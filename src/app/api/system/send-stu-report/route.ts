import {
  emailService,
  EmailConfig,
  AttendanceEmailData,
} from "@/lib/server/email";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * @openapi
 * /api/system/send-stu-report:
 *   post:
 *     tags:
 *       - System
 *     summary: Send student attendance report email
 *     description: |
 *       Sends an attendance reminder email to a student using the configured SMTP server.
 *       Requires a valid email address in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The student's email address where the report will be sent
 *                 example: "student1@uowmail.edu.au"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email sent successfully
 *       400:
 *         description: Invalid request body (missing or invalid email format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request body
 *                 errors:
 *                   type: object
 *                   example:
 *                     email: ["Invalid email format"]
 *       500:
 *         description: Internal server error or failed email server connection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Failed to connect to email server
 */

// Define Zod schema
const schema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email format"),
});
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate request body
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid request body",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    // Get SMTP configuration
    const emailConfig: EmailConfig = {
      smtpHost: "smtp.gmail.com",
      smtpPort: parseInt(process.env.SMTP_PORT || "587"),
      smtpUser: process.env.SMTP_USER || "",
      smtpPass: process.env.SMTP_PASS || "",
      fromEmail: process.env.SMTP_USER || "",
      fromName: "QR Attendance System",
    };

    // Initialize email service
    emailService.initialize(emailConfig);

    // Test connection
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return NextResponse.json(
        { message: "Failed to connect to email server" },
        { status: 500 }
      );
    }

    // Prepare email data
    const emailData: AttendanceEmailData = {
      studentName: "JC3DN Test Student",
      studentEmail: email,
      subjectName: "JC3DN Test subject",
      subjectCode: "JCDN_TEST_SBJ_CODE",
      weekNumber: 1,
      attendancePercentage: 80,
      checkinCount: 0,
      totalAttendancePercentage: 0,
      classesCanMiss: 0,
      isLowAttendance: true,
    };

    // Send email
    await emailService.sendAttendanceReminder(emailData);

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
