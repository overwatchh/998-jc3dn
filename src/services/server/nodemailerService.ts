/**
 * Server-side Email Service using Nodemailer
 * For automatic attendance reminder emails
 */

import * as nodemailer from 'nodemailer';
import { db } from '@/lib/server/db';

export interface ServerEmailData {
  studentEmail: string;
  studentName: string;
  courseName: string;
  courseCode: string;
  attendancePercentage: number;
  missedSessions: number;
  totalSessions: number;
  remainingAllowableMisses: number;
  reminderType: 'first_absence' | 'second_absence' | 'critical_absence';
}

export class NodemailerService {
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize Gmail SMTP transporter
   */
  async initialize(): Promise<boolean> {
    try {
      // Use Gmail SMTP with app password
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'qrattendancesystem2025@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD || 'Qrattendance123@' // Will need Gmail app password
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Nodemailer Gmail SMTP initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Nodemailer:', error);
      return false;
    }
  }

  /**
   * Send attendance reminder email
   */
  async sendAttendanceReminder(data: ServerEmailData): Promise<boolean> {
    if (!this.transporter) {
      console.error('❌ Nodemailer not initialized');
      return false;
    }

    try {
      const subject = this.getEmailSubject(data);
      const htmlContent = this.generateEmailHTML(data);

      const mailOptions = {
        from: {
          name: 'QR Attendance System',
          address: 'qrattendancesystem2025@gmail.com'
        },
        to: data.studentEmail,
        subject: subject,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${data.studentEmail}:`, result.messageId);
      return true;

    } catch (error) {
      console.error(`❌ Failed to send email to ${data.studentEmail}:`, error);
      return false;
    }
  }

  private getEmailSubject(data: ServerEmailData): string {
    switch (data.reminderType) {
      case 'critical_absence':
        return `🚨 CRITICAL: Attendance Below Required Threshold - ${data.courseCode}`;
      case 'second_absence':
        return `⚠️ WARNING: Low Attendance Alert - ${data.courseCode}`;
      case 'first_absence':
        return `📝 REMINDER: Attendance Notice - ${data.courseCode}`;
      default:
        return `📧 Attendance Reminder - ${data.courseCode}`;
    }
  }

  private generateEmailHTML(data: ServerEmailData): string {
    const statusColor = data.attendancePercentage < 50 ? '#dc3545' : data.attendancePercentage < 80 ? '#fd7e14' : '#28a745';
    const urgencyLevel = data.attendancePercentage < 50 ? 'CRITICAL' : data.attendancePercentage < 80 ? 'WARNING' : 'NOTICE';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Attendance Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
        .stats { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
        .urgent { color: ${statusColor}; font-weight: bold; }
        .action-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 ${urgencyLevel} ATTENDANCE NOTICE</h1>
        </div>
        
        <div class="content">
            <p><strong>Dear ${data.studentName},</strong></p>
            
            <p>Your attendance in <strong>${data.courseName} (${data.courseCode})</strong> requires immediate attention.</p>
            
            <div class="stats">
                <h3>📊 CURRENT ATTENDANCE STATUS:</h3>
                <ul>
                    <li><strong>Current Attendance:</strong> <span class="urgent">${data.attendancePercentage.toFixed(1)}%</span></li>
                    <li><strong>Sessions Attended:</strong> ${data.totalSessions - data.missedSessions} out of ${data.totalSessions}</li>
                    <li><strong>Sessions Missed:</strong> <span class="urgent">${data.missedSessions}</span></li>
                    <li><strong>Required Threshold:</strong> 80%</li>
                    ${data.remainingAllowableMisses > 0 
                        ? `<li><strong>🟢 Classes You Can Still Skip:</strong> <span style="color: #28a745; font-weight: bold;">${data.remainingAllowableMisses} session(s)</span></li>`
                        : `<li><strong>🔴 Classes You Can Still Skip:</strong> <span style="color: #dc3545; font-weight: bold;">0 sessions - Cannot miss any more!</span></li>`
                    }
                </ul>
            </div>

            ${data.attendancePercentage < 80 ? `
            <div class="action-box">
                <h3>⚠️ IMMEDIATE ACTION REQUIRED</h3>
                <p>Your attendance of ${data.attendancePercentage.toFixed(1)}% is below the mandatory 80% requirement.</p>
                <p><strong>This puts you at risk of:</strong></p>
                <ul>
                    <li>Academic penalties</li>
                    <li>Failing the course due to insufficient attendance</li>
                    <li>Impact on your overall academic standing</li>
                </ul>
            </div>
            ` : ''}

            <h3>📋 NEXT STEPS:</h3>
            <ol>
                <li><strong>Attend ALL remaining classes</strong> without exception</li>
                <li><strong>Contact your lecturer immediately</strong> to discuss your situation</li>
                <li><strong>Ensure you scan QR codes</strong> for all future classes</li>
                <li><strong>Review any missed material</strong> or assignments</li>
            </ol>

            <div class="stats">
                <h3>👨‍🏫 LECTURER CONTACT:</h3>
                <p><strong>Lecturer:</strong> Deepak Kumar Sunar<br>
                <strong>Email:</strong> dks695@uowmail.edu.au<br>
                <strong>Course:</strong> ${data.courseName} (${data.courseCode})</p>
            </div>

            <p><em>This is an automated reminder sent when attendance falls below the required threshold. If you believe this is an error, please contact your lecturer immediately.</em></p>
            
            <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="footer">
            <p>🎓 QR Attendance System - University of Wollongong</p>
            <p>This email was sent automatically. Please do not reply to this address.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Test email functionality
   */
  async testEmail(): Promise<boolean> {
    const testData: ServerEmailData = {
      studentEmail: 'sunard79@gmail.com',
      studentName: 'Test Student',
      courseName: 'Software Engineering',
      courseCode: 'CSCI301',
      attendancePercentage: 37.5,
      missedSessions: 5,
      totalSessions: 8,
      reminderType: 'critical_absence'
    };

    console.log('🧪 Testing server-side email...');
    return await this.sendAttendanceReminder(testData);
  }
}

export const nodemailerService = new NodemailerService();