/**
 * Legacy /api/chat endpoint — retained for backward compatibility.
 * The active agentic chat is now served by /api/copilotkit.
 */

export async function GET() {
  return Response.json({
    status: "ok",
    note: "Chat has moved to /api/copilotkit (LangGraph + CopilotKit). This endpoint is a health-check only.",
    aiEnabled: !!process.env.GEMINI_API_KEY,
  });
}

export async function POST() {
  return Response.json(
    {
      success: false,
      message: "This endpoint is deprecated. The chatbot now uses /api/copilotkit via CopilotKit.",
    },
    { status: 410 }
  );
}
