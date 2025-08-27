/**
 * @openapi
 * /lecturer/study-session/{id}/student-list:
 *   get:
 *     summary: Get list of students expected in a study session
 *     tags: [Lecturer]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the study session
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of students enrolled in this study session
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
 */
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const studySessionId = Number(id);
    if (!Number.isFinite(studySessionId)) {
      return NextResponse.json({ message: "Invalid study session id" }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ensure lecturer is assigned to this study session
    const [assigned] = await rawQuery<{ ok: number }>(
      "SELECT 1 as ok FROM lecturer_study_session WHERE lecturer_id = ? AND study_session_id = ? LIMIT 1",
      [session.user.id, studySessionId]
    );
    if (!assigned) {
      return NextResponse.json({ message: "You are not assigned to this study session" }, { status: 403 });
    }

    const rows = await rawQuery<{
      student_id: string;
      name: string;
      email: string;
    }>(
      `SELECT 
        u.id AS student_id,
        u.name AS name,
        u.email AS email
       FROM student_study_session sss
       JOIN user u ON u.id = sss.student_id
       WHERE sss.study_session_id = ?
       ORDER BY u.name ASC`,
      [studySessionId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /lecturer/study-session/[id]/student-list error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
