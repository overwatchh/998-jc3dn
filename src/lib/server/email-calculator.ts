import { rawQuery } from "./query";

/**
 * Calculate attendance percentage for a student based on their check-ins using EMAIL CALCULATOR METHOD
 * - 2+ check-ins = 100% attendance
 * - 1 check-in = 50% attendance
 * - 0 check-ins = 0% attendance
 */
export function calculateSessionAttendance(checkinCount: number): number {
  if (checkinCount >= 2) return 100;
  if (checkinCount === 1) return 50;
  return 0;
}

/**
 * Calculate overall attendance percentage for a student using EMAIL CALCULATOR METHOD
 */
export async function calculateStudentAttendancePercentage(
  studentId: string,
  subjectId: number
): Promise<number> {
  // Get all QR sessions for this subject and student's checkins
  const attendanceData = await rawQuery<{
    qr_session_id: number;
    checkin_count: number;
  }>(
    `
    SELECT
      qrss.id as qr_session_id,
      COALESCE(checkin_data.checkin_count, 0) as checkin_count
    FROM qr_code_study_session qrss
    JOIN study_session ss ON ss.id = qrss.study_session_id
    JOIN subject_study_session sss ON sss.study_session_id = ss.id
    LEFT JOIN (
      SELECT
        qr_code_study_session_id,
        COUNT(*) as checkin_count
      FROM checkin
      WHERE student_id = ?
      GROUP BY qr_code_study_session_id
    ) checkin_data ON checkin_data.qr_code_study_session_id = qrss.id
    WHERE sss.subject_id = ? AND ss.type = 'lecture'
    ORDER BY qrss.week_number
    `,
    [studentId, subjectId]
  );

  // Calculate attendance using email calculator method
  let totalAttendancePoints = 0;
  let totalPossiblePoints = 0;

  attendanceData.forEach((session) => {
    const checkinCount = parseInt(String(session.checkin_count)) || 0;
    const sessionPoints = calculateSessionAttendance(checkinCount);

    totalAttendancePoints += sessionPoints;
    totalPossiblePoints += 100; // Each session is worth 100 points max
  });

  return totalPossiblePoints > 0
    ? (totalAttendancePoints / totalPossiblePoints) * 100
    : 0;
}

/**
 * Calculate session attendance rate using EMAIL CALCULATOR METHOD
 */
export async function calculateSessionAttendanceRate(
  qrSessionId: number,
  subjectId: number,
  sessionType?: string,
  tutorialSessionId?: number
): Promise<number> {
  // Get QR session to find its study session
  const [qrSession] = await rawQuery<{ study_session_id: number }>(
    `SELECT study_session_id FROM qr_code_study_session WHERE id = ?`,
    [qrSessionId]
  );

  if (!qrSession) return 0;

  let checkinData;

  // If tutorialSessionId is provided, get students from student_study_session
  if (tutorialSessionId) {
    checkinData = await rawQuery<{
      student_id: string;
      checkin_count: number;
    }>(
      `
      SELECT
        student_ss.student_id,
        COALESCE(checkin_data.checkin_count, 0) as checkin_count
      FROM student_study_session student_ss
      LEFT JOIN (
        SELECT
          student_id,
          COUNT(*) as checkin_count
        FROM checkin
        WHERE qr_code_study_session_id = ?
        GROUP BY student_id
      ) checkin_data ON checkin_data.student_id = student_ss.student_id
      WHERE student_ss.study_session_id = ?
      `,
      [qrSessionId, tutorialSessionId]
    );
  } else {
    // Otherwise, get all students enrolled in the subject
    checkinData = await rawQuery<{
      student_id: string;
      checkin_count: number;
    }>(
      `
      SELECT
        e.student_id,
        COALESCE(checkin_data.checkin_count, 0) as checkin_count
      FROM enrolment e
      LEFT JOIN (
        SELECT
          student_id,
          COUNT(*) as checkin_count
        FROM checkin
        WHERE qr_code_study_session_id = ?
        GROUP BY student_id
      ) checkin_data ON checkin_data.student_id = e.student_id
      WHERE e.subject_id = ?
      `,
      [qrSessionId, subjectId]
    );
  }

  // Apply email calculator scoring for each student
  let totalPoints = 0;
  let maxPoints = 0;

  checkinData.forEach((student) => {
    const checkinCount = parseInt(String(student.checkin_count)) || 0;
    const studentPoints = calculateSessionAttendance(checkinCount);

    totalPoints += studentPoints;
    maxPoints += 100;
  });

  return maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
}

