import { rawQuery } from "./query";

export interface StudentAttendanceRecord {
  studentId: string;
  studentName: string;
  studentEmail: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  weekNumber: number;
  checkinCount: number; // 0, 1, or 2
  attendancePercentage: number; // 0%, 45%, or 90%
}

export interface StudentOverallAttendance {
  studentId: string;
  studentName: string;
  studentEmail: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  totalLectures: number;
  attendedLectures: number;
  totalAttendancePercentage: number;
  classesCanMiss: number;
  isLowAttendance: boolean;
  requiredAttendanceThresh: number;
}

export interface LectureAttendanceResult {
  studySessionId: number;
  weekNumber: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  students: StudentAttendanceRecord[];
}

/**
 * Calculate attendance percentage for a student based on their check-ins
 * - 2 check-ins = 90% attendance
 * - 1 check-in = 45% attendance
 * - 0 check-ins = 0% attendance
 */
export function calculateLectureAttendance(checkinCount: number): number {
  switch (checkinCount) {
    case 2:
      return 90;
    case 1:
      return 45;
    case 0:
      return 0;
    default:
      return 0;
  }
}

/**
 * Get attendance data for a specific lecture session and week
 */
export async function getLectureAttendanceData(
  studySessionId: number,
  weekNumber: number
): Promise<LectureAttendanceResult> {
  // First get the QR code study session info
  const [qrSessionInfo] = await rawQuery<{
    qr_code_study_session_id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
  }>(
    `
    SELECT 
      qrss.id as qr_code_study_session_id,
      sss.subject_id,
      s.code as subject_code,
      s.name as subject_name
    FROM qr_code_study_session qrss
    JOIN study_session ss ON ss.id = qrss.study_session_id
    JOIN subject_study_session sss ON sss.study_session_id = ss.id
    JOIN subject s ON s.id = sss.subject_id
    WHERE qrss.study_session_id = ? AND qrss.week_number = ?
    `,
    [studySessionId, weekNumber]
  );

  if (!qrSessionInfo) {
    throw new Error(
      `No QR session found for study session ${studySessionId}, week ${weekNumber}`
    );
  }

  // Get all students enrolled in this subject
  const enrolledStudents = await rawQuery<{
    student_id: string;
    student_name: string;
    student_email: string;
  }>(
    `
    SELECT 
      u.id as student_id,
      u.name as student_name,
      u.email as student_email
    FROM enrolment e
    JOIN user u ON u.id = e.student_id
    WHERE e.subject_id = ?
    `,
    [qrSessionInfo.subject_id]
  );

  // Get check-in data for this specific lecture
  const checkinData = await rawQuery<{
    student_id: string;
    checkin_count: number;
  }>(
    `
    SELECT 
      c.student_id,
      COUNT(*) as checkin_count
    FROM checkin c
    WHERE c.qr_code_study_session_id = ?
    GROUP BY c.student_id
    `,
    [qrSessionInfo.qr_code_study_session_id]
  );

  // Create a map for easy lookup
  const checkinMap = new Map<string, number>();
  checkinData.forEach(record => {
    checkinMap.set(record.student_id, record.checkin_count);
  });

  // Build attendance records for all enrolled students
  const students: StudentAttendanceRecord[] = enrolledStudents.map(student => {
    const checkinCount = checkinMap.get(student.student_id) || 0;
    const attendancePercentage = calculateLectureAttendance(checkinCount);

    return {
      studentId: student.student_id,
      studentName: student.student_name,
      studentEmail: student.student_email,
      subjectId: qrSessionInfo.subject_id,
      subjectCode: qrSessionInfo.subject_code,
      subjectName: qrSessionInfo.subject_name,
      weekNumber: weekNumber,
      checkinCount: checkinCount,
      attendancePercentage: attendancePercentage,
    };
  });

  return {
    studySessionId: studySessionId,
    weekNumber: weekNumber,
    subjectId: qrSessionInfo.subject_id,
    subjectCode: qrSessionInfo.subject_code,
    subjectName: qrSessionInfo.subject_name,
    students: students,
  };
}

/**
 * Calculate overall attendance for a student in a subject
 */
export async function calculateStudentOverallAttendance(
  studentId: string,
  subjectId: number
): Promise<StudentOverallAttendance> {
  // Get subject info and required threshold
  const [subjectInfo] = await rawQuery<{
    subject_code: string;
    subject_name: string;
    required_lectures: number;
    required_attendance_thresh: number;
  }>(
    `
    SELECT 
      s.code as subject_code,
      s.name as subject_name,
      s.required_lectures,
      s.required_attendance_thresh
    FROM subject s
    WHERE s.id = ?
    `,
    [subjectId]
  );

  if (!subjectInfo) {
    throw new Error(`Subject not found: ${subjectId}`);
  }

  // Get student info
  const [studentInfo] = await rawQuery<{
    student_name: string;
    student_email: string;
  }>(
    `
    SELECT 
      u.name as student_name,
      u.email as student_email
    FROM user u
    WHERE u.id = ?
    `,
    [studentId]
  );

  if (!studentInfo) {
    throw new Error(`Student not found: ${studentId}`);
  }

  // Get all lectures for this subject and student's attendance
  const lectureAttendance = await rawQuery<{
    week_number: number;
    checkin_count: number;
  }>(
    `
    SELECT 
      qrss.week_number,
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

  // Calculate total attendance percentage
  let totalAttendancePoints = 0;
  let totalPossiblePoints = 0;

  lectureAttendance.forEach(lecture => {
    const attendancePercentage = calculateLectureAttendance(
      lecture.checkin_count
    );
    totalAttendancePoints += attendancePercentage;
    totalPossiblePoints += 90; // Each lecture is worth 90% if fully attended
  });

  const totalAttendancePercentage =
    totalPossiblePoints > 0
      ? (totalAttendancePoints / totalPossiblePoints) * 100
      : 0;

  // Calculate how many classes can still be missed
  const requiredPercentage = subjectInfo.required_attendance_thresh * 100; // Convert to percentage
  const totalLectures = lectureAttendance.length;
  const remainingLectures = subjectInfo.required_lectures - totalLectures;

  // Calculate minimum points needed for 80%
  const totalPossiblePointsAtEnd = (totalLectures + remainingLectures) * 90;
  const minimumPointsNeeded =
    (totalPossiblePointsAtEnd * requiredPercentage) / 100;
  const pointsStillNeeded = minimumPointsNeeded - totalAttendancePoints;

  // Each missed class = 0 points, each attended class = 90 points
  const classesCanMiss =
    remainingLectures - Math.max(0, Math.ceil(pointsStillNeeded / 90));

  const attendedLectures = lectureAttendance.filter(
    l => l.checkin_count > 0
  ).length;

  return {
    studentId: studentId,
    studentName: studentInfo.student_name,
    studentEmail: studentInfo.student_email,
    subjectId: subjectId,
    subjectCode: subjectInfo.subject_code,
    subjectName: subjectInfo.subject_name,
    totalLectures: totalLectures,
    attendedLectures: attendedLectures,
    totalAttendancePercentage: totalAttendancePercentage,
    classesCanMiss: Math.max(0, classesCanMiss),
    isLowAttendance: totalAttendancePercentage < requiredPercentage,
    requiredAttendanceThresh: requiredPercentage,
  };
}
