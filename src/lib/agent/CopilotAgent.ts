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
import { prisma } from "@/lib/prisma";

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
 * Also persists user + assistant messages to the ChatThread in the DB.
 */
export class PortfolioAgent extends AbstractAgent {
  private visitorCtx?: VisitorContext;
  private chatToken?: string;

  constructor(visitorCtx?: VisitorContext, chatToken?: string) {
    super();
    this.visitorCtx = visitorCtx;
    this.chatToken = chatToken;
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

          // Fire-and-forget: persist messages to DB if token is present
          if (this.chatToken && content) {
            this.saveMessages(input.messages, content).catch((e) =>
              console.error("[PortfolioAgent] saveMessages:", e)
            );
          }
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

  private async saveMessages(inputMessages: Message[], assistantContent: string) {
    if (!this.chatToken) return;

    // Get the last user message from the AG-UI messages
    const lastUserMsg = [...inputMessages]
      .reverse()
      .find((m) => m.role === "user");
    const userContent = lastUserMsg
      ? typeof lastUserMsg.content === "string"
        ? lastUserMsg.content
        : (lastUserMsg.content as Array<{ text?: string }>)
            .map((p) => p.text ?? "")
            .join("\n")
      : null;

    if (!userContent) return;

    // Upsert thread, then append both messages
    const thread = await prisma.chatThread.upsert({
      where: { token: this.chatToken },
      create: {
        token: this.chatToken,
        ipAddress: this.visitorCtx?.ip,
        deviceInfo: this.visitorCtx?.deviceInfo as object | undefined,
      },
      update: {},
      select: { id: true },
    });

    await prisma.chatMessage.createMany({
      data: [
        { threadId: thread.id, role: "user", content: userContent },
        { threadId: thread.id, role: "assistant", content: assistantContent },
      ],
    });
  }
}
