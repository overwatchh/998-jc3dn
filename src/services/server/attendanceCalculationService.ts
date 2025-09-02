import { rawQuery } from "@/lib/server/query";
import { RowDataPacket } from "mysql2";

export interface AttendanceStats {
  studentId: string;
  courseId: number;
  sessionType: 'lecture' | 'lab';
  totalSessions: number;
  attendedSessions: number;
  missedSessions: number;
  attendancePercentage: number;
  allowableMisses: number;
  remainingAllowableMisses: number;
  isAboveThreshold: boolean;
}

interface AttendanceRow extends RowDataPacket {
  student_id: string;
  course_id: number;
  session_type: 'lecture' | 'lab';
  total_sessions: number;
  attended_sessions: number;
  missed_sessions: number;
  attendance_percentage: number;
}

interface CourseSettingsRow extends RowDataPacket {
  course_id: number;
  lecture_count: number;
  lab_count: number;
  attendance_threshold: number;
}

export class AttendanceCalculationService {
  
  async calculateAttendanceForStudent(studentId: string, courseId: number): Promise<AttendanceStats[]> {
    const courseSettings = await this.getCourseSettings(courseId);
    const stats: AttendanceStats[] = [];

    for (const sessionType of ['lecture', 'lab'] as const) {
      const totalSessions = sessionType === 'lecture' 
        ? courseSettings.lecture_count 
        : courseSettings.lab_count;

      const attendedSessions = await this.getAttendedSessions(studentId, courseId, sessionType);
      const missedSessions = totalSessions - attendedSessions;
      const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
      
      const allowableMisses = Math.floor(totalSessions * (1 - courseSettings.attendance_threshold));
      const remainingAllowableMisses = Math.max(0, allowableMisses - missedSessions);
      const isAboveThreshold = attendancePercentage >= (courseSettings.attendance_threshold * 100);

      stats.push({
        studentId,
        courseId,
        sessionType,
        totalSessions,
        attendedSessions,
        missedSessions,
        attendancePercentage,
        allowableMisses,
        remainingAllowableMisses,
        isAboveThreshold
      });
    }

    return stats;
  }

  async calculateAttendanceForAllStudents(courseId: number): Promise<AttendanceStats[]> {
    const students = await this.getEnrolledStudents(courseId);
    const allStats: AttendanceStats[] = [];

    for (const student of students) {
      const studentStats = await this.calculateAttendanceForStudent(student.student_id, courseId);
      allStats.push(...studentStats);
    }

    return allStats;
  }

  async getStudentsBelowThreshold(courseId: number): Promise<AttendanceStats[]> {
    const allStats = await this.calculateAttendanceForAllStudents(courseId);
    return allStats.filter(stat => !stat.isAboveThreshold);
  }

  async updateAttendanceSummaryCache(studentId: string, courseId: number): Promise<void> {
    const stats = await this.calculateAttendanceForStudent(studentId, courseId);

    for (const stat of stats) {
      const query = `
        INSERT INTO student_attendance_summary (
          student_id, course_id, session_type, total_sessions, 
          attended_sessions, missed_sessions, attendance_percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_sessions = VALUES(total_sessions),
          attended_sessions = VALUES(attended_sessions),
          missed_sessions = VALUES(missed_sessions),
          attendance_percentage = VALUES(attendance_percentage),
          last_updated = CURRENT_TIMESTAMP
      `;

      await rawQuery(query, [
        stat.studentId,
        stat.courseId,
        stat.sessionType,
        stat.totalSessions,
        stat.attendedSessions,
        stat.missedSessions,
        stat.attendancePercentage
      ]);
    }
  }

  private async getCourseSettings(courseId: number): Promise<CourseSettingsRow> {
    const query = `
      SELECT course_id, lecture_count, lab_count, attendance_threshold
      FROM email_reminder_settings 
      WHERE course_id = ?
    `;
    
    const results = await rawQuery<CourseSettingsRow>(query, [courseId]);
    
    if (results.length === 0) {
      return {
        course_id: courseId,
        lecture_count: 13,
        lab_count: 12,
        attendance_threshold: 0.80
      } as CourseSettingsRow;
    }
    
    return results[0];
  }

  private async getAttendedSessions(
    studentId: string, 
    courseId: number, 
    sessionType: 'lecture' | 'lab'
  ): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT a.session_id) as attended_count
      FROM attendance a
      JOIN course_sessions cs ON a.session_id = cs.id
      WHERE a.student_id = ? 
        AND cs.course_id = ? 
        AND cs.type = ?
    `;
    
    const results = await rawQuery<{ attended_count: number } & RowDataPacket>(
      query, 
      [studentId, courseId, sessionType]
    );
    
    return results[0]?.attended_count || 0;
  }

  private async getEnrolledStudents(courseId: number): Promise<{ student_id: string }[]> {
    const query = `
      SELECT student_id 
      FROM enrollments 
      WHERE course_id = ?
    `;
    
    return await rawQuery<{ student_id: string } & RowDataPacket>(query, [courseId]);
  }

  async getAttendanceSummaryFromCache(studentId: string, courseId: number): Promise<AttendanceRow[]> {
    const query = `
      SELECT 
        student_id,
        course_id,
        session_type,
        total_sessions,
        attended_sessions,
        missed_sessions,
        attendance_percentage
      FROM student_attendance_summary
      WHERE student_id = ? AND course_id = ?
    `;
    
    return await rawQuery<AttendanceRow>(query, [studentId, courseId]);
  }

  async refreshAllAttendanceSummaries(courseId?: number): Promise<void> {
    let students: { student_id: string; course_id: number }[];
    
    if (courseId) {
      students = await rawQuery<{ student_id: string; course_id: number } & RowDataPacket>(
        'SELECT student_id, course_id FROM enrollments WHERE course_id = ?',
        [courseId]
      );
    } else {
      students = await rawQuery<{ student_id: string; course_id: number } & RowDataPacket>(
        'SELECT student_id, course_id FROM enrollments'
      );
    }

    for (const { student_id, course_id } of students) {
      await this.updateAttendanceSummaryCache(student_id, course_id);
    }
  }
}

export const attendanceCalculationService = new AttendanceCalculationService();