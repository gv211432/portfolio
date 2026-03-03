import { AbstractAgent } from "@ag-ui/client";
import { EventType, type RunAgentInput, type BaseEvent, type Message, type ToolCall } from "@ag-ui/core";
import { Observable } from "rxjs";
import { randomUUID } from "crypto";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { createAgentGraph, type VisitorContext } from "./graph";

/**
 * Convert AG-UI protocol messages to LangChain BaseMessage format.
 * Filters out activity, reasoning, and system messages (system prompt
 * is injected by createAgentGraph via messageModifier).
 */
function toLC(messages: Message[]): BaseMessage[] {
  return messages
    .filter(
      (m) =>
        m.role !== "activity" &&
        m.role !== "reasoning" &&
        m.role !== "system" &&
        m.role !== "developer"
    )
    .map((m): BaseMessage | null => {
      if (m.role === "user") {
        const content =
          typeof m.content === "string"
            ? m.content
            : (m.content as Array<{ text?: string }>)
                .map((p) => p.text ?? "")
                .join("\n");
        return new HumanMessage(content);
      }

      if (m.role === "assistant") {
        if (m.toolCalls?.length) {
          return new AIMessage({
            content: m.content ?? "",
            tool_calls: m.toolCalls.map((tc: ToolCall) => ({
              id: tc.id,
              name: tc.function.name,
              args: (() => {
                try {
                  return JSON.parse(tc.function.arguments);
                } catch {
                  return {};
                }
              })(),
            })),
          });
        }
        return new AIMessage(m.content ?? "");
      }

      if (m.role === "tool") {
        return new ToolMessage({
          content: m.content,
          tool_call_id: m.toolCallId,
        });
      }

      return null;
    })
    .filter((m): m is BaseMessage => {
      if (!m) return false;
      const isAI = m instanceof AIMessage;
      const hasTools = isAI && (m as AIMessage).tool_calls?.length;
      const content =
        typeof m.content === "string" ? m.content.trim() : "";
      return Boolean(content) || Boolean(hasTools);
    });
}

/**
 * Custom CopilotKit AbstractAgent that wraps the LangGraph ReAct agent.
 * Created per-request so visitor context (IP, device) can be injected
 * fresh into the system prompt on every call.
 */
export class PortfolioAgent extends AbstractAgent {
  private visitorCtx?: VisitorContext;

  constructor(visitorCtx?: VisitorContext) {
    super();
    this.visitorCtx = visitorCtx;
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable((subscriber) => {
      const { runId, threadId } = input;

      subscriber.next({
        type: EventType.RUN_STARTED,
        threadId,
        runId,
      } as BaseEvent);

      (async () => {
        try {
          const graph = createAgentGraph(this.visitorCtx);
          const messages = toLC(input.messages);

          const result = await graph.invoke({ messages });

          const lastMsg = result.messages?.at(-1);
          const raw = lastMsg?.content;
          const content =
            typeof raw === "string" ? raw : JSON.stringify(raw ?? "");

          const messageId = randomUUID();
          subscriber.next({
            type: EventType.TEXT_MESSAGE_START,
            messageId,
            role: "assistant",
          } as BaseEvent);
          subscriber.next({
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId,
            delta: content,
          } as BaseEvent);
          subscriber.next({
            type: EventType.TEXT_MESSAGE_END,
            messageId,
          } as BaseEvent);
          subscriber.next({
            type: EventType.RUN_FINISHED,
            threadId,
            runId,
          } as BaseEvent);
          subscriber.complete();
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Agent execution error";
          subscriber.next({
            type: EventType.RUN_ERROR,
            message,
          } as BaseEvent);
          subscriber.complete();
        }
      })();
    });
  }
}
