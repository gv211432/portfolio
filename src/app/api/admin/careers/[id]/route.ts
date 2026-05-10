import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const perm = await requirePermission(request, "careers.read");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const application = await prisma.jobApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ application });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const perm = await requirePermission(request, "careers.update");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ success: true, application: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const perm = await requirePermission(request, "careers.delete");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  await prisma.jobApplication.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
