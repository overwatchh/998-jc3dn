import { NextRequest, NextResponse } from "next/server";
import { rawQuery } from "@/lib/server/query";
import { emailService, EmailConfig, AttendanceEmailData } from "@/lib/server/email";
import { 
  getLectureAttendanceData, 
  calculateStudentOverallAttendance 
} from "@/lib/server/attendance-calculator";

/**
 * @openapi
 * /api/system/lecture-end-trigger:
 *   post:
 *     tags:
 *       - System
 *     summary: Trigger attendance emails when a lecture ends
 *     description: |
 *       **Automatic Email Reminder System**
 *       
 *       This endpoint is automatically called by the system scheduler when a lecture ends. It performs the following operations:
 *       
 *       1. **Validates lecture completion** - Ensures all QR codes have expired
 *       2. **Calculates multi-week attendance** - Aggregates current and historical attendance data
 *       3. **Sends personalized emails** - Delivers attendance reports to all enrolled students
 *       4. **Logs all activity** - Records email attempts in the database for auditing
 *       
 *       **Multi-Week Attendance Tracking:**
 *       - Current week: 0% (no QR), 45% (1 QR), 90% (2 QRs)
 *       - Historical data: Aggregated across all previous weeks
 *       - Risk assessment: Identifies students below attendance threshold
 *       
 *       **Email Content:**
 *       - Current week attendance percentage
 *       - Overall attendance across all weeks
 *       - Number of classes student can still miss
 *       - Warning messages for at-risk students
 *       
 *       **System Requirements:**
 *       - SMTP configuration must be properly set
 *       - System authentication key required
 *       - Only processes lecture-type sessions
 *     security:
 *       - SystemKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - study_session_id
 *               - week_number
 *               - system_key
 *             properties:
 *               study_session_id:
 *                 type: integer
 *                 description: The study session ID for the lecture
 *                 example: 101
 *               week_number:
 *                 type: integer
 *                 description: The week number of the lecture (1-13)
 *                 example: 6
 *                 minimum: 1
 *                 maximum: 13
 *               system_key:
 *                 type: string
 *                 description: System authentication key (from environment SYSTEM_EMAIL_KEY)
 *                 example: "attendance_email_system_2024"
 *     responses:
 *       200:
 *         description: Lecture end processing completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lecture end processing completed"
 *                 study_session_id:
 *                   type: integer
 *                   example: 101
 *                 week_number:
 *                   type: integer
 *                   example: 6
 *                 subject:
 *                   type: string
 *                   example: "CSCI301 - Software Engineering"
 *                 total_qr_codes:
 *                   type: integer
 *                   example: 2
 *                 emails_sent:
 *                   type: integer
 *                   example: 25
 *                 failed_emails:
 *                   type: integer
 *                   example: 0
 *                 total_students:
 *                   type: integer
 *                   example: 25
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       studentEmail:
 *                         type: string
 *                         example: "student@university.edu"
 *                       success:
 *                         type: boolean
 *                         example: true
 *                       error:
 *                         type: string
 *                         example: null
 *                 processed_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-09-15T01:00:30.123Z"
 *       400:
 *         description: Invalid request or lecture not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     missing_params: "study_session_id and week_number are required"
 *                     not_lecture: "Session not found or not a lecture"
 *                     no_qr_codes: "No QR codes found for this lecture"
 *                     not_complete: "Lecture not complete yet - QR codes still active"
 *                 active_qr_codes:
 *                   type: integer
 *                   description: Number of QR codes still active (if lecture not complete)
 *                 total_qr_codes:
 *                   type: integer
 *                   description: Total number of QR codes for this lecture
 *       401:
 *         description: Invalid system authentication key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Server error during email processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     smtp_error: "Failed to connect to email server"
 *                     general_error: "Internal server error"
 *                 error:
 *                   type: string
 *                   description: Detailed error message for debugging
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // System authentication
    const systemKey = body.system_key;
    const expectedKey = process.env.SYSTEM_EMAIL_KEY || "attendance_email_system_2024";
    
    if (systemKey !== expectedKey) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { study_session_id, week_number } = body;

    if (!study_session_id || !week_number) {
      return NextResponse.json({ 
        message: "study_session_id and week_number are required" 
      }, { status: 400 });
    }

    console.log(`🎯 Lecture end triggered for session ${study_session_id}, week ${week_number}`);

    // Check if this is a lecture session
    const [sessionInfo] = await rawQuery<{
      id: number;
      type: string;
      subject_code: string;
      subject_name: string;
    }>(
      `
      SELECT 
        ss.id,
        ss.type,
        s.code as subject_code,
        s.name as subject_name
      FROM study_session ss
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      WHERE ss.id = ?
      `,
      [study_session_id]
    );

    if (!sessionInfo || sessionInfo.type !== 'lecture') {
      return NextResponse.json({ 
        message: "Session not found or not a lecture" 
      }, { status: 400 });
    }

    // Check if both QR validities are complete for this lecture
    const qrValidities = await rawQuery<{
      qr_code_id: number;
      end_time: string;
      is_expired: boolean;
    }>(
      `
      SELECT 
        qrss.qr_code_id,
        v.end_time,
        (v.end_time < NOW()) as is_expired
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.study_session_id = ? AND qrss.week_number = ?
      ORDER BY v.end_time ASC
      `,
      [study_session_id, week_number]
    );

    console.log(`📊 Found ${qrValidities.length} QR codes for this lecture`);

    if (qrValidities.length === 0) {
      return NextResponse.json({ 
        message: "No QR codes found for this lecture" 
      }, { status: 400 });
    }

    // Check if all QR codes have expired (lecture is complete)
    const allExpired = qrValidities.every(qr => qr.is_expired);
    
    if (!allExpired) {
      const activeQRs = qrValidities.filter(qr => !qr.is_expired);
      console.log(`⏳ Lecture not complete yet. ${activeQRs.length} QR codes still active`);
      
      return NextResponse.json({ 
        message: "Lecture not complete yet - QR codes still active",
        active_qr_codes: activeQRs.length,
        total_qr_codes: qrValidities.length
      }, { status: 400 });
    }

    console.log(`✅ All QR codes expired - lecture complete! Sending emails...`);

    // Get SMTP configuration from environment
    const emailConfig: EmailConfig = {
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      fromEmail: process.env.FROM_EMAIL || '',
      fromName: process.env.FROM_NAME || 'QR Attendance System',
    };

    // Initialize email service
    await emailService.initialize(emailConfig);

    // Test connection
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return NextResponse.json(
        { message: "Failed to connect to email server" },
        { status: 500 }
      );
    }

    // Get lecture attendance data
    const lectureData = await getLectureAttendanceData(study_session_id, week_number);
    
    let emailsSent = 0;
    let failedEmails = 0;
    const emailResults: Array<{studentEmail: string; success: boolean; error?: string}> = [];

    // Send emails to all students
    for (const student of lectureData.students) {
      let emailSuccess = false;
      let errorMessage = null;
      
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
        emailSuccess = true;

        emailResults.push({
          studentEmail: student.studentEmail,
          success: true,
        });

        console.log(`📧 Email sent to ${student.studentEmail}`);

        // Small delay to prevent overwhelming SMTP server
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Failed to send email to ${student.studentEmail}:`, error);
        failedEmails++;
        errorMessage = error instanceof Error ? error.message : "Unknown error";

        emailResults.push({
          studentEmail: student.studentEmail,
          success: false,
          error: errorMessage,
        });
      }
      
      // Log email attempt to database
      try {
        await rawQuery(
          `INSERT INTO email_log (study_session_id, week_number, student_id, student_email, success, error_message)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [study_session_id, week_number, student.studentId, student.studentEmail, emailSuccess ? 1 : 0, errorMessage]
        );
      } catch (logError) {
        console.warn('Failed to log email attempt:', logError);
      }
    }

    console.log(`✅ Lecture end processing complete: ${emailsSent} sent, ${failedEmails} failed`);

    return NextResponse.json({
      message: "Lecture end processing completed",
      study_session_id,
      week_number,
      subject: `${sessionInfo.subject_code} - ${sessionInfo.subject_name}`,
      total_qr_codes: qrValidities.length,
      emails_sent: emailsSent,
      failed_emails: failedEmails,
      total_students: lectureData.students.length,
      results: emailResults,
      processed_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error in lecture-end-trigger:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}