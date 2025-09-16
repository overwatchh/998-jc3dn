import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/key-metrics:
 *   get:
 *     summary: Get key attendance metrics and insights
 *     description: Returns essential attendance metrics including average attendance, at-risk students, and best/worst performing sessions for dashboard overview.
 *     tags:
 *       - Statistics
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         required: false
 *         schema:
 *           type: integer
 *           example: 101
 *         description: Study session ID to filter results (optional)
 *     responses:
 *       200:
 *         description: Key metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageAttendance:
 *                   type: number
 *                   format: float
 *                   example: 78.5
 *                 atRiskStudents:
 *                   type: integer
 *                   description: Number of students with attendance below 80%
 *                   example: 12
 *                 totalStudents:
 *                   type: integer
 *                   example: 45
 *                 totalWeeks:
 *                   type: integer
 *                   example: 12
 *                 mostAttended:
 *                   type: object
 *                   properties:
 *                     week:
 *                       type: string
 *                       example: "Week 3"
 *                     subject:
 *                       type: string
 *                       example: "MTS9307"
 *                     attendance:
 *                       type: number
 *                       format: float
 *                       example: 95.2
 *                 leastAttended:
 *                   type: object
 *                   properties:
 *                     week:
 *                       type: string
 *                       example: "Week 8"
 *                     subject:
 *                       type: string
 *                       example: "MTS9307"
 *                     attendance:
 *                       type: number
 *                       format: float
 *                       example: 62.1
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch key metrics data"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('subjectId'); // This is actually a study_session_id

    // Get overall metrics
    const metricsQuery = `
      SELECT
          ROUND(AVG(weekly_attendance.attendance_rate), 1) as average_attendance,
          COUNT(DISTINCT CASE WHEN student_avg.avg_attendance < 80 THEN student_avg.student_id END) as at_risk_students,
          COUNT(DISTINCT e.student_id) as total_students,
          COUNT(DISTINCT qrss.week_number) as total_weeks
      FROM subject s
      JOIN enrolment e ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      LEFT JOIN (
          SELECT
              sss.subject_id,
              qrss.week_number,
              (COUNT(DISTINCT c.student_id) / COUNT(DISTINCT e.student_id)) * 100 as attendance_rate
          FROM qr_code_study_session qrss
          JOIN study_session ss ON ss.id = qrss.study_session_id
          JOIN subject_study_session sss ON sss.study_session_id = ss.id
          JOIN enrolment e ON e.subject_id = sss.subject_id
          LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = e.student_id
          ${courseId ? 'WHERE ss.id = ?' : ''}
          GROUP BY sss.subject_id, qrss.week_number
      ) weekly_attendance ON weekly_attendance.subject_id = s.id
      LEFT JOIN (
          SELECT
              e.student_id,
              sss.subject_id,
              (COUNT(DISTINCT CASE WHEN c.student_id IS NOT NULL THEN qrss.week_number END) / COUNT(DISTINCT qrss.week_number)) * 100 as avg_attendance
          FROM enrolment e
          JOIN subject_study_session sss ON sss.subject_id = e.subject_id
          JOIN study_session ss ON ss.id = sss.study_session_id
          JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
          LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = e.student_id
          GROUP BY e.student_id, sss.subject_id
      ) student_avg ON student_avg.subject_id = s.id
      WHERE ss.type = 'lecture' ${courseId ? 'AND ss.id = ?' : ''}
    `;

    // Get best attended session
    const bestQuery = `
      SELECT
          CONCAT('Week ', qrss.week_number) as week_label,
          s.code as subject_code,
          ROUND((COUNT(DISTINCT c.student_id) / COUNT(DISTINCT e.student_id)) * 100, 1) as attendance_rate
      FROM qr_code_study_session qrss
      JOIN study_session ss ON ss.id = qrss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      JOIN enrolment e ON e.subject_id = s.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = e.student_id
      WHERE ss.type = 'lecture' ${courseId ? 'AND ss.id = ?' : ''}
      GROUP BY s.code, qrss.week_number, qrss.id
      ORDER BY attendance_rate DESC
      LIMIT 1
    `;

    // Get worst attended session
    const worstQuery = `
      SELECT
          CONCAT('Week ', qrss.week_number) as week_label,
          s.code as subject_code,
          ROUND((COUNT(DISTINCT c.student_id) / COUNT(DISTINCT e.student_id)) * 100, 1) as attendance_rate
      FROM qr_code_study_session qrss
      JOIN study_session ss ON ss.id = qrss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      JOIN enrolment e ON e.subject_id = s.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = e.student_id
      WHERE ss.type = 'lecture' ${courseId ? 'AND ss.id = ?' : ''}
      GROUP BY s.code, qrss.week_number, qrss.id
      ORDER BY attendance_rate ASC
      LIMIT 1
    `;

    const metricsParams = courseId ? [parseInt(courseId), parseInt(courseId)] : [];
    const queryParams = courseId ? [parseInt(courseId)] : [];

    const [metricsData] = await rawQuery(metricsQuery, metricsParams);
    const [bestSession] = await rawQuery(bestQuery, queryParams);
    const [worstSession] = await rawQuery(worstQuery, queryParams);

    return NextResponse.json({
      averageAttendance: metricsData?.average_attendance || 0,
      atRiskStudents: metricsData?.at_risk_students || 0,
      totalStudents: metricsData?.total_students || 0,
      totalWeeks: metricsData?.total_weeks || 0,
      mostAttended: {
        week: bestSession?.week_label || 'N/A',
        subject: bestSession?.subject_code || '',
        attendance: bestSession?.attendance_rate || 0
      },
      leastAttended: {
        week: worstSession?.week_label || 'N/A',
        subject: worstSession?.subject_code || '',
        attendance: worstSession?.attendance_rate || 0
      }
    });
  } catch (error) {
    console.error('Key metrics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch key metrics data' }, { status: 500 });
  }
}