import { NextRequest, NextResponse } from "next/server";
import { rawQuery } from "@/lib/server/query";
import { emailService, EmailConfig, AttendanceEmailData } from "@/lib/server/email";
import { 
  getLectureAttendanceData, 
  calculateStudentOverallAttendance 
} from "@/lib/server/attendance-calculator";

/**
 * @openapi
 * /api/system/auto-email-trigger:
 *   post:
 *     tags:
 *       - System
 *     summary: Automatically trigger attendance emails when lectures end
 *     description: This endpoint can be called by a cron job or scheduler to automatically send attendance reminder emails when QR code validity periods expire. It finds all recently expired QR sessions and sends emails.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smtp_config
 *               - system_key
 *             properties:
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
 *                   smtp_port:
 *                     type: integer
 *                   smtp_user:
 *                     type: string
 *                   smtp_pass:
 *                     type: string
 *                   from_email:
 *                     type: string
 *                   from_name:
 *                     type: string
 *               system_key:
 *                 type: string
 *                 description: System authentication key (to prevent unauthorized use)
 *               minutes_after_expiry:
 *                 type: integer
 *                 description: Only process sessions that expired within this many minutes (default 10)
 *                 default: 10
 *     responses:
 *       200:
 *         description: Auto-email processing completed
 *       401:
 *         description: Invalid system key
 *       500:
 *         description: Server error
 */

interface ProcessedSession {
  study_session_id: number;
  week_number: number;
  subject_code: string;
  subject_name: string;
  emails_sent: number;
  failed_emails: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Simple system authentication (you should use a proper key in production)
    const systemKey = body.system_key;
    const expectedKey = process.env.SYSTEM_EMAIL_KEY || "attendance_email_system_2024";
    
    if (systemKey !== expectedKey) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const minutesAfterExpiry = body.minutes_after_expiry || 10;
    const smtpConfig = body.smtp_config;

    if (!smtpConfig) {
      return NextResponse.json({ message: "SMTP configuration required" }, { status: 400 });
    }

    // Initialize email service
    const emailConfig: EmailConfig = {
      smtpHost: smtpConfig.smtp_host,
      smtpPort: smtpConfig.smtp_port,
      smtpUser: smtpConfig.smtp_user,
      smtpPass: smtpConfig.smtp_pass,
      fromEmail: smtpConfig.from_email,
      fromName: smtpConfig.from_name,
    };

    emailService.initialize(emailConfig);

    // Test connection
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return NextResponse.json(
        { message: "Failed to connect to email server" },
        { status: 500 }
      );
    }

    // Find recently expired QR sessions that haven't been processed
    // We look for sessions where the latest validity window ended within the specified minutes
    const expiredSessions = await rawQuery<{
      study_session_id: number;
      week_number: number;
      qr_code_id: number;
      latest_end_time: string;
    }>(
      `
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        MAX(v.end_time) as latest_end_time
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN study_session ss ON ss.id = qrss.study_session_id
      WHERE ss.type = 'lecture'
        AND v.end_time BETWEEN DATE_SUB(NOW(), INTERVAL ? MINUTE) AND NOW()
        AND v.end_time < NOW()
      GROUP BY qrss.study_session_id, qrss.week_number, qrss.qr_code_id
      HAVING latest_end_time < NOW()
      ORDER BY latest_end_time DESC
      `,
      [minutesAfterExpiry]
    );

    console.log(`Found ${expiredSessions.length} expired lecture sessions to process`);

    const processedSessions: ProcessedSession[] = [];

    for (const session of expiredSessions) {
      try {
        console.log(`Processing session ${session.study_session_id}, week ${session.week_number}`);

        // Get lecture attendance data
        const lectureData = await getLectureAttendanceData(
          session.study_session_id,
          session.week_number
        );

        let emailsSent = 0;
        let failedEmails = 0;

        // Send emails to all students
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
              totalAttendancePercentage: overallAttendance.totalAttendancePercentage,
              classesCanMiss: overallAttendance.classesCanMiss,
              isLowAttendance: overallAttendance.isLowAttendance,
            };

            // Send email
            await emailService.sendAttendanceReminder(emailData);
            emailsSent++;

            // Small delay to prevent overwhelming SMTP server
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (error) {
            console.error(`Failed to send email to ${student.studentEmail}:`, error);
            failedEmails++;
          }
        }

        processedSessions.push({
          study_session_id: session.study_session_id,
          week_number: session.week_number,
          subject_code: lectureData.subjectCode,
          subject_name: lectureData.subjectName,
          emails_sent: emailsSent,
          failed_emails: failedEmails,
        });

        console.log(`Completed processing session ${session.study_session_id}: ${emailsSent} sent, ${failedEmails} failed`);

      } catch (error) {
        console.error(`Error processing session ${session.study_session_id}:`, error);
        processedSessions.push({
          study_session_id: session.study_session_id,
          week_number: session.week_number,
          subject_code: "ERROR",
          subject_name: "Processing failed",
          emails_sent: 0,
          failed_emails: 0,
        });
      }
    }

    const totalEmailsSent = processedSessions.reduce((sum, session) => sum + session.emails_sent, 0);
    const totalFailedEmails = processedSessions.reduce((sum, session) => sum + session.failed_emails, 0);

    return NextResponse.json({
      message: "Auto-email processing completed",
      processed_sessions: processedSessions.length,
      total_emails_sent: totalEmailsSent,
      total_failed_emails: totalFailedEmails,
      sessions: processedSessions,
      processed_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error in auto-email-trigger:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}