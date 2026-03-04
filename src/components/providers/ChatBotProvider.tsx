"use client";

import React, { useEffect } from "react";
import { CopilotPopup, useChatContext } from "@copilotkit/react-ui";
import { FloatingActionBar, CookieConsent } from "@/components/ui";
import { useChatOpenStore } from "@/Atoms/globalAtoms";

/**
 * Invisible bridge component rendered inside CopilotPopup's context tree.
 * It syncs the external Zustand store → CopilotKit's internal open state,
 * so the FAB chat button can open/close the popup without needing the
 * CopilotKit floating button to exist at all.
 */
function ChatOpenBridge() {
  const { setOpen } = useChatContext();
  const { isChatOpen } = useChatOpenStore();

  useEffect(() => {
    setOpen(isChatOpen);
  }, [isChatOpen, setOpen]);

  return null;
}

/**
 * ChatBotProvider renders the floating utility bar, cookie consent,
 * and the AI chat popup (controlled via FAB chat button).
 * CopilotKit's own floating button is replaced by our FAB button.
 */
export default function ChatBotProvider() {
  const { setIsChatOpen } = useChatOpenStore();

  // CopilotKit's web inspector lives inside a Shadow DOM — CSS can't pierce it,
  // so we hide the host element (<cpk-web-inspector>) directly via JS.
  // The interval retries until the element appears (it may inject late).
  useEffect(() => {
    const hide = () => {
      const el = document.querySelector("cpk-web-inspector");
      if (el) (el as HTMLElement).style.display = "none";
    };
    hide();
    const id = setInterval(hide, 500);
    // Stop polling after 10 s — it won't appear after that
    const timeout = setTimeout(() => clearInterval(id), 10_000);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <FloatingActionBar />
      <CookieConsent />

      {/* Hide CopilotKit's dev console and sidebar toggle buttons */}
      <style>{`
        /* Hide "Powered by CopilotKit" footer */
        .poweredBy { display: none !important; }

        /* Hide CopilotKit dev console / web inspector button.
           The button lives in a Shadow DOM so we target the custom-element host. */
        cpk-web-inspector,
        .copilotKitDevConsole,
        [class*="copilotKitDevConsole"],
        [data-testid="dev-console"],
        .console-button {
          display: none !important;
        }
        /* Hide CopilotKit sidebar toggle if present */
        .copilotKitSidebarButton,
        [class*="copilotKitSidebar"] > button:first-child {
          display: none !important;
        }
        /* Window positioning — opens just above where the FAB bar sits */
        .copilotKitWindow {
          bottom: 5.5rem !important;
          right: 1.5rem !important;
          border-radius: 1rem !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.35) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          font-family: inherit !important;
        }
        /* Header */
        .copilotKitHeader {
          background-color: #00D4FF !important;
          color: #0a0a0a !important;
          border-radius: 1rem 1rem 0 0 !important;
        }
        .copilotKitHeader * {
          color: #0a0a0a !important;
        }
        /* Messages area */
        .copilotKitMessagesContainer {
          background-color: #f9fafb !important;
          padding: 0.75rem !important;
        }
        /* Assistant message bubble */
        .copilotKitAssistantMessage {
          background-color: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          color: #1f2937 !important;
          border-radius: 1rem 1rem 1rem 0.25rem !important;
          padding: 0.65rem 0.9rem !important;
        }
        /* User message bubble */
        .copilotKitUserMessage {
          background-color: #00D4FF !important;
          color: #0a0a0a !important;
          border-radius: 1rem 1rem 0.25rem 1rem !important;
          padding: 0.65rem 0.9rem !important;
        }
        /* Input area */
        .copilotKitInputContainer {
          border-top: 1px solid #e5e7eb !important;
          background-color: #ffffff !important;
          padding: 0.6rem 0.75rem !important;
        }
        .copilotKitInput {
          border-radius: 9999px !important;
          background-color: #f3f4f6 !important;
          color: #1f2937 !important;
        }

        /* ── Dark mode overrides ── */
        html.dark .copilotKitWindow {
          border: 1px solid rgba(255,255,255,0.10) !important;
        }
        html.dark .copilotKitMessagesContainer {
          background-color: #0d1117 !important;
        }
        html.dark .copilotKitAssistantMessage {
          background-color: #1c2333 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          color: #e6edf3 !important;
        }
        html.dark .copilotKitUserMessage {
          background-color: #00D4FF !important;
          color: #0a0a0a !important;
        }
        html.dark .copilotKitInputContainer {
          border-top: 1px solid rgba(255,255,255,0.08) !important;
          background-color: #161b22 !important;
        }
        html.dark .copilotKitInput {
          background-color: #21262d !important;
          color: #e6edf3 !important;
        }
        html.dark .copilotKitInput::placeholder {
          color: #8b949e !important;
        }
        /* Send button */
        .copilotKitSendButton {
          background-color: #00D4FF !important;
          color: #0a0a0a !important;
          border-radius: 9999px !important;
        }
        /* Markdown in responses */
        .copilotKitAssistantMessage h1,
        .copilotKitAssistantMessage h2,
        .copilotKitAssistantMessage h3 {
          font-weight: 700;
          margin-bottom: 0.5rem;
          margin-top: 0.75rem;
        }
        .copilotKitAssistantMessage h1 { font-size: 1.1rem; }
        .copilotKitAssistantMessage h2 { font-size: 1rem; }
        .copilotKitAssistantMessage h3 { font-size: 0.9rem; }
        .copilotKitAssistantMessage ul,
        .copilotKitAssistantMessage ol {
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        .copilotKitAssistantMessage li { margin-bottom: 0.25rem; }
        .copilotKitAssistantMessage code {
          background: rgba(0, 212, 255, 0.12);
          border-radius: 0.25rem;
          padding: 0.1rem 0.35rem;
          font-size: 0.8rem;
          font-family: monospace;
        }
        .copilotKitAssistantMessage pre {
          background: #1c2333;
          color: #00D4FF;
          border-radius: 0.5rem;
          padding: 0.75rem;
          overflow-x: auto;
          margin: 0.5rem 0;
          font-size: 0.78rem;
        }
        html.dark .copilotKitAssistantMessage code {
          background: rgba(0, 212, 255, 0.15);
          color: #79c0ff;
        }
        html.dark .copilotKitAssistantMessage pre {
          background: #0d1117;
          color: #00D4FF;
        }
        .copilotKitAssistantMessage pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }
        .copilotKitAssistantMessage a {
          color: #00D4FF;
          text-decoration: underline;
        }
        .copilotKitAssistantMessage strong { font-weight: 700; }
        .copilotKitAssistantMessage em { font-style: italic; }
        .copilotKitAssistantMessage blockquote {
          border-left: 3px solid #00D4FF;
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          opacity: 0.8;
        }
      `}</style>

      <CopilotPopup
        instructions="You are Gaurav's intelligent AI assistant. Help visitors learn about his blockchain development services, past projects, and expertise. Be professional, concise, and use markdown for well-structured answers."
        defaultOpen={false}
        onSetOpen={setIsChatOpen}
        labels={{
          title: "Gaurav's Assistant",
          initial: "Hi! I'm Gaurav's AI assistant. I can help you learn about his blockchain services, past projects, or get you in touch. Ask me anything!",
          placeholder: "Ask me anything...",
        }}
        Button={() => <ChatOpenBridge />}
      />
    </>
  );
}
