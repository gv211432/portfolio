import { notFound } from "next/navigation";
import { getISTHour } from "@/lib/adminAuth";
import AdminShell from "@/components/admin/AdminShell";

interface Props {
  params: Promise<{ hour: string }>;
}

/**
 * Security through obscurity layer:
 * The route /admin/[hour] is only accessible when [hour] matches the current IST hour.
 * Any other value returns a 404, making the path unpredictable to outsiders.
 * Proper JWT auth is still enforced inside AdminShell for all API calls.
 */
export default async function AdminPage({ params }: Props) {
  const { hour } = await params;
  const currentHour = getISTHour();
  const requestedHour = parseInt(hour, 10);

  if (isNaN(requestedHour) || requestedHour !== currentHour) {
    notFound();
  }

  return <AdminShell />;
}

// Never statically generate admin pages
export const dynamic = "force-dynamic";
