import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAgentGraph } from "@/lib/agent/graph";
import { collectClientInfo } from "@/utils/clientInfo";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
  const { token, message } = await req.json();

  if (!token || !message) {
    return new Response(JSON.stringify({ error: "token and message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const visitorCtx = collectClientInfo(req);

  // Upsert thread
  const thread = await prisma.chatThread.upsert({
    where: { token },
    create: { token, ipAddress: visitorCtx.ip, deviceInfo: visitorCtx.deviceInfo as object | undefined },
    update: {},
  });

  // Save user message
  await prisma.chatMessage.create({
    data: { threadId: thread.id, role: "user", content: message },
  });

  // Load recent history for context (last 20 messages, oldest first)
  const history = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { role: true, content: true },
  });
  history.reverse();

  // Build LangChain message history
  const lcMessages = history.slice(0, -1).map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );
  lcMessages.push(new HumanMessage(message));

  // Run agent
  const graph = createAgentGraph(visitorCtx);

  const encoder = new TextEncoder();
  let assistantResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await graph.invoke({ messages: lcMessages });
        const raw = result.messages?.at(-1)?.content;
        assistantResponse =
          typeof raw === "string" ? raw : JSON.stringify(raw ?? "");

        // Stream the response in chunks for ChatGPT-like feel
        const words = assistantResponse.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? "" : " ") + words[i];
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`));
          // Small delay for streaming effect (remove if causing issues)
          await new Promise((r) => setTimeout(r, 10));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Agent error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
        // Fire-and-forget: save assistant response to DB
        if (assistantResponse) {
          prisma.chatMessage
            .create({ data: { threadId: thread.id, role: "assistant", content: assistantResponse } })
            .catch((e) => console.error("[chat/send] save assistant msg:", e));
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
