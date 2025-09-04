import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { emailService } from "@/lib/services/emailService";

/**
 * @openapi
 * /api/admin/email-reminders/test:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Test email service configuration
 *     description: Sends a test email to verify email service is working
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - test_email
 *             properties:
 *               test_email:
 *                 type: string
 *                 format: email
 *                 description: Email address to send test message to
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Email service error
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { message: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const testEmail = body.test_email;

    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json(
        { message: "Valid test email required" },
        { status: 400 }
      );
    }

    // Test email service connection
    const isConnected = await emailService.testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { message: "Email service configuration error" },
        { status: 500 }
      );
    }

    // Create test partial attendance alert
    const testAlert = {
      student_id: "test-id",
      student_name: "Test Student",
      student_email: testEmail,
      subject_code: "TEST101",
      subject_name: "Test Subject",
      week_number: 1,
      session_type: "lecture",
      attendance_percentage: 30,
      missing_windows: [2],
      next_window_start: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      next_window_end: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 1.5 hours from now
    };

    const success = await emailService.sendPartialAttendanceReminder(testAlert);

    if (success) {
      return NextResponse.json({
        message: "Test email sent successfully",
        test_email: testEmail,
        service_status: "connected",
      });
    } else {
      return NextResponse.json(
        { message: "Failed to send test email" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { message: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    // Test email service connection only
    const isConnected = await emailService.testConnection();
    
    return NextResponse.json({
      email_service_status: isConnected ? "connected" : "failed",
      smtp_config: {
        host: process.env.SMTP_HOST || "not configured",
        port: process.env.SMTP_PORT || "not configured",
        user: process.env.SMTP_USER ? "configured" : "not configured",
        pass: process.env.SMTP_PASS ? "configured" : "not configured",
      },
    });

  } catch (error) {
    console.error("Email service test error:", error);
    return NextResponse.json(
      { 
        email_service_status: "error",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}