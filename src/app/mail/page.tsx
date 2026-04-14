import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/mail/staffAuth";
import prisma from "@/lib/prisma";
import MailApp from "@/components/mail/MailApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await getStaffSession();
  if (!s || s.session.stage !== "ACTIVE") redirect("/mail/login");

  const addr = await prisma.staffEmailAddress.findUnique({
    where: { staffId: s.staff.id },
  });

  return (
    <MailApp
      me={{
        staffId: s.staff.id,
        displayName: s.staff.displayName ?? `${s.staff.firstName} ${s.staff.lastName}`,
        email: addr?.email ?? "",
        isAdminView: false,
      }}
    />
  );
}
