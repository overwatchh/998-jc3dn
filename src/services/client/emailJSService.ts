/**
 * EmailJS Service - Free Email Sending from Browser
 * No server setup, no SMTP, completely free!
 */

import emailjs from '@emailjs/browser';

export class EmailJSService {
  private initialized = false;
  private serviceId = '';
  private templateId = '';
  private publicKey = '';

  /**
   * Initialize EmailJS
   */
  async initialize(serviceId: string, templateId: string, publicKey: string): Promise<boolean> {
    try {
      this.serviceId = serviceId;
      this.templateId = templateId;
      this.publicKey = publicKey;
      
      // Initialize EmailJS with public key
      emailjs.init(publicKey);
      
      this.initialized = true;
      console.log('✅ EmailJS initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
      return false;
    }
  }

  /**
   * Send email using EmailJS
   */
  async sendEmail(templateParams: {
    to_email: string;
    to_name: string;
    from_name: string;
    subject: string;
    message: string;
    [key: string]: string | number;
  }): Promise<boolean> {
    if (!this.initialized) {
      console.error('❌ EmailJS not initialized');
      return false;
    }

    try {
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        this.publicKey
      );

      console.log('✅ Email sent successfully via EmailJS:', response.status);
      return true;

    } catch (error: unknown) {
      console.error('❌ Failed to send email via EmailJS:', error);
      return false;
    }
  }

  /**
   * Send attendance reminder email
   */
  async sendAttendanceReminder(data: {
    studentEmail: string;
    studentName: string;
    courseName: string;
    courseCode: string;
    attendancePercentage: number;
    missedSessions: number;
    totalSessions: number;
  }): Promise<boolean> {
    const templateParams = {
      to_email: data.studentEmail,
      to_name: data.studentName,
      from_name: 'QR Attendance System',
      subject: `Attendance Alert: ${data.courseCode} - ${data.courseName}`,
      message: `
Hello ${data.studentName},

This is an automated reminder about your attendance in ${data.courseCode} - ${data.courseName}.

Current Attendance Status:
• Attendance Percentage: ${data.attendancePercentage}%
• Sessions Missed: ${data.missedSessions}
• Total Sessions: ${data.totalSessions}
• Required Threshold: 80%

${data.attendancePercentage < 80 ? 
  '⚠️ WARNING: Your attendance is below the required 80% threshold. Please attend upcoming classes to avoid academic consequences.' :
  '✅ Your attendance is currently above the required threshold. Keep up the good work!'
}

If you have any questions or concerns about your attendance, please contact your lecturer immediately.

Best regards,
QR Attendance System
      `,
      course_name: data.courseName,
      course_code: data.courseCode,
      attendance_percentage: data.attendancePercentage,
      missed_sessions: data.missedSessions,
      total_sessions: data.totalSessions
    };

    return await this.sendEmail(templateParams);
  }

  /**
   * Test the service
   */
  async testService(): Promise<boolean> {
    if (!this.initialized) {
      console.error('❌ EmailJS not initialized');
      return false;
    }

    try {
      const success = await this.sendEmail({
        to_email: 'sunard79@gmail.com',
        to_name: 'Test Student',
        from_name: 'QR Attendance System',
        subject: '🧪 EmailJS Test - QR Attendance System',
        message: `
Hello!

This is a test email sent using EmailJS - completely free and no server setup required!

✅ EmailJS is working perfectly
✅ Emails can now be sent to real inboxes
✅ No SMTP configuration needed
✅ No authentication hassles

Time: ${new Date().toLocaleString()}

Best regards,
QR Attendance System (via EmailJS)
        `
      });

      return success;
    } catch (error) {
      console.error('❌ EmailJS test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const emailJSService = new EmailJSService();