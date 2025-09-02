import { attendanceCalculationService, AttendanceStats } from './attendanceCalculationService';
import { emailService, EmailReminderData } from './emailService';
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

  async processCourseReminders(courseId: number): Promise<ReminderProcessingResult> {
    const result: ReminderProcessingResult = {
      totalStudentsProcessed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      studentsSkipped: 0,
      errors: []
    };

    try {
      await attendanceCalculationService.refreshAllAttendanceSummaries(courseId);
      
      const belowThresholdStats = await attendanceCalculationService.getStudentsBelowThreshold(courseId);
      
      for (const stat of belowThresholdStats) {
        result.totalStudentsProcessed++;
        
        try {
          const reminderType = this.determineReminderType(stat);
          
          if (!reminderType) {
            result.studentsSkipped++;
            continue;
          }

          const hasRecentEmail = await emailService.hasRecentEmailBeenSent(
            stat.studentId,
            stat.courseId,
            reminderType,
            stat.sessionType,
            24 
          );

          if (hasRecentEmail) {
            result.studentsSkipped++;
            continue;
          }

          const studentCourseInfo = await emailService.getStudentCourseInfo(stat.studentId, stat.courseId);
          
          if (!studentCourseInfo) {
            result.errors.push(`Could not find student/course info for ${stat.studentId}/${stat.courseId}`);
            result.emailsFailed++;
            continue;
          }

          const reminderData: EmailReminderData = {
            studentName: studentCourseInfo.student_name,
            studentEmail: studentCourseInfo.student_email,
            courseName: studentCourseInfo.course_name,
            courseCode: studentCourseInfo.course_code,
            attendancePercentage: stat.attendancePercentage,
            missedSessions: stat.missedSessions,
            totalSessions: stat.totalSessions,
            remainingAllowableMisses: stat.remainingAllowableMisses,
            sessionType: stat.sessionType,
            lecturerName: studentCourseInfo.lecturer_name,
            lecturerEmail: studentCourseInfo.lecturer_email
          };

          const emailSent = await emailService.sendAttendanceReminder(
            stat.studentId,
            stat.courseId,
            reminderType,
            reminderData
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

  async processStudentReminder(studentId: string, courseId: number): Promise<boolean> {
    try {
      await attendanceCalculationService.updateAttendanceSummaryCache(studentId, courseId);
      
      const stats = await attendanceCalculationService.calculateAttendanceForStudent(studentId, courseId);
      
      for (const stat of stats) {
        if (!stat.isAboveThreshold) {
          const reminderType = this.determineReminderType(stat);
          
          if (reminderType) {
            const hasRecentEmail = await emailService.hasRecentEmailBeenSent(
              studentId,
              courseId,
              reminderType,
              stat.sessionType,
              24
            );

            if (!hasRecentEmail) {
              const studentCourseInfo = await emailService.getStudentCourseInfo(studentId, courseId);
              
              if (studentCourseInfo) {
                const reminderData: EmailReminderData = {
                  studentName: studentCourseInfo.student_name,
                  studentEmail: studentCourseInfo.student_email,
                  courseName: studentCourseInfo.course_name,
                  courseCode: studentCourseInfo.course_code,
                  attendancePercentage: stat.attendancePercentage,
                  missedSessions: stat.missedSessions,
                  totalSessions: stat.totalSessions,
                  remainingAllowableMisses: stat.remainingAllowableMisses,
                  sessionType: stat.sessionType,
                  lecturerName: studentCourseInfo.lecturer_name,
                  lecturerEmail: studentCourseInfo.lecturer_email
                };

                return await emailService.sendAttendanceReminder(
                  studentId,
                  courseId,
                  reminderType,
                  reminderData
                );
              }
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to process student reminder for ${studentId}/${courseId}:`, error);
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

  private async getActiveCoursesWithEmailEnabled(): Promise<CourseWithSettings[]> {
    const query = `
      SELECT c.id, c.name, c.code, COALESCE(ers.email_enabled, TRUE) as email_enabled
      FROM courses c
      LEFT JOIN email_reminder_settings ers ON c.id = ers.course_id
      WHERE c.status = 'active'
        AND COALESCE(ers.email_enabled, TRUE) = TRUE
    `;
    
    return await rawQuery<CourseWithSettings>(query);
  }

  async enableEmailReminders(courseId: number): Promise<void> {
    const query = `
      INSERT INTO email_reminder_settings (course_id, email_enabled)
      VALUES (?, TRUE)
      ON DUPLICATE KEY UPDATE email_enabled = TRUE
    `;
    
    await rawQuery(query, [courseId]);
  }

  async disableEmailReminders(courseId: number): Promise<void> {
    const query = `
      INSERT INTO email_reminder_settings (course_id, email_enabled)
      VALUES (?, FALSE)
      ON DUPLICATE KEY UPDATE email_enabled = FALSE
    `;
    
    await rawQuery(query, [courseId]);
  }

  async updateCourseSettings(
    courseId: number,
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

    values.push(courseId);

    const query = `
      INSERT INTO email_reminder_settings (course_id, ${setParts.map(p => p.split(' = ')[0]).join(', ')})
      VALUES (?, ${setParts.map(() => '?').join(', ')})
      ON DUPLICATE KEY UPDATE ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
    `;

    await rawQuery(query, [courseId, ...values.slice(0, -1)]);
  }

  async getEmailReminderHistory(
    studentId?: string,
    courseId?: number,
    limit: number = 50
  ): Promise<EmailReminderHistory[]> {
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];

    if (studentId) {
      whereConditions.push('erl.student_id = ?');
      queryParams.push(studentId);
    }

    if (courseId) {
      whereConditions.push('erl.course_id = ?');
      queryParams.push(courseId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        erl.*,
        u.name as student_name,
        u.email as student_email,
        c.name as course_name,
        c.code as course_code
      FROM email_reminder_logs erl
      JOIN user u ON erl.student_id = u.id
      JOIN courses c ON erl.course_id = c.id
      ${whereClause}
      ORDER BY erl.sent_at DESC
      LIMIT ?
    `;

    queryParams.push(limit);
    return await rawQuery(query, queryParams);
  }

  async getAttendanceStatistics(courseId?: number): Promise<AttendanceStatistics[]> {
    let whereClause = '';
    const queryParams: unknown[] = [];

    if (courseId) {
      whereClause = 'WHERE c.id = ?';
      queryParams.push(courseId);
    }

    const query = `
      SELECT 
        c.id as course_id,
        c.name as course_name,
        c.code as course_code,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN sas.attendance_percentage < 80 THEN sas.student_id END) as students_below_threshold,
        AVG(sas.attendance_percentage) as average_attendance_percentage
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN student_attendance_summary sas ON e.student_id = sas.student_id AND e.course_id = sas.course_id
      ${whereClause}
      GROUP BY c.id, c.name, c.code
      ORDER BY c.name
    `;

    return await rawQuery(query, queryParams);
  }
}

export const attendanceReminderService = new AttendanceReminderService();