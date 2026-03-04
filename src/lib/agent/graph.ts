import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage } from "@langchain/core/messages";
import { ALL_TOOLS } from "./tools";
import { SYSTEM_PROMPT } from "./prompts";
import { ACTIVE_MODEL } from "./models";

export interface VisitorContext {
  ip: string;
  userAgent?: string;
  deviceInfo?: {
    deviceType: string;
    os: string;
    browser: string;
  };
}

/**
 * Create a compiled LangGraph ReAct agent.
 * A new instance is created per request so visitor context can be injected
 * into the system prompt without sharing state between users.
 */
export function createAgentGraph(visitorCtx?: VisitorContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const llm = new ChatGoogleGenerativeAI({
    model: ACTIVE_MODEL,
    apiKey,
    temperature: 0.7,
    maxOutputTokens: 1024,
  });

  // Build visitor context string to inject into system prompt
  const visitorInfo = visitorCtx
    ? [
        `\n## Current Visitor Context`,
        `- IP: ${visitorCtx.ip}`,
        visitorCtx.deviceInfo ? `- Device: ${visitorCtx.deviceInfo.deviceType} (${visitorCtx.deviceInfo.os} / ${visitorCtx.deviceInfo.browser})` : null,
        visitorCtx.userAgent ? `- User Agent: ${visitorCtx.userAgent.slice(0, 120)}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const systemPrompt = SYSTEM_PROMPT + visitorInfo;

  const agent = createReactAgent({
    llm,
    tools: ALL_TOOLS,
    messageModifier: new SystemMessage(systemPrompt),
  });

  return agent;
}
