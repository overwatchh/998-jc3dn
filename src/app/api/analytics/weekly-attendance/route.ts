import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/weekly-attendance:
 *   get:
 *     summary: Get weekly attendance data for analytics
 *     description: Returns weekly attendance statistics including enrollment numbers, attendance rates, and trends for lectures. Can be filtered by specific study session.
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
 *         description: Weekly attendance data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   subject_code:
 *                     type: string
 *                     example: "MTS9307"
 *                   subject_name:
 *                     type: string
 *                     example: "Web server programming DTN939"
 *                   week_number:
 *                     type: integer
 *                     example: 1
 *                   total_enrolled:
 *                     type: integer
 *                     example: 25
 *                   students_attended:
 *                     type: integer
 *                     example: 20
 *                   attendance_rate:
 *                     type: number
 *                     format: float
 *                     example: 80.0
 *                   week_label:
 *                     type: string
 *                     example: "Week 1"
 *                   date_label:
 *                     type: string
 *                     example: "Sep 16"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch weekly attendance data"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId'); // Now correctly using subject ID

    const query = `
      SELECT
          s.code as subject_code,
          s.name as subject_name,
          qrss.week_number,
          COUNT(DISTINCT e.student_id) as total_enrolled,
          COUNT(DISTINCT c.student_id) as students_attended,
          ROUND((COUNT(DISTINCT c.student_id) / COUNT(DISTINCT e.student_id)) * 100, 1) as attendance_rate,
          CONCAT('Week ', qrss.week_number) as week_label,
          DATE_FORMAT(MIN(ss.start_time), '%b %d') as date_label
      FROM qr_code_study_session qrss
      JOIN study_session ss ON ss.id = qrss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      JOIN enrolment e ON e.subject_id = s.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = e.student_id
      WHERE ss.type = 'lecture' ${subjectId ? 'AND s.id = ?' : ''}
      GROUP BY s.code, s.name, qrss.week_number
      ORDER BY s.code, qrss.week_number
    `;

    const params = subjectId ? [parseInt(subjectId)] : [];
    const data = await rawQuery(query, params);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Weekly attendance API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly attendance data' }, { status: 500 });
  }
}
