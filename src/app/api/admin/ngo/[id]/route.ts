import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const application = await prisma.ngoApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ application });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  const updated = await prisma.ngoApplication.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ success: true, application: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.ngoApplication.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
