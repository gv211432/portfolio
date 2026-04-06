import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { collectClientInfo, getIpInfo } from "@/utils/clientInfo";
import { sendTelegramNotification } from "@/lib/telegram";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidSubdomain(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(s) || /^[a-z0-9]$/.test(s);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationName, email, phone, subdomain, description, impact, agreedToTerms } = body;

    if (!organizationName?.trim())
      return NextResponse.json({ success: false, message: "Organization name is required" }, { status: 400 });
    if (organizationName.trim().length > 200)
      return NextResponse.json({ success: false, message: "Organization name must be under 200 characters" }, { status: 400 });

    if (!email || !isValidEmail(email))
      return NextResponse.json({ success: false, message: "Valid email is required" }, { status: 400 });
    if (email.length > 255)
      return NextResponse.json({ success: false, message: "Email must be under 255 characters" }, { status: 400 });

    if (phone && phone.length > 30)
      return NextResponse.json({ success: false, message: "Phone must be under 30 characters" }, { status: 400 });

    if (!subdomain?.trim())
      return NextResponse.json({ success: false, message: "Preferred subdomain is required" }, { status: 400 });
    if (!isValidSubdomain(subdomain.trim().toLowerCase()))
      return NextResponse.json({ success: false, message: "Subdomain must be lowercase alphanumeric with hyphens only" }, { status: 400 });

    if (!description || description.trim().length < 30)
      return NextResponse.json({ success: false, message: "Project description must be at least 30 characters" }, { status: 400 });
    if (description.length > 20000)
      return NextResponse.json({ success: false, message: "Description is too long" }, { status: 400 });

    if (!impact || impact.trim().length < 30)
      return NextResponse.json({ success: false, message: "Impact statement must be at least 30 characters" }, { status: 400 });
    if (impact.length > 20000)
      return NextResponse.json({ success: false, message: "Impact statement is too long" }, { status: 400 });

    if (!agreedToTerms)
      return NextResponse.json({ success: false, message: "You must agree to the process before submitting" }, { status: 400 });

    const { ip, userAgent, deviceInfo } = collectClientInfo(request);

    const application = await prisma.ngoApplication.create({
      data: {
        organizationName: organizationName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subdomain: subdomain.trim().toLowerCase(),
        description: description.trim(),
        impact: impact.trim(),
        agreedToTerms: true,
        ipAddress: ip,
        userAgent,
        deviceInfo: deviceInfo as unknown as Prisma.InputJsonValue,
      },
    });

    // Background: geo lookup + Telegram notification
    getIpInfo(ip).then((ipInfo) => {
      if (ipInfo) {
        prisma.ngoApplication.update({
          where: { id: application.id },
          data: { ipInfo: ipInfo as unknown as Prisma.InputJsonValue },
        }).catch(console.error);
      }

      const location = ipInfo
        ? [ipInfo.city, ipInfo.region, ipInfo.country].filter(Boolean).join(", ")
        : ip ?? "Unknown";

      const msg = [
        `🌱 <b>New NGO Application</b>`,
        ``,
        `🏛️ <b>Org:</b> ${application.organizationName}`,
        `📧 <b>Email:</b> ${application.email}`,
        application.phone ? `📞 <b>Phone:</b> ${application.phone}` : null,
        `🌐 <b>Subdomain:</b> ${application.subdomain}.myorg.in`,
        ``,
        `📝 <b>Description:</b>`,
        application.description.slice(0, 500) + (application.description.length > 500 ? "…" : ""),
        ``,
        `💚 <b>Impact:</b>`,
        application.impact.slice(0, 300) + (application.impact.length > 300 ? "…" : ""),
        ``,
        `🌍 <b>Location:</b> ${location}`,
        `🕐 <b>Time:</b> ${application.createdAt.toUTCString()}`,
        `🆔 <b>ID:</b> ${application.id}`,
      ].filter((line) => line !== null).join("\n");

      sendTelegramNotification(msg).catch(console.error);
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted! We'll review it within 3-5 business days.",
      id: application.id,
    });
  } catch (error) {
    console.error("NGO application error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
