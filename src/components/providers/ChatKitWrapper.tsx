"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CopilotKit } from "@copilotkit/react-core";
import { getOrCreateChatToken } from "@/utils/chatToken";

export default function ChatKitWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string>("");
  const pathname = usePathname();

  // Don't activate CopilotKit on admin routes — it would poll /api/copilotkit
  // continuously even when the chat popup is hidden via CSS.
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin) return;
    getOrCreateChatToken().then(setToken);
  }, [isAdmin]);

  if (isAdmin) return <>{children}</>;

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={token ? { "x-chat-token": token } : {}}
    >
      {children}
    </CopilotKit>
  );
}
