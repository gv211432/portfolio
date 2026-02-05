import { NextRequest, NextResponse } from "next/server";

// Context data for the AI to use when answering questions
const CONTEXT_DATA = `
You are Gaurav's AI assistant on his portfolio website. Here's information about Gaurav and his services:

## About Gaurav
- Full-stack blockchain developer specializing in DeFi, Web3, and trading platforms
- Expert in Solana, Sui, Ethereum, and cross-chain solutions
- Contact: contact@gaurav.one | Telegram: @gaaaalileo

## Services Offered
1. **DeFi Development**: DEX aggregators, liquidity pools, yield farming, staking platforms
2. **Trading Platforms**: Crypto trading bots, signal systems, copy trading, futures platforms
3. **Cross-Chain Solutions**: Bridges, multi-chain protocols, chain abstraction
4. **Smart Contracts**: Solidity, Rust (Solana), Move (Sui)
5. **White-label Products**: Ready-to-deploy trading bots, DeFi platforms, social tools

## Notable Projects
1. **Rewardroot.com** - Survey & rewards platform with 20x ROI, integrated 10+ offerwalls
2. **Algora Call Bot** - Telegram trading signal bot generating $140K+ MRR with 700+ subscribers
3. **Buffer.Finance** - DeFi futures platform UI enhancement, achieved 2x user growth

## Tech Stack
- Frontend: React, Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, PostgreSQL, MongoDB, Redis
- Blockchain: Solana (Rust), Ethereum (Solidity), Sui (Move)
- APIs: The Graph, Birdeye, SHYFT, various DEX APIs

## Response Guidelines
- Be helpful, concise, and professional
- Direct users to contact@gaurav.one for project inquiries
- Highlight relevant case studies when discussing capabilities
- If unsure about specific details, suggest contacting Gaurav directly
`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

// Gemini AI integration (to be configured)
async function getGeminiResponse(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return a fallback response when API key is not configured
    return getFallbackResponse(message);
  }

  try {
    // Format conversation history for Gemini
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            // System context
            {
              role: "user",
              parts: [
                {
                  text: `You are an AI assistant. Use this context to answer questions:\n\n${CONTEXT_DATA}\n\nNow respond to user queries helpfully and professionally. Keep responses concise (2-3 sentences for simple questions, more for complex ones).`,
                },
              ],
            },
            {
              role: "model",
              parts: [
                {
                  text: "I understand. I'm Gaurav's AI assistant and will help visitors learn about his blockchain development services, projects, and expertise. I'll be helpful, professional, and direct users to contact him for project inquiries.",
                },
              ],
            },
            // Previous conversation
            ...formattedHistory,
            // Current message
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return getFallbackResponse(message);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      return getFallbackResponse(message);
    }

    return aiResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return getFallbackResponse(message);
  }
}

// Fallback responses when AI is not available
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Greeting responses
  if (
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi") ||
    lowerMessage.includes("hey")
  ) {
    return "Hello! I'm Gaurav's AI assistant. I can help you learn about his blockchain development services, past projects, or how to get in touch. What would you like to know?";
  }

  // Services inquiry
  if (
    lowerMessage.includes("service") ||
    lowerMessage.includes("what do you do") ||
    lowerMessage.includes("what can you build")
  ) {
    return "Gaurav specializes in DeFi development, trading platforms, cross-chain solutions, and smart contracts. He works with Solana, Ethereum, and Sui. Notable projects include crypto trading bots, DEX platforms, and reward systems. Would you like to know more about any specific service?";
  }

  // Contact inquiry
  if (
    lowerMessage.includes("contact") ||
    lowerMessage.includes("email") ||
    lowerMessage.includes("reach") ||
    lowerMessage.includes("hire")
  ) {
    return "You can reach Gaurav at contact@gaurav.one or via Telegram @gaaaalileo. Feel free to share your project requirements, and he'll get back to you promptly!";
  }

  // Project inquiry
  if (
    lowerMessage.includes("project") ||
    lowerMessage.includes("portfolio") ||
    lowerMessage.includes("case study")
  ) {
    return "Some notable projects include: Rewardroot.com (20x ROI survey platform), Algora Call Bot ($140K+ MRR trading signals), and Buffer.Finance (DeFi futures platform). Check out the Case Studies section for detailed breakdowns!";
  }

  // Pricing inquiry
  if (
    lowerMessage.includes("price") ||
    lowerMessage.includes("cost") ||
    lowerMessage.includes("rate") ||
    lowerMessage.includes("budget")
  ) {
    return "Pricing depends on project scope and complexity. For a detailed quote, please contact Gaurav at contact@gaurav.one with your project requirements. He offers competitive rates and flexible engagement models.";
  }

  // Tech stack inquiry
  if (
    lowerMessage.includes("tech") ||
    lowerMessage.includes("stack") ||
    lowerMessage.includes("language") ||
    lowerMessage.includes("framework")
  ) {
    return "Gaurav's tech stack includes: React/Next.js, Node.js, TypeScript for web development; Solidity, Rust, and Move for smart contracts; PostgreSQL, MongoDB, Redis for databases; and various blockchain APIs like The Graph and Birdeye.";
  }

  // Default response
  return "Thanks for your message! I can help you learn about Gaurav's blockchain development services, past projects, tech stack, or how to get in touch. What would you like to know more about?";
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, message: "Message is required" },
        { status: 400 }
      );
    }

    // Get AI response
    const aiResponse = await getGeminiResponse(message, history);

    return NextResponse.json({
      success: true,
      message: aiResponse,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Sorry, something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const hasApiKey = !!process.env.GEMINI_API_KEY;

  return NextResponse.json({
    status: "ok",
    aiEnabled: hasApiKey,
    message: hasApiKey
      ? "Gemini AI is configured"
      : "Using fallback responses (add GEMINI_API_KEY to enable AI)",
  });
}
