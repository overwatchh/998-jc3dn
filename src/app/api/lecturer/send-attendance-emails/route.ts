import {
  getLectureAttendanceData,
  calculateStudentOverallAttendance,
} from "@/lib/server/attendance-calculator";
import { auth } from "@/lib/server/auth";
import {
  emailService,
  EmailConfig,
  AttendanceEmailData,
} from "@/lib/server/email";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * @openapi
 * /api/lecturer/send-attendance-emails:
 *   post:
 *     tags:
 *       - Lecturer
 *     summary: Send automatic attendance reminder emails after lecture ends
 *     description: Sends attendance reminder emails to all students after a lecture session ends. Calculates attendance for the specific lecture and overall attendance percentage, including how many classes they can still miss.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - study_session_id
 *               - week_number
 *               - smtp_config
 *             properties:
 *               study_session_id:
 *                 type: integer
 *                 description: The study session ID for the lecture
 *               week_number:
 *                 type: integer
 *                 description: The week number of the lecture
 *               smtp_config:
 *                 type: object
 *                 description: SMTP configuration for sending emails
 *                 required:
 *                   - smtp_host
 *                   - smtp_port
 *                   - smtp_user
 *                   - smtp_pass
 *                   - from_email
 *                   - from_name
 *                 properties:
 *                   smtp_host:
 *                     type: string
 *                     description: SMTP server hostname (e.g., smtp.gmail.com)
 *                   smtp_port:
 *                     type: integer
 *                     description: SMTP server port (587 for TLS, 465 for SSL)
 *                   smtp_user:
 *                     type: string
 *                     description: SMTP username (your email)
 *                   smtp_pass:
 *                     type: string
 *                     description: SMTP password or app password
 *                   from_email:
 *                     type: string
 *                     description: From email address
 *                   from_name:
 *                     type: string
 *                     description: From name (e.g., "QR Attendance System")
 *     responses:
 *       200:
 *         description: Attendance emails sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 emails_sent:
 *                   type: integer
 *                 failed_emails:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - not a lecturer
 *       403:
 *         description: Lecturer not assigned to this session
 *       500:
 *         description: Server error or email configuration issue
 */

interface EmailResult {
  studentEmail: string;
  success: boolean;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate lecturer
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const lecturerId = session.user.id;

    // Validate request body
    const body = await req.json();
    const schema = z.object({
      study_session_id: z.number(),
      week_number: z.number(),
      smtp_config: z.object({
        smtp_host: z.string(),
        smtp_port: z.number(),
        smtp_user: z.string(),
        smtp_pass: z.string(),
        from_email: z.string().email(),
        from_name: z.string(),
      }),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid request body",
          errors: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { study_session_id, week_number, smtp_config } = parsed.data;

    // Verify lecturer is assigned to this study session
    const { rawQuery } = await import("@/lib/server/query");
    const [sessionCheck] = await rawQuery<{ study_session_id: number }>(
      `
      SELECT ss.id as study_session_id
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      WHERE ss.id = ? AND lss.lecturer_id = ?
      `,
      [study_session_id, lecturerId]
    );

    if (!sessionCheck) {
      return NextResponse.json(
        { message: "You are not assigned to this study session" },
        { status: 403 }
      );
    }

    // Initialize email service
    const emailConfig: EmailConfig = {
      smtpHost: smtp_config.smtp_host,
      smtpPort: smtp_config.smtp_port,
      smtpUser: smtp_config.smtp_user,
      smtpPass: smtp_config.smtp_pass,
      fromEmail: smtp_config.from_email,
      fromName: smtp_config.from_name,
    };

    await emailService.initialize(emailConfig);

    // Test email connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return NextResponse.json(
        {
          message:
            "Failed to connect to email server. Please check your SMTP configuration.",
        },
        { status: 500 }
      );
    }

    // Get lecture attendance data
    let lectureData;
    try {
      lectureData = await getLectureAttendanceData(
        study_session_id,
        week_number
      );
    } catch (error) {
      return NextResponse.json(
        {
          message: "Failed to retrieve lecture attendance data",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Send emails to all students
    const emailResults: EmailResult[] = [];
    let emailsSent = 0;
    let failedEmails = 0;

    for (const student of lectureData.students) {
      try {
        // Get overall attendance for this student
        const overallAttendance = await calculateStudentOverallAttendance(
          student.studentId,
          student.subjectId
        );

        // Prepare email data
        const emailData: AttendanceEmailData = {
          studentName: student.studentName,
          studentEmail: student.studentEmail,
          subjectName: student.subjectName,
          subjectCode: student.subjectCode,
          weekNumber: student.weekNumber,
          attendancePercentage: student.attendancePercentage,
          checkinCount: student.checkinCount,
          totalAttendancePercentage:
            overallAttendance.totalAttendancePercentage,
          classesCanMiss: overallAttendance.classesCanMiss,
          isLowAttendance: overallAttendance.isLowAttendance,
        };

        // Send email
        await emailService.sendAttendanceReminder(emailData);

        emailResults.push({
          studentEmail: student.studentEmail,
          success: true,
        });
        emailsSent++;

        // Small delay to prevent overwhelming the SMTP server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Failed to send email to ${student.studentEmail}:`,
          error
        );

        emailResults.push({
          studentEmail: student.studentEmail,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failedEmails++;
      }
    }

    return NextResponse.json({
      message: `Attendance emails processed successfully`,
      emails_sent: emailsSent,
      failed_emails: failedEmails,
      total_students: lectureData.students.length,
      subject: `${lectureData.subjectCode} - ${lectureData.subjectName}`,
      week_number: week_number,
      results: emailResults,
    });
  } catch (error) {
    console.error("Error in send-attendance-emails:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
