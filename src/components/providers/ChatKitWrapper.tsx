"use client";

import { useEffect, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { getOrCreateChatToken } from "@/utils/chatToken";

/**
 * Wraps the app with CopilotKit, injecting the browser's persistent chat token
 * as an `x-chat-token` header so the backend can associate messages with a thread.
 * Token is stored in IndexedDB (gaurav_chat DB) and generated on first visit.
 */
export default function ChatKitWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    getOrCreateChatToken().then(setToken);
  }, []);

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={token ? { "x-chat-token": token } : {}}
    >
      {children}
    </CopilotKit>
  );
}
