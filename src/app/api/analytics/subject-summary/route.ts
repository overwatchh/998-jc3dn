import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/subject-summary:
 *   get:
 *     summary: Get subject-level attendance summary
 *     description: Returns aggregated attendance data across all subjects including enrollment numbers, average attendance rates, and at-risk student counts.
 *     tags:
 *       - Statistics
 *     parameters:
 *       - in: query
 *         name: sessionType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [lecture, tutorial, both]
 *           default: lecture
 *         description: Type of sessions to include in analysis
 *     responses:
 *       200:
 *         description: Subject summary data retrieved successfully
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
 *                   total_students:
 *                     type: integer
 *                     description: Total number of enrolled students
 *                     example: 25
 *                   total_weeks:
 *                     type: integer
 *                     description: Total number of weeks with attendance data
 *                     example: 12
 *                   avg_attendance_rate:
 *                     type: number
 *                     format: float
 *                     description: Average attendance rate across all weeks
 *                     example: 78.5
 *                   at_risk_students:
 *                     type: integer
 *                     description: Number of students with attendance below 80%
 *                     example: 8
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch subject summary data"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionType = searchParams.get('sessionType') || 'lecture';

    // Build session type filter
    const sessionFilter = `AND ss.type = '${sessionType}'`;

    const query = `
      SELECT
          s.code as subject_code,
          s.name as subject_name,
          COUNT(DISTINCT e.student_id) as total_students,
          COUNT(DISTINCT qrss.id) as total_weeks,
          ROUND(AVG(weekly_attendance.attendance_rate), 1) as avg_attendance_rate,
          COUNT(DISTINCT CASE WHEN student_avg.avg_attendance < 80 THEN student_avg.student_id END) as at_risk_students
      FROM subject s
      JOIN enrolment e ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      LEFT JOIN (
          SELECT
              sss.subject_id,
              qrss.id as qr_session_id,
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
          WHERE 1=1 ${sessionFilter}
          GROUP BY sss.subject_id, qrss.id
      ) weekly_attendance ON weekly_attendance.subject_id = s.id
      LEFT JOIN (
          SELECT
              e.student_id,
              sss.subject_id,
              ROUND(
                (SUM(
                  CASE
                    WHEN checkin_counts.checkin_count >= 2 THEN 100
                    WHEN checkin_counts.checkin_count = 1 THEN 50
                    ELSE 0
                  END
                ) / (COUNT(DISTINCT qrss.id) * 100)) * 100,
                1
              ) as avg_attendance
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
          WHERE 1=1 ${sessionFilter}
          GROUP BY e.student_id, sss.subject_id
      ) student_avg ON student_avg.subject_id = s.id
      WHERE 1=1 ${sessionFilter}
      GROUP BY s.code, s.name
      ORDER BY s.code
    `;

    const data = await rawQuery(query, []);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Subject summary API error:", error);
    return NextResponse.json({ error: "Failed to fetch subject summary data" }, { status: 500 });
  }
}