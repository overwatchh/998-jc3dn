import cron from 'node-cron';
import { emailService, EmailConfig, AttendanceEmailData } from './email';
import { getLectureAttendanceData, calculateStudentOverallAttendance } from './attendance-calculator';
import { rawQuery } from './query';

interface SchedulerConfig {
  smtpConfig: EmailConfig;
  enabled: boolean;
  checkIntervalMinutes: number;
}

class AttendanceEmailScheduler {
  private schedulerTask: cron.ScheduledTask | null = null;
  private config: SchedulerConfig | null = null;
  private isRunning = false;

  initialize(config: SchedulerConfig) {
    this.config = config;
    emailService.initialize(config.smtpConfig);
  }

  start() {
    if (!this.config) {
      throw new Error('Scheduler not configured');
    }

    if (this.schedulerTask) {
      console.log('Stopping existing scheduler...');
      this.schedulerTask.stop();
    }

    // Run every N minutes (configurable)
    const cronExpression = `*/${this.config.checkIntervalMinutes} * * * *`;
    
    console.log(`Starting attendance email scheduler with interval: ${this.config.checkIntervalMinutes} minutes`);
    
    this.schedulerTask = cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        console.log('Previous email job still running, skipping this cycle...');
        return;
      }

      this.isRunning = true;
      try {
        await this.processExpiredSessions();
      } catch (error) {
        console.error('Error in scheduled email processing:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('Attendance email scheduler started successfully');
  }

  stop() {
    if (this.schedulerTask) {
      this.schedulerTask.stop();
      this.schedulerTask = null;
      console.log('Attendance email scheduler stopped');
    }
  }

  private async processExpiredSessions() {
    if (!this.config) return;

    try {
      console.log('Checking for recently expired lecture sessions...');

      // Find QR sessions that ended in the last checkIntervalMinutes + 1 minute
      // This ensures we catch sessions that expired since the last check
      const lookbackMinutes = this.config.checkIntervalMinutes + 1;
      
      const expiredSessions = await rawQuery<{
        study_session_id: number;
        week_number: number;
        qr_code_id: number;
        latest_end_time: string;
        subject_code: string;
        subject_name: string;
      }>(
        `
        SELECT DISTINCT
          qrss.study_session_id,
          qrss.week_number,
          qrss.qr_code_id,
          MAX(v.end_time) as latest_end_time,
          s.code as subject_code,
          s.name as subject_name
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
        [lookbackMinutes]
      );

      if (expiredSessions.length === 0) {
        console.log('No recently expired lecture sessions found');
        return;
      }

      console.log(`Found ${expiredSessions.length} expired lecture sessions to process`);

      // Process each expired session
      for (const session of expiredSessions) {
        await this.processSingleSession(session);
      }

      console.log('Completed processing all expired sessions');

    } catch (error) {
      console.error('Error in processExpiredSessions:', error);
      throw error;
    }
  }

  private async processSingleSession(session: {
    study_session_id: number;
    week_number: number;
    subject_code: string;
    subject_name: string;
  }) {
    try {
      console.log(`Processing ${session.subject_code} - Week ${session.week_number}`);

      // Check if we've already processed this session recently to avoid duplicates
      const recentProcessing = await rawQuery<{ count: number }>(
        `
        SELECT COUNT(*) as count
        FROM email_log 
        WHERE study_session_id = ? 
          AND week_number = ? 
          AND sent_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
        `,
        [session.study_session_id, session.week_number]
      );

      if (recentProcessing[0]?.count > 0) {
        console.log(`Session ${session.study_session_id} Week ${session.week_number} already processed recently, skipping`);
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

          // Delay to prevent SMTP rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          console.error(`Failed to send email to ${student.studentEmail}:`, error);
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

      console.log(`Session ${session.study_session_id} completed: ${emailsSent} sent, ${failedEmails} failed`);

    } catch (error) {
      console.error(`Error processing session ${session.study_session_id}:`, error);
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

  isSchedulerRunning(): boolean {
    return this.schedulerTask !== null;
  }

  getConfig(): SchedulerConfig | null {
    return this.config;
  }
}

export const attendanceEmailScheduler = new AttendanceEmailScheduler();

// Initialize scheduler from environment variables
export function initializeSchedulerFromEnv() {
  const smtpConfig: EmailConfig = {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || '',
    fromName: process.env.FROM_NAME || 'QR Attendance System',
  };

  const schedulerConfig: SchedulerConfig = {
    smtpConfig,
    enabled: process.env.AUTO_EMAIL_ENABLED === 'true',
    checkIntervalMinutes: parseInt(process.env.EMAIL_CHECK_INTERVAL || '5'), // Check every 5 minutes
  };

  if (schedulerConfig.enabled && smtpConfig.smtpUser && smtpConfig.smtpPass) {
    attendanceEmailScheduler.initialize(schedulerConfig);
    attendanceEmailScheduler.start();
    console.log('🚀 Automatic attendance email scheduler initialized and started');
  } else {
    console.log('📧 Automatic attendance email scheduler disabled or not configured');
  }
}