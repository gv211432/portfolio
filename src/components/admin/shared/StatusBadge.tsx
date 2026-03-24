"use client";

const CONTACT_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  IN_DISCUSSION: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  PROPOSAL_SENT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  CONVERTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const APP_COLORS: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  REVIEWED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  INTERVIEWING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  OFFERED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  HIRED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

interface Props {
  status: string;
  type?: "contact" | "career";
}

export default function StatusBadge({ status, type = "contact" }: Props) {
  const map = type === "contact" ? CONTACT_COLORS : APP_COLORS;
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  const label = status.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
