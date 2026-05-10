import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, logAdminActivity } from "@/lib/admin/permissions";

type Ctx = { params: Promise<{ id: string }> };

const DEADLOCK_PROTECTED = new Set([
  "rbac.actions.toggle",  // cannot disable the action that disables actions
  "auth.login",
  "auth.logout",
  "auth.session",
  "auth.totp.setup",
  "auth.totp.verify",
]);

/** PATCH /api/admin/rbac/actions/[id] — toggle isEnabled */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.actions.toggle");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  if (DEADLOCK_PROTECTED.has(id)) {
    return NextResponse.json(
      { error: `Action "${id}" is protected and cannot be disabled.` },
      { status: 400 }
    );
  }

  const action = await prisma.adminAction.findUnique({ where: { id } });
  if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action.isSystem) {
    return NextResponse.json({ error: "System actions cannot be toggled." }, { status: 400 });
  }

  const { isEnabled }: { isEnabled: boolean } = await req.json();
  if (typeof isEnabled !== "boolean") {
    return NextResponse.json({ error: "isEnabled must be a boolean" }, { status: 400 });
  }

  const updated = await prisma.adminAction.update({
    where: { id },
    data: { isEnabled },
    select: { id: true, label: true, isEnabled: true, section: true },
  });

  await logAdminActivity(perm.user.id, "ACTION_TOGGLED",
    { actionId: id, isEnabled },
    req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ action: updated });
}
