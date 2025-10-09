import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { rawQuery } from "@/lib/server/query";
import QRCode from "qrcode";

const APP_URL = process.env.BASE_URL || "http://localhost:3000";

/**
 * @openapi
 * /api/lecturer/send-qr-email:
 *   post:
 *     tags:
 *       - Lecturer
 *     summary: Send QR code link/image to enrolled students
 *     description: Sends an email with the QR code link or image to all students enrolled in the session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_code_id
 *             properties:
 *               qr_code_id:
 *                 type: integer
 *                 description: The QR code ID to send
 *     responses:
 *       200:
 *         description: QR code emails sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

interface Student {
  student_id: string;
  student_name: string;
  student_email: string;
}

interface QRCodeData {
  qr_url: string;
  study_session_id: number;
  week_number: number;
  subject_code: string;
  subject_name: string;
  session_type: string;
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
      qr_code_id: z.number(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request body", errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const { qr_code_id } = parsed.data;

    // Get QR code details and verify lecturer ownership
    const [qrCodeData] = await rawQuery<Omit<QRCodeData, 'qr_url'>>(
      `
      SELECT
        ss.id as study_session_id,
        qcss.week_number,
        sub.code as subject_code,
        sub.name as subject_name,
        ss.type as session_type
      FROM qr_code_study_session qcss
      JOIN study_session ss ON ss.id = qcss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject sub ON sub.id = sss.subject_id
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      WHERE qcss.id = ? AND lss.lecturer_id = ?
      `,
      [qr_code_id, lecturerId]
    );

    if (!qrCodeData) {
      return NextResponse.json(
        { message: "QR code not found or you don't have permission" },
        { status: 403 }
      );
    }

    // Generate QR code URL dynamically
    const qrUrl = `${APP_URL}/scan?qr_code_id=${qr_code_id}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);

    // Get enrolled students for this study session
    // For tutorials, use student_study_session (students enrolled in specific tutorial)
    // For lectures, use enrolment (all students enrolled in subject)
    let students: Student[];

    if (qrCodeData.session_type === 'tutorial') {
      students = await rawQuery<Student>(
        `
        SELECT DISTINCT
          u.id as student_id,
          u.name as student_name,
          u.email as student_email
        FROM student_study_session sss
        JOIN user u ON u.id = sss.student_id
        WHERE sss.study_session_id = ?
        `,
        [qrCodeData.study_session_id]
      );
    } else {
      students = await rawQuery<Student>(
        `
        SELECT DISTINCT
          u.id as student_id,
          u.name as student_name,
          u.email as student_email
        FROM enrolment e
        JOIN user u ON u.id = e.student_id
        JOIN subject_study_session sss ON sss.subject_id = e.subject_id
        WHERE sss.study_session_id = ?
        `,
        [qrCodeData.study_session_id]
      );
    }

    if (students.length === 0) {
      return NextResponse.json(
        { message: "No enrolled students found for this session" },
        { status: 400 }
      );
    }

    // Import email service
    const { emailService } = await import("@/lib/server/email");

    // Initialize email service if not already initialized
    if (!emailService.isInitialized()) {
      // Use environment variables for SMTP configuration
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = process.env.SMTP_PORT;

      if (!smtpUser || !smtpPass || !smtpPort) {
        return NextResponse.json(
          { message: "Email service not configured. Please configure SMTP settings in environment variables." },
          { status: 500 }
        );
      }

      await emailService.initialize({
        smtpHost: "smtp.gmail.com",
        smtpPort: parseInt(smtpPort),
        smtpUser: smtpUser,
        smtpPass: smtpPass,
        fromEmail: smtpUser,
        fromName: "QR Attendance System",
      });
    }

    // Send emails to all students in parallel batches
    const BATCH_SIZE = 10; // Send 10 emails at a time
    const emailResults = [];
    let emailsSent = 0;
    let failedEmails = 0;

    // Process students in batches
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (student) => {
        try {
          await emailService.sendQRCodeEmail({
            studentName: student.student_name,
            studentEmail: student.student_email,
            subjectName: qrCodeData.subject_name,
            subjectCode: qrCodeData.subject_code,
            sessionType: qrCodeData.session_type,
            weekNumber: qrCodeData.week_number,
            qrCodeUrl: qrDataUrl,
            scanUrl: qrUrl,
          });

          return {
            studentEmail: student.student_email,
            success: true,
          };
        } catch (error) {
          console.error(`Failed to send QR email to ${student.student_email}:`, error);

          return {
            studentEmail: student.student_email,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      // Wait for all emails in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      emailResults.push(...batchResults);

      // Count successes and failures
      batchResults.forEach(result => {
        if (result.success) {
          emailsSent++;
        } else {
          failedEmails++;
        }
      });

      // Small delay between batches to prevent overwhelming the SMTP server
      if (i + BATCH_SIZE < students.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      message: `QR code emails processed successfully`,
      emails_sent: emailsSent,
      failed_emails: failedEmails,
      total_students: students.length,
      subject: `${qrCodeData.subject_code} - ${qrCodeData.subject_name}`,
      week_number: qrCodeData.week_number,
      results: emailResults,
    });

  } catch (error) {
    console.error("Error in send-qr-email:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}