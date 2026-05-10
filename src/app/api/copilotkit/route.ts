import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  EmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { PortfolioAgent } from "@/lib/agent/CopilotAgent";
import { collectClientInfo } from "@/utils/clientInfo";
import { ACTIVE_MODEL } from "@/lib/agent/models";

// Per-IP rate limiter: max 20 requests per 60-second window
const ipWindows = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT    = 20;
const IP_WINDOW   = 60_000; // 1 minute

// Per-session (x-chat-token) rate limiter: max 30 requests per 60-second window
const sessionWindows = new Map<string, { count: number; resetAt: number }>();
const SESSION_LIMIT  = 30;

function checkRateLimit(key: string, store: Map<string, { count: number; resetAt: number }>, limit: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + IP_WINDOW });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true; // allowed
}

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
  const chatToken  = req.headers.get("x-chat-token") ?? undefined;

  // Per-IP rate limit
  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim();
  if (!checkRateLimit(ip, ipWindows, IP_LIMIT)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  // Per-session rate limit (if token present)
  if (chatToken && !checkRateLimit(chatToken, sessionWindows, SESSION_LIMIT)) {
    return new Response(JSON.stringify({ error: "Session rate limit exceeded. Try again in a minute." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  const runtime = new CopilotRuntime({
    agents: {
      default: new PortfolioAgent(visitorCtx, chatToken),
    },
  });

  const { handleRequest: copilotHandler } =
    copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter: new EmptyAdapter(),
      endpoint: "/api/copilotkit",
    });

  return copilotHandler(req);
}

export const POST = handleRequest;

// Health check
export async function GET() {
  return Response.json({
    status: "ok",
    agent: `LangGraph ReAct (${ACTIVE_MODEL.replaceAll("-", " ")})`,
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
      serviceAdapter: new EmptyAdapter(),
      endpoint: "/api/copilotkit",
    });

  return copilotHandler(req);
}
