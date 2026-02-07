import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { verifyRecaptchaToken } from "@/utils/recaptcha";
import { collectClientInfo, getIpInfo } from "@/utils/clientInfo";

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "resumes");

async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // reCAPTCHA verification
    const recaptchaToken = formData.get("recaptchaToken") as string;
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "reCAPTCHA verification required" },
        { status: 400 }
      );
    }

    const recaptcha = await verifyRecaptchaToken(recaptchaToken, "careers_apply");
    if (!recaptcha.success || recaptcha.score < 0.5) {
      return NextResponse.json(
        { error: "reCAPTCHA verification failed. Please try again." },
        { status: 403 }
      );
    }

    // Extract form fields
    const jobSlug = formData.get("jobSlug") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const legalName = formData.get("legalName") as string;
    const passportNo = formData.get("passportNo") as string;
    const countryOfOrigin = formData.get("countryOfOrigin") as string;
    const experience = formData.get("experience") as string;
    const email = formData.get("email") as string;
    const resume = formData.get("resume") as File | null;

    // Validate required fields
    if (!jobSlug || !jobTitle || !legalName || !passportNo || !countryOfOrigin || !experience || !email) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    let resumeUrl: string | null = null;
    let resumeFileName: string | null = null;

    // Handle resume upload
    if (resume && resume.size > 0) {
      // Validate file size (5MB max)
      if (resume.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Resume file must be less than 5MB" },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(resume.type)) {
        return NextResponse.json(
          { error: "Please upload a PDF or Word document" },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = legalName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const ext = resume.name.split(".").pop();
      const fileName = `${sanitizedName}_${timestamp}.${ext}`;

      // Save file
      await ensureUploadsDir();
      const filePath = path.join(UPLOADS_DIR, fileName);
      const bytes = await resume.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      resumeUrl = `/uploads/resumes/${fileName}`;
      resumeFileName = resume.name;
    }

    // Collect client info
    const { ip, userAgent, deviceInfo } = collectClientInfo(request);

    // Create application in database
    const application = await prisma.jobApplication.create({
      data: {
        jobSlug,
        jobTitle,
        legalName,
        passportNo,
        countryOfOrigin,
        experience,
        email,
        resumeUrl,
        resumeFileName,
        ipAddress: ip,
        userAgent,
        deviceInfo: deviceInfo as unknown as Prisma.InputJsonValue,
      },
    });

    // Fetch IP info in background and update the record
    getIpInfo(ip).then((ipInfo) => {
      if (ipInfo) {
        prisma.jobApplication.update({
          where: { id: application.id },
          data: { ipInfo: ipInfo as unknown as Prisma.InputJsonValue },
        }).catch(console.error);
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: application.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve applications (for admin purposes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobSlug = searchParams.get("jobSlug");
    const status = searchParams.get("status");

    const where: Record<string, string> = {};
    if (jobSlug) where.jobSlug = jobSlug;
    if (status) where.status = status;

    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
