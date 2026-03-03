import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  LangChainAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { AIMessage } from "@langchain/core/messages";
import { createAgentGraph } from "@/lib/agent/graph";
import { collectClientInfo } from "@/utils/clientInfo";

/**
 * Per-request CopilotKit handler.
 * We create a fresh LangGraph agent per request so visitor context
 * (IP, device) can be safely injected into the system prompt.
 */
async function handleRequest(req: NextRequest) {
  const visitorCtx = collectClientInfo(req);

  const serviceAdapter = new LangChainAdapter({
    chainFn: async ({ messages }) => {
      const graph = createAgentGraph(visitorCtx);
      const result = await graph.invoke({ messages });

      // Extract the last AI message content as a string for CopilotKit
      const lastMsg = result.messages?.at(-1);
      let content = "";
      if (lastMsg) {
        const raw = lastMsg.content;
        content = typeof raw === "string" ? raw : JSON.stringify(raw);
      }

      // Return as an AIMessage so CopilotKit renders it correctly
      return new AIMessage(content);
    },
  });

  const { handleRequest: copilotHandler } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: new CopilotRuntime(),
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return copilotHandler(req);
}

export const POST = handleRequest;

// Health check
export async function GET() {
  return Response.json({
    status: "ok",
    agent: "LangGraph ReAct (Gemini 1.5 Flash)",
    tools: 14,
    aiEnabled: !!process.env.GEMINI_API_KEY,
  });
}

export async function OPTIONS(req: NextRequest) {
  const { handleRequest: copilotHandler } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: new CopilotRuntime(),
    serviceAdapter: new LangChainAdapter({
      chainFn: async () => new AIMessage(""),
    }),
    endpoint: "/api/copilotkit",
  });
  return copilotHandler(req);
}
