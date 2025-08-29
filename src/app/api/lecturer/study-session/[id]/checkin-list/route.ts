import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query"; // Replace with your DB access method (e.g., mysql2)
import { headers } from "next/headers";
/**
 * @openapi
 * /api/lecturer/study-session/{id}/checkin-list:
 *   get:
 *     tags:
 *       - Lecturer
 *     summary: Get list of students who have checked in for the current validity of a study session
 *     description: Returns a list of students who have checked in for the current active validity of a specified study session and week number. The user must be authenticated and have the role of 'lecturer'.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study session ID
 *       - in: query
 *         name: week_number
 *         required: true
 *         schema:
 *           type: integer
 *         description: Week number
 *     responses:
 *       200:
 *         description: List of students who have checked in
 *       400:
 *         description: Missing required parameters or no QR code session found
 *       401:
 *         description: Unauthorized – user not signed in or not a lecturer
 *       403:
 *         description: Lecturer is not assigned to the session or QR not found for the given week
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
    const { searchParams } = new URL(req.url);
    const week_number = parseInt(searchParams.get("week_number") || "");

    if (!studySessionId || !week_number) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const lecturerId = session.user.id;
    //  Check if lecturer is assigned to this session
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

    // Step 1: Ensure QR code study session exists
    const qrssSql = `
      SELECT id FROM qr_code_study_session
      WHERE study_session_id = ? AND week_number = ?
    `;
    const qrssRows = await rawQuery<{ id: number }>(qrssSql, [
      studySessionId,
      week_number,
    ]);

    if (qrssRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No QR code study session found for this study session and week number",
        },
        { status: 400 }
      );
    }

    // Step 2: Detect current active validity
    const validitySql = `
      SELECT v.id AS validity_id, v.count AS validity_count, v.start_time, v.end_time
      FROM validity v
      WHERE v.qr_code_id = (
        SELECT qr_code_id FROM qr_code_study_session
        WHERE study_session_id = ? AND week_number = ?
      )
        AND NOW() BETWEEN v.start_time AND v.end_time
      LIMIT 1
    `;
    const validities = await rawQuery<{
      validity_id: number;
      validity_count: number;
      start_time: string;
      end_time: string;
    }>(validitySql, [studySessionId, week_number]);

    if (validities.length === 0) {
      return NextResponse.json({
        message: "No active validity window right now",
        validity_count: null,
        count: 0,
        data: [],
      });
    }

    const { validity_id, validity_count } = validities[0];

    // Step 3: Fetch students checked in for this validity
    const studentsSql = `
      SELECT 
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        c.checkin_time
      FROM checkin c
      JOIN user u 
        ON c.student_id = u.id
      WHERE c.qr_code_study_session_id = ?
        AND c.validity_id = ?
    `;
    const students = await rawQuery(studentsSql, [qrssRows[0].id, validity_id]);

    return NextResponse.json({
      message: "Fetched checked in students successfully",
      validity_count: validity_count,
      count: students.length,
      data: students,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
