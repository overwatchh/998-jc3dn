import nodemailer from 'nodemailer';
import { PartialAttendanceAlert } from './attendanceService';


interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      // Test mode - use ethereal email for testing
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
      console.log('📧 Email service in TEST MODE - emails will be logged, not sent');
    } else {
      // Production mode
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In test mode, just log the email instead of sending
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
        console.log('\n📧 === TEST EMAIL ===');
        console.log('📧 To:', options.to);
        console.log('📧 Subject:', options.subject);
        console.log('📧 Content:', options.text?.substring(0, 200) + '...');
        console.log('📧 ================\n');
        return true; // Simulate successful sending
      }

      const info = await this.transporter.sendMail({
        from: `"QR Attendance System" <${process.env.SMTP_USER || 'test@example.com'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('📧 Email sending failed:', error);
      return false;
    }
  }

  /**
   * Send partial attendance reminder email (after lecture is over)
   */
  async sendPartialAttendanceReminder(alert: PartialAttendanceAlert): Promise<boolean> {
    const subject = `📋 Attendance Notice - ${alert.subject_code} Week ${alert.week_number}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <h2 style="color: #856404; margin: 0;">📋 Attendance Notice</h2>
        </div>
        
        <p>Dear <strong>${alert.student_name}</strong>,</p>
        
        <p>This is a notification regarding your attendance for the recent session:</p>
        
        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Subject:</strong> ${alert.subject_name} (${alert.subject_code})</li>
            <li><strong>Session:</strong> ${alert.session_type} - Week ${alert.week_number}</li>
            <li><strong>Your Attendance:</strong> <span style="color: #ffc107; font-weight: bold;">${alert.attendance_percentage}% (Partial)</span></li>
          </ul>
        </div>

        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff;">
          <h3 style="color: #004085; margin-top: 0;">📊 Attendance Breakdown</h3>
          <p style="margin-bottom: 10px;">You were marked present for the <strong>first part</strong> of the session but missed the <strong>second part</strong>.</p>
          <ul style="color: #004085; margin-bottom: 0;">
            <li>✅ First check-in: <strong>Completed</strong></li>
            <li>❌ Second check-in: <strong>Missed</strong></li>
          </ul>
        </div>

        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #155724; margin-top: 0;">💡 Attendance Policy Reminder</h4>
          <ul style="color: #155724; margin-bottom: 0;">
            <li>Full attendance (100%) = Present for entire session (both check-ins)</li>
            <li>Partial attendance (30%) = Present for part of session (one check-in)</li>
            <li>Please ensure you stay for the complete session to receive full attendance credit</li>
          </ul>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #6c757d;">
            <strong>Questions about this attendance record?</strong><br>
            Please contact your lecturer or the course coordinator.
          </p>
        </div>

        <hr style="border: none; height: 1px; background-color: #dee2e6; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6c757d; text-align: center;">
          This is an automated attendance notification from the QR Attendance System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

    const text = `
ATTENDANCE NOTICE - ${alert.subject_code} Week ${alert.week_number}

Dear ${alert.student_name},

This is a notification regarding your attendance for the recent session:

Subject: ${alert.subject_name} (${alert.subject_code})
Session: ${alert.session_type} - Week ${alert.week_number}
Your Attendance: ${alert.attendance_percentage}% (Partial)

ATTENDANCE BREAKDOWN:
✓ First check-in: Completed
✗ Second check-in: Missed

You were marked present for the first part of the session but missed the second part.

ATTENDANCE POLICY REMINDER:
- Full attendance (100%) = Present for entire session (both check-ins)
- Partial attendance (30%) = Present for part of session (one check-in)
- Please ensure you stay for the complete session to receive full attendance credit

Questions about this attendance record? Please contact your lecturer or course coordinator.

This is an automated attendance notification from the QR Attendance System.
    `;

    return await this.sendEmail({
      to: alert.student_email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send weekly attendance summary
   */
  async sendWeeklyAttendanceSummary(
    studentEmail: string,
    studentName: string,
    summaryData: {
      subject_code: string;
      week_number: number;
      session_type: string;
      attendance_percentage: number;
    }[]
  ): Promise<boolean> {
    const subject = `📊 Weekly Attendance Summary`;
    
    // Calculate overall stats
    const totalSessions = summaryData.length;
    const fullAttendance = summaryData.filter(s => s.attendance_percentage === 100).length;
    const partialAttendance = summaryData.filter(s => s.attendance_percentage === 30).length;
    const absent = summaryData.filter(s => s.attendance_percentage === 0).length;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #007bff; margin: 0;">📊 Weekly Attendance Summary</h2>
        </div>
        
        <p>Dear <strong>${studentName}</strong>,</p>
        
        <p>Here's your attendance summary for this week:</p>
        
        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0;">📈 Overall Statistics</h3>
          <ul>
            <li><strong>Total Sessions:</strong> ${totalSessions}</li>
            <li style="color: #28a745;"><strong>Full Attendance (100%):</strong> ${fullAttendance}</li>
            <li style="color: #ffc107;"><strong>Partial Attendance (30%):</strong> ${partialAttendance}</li>
            <li style="color: #dc3545;"><strong>Absent (0%):</strong> ${absent}</li>
          </ul>
        </div>

        <h3>📚 Session Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Subject</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Week</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Type</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Attendance</th>
            </tr>
          </thead>
          <tbody>
            ${summaryData.map(session => `
              <tr>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${session.subject_code}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${session.week_number}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${session.session_type}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; color: ${
                  session.attendance_percentage === 100 ? '#28a745' : 
                  session.attendance_percentage === 30 ? '#ffc107' : '#dc3545'
                };">
                  <strong>${session.attendance_percentage}%</strong>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${partialAttendance > 0 ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Action Required</h4>
            <p style="color: #856404; margin-bottom: 0;">
              You have ${partialAttendance} session(s) with partial attendance. 
              Watch for upcoming second check-in opportunities to improve your attendance rate!
            </p>
          </div>
        ` : ''}

        <hr style="border: none; height: 1px; background-color: #dee2e6; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6c757d; text-align: center;">
          This is an automated weekly summary from the QR Attendance System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: studentEmail,
      subject,
      html,
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service configuration error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();