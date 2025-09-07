import { attendanceCalculationService, AttendanceStats } from './attendanceCalculationService';
import { emailJSAttendanceService, AttendanceEmailData } from './emailJSAttendanceService';
import { rawQuery } from '@/lib/server/query';
import { RowDataPacket } from 'mysql2';

interface EmailReminderHistory extends RowDataPacket {
  id: number;
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: number;
  course_name: string;
  course_code: string;
  reminder_type: 'first_absence' | 'second_absence' | 'critical_absence';
  session_type: 'lecture' | 'lab';
  missed_count: number;
  total_sessions: number;
  attendance_percentage: number;
  email_subject: string;
  email_status: 'sent' | 'failed' | 'pending';
  sent_at: string;
}

interface AttendanceStatistics extends RowDataPacket {
  course_id: number;
  course_name: string;
  course_code: string;
  total_students: number;
  students_below_threshold: number;
  average_attendance_percentage: number;
}

export interface ReminderProcessingResult {
  totalStudentsProcessed: number;
  emailsSent: number;
  emailsFailed: number;
  studentsSkipped: number;
  errors: string[];
}

interface CourseWithSettings extends RowDataPacket {
  id: number;
  name: string;
  code: string;
  email_enabled: boolean;
}

export class AttendanceReminderService {
  
  async processAllReminders(): Promise<ReminderProcessingResult> {
    const result: ReminderProcessingResult = {
      totalStudentsProcessed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      studentsSkipped: 0,
      errors: []
    };

    try {
      const activeCourses = await this.getActiveCoursesWithEmailEnabled();
      
      for (const course of activeCourses) {
        const courseResult = await this.processCourseReminders(course.id);
        
        result.totalStudentsProcessed += courseResult.totalStudentsProcessed;
        result.emailsSent += courseResult.emailsSent;
        result.emailsFailed += courseResult.emailsFailed;
        result.studentsSkipped += courseResult.studentsSkipped;
        result.errors.push(...courseResult.errors);
      }

      console.log('Attendance reminder processing completed:', result);
      return result;
    } catch (error) {
      const errorMessage = `Failed to process attendance reminders: ${error}`;
      result.errors.push(errorMessage);
      console.error(errorMessage);
      return result;
    }
  }

