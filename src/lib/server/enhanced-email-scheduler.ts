import cron from 'node-cron';
import { emailService, EmailConfig, AttendanceEmailData } from './email';
import { getLectureAttendanceData, calculateStudentOverallAttendance } from './attendance-calculator';
import { rawQuery } from './query';

interface EnhancedSchedulerConfig {
  smtpConfig: EmailConfig;
  enabled: boolean;
  checkIntervalSeconds: number; // Changed to seconds for faster response
  lookbackMinutes: number; // How far back to look for expired sessions
}

class EnhancedAttendanceEmailScheduler {
  private schedulerTask: cron.ScheduledTask | null = null;
  private config: EnhancedSchedulerConfig | null = null;
  private isRunning = false;
  private processedSessions = new Set<string>(); // Track processed sessions to avoid duplicates

  initialize(config: EnhancedSchedulerConfig) {
    this.config = config;
    emailService.initialize(config.smtpConfig);
  }

  start() {
    if (!this.config) {
      throw new Error('Enhanced scheduler not configured');
    }

    if (this.schedulerTask) {
      console.log('Stopping existing enhanced scheduler...');
      this.schedulerTask.stop();
    }

    // Run every N seconds for real-time processing
    const cronExpression = `*/${this.config.checkIntervalSeconds} * * * * *`;
    
    console.log(`🚀 Starting ENHANCED attendance email scheduler`);
    console.log(`   Check interval: every ${this.config.checkIntervalSeconds} seconds`);
    console.log(`   Lookback period: ${this.config.lookbackMinutes} minutes`);
    console.log(`   Real-time processing for multiple classes!`);
    
    this.schedulerTask = cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        return; // Skip if previous check is still running
      }

