import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

interface SessionData {
  subject_code: string;
  subject_name: string;
  qr_session_id: number;
  week_number: number;
  total_enrolled: number;
  week_label: string;
  date_label: string;
}
import { calculateSessionAttendanceRate } from "@/lib/server/email-calculator";

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
    const subjectIdNum = subjectId ? parseInt(subjectId) : null;
    const sessionType = searchParams.get('sessionType') || 'lecture';

    // Build session type filter
    const sessionFilter = `AND ss.type = '${sessionType}'`;

    // Get basic session info
    const query = `
      SELECT
          s.code as subject_code,
          s.name as subject_name,
          qrss.id as qr_session_id,
          qrss.week_number,
          COUNT(DISTINCT e.student_id) as total_enrolled,
          CONCAT('Week ', qrss.week_number) as week_label,
          DATE_FORMAT(
            DATE_ADD('2025-07-07', INTERVAL (qrss.week_number - 1) * 7 DAY),
            '%b %d'
          ) as date_label
      FROM qr_code_study_session qrss
      JOIN study_session ss ON ss.id = qrss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      JOIN enrolment e ON e.subject_id = s.id
      WHERE 1=1 ${sessionFilter} ${subjectIdNum ? 'AND s.id = ?' : ''}
      GROUP BY s.code, s.name, qrss.id, qrss.week_number
      ORDER BY s.code, qrss.week_number
    `;

    const params = subjectIdNum ? [subjectIdNum] : [];
    const sessions = await rawQuery(query, params);

    // Calculate attendance using email calculator method for each session
    const dataWithAttendance = await Promise.all(
      sessions.map(async (session: SessionData) => {
        const attendanceRate = await calculateSessionAttendanceRate(
          session.qr_session_id,
          subjectIdNum || 1 // If no subject specified, use a default (this is edge case)
        );

        return {
          subject_code: session.subject_code,
          subject_name: session.subject_name,
          week_number: session.week_number,
          total_enrolled: session.total_enrolled,
          students_attended: Math.round((attendanceRate * session.total_enrolled) / 100),
          attendance_rate: Math.round(attendanceRate * 10) / 10,
          week_label: session.week_label,
          date_label: session.date_label
        };
      })
    );

    return NextResponse.json(dataWithAttendance);
  } catch (error) {
    console.error("Weekly attendance API error:", error);
    return NextResponse.json({ error: "Failed to fetch weekly attendance data" }, { status: 500 });
  }
}