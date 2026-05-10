import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const perm = await requirePermission(request, "contacts.read");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const submission = await prisma.contactSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ submission });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const perm = await requirePermission(request, "contacts.update");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  const updated = await prisma.contactSubmission.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ success: true, submission: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const perm = await requirePermission(request, "contacts.delete");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  await prisma.contactSubmission.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