      this.isRunning = true;
      try {
        await this.processExpiredSessions();
      } catch (error) {
        console.error('Error in enhanced email processing:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('✅ Enhanced attendance email scheduler started successfully');
  }

  stop() {
    if (this.schedulerTask) {
      this.schedulerTask.stop();
      this.schedulerTask = null;
      console.log('Enhanced attendance email scheduler stopped');
    }
  }

  private async processExpiredSessions() {
    if (!this.config) return;

    try {
      // Find QR sessions that expired within the lookback period
      const expiredSessions = await rawQuery<{
        study_session_id: number;
        week_number: number;
        qr_code_id: number;
        latest_end_time: string;
        subject_code: string;
        subject_name: string;
        minutes_since_expired: number;
      }>(
        `
        SELECT DISTINCT
          qrss.study_session_id,
          qrss.week_number,
          qrss.qr_code_id,
          MAX(v.end_time) as latest_end_time,
          s.code as subject_code,
          s.name as subject_name,
          TIMESTAMPDIFF(MINUTE, MAX(v.end_time), NOW()) as minutes_since_expired
        FROM qr_code_study_session qrss
        JOIN validity v ON v.qr_code_id = qrss.qr_code_id
        JOIN study_session ss ON ss.id = qrss.study_session_id
        JOIN subject_study_session sss ON sss.study_session_id = ss.id
        JOIN subject s ON s.id = sss.subject_id
        WHERE ss.type = 'lecture'
          AND v.end_time BETWEEN DATE_SUB(NOW(), INTERVAL ? MINUTE) AND NOW()
          AND v.end_time < NOW()
        GROUP BY qrss.study_session_id, qrss.week_number, qrss.qr_code_id, s.code, s.name
        HAVING latest_end_time < NOW()
        ORDER BY latest_end_time DESC
        `,
        [this.config.lookbackMinutes]
      );

      if (expiredSessions.length === 0) {
        return; // No output to reduce log noise
      }

      // Filter out already processed sessions
      const newSessions = expiredSessions.filter(session => {
        const sessionKey = `${session.study_session_id}-${session.week_number}`;
        return !this.processedSessions.has(sessionKey);
      });

      if (newSessions.length === 0) {
        return; // All sessions already processed
      }

      console.log(`⚡ Found ${newSessions.length} NEW expired lecture sessions`);

      // Process each new expired session
      for (const session of newSessions) {
        await this.processSingleSession(session);
        
        // Mark as processed
        const sessionKey = `${session.study_session_id}-${session.week_number}`;
        this.processedSessions.add(sessionKey);
      }

      console.log(`✅ Processed ${newSessions.length} expired sessions`);

      // Clean up old processed sessions (older than 1 hour)
      this.cleanupProcessedSessions();

    } catch (error) {
      console.error('Error in enhanced processExpiredSessions:', error);
      throw error;
    }
  }

  private async processSingleSession(session: {
    study_session_id: number;
    week_number: number;
    subject_code: string;
    subject_name: string;
    minutes_since_expired: number;
  }) {
    try {
      console.log(`📧 Processing: ${session.subject_code} Week ${session.week_number} (expired ${session.minutes_since_expired}min ago)`);

      // Check if we've already sent emails for this session recently
      const recentEmailCheck = await rawQuery<{ count: number }>(
        `
        SELECT COUNT(*) as count
        FROM email_log 
        WHERE study_session_id = ? 
          AND week_number = ? 
          AND sent_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
        `,
        [session.study_session_id, session.week_number]
      );

      if (recentEmailCheck[0]?.count > 0) {
        console.log(`   ⚠️ Already processed recently, skipping`);
        return;
      }

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

          // Log successful email
          await this.logEmail(
            session.study_session_id,
            session.week_number,
            student.studentId,
            student.studentEmail,
            true
          );

          // Small delay to prevent SMTP rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`   ❌ Failed to send email to ${student.studentEmail}:`, error);
          failedEmails++;

          // Log failed email
          await this.logEmail(
            session.study_session_id,
            session.week_number,
            student.studentId,
            student.studentEmail,
            false,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }

      console.log(`   ✅ Completed: ${emailsSent} sent, ${failedEmails} failed`);

    } catch (error) {
      console.error(`❌ Error processing ${session.subject_code} Week ${session.week_number}:`, error);
    }
  }

  private async logEmail(
    studySessionId: number,
    weekNumber: number,
    studentId: string,
    studentEmail: string,
    success: boolean,
    errorMessage?: string
  ) {
    try {
      await rawQuery(
        `
        INSERT INTO email_log 
        (study_session_id, week_number, student_id, student_email, success, error_message, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
        `,
        [studySessionId, weekNumber, studentId, studentEmail, success, errorMessage || null]
      );
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  private cleanupProcessedSessions() {
    // Remove processed session keys older than 1 hour to prevent memory leak
    // This is a simple cleanup - in production you'd want more sophisticated tracking
    if (this.processedSessions.size > 100) {
      this.processedSessions.clear();
      console.log('🧹 Cleaned up processed sessions cache');
    }
  }

  isSchedulerRunning(): boolean {
    return this.schedulerTask !== null;
  }

  getConfig(): EnhancedSchedulerConfig | null {
    return this.config;
  }

  getProcessedCount(): number {
    return this.processedSessions.size;
  }
}

export const enhancedAttendanceEmailScheduler = new EnhancedAttendanceEmailScheduler();

// Initialize enhanced scheduler from environment variables
export function initializeEnhancedSchedulerFromEnv() {
  const smtpConfig: EmailConfig = {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || '',
    fromName: process.env.FROM_NAME || 'QR Attendance System',
  };

  const schedulerConfig: EnhancedSchedulerConfig = {
    smtpConfig,
    enabled: process.env.AUTO_EMAIL_ENABLED === 'true',
    checkIntervalSeconds: parseInt(process.env.EMAIL_CHECK_INTERVAL_SECONDS || '30'), // Check every 30 seconds
    lookbackMinutes: parseInt(process.env.EMAIL_LOOKBACK_MINUTES || '5'), // Look back 5 minutes
  };

  if (schedulerConfig.enabled && smtpConfig.smtpUser && smtpConfig.smtpPass) {
    enhancedAttendanceEmailScheduler.initialize(schedulerConfig);
    enhancedAttendanceEmailScheduler.start();
    console.log('🚀 ENHANCED real-time attendance email scheduler started!');
    console.log(`   ⚡ Processes multiple classes with ${schedulerConfig.checkIntervalSeconds}s response time`);
  } else {
    console.log('📧 Enhanced attendance email scheduler disabled or not configured');
  }
}