  async processCourseReminders(subjectId: number): Promise<ReminderProcessingResult> {
    const result: ReminderProcessingResult = {
      totalStudentsProcessed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      studentsSkipped: 0,
      errors: []
    };

    try {
      await attendanceCalculationService.refreshAllAttendanceSummaries(subjectId);
      
      const belowThresholdStats = await attendanceCalculationService.getStudentsBelowThreshold(subjectId);
      
      // Deduplicate by student ID - only process each student once
      const uniqueStudentStats = new Map<string, AttendanceStats>();
      for (const stat of belowThresholdStats) {
        if (!uniqueStudentStats.has(stat.studentId) || 
            stat.attendancePercentage < uniqueStudentStats.get(stat.studentId)!.attendancePercentage) {
          uniqueStudentStats.set(stat.studentId, stat);
        }
      }
      
      for (const stat of uniqueStudentStats.values()) {
        result.totalStudentsProcessed++;
        
        try {
          const reminderType = this.determineReminderType(stat);
          
          if (!reminderType) {
            result.studentsSkipped++;
            continue;
          }

          // Check if we've already sent an email for this student/subject in the last 6 hours
          const recentEmailExists = await this.hasRecentEmailBeenSent(
            stat.studentId, 
            stat.subjectId, 
            reminderType, 
            stat.sessionType,
            6 // 6 hour window
          );
          
          if (recentEmailExists) {
            console.log(`⏭️  Skipping ${stat.studentId} - recent ${reminderType} email already sent`);
            result.studentsSkipped++;
            continue;
          }

          const studentCourseInfo = await this.getStudentCourseInfo(stat.studentId, stat.subjectId);
          
          if (!studentCourseInfo) {
            result.errors.push(`Could not find student/course info for ${stat.studentId}/${stat.subjectId}`);
            result.emailsFailed++;
            continue;
          }

          const reminderData: AttendanceEmailData = {
            studentName: studentCourseInfo.student_name,
            studentEmail: studentCourseInfo.student_email,
            courseName: studentCourseInfo.course_name,
            courseCode: studentCourseInfo.course_code,
            attendancePercentage: stat.attendancePercentage,
            missedSessions: stat.missedSessions,
            totalSessions: stat.totalSessions,
            remainingAllowableMisses: stat.remainingAllowableMisses,
            reminderType: reminderType
          };

          const emailSent = await emailJSAttendanceService.sendAttendanceReminder(reminderData);

          // Log the email attempt
          await this.logEmailSent(
            stat.studentId,
            stat.subjectId,
            reminderType,
            stat.sessionType,
            `Attendance Notice - ${studentCourseInfo.course_name}`,
            'Email sent via EmailJS',
            emailSent ? 'sent' : 'failed',
            stat.missedSessions,
            stat.totalSessions,
            stat.attendancePercentage
          );

          if (emailSent) {
            result.emailsSent++;
            console.log(`Sent ${reminderType} reminder to ${studentCourseInfo.student_name} for ${studentCourseInfo.course_name}`);
          } else {
            result.emailsFailed++;
          }

        } catch (error) {
          result.emailsFailed++;
          result.errors.push(`Failed to process reminder for student ${stat.studentId}: ${error}`);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Failed to process course ${courseId}: ${error}`);
      return result;
    }
  }

  async processStudentReminder(studentId: string, subjectId: number): Promise<boolean> {
    try {
      await attendanceCalculationService.updateAttendanceSummaryCache(studentId, subjectId);
      
      const stats = await attendanceCalculationService.calculateAttendanceForStudent(studentId, subjectId);
      
      for (const stat of stats) {
        if (!stat.isAboveThreshold) {
          const reminderType = this.determineReminderType(stat);
          
          if (reminderType) {
            // Check if we've already sent an email for this student/subject in the last 6 hours
            const recentEmailExists = await this.hasRecentEmailBeenSent(
              studentId, 
              subjectId, 
              reminderType, 
              stat.sessionType,
              6 // 6 hour window
            );
            
            if (recentEmailExists) {
              console.log(`⏭️  Skipping ${studentId} - recent ${reminderType} email already sent`);
              return false;
            }
            
            const studentCourseInfo = await this.getStudentCourseInfo(studentId, subjectId);
            
            if (studentCourseInfo) {
              const reminderData: AttendanceEmailData = {
                studentName: studentCourseInfo.student_name,
                studentEmail: studentCourseInfo.student_email,
                courseName: studentCourseInfo.course_name,
                courseCode: studentCourseInfo.course_code,
                attendancePercentage: stat.attendancePercentage,
                missedSessions: stat.missedSessions,
                totalSessions: stat.totalSessions,
                remainingAllowableMisses: stat.remainingAllowableMisses,
                reminderType: reminderType
              };

              const emailSent = await emailJSAttendanceService.sendAttendanceReminder(reminderData);
              
              // Log the email attempt
              await this.logEmailSent(
                studentId,
                subjectId,
                reminderType,
                stat.sessionType,
                `Attendance Notice - ${studentCourseInfo.course_name}`,
                'Email sent via EmailJS',
                emailSent ? 'sent' : 'failed',
                stat.missedSessions,
                stat.totalSessions,
                stat.attendancePercentage
              );
              
              return emailSent;
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to process student reminder for ${studentId}/${subjectId}:`, error);
      return false;
    }
  }

  private determineReminderType(
    stat: AttendanceStats
  ): 'first_absence' | 'second_absence' | 'critical_absence' | null {
    if (stat.isAboveThreshold) {
      return null;
    }

    const attendancePercentage = stat.attendancePercentage;
    const remainingMisses = stat.remainingAllowableMisses;
    
    if (attendancePercentage < 80) {
      return 'critical_absence';
    }
    
    if (remainingMisses === 0) {
      return 'second_absence';
    }
    
    if (remainingMisses <= 1) {
      return 'first_absence';
    }
    
    return null;
  }

  private async getStudentCourseInfo(studentId: string, subjectId: number) {
    const query = `
      SELECT 
        u.name as student_name,
        u.email as student_email,
        s.name as course_name,
        s.code as course_code,
        lecturer.name as lecturer_name,
        lecturer.email as lecturer_email
      FROM user u
      JOIN enrolment e ON u.id = e.student_id
      JOIN subject s ON e.subject_id = s.id
      LEFT JOIN (
        SELECT DISTINCT lss.lecturer_id, sss.subject_id
        FROM lecturer_study_session lss
        JOIN study_session ss ON lss.study_session_id = ss.id
        JOIN subject_study_session sss ON ss.id = sss.study_session_id
      ) lecturer_mapping ON s.id = lecturer_mapping.subject_id
      LEFT JOIN user lecturer ON lecturer_mapping.lecturer_id = lecturer.id
      WHERE u.id = ? AND s.id = ?
      LIMIT 1
    `;
    
    const results = await rawQuery(query, [studentId, subjectId]);
    return results.length > 0 ? results[0] : null;
  }

  private async getActiveCoursesWithEmailEnabled(): Promise<CourseWithSettings[]> {
    const query = `
      SELECT s.id, s.name, s.code, COALESCE(ers.email_enabled, TRUE) as email_enabled
      FROM subject s
      LEFT JOIN email_reminder_settings ers ON s.id = ers.subject_id
      WHERE s.status = 'active'
        AND COALESCE(ers.email_enabled, TRUE) = TRUE
    `;
    
    return await rawQuery<CourseWithSettings>(query);
  }

  async enableEmailReminders(subjectId: number): Promise<void> {
    const query = `
      INSERT INTO email_reminder_settings (subject_id, email_enabled)
      VALUES (?, TRUE)
      ON DUPLICATE KEY UPDATE email_enabled = TRUE
    `;
    
    await rawQuery(query, [subjectId]);
  }

  async disableEmailReminders(subjectId: number): Promise<void> {
    const query = `
      INSERT INTO email_reminder_settings (subject_id, email_enabled)
      VALUES (?, FALSE)
      ON DUPLICATE KEY UPDATE email_enabled = FALSE
    `;
    
    await rawQuery(query, [subjectId]);
  }

  async updateSubjectSettings(
    subjectId: number,
    settings: {
      lectureCount?: number;
      labCount?: number;
      attendanceThreshold?: number;
      emailEnabled?: boolean;
    }
  ): Promise<void> {
    const setParts: string[] = [];
    const values: unknown[] = [];

    if (settings.lectureCount !== undefined) {
      setParts.push('lecture_count = ?');
      values.push(settings.lectureCount);
    }

    if (settings.labCount !== undefined) {
      setParts.push('lab_count = ?');
      values.push(settings.labCount);
    }

    if (settings.attendanceThreshold !== undefined) {
      setParts.push('attendance_threshold = ?');
      values.push(settings.attendanceThreshold);
    }

    if (settings.emailEnabled !== undefined) {
      setParts.push('email_enabled = ?');
      values.push(settings.emailEnabled);
    }

    if (setParts.length === 0) {
      return;
    }

    values.push(subjectId);

    const query = `
      INSERT INTO email_reminder_settings (subject_id, ${setParts.map(p => p.split(' = ')[0]).join(', ')})
      VALUES (?, ${setParts.map(() => '?').join(', ')})
      ON DUPLICATE KEY UPDATE ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
    `;

    await rawQuery(query, [subjectId, ...values.slice(0, -1)]);
  }

  async getEmailReminderHistory(
    studentId?: string,
    subjectId?: number,
    limit: number = 50
  ): Promise<EmailReminderHistory[]> {
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];

    if (studentId) {
      whereConditions.push('erl.student_id = ?');
      queryParams.push(studentId);
    }

    if (subjectId) {
      whereConditions.push('erl.subject_id = ?');
      queryParams.push(subjectId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        erl.*,
        u.name as student_name,
        u.email as student_email,
        s.name as course_name,
        s.code as course_code
      FROM email_reminder_logs erl
      JOIN user u ON erl.student_id = u.id
      JOIN subject s ON erl.subject_id = s.id
      ${whereClause}
      ORDER BY erl.sent_at DESC
      LIMIT ?
    `;

    queryParams.push(limit);
    return await rawQuery(query, queryParams);
  }

  async getAttendanceStatistics(subjectId?: number): Promise<AttendanceStatistics[]> {
    let whereClause = '';
    const queryParams: unknown[] = [];

    if (subjectId) {
      whereClause = 'WHERE s.id = ?';
      queryParams.push(subjectId);
    }

    const query = `
      SELECT 
        s.id as course_id,
        s.name as course_name,
        s.code as course_code,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN sas.attendance_percentage < 80 THEN sas.student_id END) as students_below_threshold,
        AVG(sas.attendance_percentage) as average_attendance_percentage
      FROM subject s
      JOIN enrolment e ON s.id = e.subject_id
      LEFT JOIN student_attendance_summary sas ON e.student_id = sas.student_id AND e.subject_id = sas.course_id
      ${whereClause}
      GROUP BY s.id, s.name, s.code
      ORDER BY s.name
    `;

    return await rawQuery(query, queryParams);
  }

  async hasRecentEmailBeenSent(
    studentId: string,
    subjectId: number,
    reminderType: 'first_absence' | 'second_absence' | 'critical_absence',
    sessionType: 'lecture' | 'lab',
    hoursWindow: number = 6
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM email_reminder_logs
      WHERE student_id = ? 
        AND subject_id = ? 
        AND reminder_type = ?
        AND session_type = ?
        AND email_status = 'sent'
        AND sent_at > DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;

    const results = await rawQuery<{ count: number } & RowDataPacket>(
      query,
      [studentId, subjectId, reminderType, sessionType, hoursWindow]
    );

    return (results[0]?.count || 0) > 0;
  }

  async logEmailSent(
    studentId: string,
    subjectId: number,
    reminderType: 'first_absence' | 'second_absence' | 'critical_absence',
    sessionType: 'lecture' | 'lab',
    emailSubject: string,
    emailBody: string,
    emailStatus: 'sent' | 'failed' | 'pending',
    missedCount: number,
    totalSessions: number,
    attendancePercentage: number
  ): Promise<void> {
    const query = `
      INSERT INTO email_reminder_logs (
        student_id, subject_id, reminder_type, session_type, missed_count,
        total_sessions, attendance_percentage, email_subject, email_body, email_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await rawQuery(query, [
      studentId,
      subjectId,
      reminderType,
      sessionType,
      missedCount,
      totalSessions,
      attendancePercentage,
      emailSubject,
      emailBody,
      emailStatus
    ]);
  }
}

export const attendanceReminderService = new AttendanceReminderService();