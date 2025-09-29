import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/attendance-distribution:
 *   get:
 *     summary: Get attendance performance distribution
 *     description: Returns the distribution of students across different performance categories (Excellent, Good, Average, Poor) with counts and color coding for charts.
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
 *         description: Attendance distribution data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     enum: [Excellent, Good, Average, Poor]
 *                     example: "Good"
 *                   value:
 *                     type: integer
 *                     description: Number of students in this category
 *                     example: 15
 *                   fill:
 *                     type: string
 *                     description: Hex color code for chart visualization
 *                     example: "#84cc16"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch attendance distribution data"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId'); // Now correctly using subject ID

    const query = `
      SELECT
          performance_category as name,
          COUNT(*) as value,
          CASE
              WHEN performance_category = 'Excellent' THEN '#22c55e'
              WHEN performance_category = 'Good' THEN '#84cc16'
              WHEN performance_category = 'Average' THEN '#f59e0b'
              WHEN performance_category = 'Poor' THEN '#ef4444'
          END as fill
      FROM (
          SELECT
              CASE
                  WHEN ROUND((COUNT(DISTINCT CASE WHEN c.student_id IS NOT NULL THEN qrss.week_number END) / COUNT(DISTINCT qrss.week_number)) * 100, 1) >= 90 THEN 'Excellent'
                  WHEN ROUND((COUNT(DISTINCT CASE WHEN c.student_id IS NOT NULL THEN qrss.week_number END) / COUNT(DISTINCT qrss.week_number)) * 100, 1) >= 80 THEN 'Good'
                  WHEN ROUND((COUNT(DISTINCT CASE WHEN c.student_id IS NOT NULL THEN qrss.week_number END) / COUNT(DISTINCT qrss.week_number)) * 100, 1) >= 70 THEN 'Average'
                  ELSE 'Poor'
              END as performance_category
          FROM user u
          JOIN enrolment e ON e.student_id = u.id
          JOIN subject s ON s.id = e.subject_id
          JOIN subject_study_session sss ON sss.subject_id = s.id
          JOIN study_session ss ON ss.id = sss.study_session_id
          JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
          LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = u.id
          WHERE u.role = 'student' AND ss.type = 'lecture' ${subjectId ? 'AND s.id = ?' : ''}
          GROUP BY u.id, s.id
      ) student_performance
      GROUP BY performance_category
      ORDER BY
          CASE performance_category
              WHEN 'Excellent' THEN 1
              WHEN 'Good' THEN 2
              WHEN 'Average' THEN 3
              WHEN 'Poor' THEN 4
          END
    `;

    const subjectIdNum = subjectId && subjectId !== 'all' ? parseInt(subjectId) : null;
    const params = subjectIdNum ? [subjectIdNum] : [];
    const data = await rawQuery(query, params);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Attendance distribution API error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance distribution data' }, { status: 500 });
  }
}