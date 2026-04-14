/**
 * GET  /api/mail/labels   — list
 * POST /api/mail/labels   — create { name, color? }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor, logAsActor } from "@/lib/mail/mailActor";
import { Activity } from "@/lib/mail/activity";

export async function GET(req: NextRequest) {
  const r = await resolveMailActor(req); if (!r.ok) return r.response;
  const labels = await prisma.emailLabel.findMany({
    where: { staffId: r.actor.staffId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ labels });
}

export async function POST(req: NextRequest) {
  const r = await resolveMailActor(req); if (!r.ok) return r.response;
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  try {
    const label = await prisma.emailLabel.create({
      data: {
        staffId: r.actor.staffId,
        name,
        color: typeof body.color === "string" ? body.color : null,
      },
    });
    await logAsActor(r.actor, Activity.StaffLabelCreate, { targetType: "EmailLabel", targetId: label.id });
    return NextResponse.json({ label });
  } catch {
    return NextResponse.json({ error: "Label already exists" }, { status: 409 });
  }
}
