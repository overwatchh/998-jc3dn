/**
 * Automatic Attendance Monitor
 * Runs continuously and sends emails automatically when lectures end
 */

import { attendanceReminderService } from '../services/server/attendanceReminderService';
import { emailJSAttendanceService } from '../services/server/emailJSAttendanceService';
import { rawQuery } from '@/lib/server/query';
import { db } from '@/lib/server/db';

interface ActiveSession {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  type: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

class AutomaticAttendanceMonitor {
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private processedSessions = new Set<string>(); // Track processed sessions

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Monitor already running');
      return;
    }

    console.log('🚀 Starting Automatic Attendance Monitor...');
    
    // Initialize email service
    const emailInitialized = await emailJSAttendanceService.initialize();
    if (!emailInitialized) {
      console.error('❌ Failed to initialize email service');
      return;
    }

    this.isRunning = true;
    console.log('✅ Email service initialized');
    console.log('⏰ Monitoring lecture end times every 30 seconds...');

    // Check every 30 seconds for lectures that just ended
    this.checkInterval = setInterval(async () => {
      await this.checkForEndedLectures();
    }, 30000); // Check every 30 seconds

    // Also do an immediate check
    await this.checkForEndedLectures();
  }

  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Automatic Attendance Monitor stopped');
  }

  private async checkForEndedLectures() {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD

      console.log(`🔍 Checking at ${currentTime} on ${currentDay}...`);

      // Find lectures that ended in the last minute
      const endTimeThreshold = new Date(now.getTime() - 60000).toTimeString().slice(0, 8); // 1 minute ago

      const query = `
        SELECT DISTINCT
          ss.id,
          ss.day_of_week,
          ss.start_time,
          ss.end_time,
          ss.type,
          s.id as subject_id,
          s.name as subject_name,
          s.code as subject_code
        FROM study_session ss
        JOIN subject_study_session sss ON ss.id = sss.study_session_id  
        JOIN subject s ON sss.subject_id = s.id
        WHERE ss.day_of_week = ?
          AND ss.end_time <= ?
          AND ss.end_time > ?
          AND s.status = 'active'
        GROUP BY ss.id, s.id
      `;

      const endedSessions = await rawQuery<ActiveSession>(query, [
        currentDay,
        currentTime,
        endTimeThreshold
      ]);

      for (const session of endedSessions) {
        const sessionKey = `${currentDate}-${session.subject_id}-${session.end_time}`;
        
        if (!this.processedSessions.has(sessionKey)) {
          console.log(`📚 Lecture ended: ${session.subject_name} (${session.type})`);
          console.log(`   Time: ${session.start_time} - ${session.end_time}`);
          console.log(`   Session Key: ${sessionKey}`);
          
          // Process attendance reminders for this subject
          await this.processEndedSession(session);
          
          // Mark as processed to avoid duplicate emails
          this.processedSessions.add(sessionKey);
          
          // Clean up old processed sessions (older than 24 hours)
          this.cleanupProcessedSessions();
        }
      }

    } catch (error) {
      console.error('❌ Error checking for ended lectures:', error);
    }
  }

  private async processEndedSession(session: ActiveSession) {
    try {
      console.log(`📊 Processing attendance for ${session.subject_name}...`);
      
      // Process reminders for students below threshold
      const result = await attendanceReminderService.processCourseReminders(session.subject_id);
      
      console.log(`📧 Email Results for ${session.subject_name}:`);
      console.log(`   Students Processed: ${result.totalStudentsProcessed}`);
      console.log(`   Emails Sent: ${result.emailsSent}`);
      console.log(`   Emails Failed: ${result.emailsFailed}`);
      console.log(`   Students Skipped: ${result.studentsSkipped}`);
      
      if (result.errors.length > 0) {
        console.log('⚠️  Errors:');
        result.errors.forEach(error => console.log(`     ${error}`));
      }

    } catch (error) {
      console.error(`❌ Error processing session ${session.subject_name}:`, error);
    }
  }

  private cleanupProcessedSessions() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    this.processedSessions.forEach(sessionKey => {
      if (sessionKey.startsWith(yesterday)) {
        this.processedSessions.delete(sessionKey);
      }
    });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      processedToday: Array.from(this.processedSessions).filter(key => 
        key.startsWith(new Date().toISOString().slice(0, 10))
      ).length
    };
  }
}

// Create singleton instance
export const automaticAttendanceMonitor = new AutomaticAttendanceMonitor();

// If running directly, start the monitor
if (require.main === module) {
  console.log('🎯 Starting Automatic Attendance Monitor...');
  
  automaticAttendanceMonitor.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\\n🛑 Shutting down...');
    await automaticAttendanceMonitor.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\\n🛑 Shutting down...');
    await automaticAttendanceMonitor.stop();
    process.exit(0);
  });
}