import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { rawQuery } from '@/lib/server/query';
import { headers } from 'next/headers';

interface Student {
  student_id: number;
  student_name: string;
  student_email: string;
  initials: string;
}

interface AttendanceSession {
  qr_session_id: number;
  week_number: number;
  checkin_count: string | number;
}

interface CheckinData {
  checkin_count: string | number;
}

interface CourseData {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  total_sessions: string | number;
  total_students: string | number;
  average_attendance: string | number;
  last_session: string;
}

interface SessionAttendanceData {
  qr_session_id: number;
  week_number: number;
  session_label: string;
  formatted_date: string;
  primary_checkin_type: string;
  total_enrolled: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId');
    const viewType = searchParams.get('viewType') || 'student';
    const searchQuery = searchParams.get('search') || '';
    const sessionType = searchParams.get('sessionType') || 'lecture';

    if (!subjectId || subjectId === 'all') {
      return NextResponse.json({ error: "Specific Subject ID is required for detailed attendance" }, { status: 400 });
    }

    let data;

    switch (viewType) {
      case 'student':
        data = await getStudentAttendance(parseInt(subjectId), searchQuery, sessionType);
        break;
      case 'session':
        data = await getSessionAttendance(parseInt(subjectId), sessionType);
        break;
      case 'course':
        data = await getCourseAttendance(session.user.id, sessionType);
        break;
      default:
        data = await getStudentAttendance(parseInt(subjectId), searchQuery, sessionType);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching detailed attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch detailed attendance data" },
      { status: 500 }
    );
  }
}

