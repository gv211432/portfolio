import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { PortfolioAgent } from "@/lib/agent/CopilotAgent";
import { collectClientInfo } from "@/utils/clientInfo";

/**
 * Per-request CopilotKit handler.
 * A fresh PortfolioAgent (and CopilotRuntime) is created per request
 * so visitor context (IP, device) is injected into the system prompt.
 *
 * Architecture note: CopilotKit 1.52.x switched to @copilotkitnext/agent's
 * BuiltInAgent system, which broke the old LangChainAdapter + chainFn pattern.
 * We bypass it by supplying our own AbstractAgent implementation (PortfolioAgent)
 * directly — when agents are pre-populated, CopilotRuntime skips BuiltInAgent
 * creation entirely and routes requests straight to our LangGraph agent.
 */
async function handleRequest(req: NextRequest) {
  const visitorCtx = collectClientInfo(req);

  const runtime = new CopilotRuntime({
    agents: {
      default: new PortfolioAgent(visitorCtx),
    },
  });

  const { handleRequest: copilotHandler } =
    copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
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
  const runtime = new CopilotRuntime({
    agents: {
      default: new PortfolioAgent(),
    },
  });

  const { handleRequest: copilotHandler } =
    copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      endpoint: "/api/copilotkit",
    });

  return copilotHandler(req);
}
