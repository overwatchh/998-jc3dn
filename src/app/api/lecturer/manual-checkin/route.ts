import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/lecturer/manual-checkin:
 *   post:
 *     tags:
 *       - Lecturer
 *     summary: Manually check in a student
 *     description: Allows a lecturer to manually check in a student who doesn't have a phone or is unable to scan the QR code. The lecturer must be authorized for the session and there must be an active QR code session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - study_session_id
 *               - week_number
 *             properties:
 *               student_id:
 *                 type: string
 *                 description: The ID of the student to check in
 *               study_session_id:
 *                 type: integer
 *                 description: The study session ID
 *               week_number:
 *                 type: integer
 *                 description: The week number
 *     responses:
 *       200:
 *         description: Student checked in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 checkin_time:
 *                   type: string
 *                 validity_count:
 *                   type: integer
 *       400:
 *         description: Missing required parameters or validation errors
 *       401:
 *         description: Unauthorized – user not signed in or not a lecturer
 *       403:
 *         description: Lecturer not authorized for this session or student not enrolled
 *       409:
 *         description: Student already checked in for this validity window
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, study_session_id, week_number } = body;

    if (!student_id || !study_session_id || !week_number) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: student_id, study_session_id, week_number",
        },
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
    const checkLecturerSql = `
      SELECT ss.id AS study_session_id
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      WHERE ss.id = ? AND lss.lecturer_id = ?
    `;

    const [studySessionRow] = await rawQuery<{ study_session_id: number }>(
      checkLecturerSql,
      [study_session_id, lecturerId]
    );

    if (!studySessionRow) {
      return NextResponse.json(
        { message: "You are not assigned to this course session" },
        { status: 403 }
      );
    }

    // Check if student is enrolled in the subject for this study session
    const checkStudentSql = `
      SELECT u.id, u.name
      FROM user u
      JOIN enrolment e ON e.student_id = u.id
      JOIN subject_study_session sss ON sss.subject_id = e.subject_id
      WHERE sss.study_session_id = ? 
        AND u.id = ? 
        AND u.role = 'student'
    `;

    const [studentRow] = await rawQuery<{ id: string; name: string }>(
      checkStudentSql,
      [study_session_id, student_id]
    );

    if (!studentRow) {
      return NextResponse.json(
        { message: "Student is not enrolled in this course session" },
        { status: 403 }
      );
    }

    // Get the QR code study session for this week
    const qrSessionSql = `
      SELECT id, qr_code_id 
      FROM qr_code_study_session
      WHERE study_session_id = ? AND week_number = ?
    `;

    const [qrSessionRow] = await rawQuery<{ id: number; qr_code_id: number }>(
      qrSessionSql,
      [study_session_id, week_number]
    );

    if (!qrSessionRow) {
      return NextResponse.json(
        { error: "No QR code session found for this study session and week" },
        { status: 400 }
      );
    }

    // Ensure session is active now by verifying at least one active validity window
    const activeValiditySql = `
      SELECT id, count AS validity_count
      FROM validity
      WHERE qr_code_id = ?
        AND NOW() BETWEEN start_time AND end_time
      ORDER BY count ASC
      LIMIT 1
    `;

    const [activeValidityRow] = await rawQuery<{
      id: number;
      validity_count: number;
    }>(activeValiditySql, [qrSessionRow.qr_code_id]);

    if (!activeValidityRow) {
      return NextResponse.json(
        { error: "No active validity window found for this QR code session" },
        { status: 400 }
      );
    }

    // Fetch both validity windows for this QR code
    const allValidityRows = await rawQuery<{
      id: number;
      validity_count: number;
    }>(
      `
      SELECT id, count AS validity_count
      FROM validity
      WHERE qr_code_id = ?
      ORDER BY count ASC
      `,
      [qrSessionRow.qr_code_id]
    );

    if (!allValidityRows || allValidityRows.length === 0) {
      return NextResponse.json(
        { error: "No validity windows configured for this QR code session" },
        { status: 400 }
      );
    }

    // Determine which validity IDs are missing for this student
    const validityIds = allValidityRows.map(v => v.id);
    const placeholders = validityIds.map(() => "?").join(", ");
    const existingForStudent = await rawQuery<{ validity_id: number }>(
      `
      SELECT validity_id
      FROM checkin
      WHERE student_id = ?
        AND qr_code_study_session_id = ?
        AND validity_id IN (${placeholders})
      `,
      [student_id, qrSessionRow.id, ...validityIds]
    );

    const existingIds = new Set(existingForStudent.map(r => r.validity_id));
    const missingValidityIds = validityIds.filter(id => !existingIds.has(id));

    // Insert check-ins for any missing validity windows (mark as Manual)
    if (missingValidityIds.length > 0) {
      for (const vId of missingValidityIds) {
        await rawQuery(
          `
          INSERT INTO checkin (
            student_id,
            qr_code_study_session_id,
            validity_id,
            checkin_time,
            checkin_type
          ) VALUES (?, ?, ?, NOW(), 'Manual')
          `,
          [student_id, qrSessionRow.id, vId]
        );
      }
    } else {
      // Already fully checked in for both windows
      return NextResponse.json(
        { error: "Student is already fully checked in for this session" },
        { status: 409 }
      );
    }

    // Report success with validity_count 2 (i.e., 2/2)
    return NextResponse.json({
      message: `${studentRow.name} has been checked in successfully`,
      checkin_time: new Date().toISOString(),
      validity_count: 2,
    });
  } catch (error: unknown) {
    console.error("Manual check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
