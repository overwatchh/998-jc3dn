import { rawQuery } from "@/lib/server/query";

export interface AttendanceRecord {
  student_id: string;
  qr_code_study_session_id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  week_number: number;
  session_type: "lecture" | "tutorial" | "lab";
  total_validity_windows: number;
  checked_in_windows: number;
  attendance_percentage: number;
  check_ins: {
    validity_id: number;
    checkin_time: string;
    window_count: number;
  }[];
}

export interface PartialAttendanceAlert {
  student_id: string;
  student_name: string;
  student_email: string;
  subject_code: string;
  subject_name: string;
  week_number: number;
  session_type: string;
  attendance_percentage: number;
  missing_windows: number[];
  next_window_start?: string;
  next_window_end?: string;
}

/**
 * Calculate attendance percentage for a student's session
 */
export async function calculateSessionAttendance(
  studentId: string,
  qrCodeStudySessionId: number
): Promise<AttendanceRecord | null> {
  // Get session details and total validity windows
  const [sessionInfo] = await rawQuery<{
    qr_code_study_session_id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    week_number: number;
    session_type: "lecture" | "tutorial" | "lab";
    qr_code_id: number;
  }>(
    `
    SELECT 
      qrss.id as qr_code_study_session_id,
      sss.subject_id,
      s.code as subject_code,
      s.name as subject_name,
      qrss.week_number,
      ss.type as session_type,
      qrss.qr_code_id
    FROM qr_code_study_session qrss
    JOIN study_session ss ON ss.id = qrss.study_session_id  
    JOIN subject_study_session sss ON sss.study_session_id = ss.id
    JOIN subject s ON s.id = sss.subject_id
    WHERE qrss.id = ?
    `,
    [qrCodeStudySessionId]
  );

  if (!sessionInfo) return null;

  // Get all validity windows for this QR code
  const validityWindows = await rawQuery<{
    id: number;
    count: number;
    start_time: string;
    end_time: string;
  }>(
    `
    SELECT id, count, start_time, end_time
    FROM validity 
    WHERE qr_code_id = ?
    ORDER BY count ASC
    `,
    [sessionInfo.qr_code_id]
  );

  // Get student's check-ins for this session
  const checkIns = await rawQuery<{
    validity_id: number;
    checkin_time: string;
    window_count: number;
  }>(
    `
    SELECT 
      c.validity_id,
      c.checkin_time,
      v.count as window_count
    FROM checkin c
    JOIN validity v ON v.id = c.validity_id
    WHERE c.student_id = ? AND c.qr_code_study_session_id = ?
    ORDER BY v.count ASC
    `,
    [studentId, qrCodeStudySessionId]
  );

  const totalWindows = validityWindows.length;
  const checkedInWindows = checkIns.length;

  // Calculate attendance percentage
  let attendancePercentage = 0;
  if (totalWindows === 2) {
    if (checkedInWindows === 2) {
      attendancePercentage = 100; // Full attendance
    } else if (checkedInWindows === 1) {
      attendancePercentage = 30; // Partial attendance  
    } else {
      attendancePercentage = 0; // Absent
    }
  } else if (totalWindows === 1) {
    attendancePercentage = checkedInWindows === 1 ? 100 : 0;
  }

  return {
    student_id: studentId,
    qr_code_study_session_id: qrCodeStudySessionId,
    subject_id: sessionInfo.subject_id,
    subject_code: sessionInfo.subject_code,
    subject_name: sessionInfo.subject_name,
    week_number: sessionInfo.week_number,
    session_type: sessionInfo.session_type,
    total_validity_windows: totalWindows,
    checked_in_windows: checkedInWindows,
    attendance_percentage: attendancePercentage,
    check_ins: checkIns,
  };
}

/**
 * Find students with partial attendance (30%) who need email reminders
 * Only triggered AFTER the entire lecture/session is completely over
 */
export async function findPartialAttendanceAlerts(): Promise<PartialAttendanceAlert[]> {
  const currentTime = new Date();
  
  const partialAttendanceStudents = await rawQuery<{
    student_id: string;
    student_name: string;
    student_email: string;
    qr_code_study_session_id: number;
    subject_code: string;
    subject_name: string;
    week_number: number;
    session_type: string;
    qr_code_id: number;
    first_window_end: string;
    second_window_end: string;
    lecture_end_time: string;
  }>(
    `
    SELECT DISTINCT
      u.id as student_id,
      u.name as student_name,
      u.email as student_email,
      qrss.id as qr_code_study_session_id,
      s.code as subject_code,
      s.name as subject_name,
      qrss.week_number,
      ss.type as session_type,
      qrss.qr_code_id,
      v1.end_time as first_window_end,
      v2.end_time as second_window_end,
      ss.end_time as lecture_end_time
    FROM qr_code_study_session qrss
    JOIN study_session ss ON ss.id = qrss.study_session_id
    JOIN subject_study_session sss ON sss.study_session_id = ss.id  
    JOIN subject s ON s.id = sss.subject_id
    JOIN enrolment e ON e.subject_id = s.id
    JOIN user u ON u.id = e.student_id
    JOIN validity v1 ON v1.qr_code_id = qrss.qr_code_id AND v1.count = 1
    JOIN validity v2 ON v2.qr_code_id = qrss.qr_code_id AND v2.count = 2
    JOIN checkin c1 ON c1.student_id = u.id AND c1.qr_code_study_session_id = qrss.id AND c1.validity_id = v1.id
    LEFT JOIN checkin c2 ON c2.student_id = u.id AND c2.qr_code_study_session_id = qrss.id AND c2.validity_id = v2.id
    WHERE 
      v2.end_time <= NOW()  -- Both validity windows have ended (lecture is over)
      AND c1.student_id IS NOT NULL  -- Student checked in first time
      AND c2.student_id IS NULL  -- But did NOT check in second time
      AND v2.end_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)  -- Only recent sessions (last 24 hours)
    `,
    []
  );

  const alerts: PartialAttendanceAlert[] = [];

  for (const student of partialAttendanceStudents) {
    alerts.push({
      student_id: student.student_id,
      student_name: student.student_name,
      student_email: student.student_email,
      subject_code: student.subject_code,
      subject_name: student.subject_name,
      week_number: student.week_number,
      session_type: student.session_type,
      attendance_percentage: 30,
      missing_windows: [2],
      // No next window info since lecture is already over
    });
  }

  return alerts;
}

/**
 * Get attendance summary for a student across all subjects
 */
export async function getStudentAttendanceSummary(studentId: string) {
  const sessions = await rawQuery<{
    qr_code_study_session_id: number;
    subject_code: string;
    subject_name: string;
    week_number: number;
    session_type: string;
    total_sessions: number;
  }>(
    `
    SELECT DISTINCT
      qrss.id as qr_code_study_session_id,
      s.code as subject_code,
      s.name as subject_name, 
      qrss.week_number,
      ss.type as session_type,
      COUNT(*) OVER (PARTITION BY s.id) as total_sessions
    FROM qr_code_study_session qrss
    JOIN study_session ss ON ss.id = qrss.study_session_id
    JOIN subject_study_session sss ON sss.study_session_id = ss.id
    JOIN subject s ON s.id = sss.subject_id
    JOIN enrolment e ON e.subject_id = s.id
    WHERE e.student_id = ?
    ORDER BY s.code, qrss.week_number
    `,
    [studentId]
  );

  const summary = [];
  
  for (const session of sessions) {
    const attendance = await calculateSessionAttendance(
      studentId,
      session.qr_code_study_session_id
    );
    
    if (attendance) {
      summary.push(attendance);
    }
  }

  return summary;
}