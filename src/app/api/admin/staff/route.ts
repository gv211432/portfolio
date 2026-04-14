/**
 * GET  /api/admin/staff             — list staff (paginated, searchable)
 * POST /api/admin/staff             — create staff: assigns email, auto-generates
 *                                     password, optionally emails credentials
 *                                     to the recovery address.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { hashPassword } from "@/lib/mail/staffAuth";
import { generateFriendlyPassword, isValidEmail } from "@/lib/mail/text";
import { sendStaffCredentials } from "@/lib/mail/systemMail";
import { logActivity, Activity } from "@/lib/mail/activity";
import { MAIL_ENV } from "@/lib/mail/env";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status") ?? undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { employeeCode: { contains: search, mode: "insensitive" } },
      { recoveryEmail: { contains: search, mode: "insensitive" } },
      { emailAddress: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [staff, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { emailAddress: true, twoFactor: true },
    }),
    prisma.staff.count({ where }),
  ]);

  return NextResponse.json({
    staff: staff.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      displayName: s.displayName,
      email: s.emailAddress?.email ?? null,
      recoveryEmail: s.recoveryEmail,
      role: s.role,
      employeeCode: s.employeeCode,
      joinedAt: s.joinedAt,
      dateOfBirth: s.dateOfBirth,
      status: s.status,
      mustResetPassword: s.mustResetPassword,
      lastLoginAt: s.lastLoginAt,
      createdAt: s.createdAt,
      has2fa: s.twoFactor.some((f) => f.enabled),
      hasOverride: s.allowedDomainsOverride !== null,
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      displayName,
      emailLocalPart,     // e.g. "jack" → jack@<MAIL_DOMAIN>
      recoveryEmail,
      phone,
      role,
      employeeCode,
      dateOfBirth,
      joinedAt,
      profileImageUrl,
      sendCredentialsEmail = true,
    } = body ?? {};

    if (!firstName || !lastName || !emailLocalPart || !recoveryEmail) {
      return NextResponse.json(
        { error: "firstName, lastName, emailLocalPart, recoveryEmail are required" },
        { status: 400 },
      );
    }
    if (!isValidEmail(recoveryEmail)) {
      return NextResponse.json({ error: "Invalid recoveryEmail" }, { status: 400 });
    }
    const localPart = String(emailLocalPart).toLowerCase().trim();
    if (!/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(localPart)) {
      return NextResponse.json({ error: "Invalid email local part" }, { status: 400 });
    }

    const fullEmail = `${localPart}@${MAIL_ENV.DOMAIN}`;

    const existing = await prisma.staffEmailAddress.findUnique({ where: { email: fullEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    if (employeeCode) {
      const dup = await prisma.staff.findUnique({ where: { employeeCode } });
      if (dup) return NextResponse.json({ error: "Employee code already in use" }, { status: 409 });
    }

    const tempPassword = generateFriendlyPassword();
    const passwordHash = await hashPassword(tempPassword);

    const created = await prisma.staff.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        displayName: displayName ? String(displayName).trim() : null,
        recoveryEmail: String(recoveryEmail).trim().toLowerCase(),
        phone: phone ?? null,
        role: role ?? null,
        employeeCode: employeeCode ?? null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        joinedAt: joinedAt ? new Date(joinedAt) : null,
        profileImageUrl: profileImageUrl ?? null,
        passwordHash,
        mustResetPassword: true,
        emailAddress: {
          create: { email: fullEmail, isPrimary: true },
        },
      },
      include: { emailAddress: true },
    });

    await logActivity({
      actorType: "ADMIN",
      actorId: admin.id,
      actorLabel: admin.username,
      action: Activity.AdminStaffCreate,
      targetType: "Staff",
      targetId: created.id,
      metadata: { email: fullEmail, sendCredentialsEmail },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim(),
      userAgent: req.headers.get("user-agent"),
    });

    if (sendCredentialsEmail) {
      // fire-and-forget so admin UI doesn't block on SES latency
      void sendStaffCredentials({
        recoveryEmail: created.recoveryEmail,
        staffName: `${created.firstName} ${created.lastName}`,
        staffEmail: fullEmail,
        tempPassword,
        staffId: created.id,
      });
    }

    return NextResponse.json({
      staff: {
        id: created.id,
        email: fullEmail,
        firstName: created.firstName,
        lastName: created.lastName,
      },
      tempPassword, // shown once to admin in the UI
      credentialsEmailQueued: sendCredentialsEmail,
    });
  } catch (err) {
    console.error("[admin/staff POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
