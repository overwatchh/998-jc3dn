import { rawQuery } from "@/lib/server/query";
import { RowDataPacket } from "mysql2";

export interface AttendanceStats {
  studentId: string;
  subjectId: number;
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
  subject_id: number;
  session_type: 'lecture' | 'lab';
  total_sessions: number;
  attended_sessions: number;
  missed_sessions: number;
  attendance_percentage: number;
}

interface SubjectSettingsRow extends RowDataPacket {
  subject_id: number;
  lecture_count: number;
  lab_count: number;
  attendance_threshold: number;
}

export class AttendanceCalculationService {
  
  async calculateAttendanceForStudent(studentId: string, subjectId: number): Promise<AttendanceStats[]> {
    const subjectSettings = await this.getSubjectSettings(subjectId);
    const stats: AttendanceStats[] = [];

    for (const sessionType of ['lecture', 'lab'] as const) {
      // Use actual session count instead of hardcoded values
      const totalSessions = await this.getActualSessionCount(subjectId, sessionType);

      const attendedSessions = await this.getAttendedSessions(studentId, subjectId, sessionType);
      const missedSessions = totalSessions - attendedSessions;
      const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
      
      const allowableMisses = Math.floor(totalSessions * (1 - subjectSettings.attendance_threshold));
      const remainingAllowableMisses = Math.max(0, allowableMisses - missedSessions);
      const isAboveThreshold = attendancePercentage >= (subjectSettings.attendance_threshold * 100);

      stats.push({
        studentId,
        subjectId,
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

  async calculateAttendanceForAllStudents(subjectId: number): Promise<AttendanceStats[]> {
    const students = await this.getEnrolledStudents(subjectId);
    const allStats: AttendanceStats[] = [];

    for (const student of students) {
      const studentStats = await this.calculateAttendanceForStudent(student.student_id, subjectId);
      allStats.push(...studentStats);
    }

    return allStats;
  }

  async getStudentsBelowThreshold(subjectId: number): Promise<AttendanceStats[]> {
    const allStats = await this.calculateAttendanceForAllStudents(subjectId);
    return allStats.filter(stat => !stat.isAboveThreshold);
  }

  async updateAttendanceSummaryCache(studentId: string, subjectId: number): Promise<void> {
    const stats = await this.calculateAttendanceForStudent(studentId, subjectId);

    for (const stat of stats) {
      const query = `
        INSERT INTO student_attendance_summary (
          student_id, subject_id, session_type, total_sessions, 
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
        stat.subjectId,
        stat.sessionType,
        stat.totalSessions,
        stat.attendedSessions,
        stat.missedSessions,
        stat.attendancePercentage
      ]);
    }
  }

  private async getSubjectSettings(subjectId: number): Promise<SubjectSettingsRow> {
    const query = `
      SELECT subject_id, lecture_count, lab_count, attendance_threshold
      FROM email_reminder_settings 
      WHERE subject_id = ?
    `;
    
    const results = await rawQuery<SubjectSettingsRow>(query, [subjectId]);
    
    if (results.length === 0) {
      return {
        subject_id: subjectId,
        lecture_count: 13,
        lab_count: 12,
        attendance_threshold: 0.80
      } as SubjectSettingsRow;
    }
    
    return results[0];
  }

  private async getAttendedSessions(
    studentId: string, 
    subjectId: number, 
    sessionType: 'lecture' | 'lab'
  ): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT c.student_id) as attended_count
      FROM checkin c
      JOIN qr_code_study_session qcss ON c.qr_code_study_session_id = qcss.id
      JOIN study_session ss ON qcss.study_session_id = ss.id
      JOIN subject_study_session sss ON ss.id = sss.study_session_id
      WHERE c.student_id = ? 
        AND sss.subject_id = ? 
        AND ss.type = ?
    `;
    
    const results = await rawQuery<{ attended_count: number } & RowDataPacket>(
      query, 
      [studentId, subjectId, sessionType]
    );
    
    return results[0]?.attended_count || 0;
  }

  private async getEnrolledStudents(subjectId: number): Promise<{ student_id: string }[]> {
    const query = `
      SELECT student_id 
      FROM enrolment 
      WHERE subject_id = ?
    `;
    
    return await rawQuery<{ student_id: string } & RowDataPacket>(query, [subjectId]);
  }

  private async getActualSessionCount(subjectId: number, sessionType: 'lecture' | 'lab'): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT ss.id) as session_count
      FROM study_session ss
      JOIN subject_study_session sss ON ss.id = sss.study_session_id
      WHERE sss.subject_id = ? AND ss.type = ?
    `;
    
    const results = await rawQuery<{ session_count: number } & RowDataPacket>(
      query, 
      [subjectId, sessionType]
    );
    
    return results[0]?.session_count || 0;
  }

  async getAttendanceSummaryFromCache(studentId: string, subjectId: number): Promise<AttendanceRow[]> {
    const query = `
      SELECT 
        student_id,
        subject_id,
        session_type,
        total_sessions,
        attended_sessions,
        missed_sessions,
        attendance_percentage
      FROM student_attendance_summary
      WHERE student_id = ? AND subject_id = ?
    `;
    
    return await rawQuery<AttendanceRow>(query, [studentId, subjectId]);
  }

  async refreshAllAttendanceSummaries(subjectId?: number): Promise<void> {
    let students: { student_id: string; subject_id: number }[];
    
    if (subjectId) {
      students = await rawQuery<{ student_id: string; subject_id: number } & RowDataPacket>(
        'SELECT student_id, subject_id FROM enrolment WHERE subject_id = ?',
        [subjectId]
      );
    } else {
      students = await rawQuery<{ student_id: string; subject_id: number } & RowDataPacket>(
        'SELECT student_id, subject_id FROM enrolment'
      );
    }

    for (const { student_id, subject_id } of students) {
      await this.updateAttendanceSummaryCache(student_id, subject_id);
    }
  }
}

export const attendanceCalculationService = new AttendanceCalculationService();