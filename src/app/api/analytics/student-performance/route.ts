import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/student-performance:
 *   get:
 *     summary: Get individual student performance analytics
 *     description: Returns detailed performance data for individual students including attendance percentages, performance categories, and trends. Can be filtered by specific study session and limited in results.
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
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           example: 20
 *         description: Maximum number of student records to return
 *     responses:
 *       200:
 *         description: Student performance data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   student_name:
 *                     type: string
 *                     example: "John Smith"
 *                   student_id_anon:
 *                     type: string
 *                     description: Anonymized student ID
 *                     example: "S001"
 *                   initials:
 *                     type: string
 *                     example: "JS"
 *                   student_email:
 *                     type: string
 *                     format: email
 *                     example: "john.smith@student.edu"
 *                   subject_code:
 *                     type: string
 *                     example: "MTS9307"
 *                   subject_name:
 *                     type: string
 *                     example: "Web server programming DTN939"
 *                   total_weeks:
 *                     type: integer
 *                     example: 12
 *                   weeks_attended:
 *                     type: integer
 *                     example: 10
 *                   attendance_percentage:
 *                     type: number
 *                     format: float
 *                     example: 83.3
 *                   performance_category:
 *                     type: string
 *                     enum: [Excellent, Good, Average, Poor]
 *                     example: "Good"
 *                   trend:
 *                     type: string
 *                     enum: [up, none, down]
 *                     example: "up"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch student performance data"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId');
    const limit = searchParams.get('limit') || '50';
    const sessionType = searchParams.get('sessionType') || 'lecture';

    // Build session type filter
    const sessionFilter = `AND ss.type = '${sessionType}'`;

    // Using EMAIL CALCULATOR METHOD: 2+ checkins = 100 points, 1 checkin = 50 points, 0 checkins = 0 points
    const query = `
      SELECT
          u.name as student_name,
          CONCAT('S', LPAD(ROW_NUMBER() OVER (ORDER BY u.name), 3, '0')) as student_id_anon,
          UPPER(CONCAT(LEFT(SUBSTRING_INDEX(u.name, ' ', 1), 1), LEFT(SUBSTRING_INDEX(u.name, ' ', -1), 1))) as initials,
          u.email as student_email,
          s.code as subject_code,
          s.name as subject_name,
          COUNT(DISTINCT qrss.id) as total_weeks,
          COUNT(DISTINCT CASE WHEN checkin_counts.checkin_count > 0 THEN qrss.id END) as weeks_attended,
          ROUND(
            (SUM(
              CASE
                WHEN checkin_counts.checkin_count >= 2 THEN 100
                WHEN checkin_counts.checkin_count = 1 THEN 50
                ELSE 0
              END
            ) / (COUNT(DISTINCT qrss.id) * 100)) * 100,
            1
          ) as attendance_percentage,
          CASE
              WHEN ROUND((SUM(CASE WHEN checkin_counts.checkin_count >= 2 THEN 100 WHEN checkin_counts.checkin_count = 1 THEN 50 ELSE 0 END) / (COUNT(DISTINCT qrss.id) * 100)) * 100, 1) >= 90 THEN 'Excellent'
              WHEN ROUND((SUM(CASE WHEN checkin_counts.checkin_count >= 2 THEN 100 WHEN checkin_counts.checkin_count = 1 THEN 50 ELSE 0 END) / (COUNT(DISTINCT qrss.id) * 100)) * 100, 1) >= 80 THEN 'Good'
              WHEN ROUND((SUM(CASE WHEN checkin_counts.checkin_count >= 2 THEN 100 WHEN checkin_counts.checkin_count = 1 THEN 50 ELSE 0 END) / (COUNT(DISTINCT qrss.id) * 100)) * 100, 1) >= 70 THEN 'Average'
              ELSE 'Poor'
          END as performance_category,
          CASE
              WHEN ROUND((SUM(CASE WHEN checkin_counts.checkin_count >= 2 THEN 100 WHEN checkin_counts.checkin_count = 1 THEN 50 ELSE 0 END) / (COUNT(DISTINCT qrss.id) * 100)) * 100, 1) >= 80 THEN 'up'
              WHEN ROUND((SUM(CASE WHEN checkin_counts.checkin_count >= 2 THEN 100 WHEN checkin_counts.checkin_count = 1 THEN 50 ELSE 0 END) / (COUNT(DISTINCT qrss.id) * 100)) * 100, 1) >= 60 THEN 'none'
              ELSE 'down'
          END as trend
      FROM user u
      JOIN enrolment e ON e.student_id = u.id
      JOIN subject s ON s.id = e.subject_id
      JOIN subject_study_session sss ON sss.subject_id = s.id
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
                       AND checkin_counts.student_id = u.id
      WHERE u.role = 'student' ${sessionFilter} ${subjectId && subjectId !== 'all' ? 'AND s.id = ?' : ''}
      GROUP BY u.id, u.name, u.email, s.code, s.name
      ORDER BY ${subjectId && subjectId !== 'all' ? 'attendance_percentage DESC' : 's.code, attendance_percentage DESC'}
      LIMIT ?
    `;

    const subjectIdNum = subjectId && subjectId !== 'all' ? parseInt(subjectId) : null;
    const params = subjectIdNum ? [subjectIdNum, parseInt(limit)] : [parseInt(limit)];
    const data = await rawQuery(query, params);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Student performance API error:", error);
    return NextResponse.json({ error: "Failed to fetch student performance data" }, { status: 500 });
  }
}