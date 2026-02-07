import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyRecaptchaToken } from "@/utils/recaptcha";
import { collectClientInfo, getIpInfo } from "@/utils/clientInfo";

// Constants
const MAX_MESSAGE_LENGTH = 10000;
const MIN_MESSAGE_LENGTH = 20;

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Valid budget options
const VALID_BUDGETS = [
  "< $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "$25,000 - $50,000",
  "$50,000 - $100,000",
  "> $100,000",
  "Not sure",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, budget, message, recaptchaToken } = body;

    // reCAPTCHA verification
    if (!recaptchaToken) {
      return NextResponse.json(
        { success: false, message: "reCAPTCHA verification required" },
        { status: 400 }
      );
    }

    const recaptcha = await verifyRecaptchaToken(recaptchaToken, "contact_submit");
    if (!recaptcha.success || recaptcha.score < 0.5) {
      return NextResponse.json(
        { success: false, message: "reCAPTCHA verification failed. Please try again." },
        { status: 403 }
      );
    }

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: "Name must be less than 100 characters" },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Valid email is required" },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { success: false, message: "Email must be less than 255 characters" },
        { status: 400 }
      );
    }

    if (phone && phone.length > 30) {
      return NextResponse.json(
        { success: false, message: "Phone number must be less than 30 characters" },
        { status: 400 }
      );
    }

    if (!budget || !VALID_BUDGETS.includes(budget)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid budget range" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Message must be at least ${MIN_MESSAGE_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Message must be less than ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Collect client info
    const { ip, userAgent, deviceInfo } = collectClientInfo(request);

    // Save to database
    const submission = await prisma.contactSubmission.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        budget,
        message: message.trim(),
        ipAddress: ip,
        userAgent,
        deviceInfo: deviceInfo as unknown as Prisma.InputJsonValue,
      },
    });

    // Fetch IP info in background and update the record
    getIpInfo(ip).then((ipInfo) => {
      if (ipInfo) {
        prisma.contactSubmission.update({
          where: { id: submission.id },
          data: { ipInfo: ipInfo as unknown as Prisma.InputJsonValue },
        }).catch(console.error);
      }
    });

    console.log("=== New Contact Form Submission Saved ===");
    console.log("ID:", submission.id);
    console.log("Name:", submission.name);
    console.log("Email:", submission.email);
    console.log("Budget:", submission.budget);
    console.log("IP:", ip);
    console.log("Timestamp:", submission.createdAt);
    console.log("=========================================");

    // TODO: Optionally send email notification
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'contact@gaurav.one',
    //   to: 'contact@gaurav.one',
    //   subject: `New Project Inquiry from ${name}`,
    //   html: `...`,
    // });

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll get back to you within 24 hours.",
      id: submission.id,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Health check & list submissions (for admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("admin_key");

  // Basic admin check (in production, use proper authentication)
  if (adminKey === process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY) {
    try {
      const submissions = await prisma.contactSubmission.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({
        success: true,
        count: submissions.length,
        submissions,
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch submissions" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    status: "ok",
    message: "Contact API is running",
  });
}
