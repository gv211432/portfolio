// No html/body — root layout provides those.
// Chat page uses position:fixed for reliable full-viewport coverage.
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