/**
 * Get subject average attendance using EMAIL CALCULATOR METHOD (optimized batch query)
 */
export async function getSubjectAverageAttendance(subjectId: number): Promise<number> {
  // Single optimized query to calculate all session attendance rates at once
  const sessionRates = await rawQuery<{
    qr_session_id: number;
    total_points: number;
    max_points: number;
    attendance_rate: number;
  }>(
    `
    SELECT
      qrss.id as qr_session_id,
      SUM(
        CASE
          WHEN checkin_counts.checkin_count >= 2 THEN 100
          WHEN checkin_counts.checkin_count = 1 THEN 50
          ELSE 0
        END
      ) as total_points,
      COUNT(e.student_id) * 100 as max_points,
      ROUND(
        (SUM(
          CASE
            WHEN checkin_counts.checkin_count >= 2 THEN 100
            WHEN checkin_counts.checkin_count = 1 THEN 50
            ELSE 0
          END
        ) / (COUNT(e.student_id) * 100)) * 100,
        1
      ) as attendance_rate
    FROM qr_code_study_session qrss
    JOIN study_session ss ON ss.id = qrss.study_session_id
    JOIN subject_study_session sss ON sss.study_session_id = ss.id
    JOIN enrolment e ON e.subject_id = sss.subject_id
    LEFT JOIN (
      SELECT
        qr_code_study_session_id,
        student_id,
        COUNT(*) as checkin_count
      FROM checkin
      GROUP BY qr_code_study_session_id, student_id
    ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                     AND checkin_counts.student_id = e.student_id
    WHERE sss.subject_id = ? AND ss.type = 'lecture'
    GROUP BY qrss.id
    `,
    [subjectId]
  );

  if (sessionRates.length === 0) return 0;

  const totalAttendance = sessionRates.reduce((sum, session) => sum + session.attendance_rate, 0);
  return totalAttendance / sessionRates.length;
}

/**
 * Get students with attendance below threshold using EMAIL CALCULATOR METHOD (optimized batch query)
 */
export async function getAtRiskStudents(
  subjectId: number,
  threshold: number = 80
): Promise<number> {
  // Single query to calculate all student attendance percentages and count at-risk students
  const [result] = await rawQuery<{
    at_risk_count: number;
  }>(
    `
    SELECT
      COUNT(*) as at_risk_count
    FROM (
      SELECT
        e.student_id,
        ROUND(
          (SUM(
            CASE
              WHEN checkin_counts.checkin_count >= 2 THEN 100
              WHEN checkin_counts.checkin_count = 1 THEN 50
              ELSE 0
            END
          ) / (COUNT(qrss.id) * 100)) * 100,
          1
        ) as student_attendance_percentage
      FROM enrolment e
      JOIN subject_study_session sss ON sss.subject_id = e.subject_id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      LEFT JOIN (
        SELECT
          qr_code_study_session_id,
          student_id,
          COUNT(*) as checkin_count
        FROM checkin
        GROUP BY qr_code_study_session_id, student_id
      ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                       AND checkin_counts.student_id = e.student_id
      WHERE e.subject_id = ? AND ss.type = 'lecture'
      GROUP BY e.student_id
      HAVING student_attendance_percentage < ?
    ) at_risk_students
    `,
    [subjectId, threshold]
  );

  return result?.at_risk_count || 0;
}