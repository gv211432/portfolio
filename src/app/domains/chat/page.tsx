"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getOrCreateChatToken } from "@/utils/chatToken";
import LogoSingle from "@/components/ui/LogoSingle";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

function ChatPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoadingRef = useRef(false);

  // Initialize token and load initial history
  useEffect(() => {
    async function init() {
      const urlToken = searchParams.get("token");
      let tok: string;
      if (urlToken) {
        tok = urlToken;
        // Persist URL token to IndexedDB so future visits use it
        const { getOrCreateChatToken: _, ...rest } = await import("@/utils/chatToken");
        void rest;
        try {
          const db = await new Promise<IDBDatabase>((res, rej) => {
            const r = indexedDB.open("gaurav_chat", 1);
            r.onupgradeneeded = () => r.result.createObjectStore("session");
            r.onsuccess = () => res(r.result);
            r.onerror = () => rej(r.error);
          });
          const tx = db.transaction("session", "readwrite");
          tx.objectStore("session").put(urlToken, "token");
        } catch { /* ignore */ }
      } else {
        tok = await getOrCreateChatToken();
      }
      setToken(tok);

      // Ensure thread exists
      await fetch("/api/chat/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tok }),
      });

      // Load initial history (most recent 20)
      await loadHistory(tok, null, "append");
      setInitialized(true);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when new messages arrive (not when loading history)
  useEffect(() => {
    if (initialized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, initialized]);

  const loadHistory = useCallback(
    async (tok: string, cursor: string | null, mode: "prepend" | "append") => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoadingHistory(true);

      try {
        const params = new URLSearchParams({ token: tok, limit: "20" });
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(`/api/chat/history?${params}`);
        const data = await res.json();

        if (data.messages?.length) {
          if (mode === "prepend") {
            // Preserve scroll position when prepending older messages
            const scrollArea = scrollAreaRef.current;
            const prevScrollHeight = scrollArea?.scrollHeight ?? 0;

            setMessages((prev) => [...data.messages, ...prev]);

            requestAnimationFrame(() => {
              if (scrollArea) {
                scrollArea.scrollTop += scrollArea.scrollHeight - prevScrollHeight;
              }
            });
          } else {
            setMessages(data.messages);
          }
          setNextCursor(data.nextCursor);
        }
      } finally {
        isLoadingRef.current = false;
        setIsLoadingHistory(false);
      }
    },
    []
  );

  // IntersectionObserver: load older messages when sentinel (top) is visible
  useEffect(() => {
    if (!initialized || !token) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !isLoadingRef.current) {
          loadHistory(token, nextCursor, "prepend");
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [initialized, token, nextCursor, loadHistory]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping || !token) return;

    setInput("");
    setIsTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Optimistic user message
    const userMsg: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Streaming assistant message
    const assistantId = `streaming-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: text }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.delta) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + payload.delta }
                    : m
                )
              );
            }
          } catch { /* ignore malformed lines */ }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, token]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100" style={{ position: "fixed", inset: 0 }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-[#00D4FF] text-[#0a0a0a] flex-shrink-0">
        <LogoSingle size="sm" asLink={false} />
        <div>
          <h1 className="font-semibold text-sm leading-none">Gaurav&apos;s AI Assistant</h1>
          <p className="text-xs opacity-70 mt-0.5">Blockchain & Web3 specialist</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {isTyping && (
            <span className="text-xs opacity-70 animate-pulse">Typing…</span>
          )}
          <a
            href="https://gaurav.one"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs opacity-70 hover:opacity-100 transition-opacity ml-2"
          >
            gaurav.one ↗
          </a>
        </div>
      </header>

      {/* Messages — full-width scroll area, content capped at max-w-3xl */}
      <div
        ref={scrollAreaRef}
        className="flex-1 min-h-0 overflow-y-auto py-4"
      >
        <div className="max-w-3xl mx-auto w-full px-4 space-y-3">
          {/* Sentinel: triggers history load when scrolled to top */}
          <div ref={sentinelRef} className="h-1" />

          {isLoadingHistory && (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!initialized && messages.length === 0 && (
            <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
              Loading conversation…
            </div>
          )}

          {initialized && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 bg-[#00D4FF]/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Hi! I&apos;m Gaurav&apos;s AI Assistant
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ask me about his blockchain services, past projects, or how to get in touch.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {[
                  "What services does Gaurav offer?",
                  "Tell me about Algora Call Bot",
                  "What are your rates?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-[#00D4FF]/40 text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.role === "user"
                    ? "bg-[#00D4FF] text-[#0a0a0a] rounded-br-md"
                    : "bg-white dark:bg-[#1c2333] border border-gray-100 dark:border-white/8 text-gray-800 dark:text-[#e6edf3] rounded-bl-md"
                  }`}
              >
                {msg.content || (
                  <span className="opacity-50 animate-pulse">●●●</span>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input — full-width background, content capped at max-w-3xl */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/8 bg-white dark:bg-[#161b22] px-4 py-3">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#21262d] text-gray-900 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#8b949e] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-colors overflow-hidden"
            style={{ minHeight: "42px", maxHeight: "160px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-[#00D4FF] text-[#0a0a0a] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#00bfea] transition-colors"
            aria-label="Send"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-2">
          AI assistant for <a href="https://gaurav.one" target="_blank" rel="noopener noreferrer" className="hover:text-[#00D4FF] transition-colors">gaurav.one</a>
        </p>
      </div>
    </div>
  );
}

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex h-dvh items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatPage />
    </Suspense>
  );
}
