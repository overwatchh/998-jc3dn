import nodemailer from 'nodemailer';
import { rawQuery } from '@/lib/server/query';
import { RowDataPacket } from 'mysql2';
import { getEmailConfigByAddress, detectEmailProvider, EMAIL_PROVIDERS, EmailProvider } from '@/config/emailProviders';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailReminderData {
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseCode: string;
  attendancePercentage: number;
  missedSessions: number;
  totalSessions: number;
  remainingAllowableMisses: number;
  sessionType: 'lecture' | 'lab';
  lecturerName?: string;
  lecturerEmail?: string;
}

export interface EmailLogEntry {
  studentId: string;
  courseId: number;
  reminderType: 'first_absence' | 'second_absence' | 'critical_absence';
  sessionType: 'lecture' | 'lab';
  missedCount: number;
  totalSessions: number;
  attendancePercentage: number;
  emailSubject: string;
  emailBody: string;
  emailStatus: 'sent' | 'failed' | 'pending';
}

interface StudentCourseInfo extends RowDataPacket {
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: number;
  course_name: string;
  course_code: string;
  lecturer_name: string;
  lecturer_email: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }

  async sendAttendanceReminder(
    studentId: string,
    courseId: number,
    reminderType: 'first_absence' | 'second_absence' | 'critical_absence',
    reminderData: EmailReminderData
  ): Promise<boolean> {
    try {
      const template = this.generateEmailTemplate(reminderType, reminderData);
      
      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to: reminderData.studentEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      if (reminderType === 'critical_absence' && reminderData.lecturerEmail) {
        mailOptions.to = `${reminderData.studentEmail}, ${reminderData.lecturerEmail}`;
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      await this.logEmailSent({
        studentId,
        courseId,
        reminderType,
        sessionType: reminderData.sessionType,
        missedCount: reminderData.missedSessions,
        totalSessions: reminderData.totalSessions,
        attendancePercentage: reminderData.attendancePercentage,
        emailSubject: template.subject,
        emailBody: template.html,
        emailStatus: 'sent',
      });

      return !!result.messageId;
    } catch (error) {
      console.error('Email sending failed:', error);
      
      await this.logEmailSent({
        studentId,
        courseId,
        reminderType,
        sessionType: reminderData.sessionType,
        missedCount: reminderData.missedSessions,
        totalSessions: reminderData.totalSessions,
        attendancePercentage: reminderData.attendancePercentage,
        emailSubject: `Attendance Notice - ${reminderData.courseName}`,
        emailBody: 'Email send failed',
        emailStatus: 'failed',
      });

      return false;
    }
  }

  async getStudentCourseInfo(studentId: string, courseId: number): Promise<StudentCourseInfo | null> {
    const query = `
      SELECT 
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        c.id as course_id,
        c.name as course_name,
        c.code as course_code,
        lecturer.name as lecturer_name,
        lecturer.email as lecturer_email
      FROM user u
      JOIN enrollments e ON u.id = e.student_id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN course_lecturers cl ON c.id = cl.course_id
      LEFT JOIN user lecturer ON cl.lecturer_id = lecturer.id
      WHERE u.id = ? AND c.id = ?
      LIMIT 1
    `;

    const results = await rawQuery<StudentCourseInfo>(query, [studentId, courseId]);
    return results[0] || null;
  }

  async hasRecentEmailBeenSent(
    studentId: string,
    courseId: number,
    reminderType: 'first_absence' | 'second_absence' | 'critical_absence',
    sessionType: 'lecture' | 'lab',
    hoursWindow: number = 24
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM email_reminder_logs
      WHERE student_id = ? 
        AND course_id = ? 
        AND reminder_type = ?
        AND session_type = ?
        AND email_status = 'sent'
        AND sent_at > DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;

    const results = await rawQuery<{ count: number } & RowDataPacket>(
      query,
      [studentId, courseId, reminderType, sessionType, hoursWindow]
    );

    return (results[0]?.count || 0) > 0;
  }

  private generateEmailTemplate(
    reminderType: 'first_absence' | 'second_absence' | 'critical_absence',
    data: EmailReminderData
  ): EmailTemplate {
    switch (reminderType) {
      case 'first_absence':
        return this.getFirstReminderTemplate(data);
      case 'second_absence':
        return this.getSecondWarningTemplate(data);
      case 'critical_absence':
        return this.getCriticalNoticeTemplate(data);
      default:
        throw new Error(`Unknown reminder type: ${reminderType}`);
    }
  }

  private getFirstReminderTemplate(data: EmailReminderData): EmailTemplate {
    const subject = `Attendance Notice - ${data.courseName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
          <h2 style="color: #333; margin-top: 0;">Attendance Reminder</h2>
          
          <p>Dear ${data.studentName},</p>
          
          <p>We hope this message finds you well. This is a friendly reminder about maintaining the required attendance for your course.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Course Information</h3>
            <p><strong>Course:</strong> ${data.courseName} (${data.courseCode})</p>
            <p><strong>Session Type:</strong> ${data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1)}</p>
            <p><strong>Current Attendance:</strong> You have attended ${data.totalSessions - data.missedSessions} out of ${data.totalSessions} sessions (${data.attendancePercentage.toFixed(1)}%)</p>
            <p><strong>Remaining Allowable Absences:</strong> ${data.remainingAllowableMisses} session(s)</p>
          </div>
          
          <p>Please ensure you maintain at least 80% attendance to meet course requirements. If you have any questions or concerns about your attendance, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>Academic Administration</p>
        </div>
      </div>
    `;
    
    const text = `
      Attendance Reminder
      
      Dear ${data.studentName},
      
      This is a friendly reminder about maintaining the required attendance for ${data.courseName} (${data.courseCode}).
      
      Current Status:
      - Session Type: ${data.sessionType}
      - Attended: ${data.totalSessions - data.missedSessions} out of ${data.totalSessions} sessions
      - Attendance Rate: ${data.attendancePercentage.toFixed(1)}%
      - Remaining Allowable Absences: ${data.remainingAllowableMisses} session(s)
      
      Please maintain at least 80% attendance to meet course requirements.
      
      Best regards,
      Academic Administration
    `;

    return { subject, html, text };
  }

  private getSecondWarningTemplate(data: EmailReminderData): EmailTemplate {
    const subject = `Important: Attendance Warning - ${data.courseName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h2 style="color: #856404; margin-top: 0;">⚠️ Attendance Warning</h2>
          
          <p>Dear ${data.studentName},</p>
          
          <p><strong>Important Notice:</strong> Your attendance for ${data.courseName} has dropped to a level that requires immediate attention.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">Current Attendance Status</h3>
            <p><strong>Course:</strong> ${data.courseName} (${data.courseCode})</p>
            <p><strong>Session Type:</strong> ${data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1)}</p>
            <p><strong>Sessions Attended:</strong> ${data.totalSessions - data.missedSessions} out of ${data.totalSessions}</p>
            <p><strong>Current Attendance Rate:</strong> ${data.attendancePercentage.toFixed(1)}%</p>
            <p style="color: #dc3545;"><strong>⚠️ Critical:</strong> You cannot miss any more ${data.sessionType} sessions to stay above the 80% threshold!</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0;">What You Need to Do:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Attend all remaining ${data.sessionType} sessions</li>
              <li>Contact your lecturer immediately if you have valid reasons for previous absences</li>
              <li>Review the course attendance policy</li>
            </ul>
          </div>
          
          <p>Failure to maintain the required 80% attendance may result in academic consequences. Please take immediate action to ensure your academic success.</p>
          
          <p>If you have any questions or need support, please contact your lecturer or academic advisor immediately.</p>
          
          <p>Best regards,<br>Academic Administration</p>
        </div>
      </div>
    `;
    
    const text = `
      ⚠️ ATTENDANCE WARNING
      
      Dear ${data.studentName},
      
      IMPORTANT: Your attendance for ${data.courseName} requires immediate attention.
      
      Current Status:
      - Course: ${data.courseName} (${data.courseCode})
      - Session Type: ${data.sessionType}
      - Attended: ${data.totalSessions - data.missedSessions} out of ${data.totalSessions} sessions
      - Attendance Rate: ${data.attendancePercentage.toFixed(1)}%
      
      ⚠️ CRITICAL: You cannot miss any more ${data.sessionType} sessions to stay above 80% threshold!
      
      Required Actions:
      1. Attend all remaining ${data.sessionType} sessions
      2. Contact your lecturer immediately if you have valid reasons for absences
      3. Review the course attendance policy
      
      Please take immediate action to ensure your academic success.
      
      Academic Administration
    `;

    return { subject, html, text };
  }

  private getCriticalNoticeTemplate(data: EmailReminderData): EmailTemplate {
    const subject = `Critical: Attendance Below Threshold - ${data.courseName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h2 style="color: #721c24; margin-top: 0;">🚨 Critical: Attendance Below Threshold</h2>
          
          <p>Dear ${data.studentName},</p>
          
          <p><strong>URGENT NOTICE:</strong> Your attendance for ${data.courseName} has fallen below the required 80% threshold.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 2px solid #dc3545;">
            <h3 style="margin-top: 0; color: #721c24;">Final Attendance Status</h3>
            <p><strong>Course:</strong> ${data.courseName} (${data.courseCode})</p>
            <p><strong>Session Type:</strong> ${data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1)}</p>
            <p><strong>Sessions Attended:</strong> ${data.totalSessions - data.missedSessions} out of ${data.totalSessions}</p>
            <p style="color: #dc3545; font-size: 18px;"><strong>Final Attendance Rate: ${data.attendancePercentage.toFixed(1)}%</strong></p>
            <p style="color: #dc3545;"><strong>⚠️ Status:</strong> Below Required 80% Threshold</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">Immediate Actions Required:</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Contact your lecturer immediately</strong> to discuss your situation</li>
              <li>Report any attendance discrepancies or errors in recording</li>
              <li>Provide documentation for any medical or emergency absences</li>
              <li>Schedule a meeting with your academic advisor</li>
            </ol>
          </div>
          
          ${data.lecturerName && data.lecturerEmail ? `
          <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #bee5eb;">
            <h4 style="margin-top: 0; color: #0c5460;">Lecturer Contact Information:</h4>
            <p><strong>Name:</strong> ${data.lecturerName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.lecturerEmail}">${data.lecturerEmail}</a></p>
            <p><em>Your lecturer has been copied on this notification.</em></p>
          </div>
          ` : ''}
          
          <p style="color: #721c24;"><strong>Please note:</strong> This attendance deficiency may result in academic consequences as outlined in the course syllabus and university policies.</p>
          
          <p>Take immediate action to address this situation. Time is critical.</p>
          
          <p>Best regards,<br>Academic Administration</p>
        </div>
      </div>
    `;
    
    const text = `
      🚨 CRITICAL: ATTENDANCE BELOW THRESHOLD
      
      Dear ${data.studentName},
      
      URGENT: Your attendance for ${data.courseName} has fallen below the required 80% threshold.
      
      Final Status:
      - Course: ${data.courseName} (${data.courseCode})
      - Session Type: ${data.sessionType}
      - Attended: ${data.totalSessions - data.missedSessions} out of ${data.totalSessions} sessions
      - Final Attendance Rate: ${data.attendancePercentage.toFixed(1)}%
      - Status: BELOW REQUIRED 80% THRESHOLD
      
      IMMEDIATE ACTIONS REQUIRED:
      1. Contact your lecturer immediately: ${data.lecturerName} (${data.lecturerEmail})
      2. Report any attendance discrepancies
      3. Provide documentation for medical/emergency absences
      4. Schedule meeting with academic advisor
      
      This may result in academic consequences. Take immediate action.
      
      Academic Administration
    `;

    return { subject, html, text };
  }

  private async logEmailSent(logEntry: EmailLogEntry): Promise<void> {
    const query = `
      INSERT INTO email_reminder_logs (
        student_id, course_id, reminder_type, session_type, missed_count,
        total_sessions, attendance_percentage, email_subject, email_body, email_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await rawQuery(query, [
      logEntry.studentId,
      logEntry.courseId,
      logEntry.reminderType,
      logEntry.sessionType,
      logEntry.missedCount,
      logEntry.totalSessions,
      logEntry.attendancePercentage,
      logEntry.emailSubject,
      logEntry.emailBody,
      logEntry.emailStatus,
    ]);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();