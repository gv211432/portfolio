/**
 * GET    /api/staff/auth/devices  — list trusted devices (with isCurrent flag)
 * DELETE /api/staff/auth/devices  — revoke ALL trusted devices (sign out all)
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";
import { requireActiveStaff } from "@/lib/mail/staffAuth";
import { listTrustedDevices, revokeAllTrustedDevices, DEVICE_COOKIE } from "@/lib/mail/staffDevice";

function sha256(v: string) { return createHash("sha256").update(v).digest("hex"); }

export async function GET(req: NextRequest) {
  const s = await requireActiveStaff(req);
  if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const devices = await listTrustedDevices(s.staff.id);

  // Identify which device entry matches the current request's cookie
  const currentToken = req.cookies.get(DEVICE_COOKIE)?.value;
  let currentDeviceId: string | null = null;
  if (currentToken) {
    const rec = await prisma.staffTrustedDevice.findUnique({
      where:  { tokenHash: sha256(currentToken) },
      select: { id: true, staffId: true },
    });
    if (rec?.staffId === s.staff.id) currentDeviceId = rec.id;
  }

  return NextResponse.json({
    devices: devices.map((d) => ({ ...d, isCurrent: d.id === currentDeviceId })),
  });
}

export async function DELETE(req: NextRequest) {
  const s = await requireActiveStaff(req);
  if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  await revokeAllTrustedDevices(s.staff.id, res);
  return res;
}
