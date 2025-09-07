/**
 * EmailJS Attendance Reminder Service
 * Integrates EmailJS with the attendance system for real email delivery
 */

import { nodemailerService, ServerEmailData } from './nodemailerService';

export interface AttendanceEmailData {
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

export class EmailJSAttendanceService {
  
  /**
   * Initialize Nodemailer for server-side use
   */
  async initialize(): Promise<boolean> {
    return await nodemailerService.initialize();
  }

  /**
   * Send attendance reminder email
   */
  async sendAttendanceReminder(data: AttendanceEmailData): Promise<boolean> {
    try {
      console.log(`📧 Sending attendance reminder to ${data.studentEmail}`);
      
      const serverEmailData: ServerEmailData = {
        studentEmail: data.studentEmail,
        studentName: data.studentName,
        courseName: data.courseName,
        courseCode: data.courseCode,
        attendancePercentage: data.attendancePercentage,
        missedSessions: data.missedSessions,
        totalSessions: data.totalSessions,
        remainingAllowableMisses: data.remainingAllowableMisses,
        reminderType: data.reminderType
      };

      const success = await nodemailerService.sendAttendanceReminder(serverEmailData);

      if (success) {
        console.log(`✅ Attendance reminder sent to ${data.studentEmail}`);
      } else {
        console.log(`❌ Failed to send reminder to ${data.studentEmail}`);
      }

      return success;
    } catch (error) {
      console.error(`❌ Error sending attendance reminder:`, error);
      return false;
    }
  }

  /**
   * Send bulk attendance reminders
   */
  async sendBulkReminders(reminders: AttendanceEmailData[]): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const result = { sent: 0, failed: 0, errors: [] as string[] };
    
    console.log(`📧 Sending ${reminders.length} attendance reminders...`);

    for (const reminder of reminders) {
      try {
        const success = await this.sendAttendanceReminder(reminder);
        
        if (success) {
          result.sent++;
        } else {
          result.failed++;
          result.errors.push(`Failed to send to ${reminder.studentEmail}`);
        }
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        result.failed++;
        result.errors.push(`Error sending to ${reminder.studentEmail}: ${error}`);
      }
    }

    console.log(`📊 Bulk reminders result: ${result.sent} sent, ${result.failed} failed`);
    return result;
  }

  /**
   * Test email sending
   */
  async testEmailService(): Promise<boolean> {
    console.log('🧪 Testing Nodemailer attendance service...');
    return await nodemailerService.testEmail();
  }
}

// Create singleton instance
export const emailJSAttendanceService = new EmailJSAttendanceService();