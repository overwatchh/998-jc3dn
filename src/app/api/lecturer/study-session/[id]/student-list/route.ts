import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/lecturer/study-session/{id}/student-list:
 *   get:
 *     tags:
 *       - Lecturer
 *     summary: Get list of students enrolled in the subject for a study session
 *     description: Returns a list of all students who are enrolled in the subject that contains the specified study session. The user must be authenticated and have the role of 'lecturer'.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study session ID
 *     responses:
 *       200:
 *         description: List of enrolled students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   student_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *       400:
 *         description: Invalid study session ID
 *       401:
 *         description: Unauthorized – user not signed in or not a lecturer
 *       403:
 *         description: Lecturer is not assigned to the session
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

    if (!studySessionId || isNaN(studySessionId)) {
      return NextResponse.json(
        { error: "Invalid study session ID" },
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

    // Get all students enrolled in the subject that this study session belongs to
    const studentsSql = `
      SELECT 
        u.id AS student_id,
        u.name,
        u.email
      FROM user u
      JOIN enrolment e ON e.student_id = u.id
      JOIN subject_study_session sss ON sss.subject_id = e.subject_id
      WHERE sss.study_session_id = ?
        AND u.role = 'student'
      ORDER BY u.name ASC
    `;

    const students = await rawQuery<{
      student_id: string;
      name: string;
      email: string;
    }>(studentsSql, [studySessionId]);

    return NextResponse.json(students);
  } catch (error: unknown) {
    console.error("Error fetching student list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
