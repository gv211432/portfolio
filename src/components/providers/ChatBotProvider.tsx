"use client";

import React from "react";
import { FloatingActionBar, CookieConsent } from "@/components/ui";

export default function ChatBotProvider() {
  return (
    <>
      <FloatingActionBar />
      <CookieConsent />
    </>
  );
}