async function getStudentAttendance(subjectId: number, searchQuery: string, sessionType: string) {
  // Build session type filter
  const sessionFilter = `AND ss.type = '${sessionType}'`;
  // Get all students with their attendance data using the EMAIL CALCULATOR METHOD
  // This uses the same logic as the email reminder system:
  // - Count total check-ins per QR session for each student
  // - Apply scoring: 2+ check-ins = 90%, 1 check-in = 45%, 0 check-ins = 0%
  // - Calculate overall percentage based on total points vs possible points

  // First get all students enrolled in the subject
  let baseQuery = `
    SELECT DISTINCT
      u.id as student_id,
      u.name as student_name,
      u.email as student_email,
      COALESCE(
        CONCAT(
          UPPER(SUBSTRING(u.name, 1, 1)),
          UPPER(SUBSTRING(SUBSTRING_INDEX(u.name, ' ', -1), 1, 1))
        ),
        'XX'
      ) as initials
    FROM user u
    INNER JOIN enrolment e ON u.id = e.student_id
    WHERE e.subject_id = ?
  `;

  const params: (number | string)[] = [subjectId];

  if (searchQuery) {
    baseQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
    params.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  baseQuery += ` ORDER BY u.name ASC`;

  const students = await rawQuery(baseQuery, params);

  // For each student, calculate attendance using EMAIL CALCULATOR METHOD
  const studentsWithAttendance = await Promise.all(students.map(async (student: Student) => {
    // Get all QR sessions for this subject and student's checkins
    const attendanceQuery = `
      SELECT
        qrss.id as qr_session_id,
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
      WHERE sss.subject_id = ? ${sessionFilter}
      ORDER BY qrss.week_number
    `;

    const attendanceData = await rawQuery(attendanceQuery, [student.student_id, subjectId]);

    // Calculate attendance using email calculator method
    let totalAttendancePoints = 0;
    let totalPossiblePoints = 0;

    attendanceData.forEach((session: AttendanceSession) => {
      // Apply email calculator scoring: 2+ checkins = 100%, 1 checkin = 50%, 0 checkins = 0%
      const checkinCount = parseInt(String(session.checkin_count)) || 0;
      let sessionPoints = 0;

      if (checkinCount >= 2) {
        sessionPoints = 100;
      } else if (checkinCount === 1) {
        sessionPoints = 50;
      } else {
        sessionPoints = 0;
      }

      totalAttendancePoints += sessionPoints;
      totalPossiblePoints += 100; // Each session is worth 100 points max
    });

    const totalAttendancePercentage = totalPossiblePoints > 0
      ? (totalAttendancePoints / totalPossiblePoints) * 100
      : 0;

    // Calculate trend based on recent sessions
    const recentSessions = attendanceData.slice(-6); // Last 6 sessions
    let trend = 'stable';

    if (recentSessions.length >= 6) {
      const recent = recentSessions.slice(-3); // Last 3
      const earlier = recentSessions.slice(-6, -3); // Previous 3

      const recentPoints = recent.reduce((sum: number, session: AttendanceSession): number => {
        const checkinCount = parseInt(String(session.checkin_count)) || 0;
        return sum + (checkinCount >= 2 ? 100 : checkinCount === 1 ? 50 : 0);
      }, 0 as number);

      const earlierPoints = earlier.reduce((sum: number, session: AttendanceSession): number => {
        const checkinCount = parseInt(String(session.checkin_count)) || 0;
        return sum + (checkinCount >= 2 ? 100 : checkinCount === 1 ? 50 : 0);
      }, 0 as number);

      const recentRate = Number(recentPoints) / (3 * 100);
      const earlierRate = Number(earlierPoints) / (3 * 100);

      if (recentRate > earlierRate + 0.1) trend = 'up';
      else if (recentRate < earlierRate - 0.1) trend = 'down';
    }

    const attendedSessions = attendanceData.filter((session: AttendanceSession) => parseInt(String(session.checkin_count)) > 0).length;

    return {
      id: student.student_id,
      name: student.student_name || 'Unknown',
      email: student.student_email || '',
      initials: student.initials,
      totalSessions: attendanceData.length,
      attendedSessions: attendedSessions,
      attendancePercentage: Math.round(totalAttendancePercentage * 10) / 10,
      trend
    };
  }));

  return studentsWithAttendance;
}

async function getSessionAttendance(subjectId: number, sessionType: string) {
  // Build session type filter
  const sessionFilter = `AND ss.type = '${sessionType}'`;

  // Get session attendance using EMAIL CALCULATOR METHOD
  // Each QR session is scored individually using the 0/45/90 point system
  const query = `
    SELECT
      qrss.id as qr_session_id,
      qrss.week_number,
      CONCAT('Week ', qrss.week_number) as session_label,
      DATE_FORMAT(
        DATE_ADD('2025-07-07', INTERVAL (qrss.week_number - 1) * 7 DAY),
        '%d/%m/%Y'
      ) as formatted_date,
      CASE
        WHEN COUNT(DISTINCT CASE WHEN c.checkin_type = 'on_time' THEN c.student_id END) > 0 THEN 'Mixed'
        WHEN COUNT(DISTINCT CASE WHEN c.checkin_type = 'late' THEN c.student_id END) > 0 THEN 'Mixed'
        WHEN COUNT(DISTINCT CASE WHEN c.checkin_type = 'very_late' THEN c.student_id END) > 0 THEN 'Mixed'
        WHEN COUNT(DISTINCT CASE WHEN c.checkin_type = 'manual_override' THEN c.student_id END) > 0 THEN 'Manual Override'
        ELSE 'QR Code'
      END as primary_checkin_type,
      COUNT(DISTINCT e.student_id) as total_enrolled
    FROM qr_code_study_session qrss
    JOIN study_session ss ON ss.id = qrss.study_session_id
    JOIN subject_study_session sss ON sss.study_session_id = ss.id
    LEFT JOIN enrolment e ON e.subject_id = sss.subject_id
    LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = e.student_id
    WHERE sss.subject_id = ? ${sessionFilter}
    GROUP BY qrss.id, qrss.week_number
    ORDER BY qrss.week_number ASC, qrss.id ASC
  `;

  const sessions = await rawQuery(query, [subjectId]);

  // For each session, calculate attendance using email calculator method
  const sessionsWithAttendance = await Promise.all(sessions.map(async (session: SessionAttendanceData) => {
    // Get checkin counts for each student for this specific QR session
    const checkinQuery = `
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
    `;

    const checkinData = await rawQuery(checkinQuery, [session.qr_session_id, subjectId]);

    // Apply email calculator scoring for each student
    let totalPoints = 0;
    let maxPoints = 0;
    let fullAttendanceCount = 0; // Students with 2+ checkins (100 points)
    let partialAttendanceCount = 0; // Students with 1 checkin (50 points)
    let absentCount = 0; // Students with 0 checkins

    checkinData.forEach((student: CheckinData) => {
      const checkinCount = parseInt(String(student.checkin_count)) || 0;
      maxPoints += 100;

      if (checkinCount >= 2) {
        totalPoints += 100;
        fullAttendanceCount++;
      } else if (checkinCount === 1) {
        totalPoints += 50;
        partialAttendanceCount++;
      } else {
        absentCount++;
      }
    });

    const attendanceRate = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    return {
      id: session.qr_session_id,
      weekLabel: session.session_label,
      date: session.formatted_date || 'TBD',
      checkInType: session.primary_checkin_type || 'QR Code',
      presentCount: fullAttendanceCount + partialAttendanceCount,
      absentCount: absentCount,
      totalCount: parseInt(String(session.total_enrolled)) || 0,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      // Additional breakdown for detailed view
      fullAttendanceCount: fullAttendanceCount,
      partialAttendanceCount: partialAttendanceCount
    };
  }));

  return sessionsWithAttendance;
}

async function getCourseAttendance(lecturerId: string, sessionType: string) {
  // Build session type filter
  const sessionFilter = `AND ss.type = '${sessionType}'`;

  // Using EMAIL CALCULATOR METHOD: 2+ checkins = 100 points, 1 checkin = 50 points, 0 checkins = 0 points
  const query = `
    SELECT
      s.id as subject_id,
      s.code as subject_code,
      s.name as subject_name,
      COUNT(DISTINCT qrss.id) as total_sessions,
      COUNT(DISTINCT e.student_id) as total_students,
      ROUND(
        (SUM(
          CASE
            WHEN checkin_counts.checkin_count >= 2 THEN 100
            WHEN checkin_counts.checkin_count = 1 THEN 50
            ELSE 0
          END
        ) / (COUNT(DISTINCT qrss.id) * COUNT(DISTINCT e.student_id) * 100)) * 100,
        1
      ) as average_attendance,
      MAX(ss.start_time) as last_session
    FROM subject s
    INNER JOIN subject_study_session sss ON sss.subject_id = s.id
    INNER JOIN study_session ss ON ss.id = sss.study_session_id
    INNER JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
    LEFT JOIN enrolment e ON e.subject_id = s.id
    LEFT JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
    LEFT JOIN (
      SELECT
        qr_code_study_session_id,
        student_id,
        COUNT(*) as checkin_count
      FROM checkin
      GROUP BY qr_code_study_session_id, student_id
    ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                     AND checkin_counts.student_id = e.student_id
    WHERE lss.lecturer_id = ? ${sessionFilter}
    GROUP BY s.id, s.code, s.name
    ORDER BY s.code ASC
  `;

  const courses = await rawQuery(query, [lecturerId]);

  return courses.map((course: CourseData) => ({
    id: course.subject_id,
    code: course.subject_code,
    name: course.subject_name,
    totalSessions: parseInt(String(course.total_sessions)) || 0,
    totalStudents: parseInt(String(course.total_students)) || 0,
    averageAttendance: parseFloat(String(course.average_attendance)) || 0,
    lastSession: course.last_session
  }));
}