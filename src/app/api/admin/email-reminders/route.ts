import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { findPartialAttendanceAlerts } from "@/lib/services/attendanceService";
import { emailService } from "@/lib/services/emailService";
import { rawQuery } from "@/lib/server/query";

/**
 * @openapi
 * /api/admin/email-reminders:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Send email reminders for partial attendance
 *     description: Finds students with partial attendance and sends email reminders
 *     responses:
 *       200:
 *         description: Email reminders sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sent_count:
 *                   type: number
 *                 failed_count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin only)
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "lecturer") {
    return NextResponse.json(
      { message: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    // Find all students with partial attendance
    const partialAttendanceAlerts = await findPartialAttendanceAlerts();

    console.log(`Found ${partialAttendanceAlerts.length} students with partial attendance`);

    let sentCount = 0;
    let failedCount = 0;

    // Send email reminders
    for (const alert of partialAttendanceAlerts) {
      try {
        const success = await emailService.sendPartialAttendanceReminder(alert);
        
        if (success) {
          sentCount++;
          // Log email sent to database
          await rawQuery(
            `
            INSERT INTO email_log (student_id, email_type, subject, sent_at, status)
            VALUES (?, ?, ?, NOW(), ?)
            `,
            [
              alert.student_id,
              'partial_attendance_reminder',
              `⚠️ Partial Attendance Alert - ${alert.subject_code} Week ${alert.week_number}`,
              'sent'
            ]
          );
        } else {
          failedCount++;
          // Log failed email
          await rawQuery(
            `
            INSERT INTO email_log (student_id, email_type, subject, sent_at, status)
            VALUES (?, ?, ?, NOW(), ?)
            `,
            [
              alert.student_id,
              'partial_attendance_reminder',
              `⚠️ Partial Attendance Alert - ${alert.subject_code} Week ${alert.week_number}`,
              'failed'
            ]
          );
        }
      } catch (error) {
        console.error(`Failed to send email to ${alert.student_email}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      message: `Email reminders processed`,
      total_alerts: partialAttendanceAlerts.length,
      sent_count: sentCount,
      failed_count: failedCount,
      alerts: partialAttendanceAlerts.map(alert => ({
        student_name: alert.student_name,
        student_email: alert.student_email,
        subject: alert.subject_code,
        week: alert.week_number,
        attendance_percentage: alert.attendance_percentage,
      })),
    });
  } catch (error) {
    console.error("Error processing email reminders:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/admin/email-reminders:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get partial attendance alerts without sending emails
 *     description: Preview students who would receive partial attendance reminders
 *     responses:
 *       200:
 *         description: Partial attendance alerts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "lecturer") {
    return NextResponse.json(
      { message: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const partialAttendanceAlerts = await findPartialAttendanceAlerts();

    // Get recent email history
    const recentEmails = await rawQuery<{
      student_id: string;
      student_name: string;
      email_type: string;
      subject: string;
      sent_at: string;
      status: string;
    }>(
      `
      SELECT 
        el.student_id,
        u.name as student_name,
        el.email_type,
        el.subject,
        el.sent_at,
        el.status
      FROM email_log el
      JOIN user u ON u.id = el.student_id
      WHERE el.sent_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      ORDER BY el.sent_at DESC
      LIMIT 50
      `,
      []
    );

    return NextResponse.json({
      alerts: partialAttendanceAlerts,
      recent_emails: recentEmails,
      summary: {
        total_partial_attendance: partialAttendanceAlerts.length,
        recent_emails_sent: recentEmails.filter(e => e.status === 'sent').length,
        recent_emails_failed: recentEmails.filter(e => e.status === 'failed').length,
      },
    });
  } catch (error) {
    console.error("Error fetching partial attendance alerts:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}