import { NextRequest, NextResponse } from "next/server";

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  budget: string;
  message: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();
    const { name, email, phone, budget, message } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!budget) {
      return NextResponse.json(
        { success: false, message: "Budget selection is required" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length < 20) {
      return NextResponse.json(
        { success: false, message: "Message must be at least 20 characters" },
        { status: 400 }
      );
    }

    // Log the submission (in production, you'd send an email or save to database)
    console.log("=== New Contact Form Submission ===");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Phone:", phone || "Not provided");
    console.log("Budget:", budget);
    console.log("Message:", message);
    console.log("Timestamp:", new Date().toISOString());
    console.log("===================================");

    // TODO: Implement actual email sending using a service like:
    // - Resend (https://resend.com)
    // - SendGrid
    // - Nodemailer with SMTP
    // - AWS SES
    //
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'contact@gaurav.one',
    //   to: 'contact@gaurav.one',
    //   subject: `New Project Inquiry from ${name}`,
    //   html: `
    //     <h2>New Contact Form Submission</h2>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    //     <p><strong>Budget:</strong> ${budget}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${message}</p>
    //   `,
    // });

    // For now, we'll simulate success
    // In production, replace this with actual email sending logic

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll get back to you within 24 hours.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Contact API is running",
  });
}
