import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/lecturer/study-session/{id}/at-risk-students:
 *   get:
 *     tags:
 *       - Lecturer
 *     summary: Get at-risk students for a study session
 *     description: Returns students with poor attendance records for the specific study session and subject.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study session ID
 *     responses:
 *       200:
 *         description: At-risk students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       student_id:
 *                         type: string
 *                       student_name:
 *                         type: string
 *                       student_email:
 *                         type: string
 *                       attendance_rate:
 *                         type: number
 *                         format: float
 *                       absence_count:
 *                         type: integer
 *                       last_checkin:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Lecturer not assigned to session
 *       500:
 *         description: Server error
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const studySessionId = parseInt(id);

    if (!studySessionId) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      );
    }

    // Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const lecturerId = session.user.id;

    // Check if lecturer is assigned to this session
    const checkSql = `
      SELECT ss.id AS study_session_id
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      WHERE ss.id = ? AND lss.lecturer_id = ?
    `;

    const [studySessionRow] = await rawQuery<{ study_session_id: number }>(
      checkSql,
      [studySessionId, lecturerId]
    );
    if (!studySessionRow) {
      return NextResponse.json(
        { message: "You are not assigned to this course session" },
        { status: 403 }
      );
    }

    // Get at-risk students (attendance rate < 80%)
    const atRiskSql = `
      SELECT
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        ROUND(
          (COUNT(DISTINCT CASE WHEN c.student_id IS NOT NULL THEN qrss.week_number END) / 
           COUNT(DISTINCT qrss.week_number)) * 100, 1
        ) AS attendance_rate,
        COUNT(DISTINCT qrss.week_number) - COUNT(DISTINCT CASE WHEN c.student_id IS NOT NULL THEN qrss.week_number END) AS absence_count,
        MAX(c.checkin_time) AS last_checkin
      FROM study_session ss
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      JOIN enrolment e ON e.subject_id = s.id
      JOIN user u ON u.id = e.student_id
      JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = u.id
      WHERE ss.id = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.email
      HAVING attendance_rate < 80
      ORDER BY attendance_rate ASC, absence_count DESC
      LIMIT 10
    `;

    const atRiskStudents = await rawQuery<{
      student_id: string;
      student_name: string;
      student_email: string;
      attendance_rate: number;
      absence_count: number;
      last_checkin: string | null;
    }>(atRiskSql, [studySessionId]);

    return NextResponse.json({
      message: "At-risk students retrieved successfully",
      count: atRiskStudents.length,
      data: atRiskStudents,
    });
  } catch (error: unknown) {
    console.error("At-risk students API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
