/**
 * DELETE /api/staff/auth/devices/[id]  — revoke a single trusted device
 */

import { NextRequest, NextResponse } from "next/server";
import { requireActiveStaff } from "@/lib/mail/staffAuth";
import { revokeSingleDevice } from "@/lib/mail/staffDevice";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const s = await requireActiveStaff(req);
  if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const removed = await revokeSingleDevice(id, s.staff.id);
  if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
