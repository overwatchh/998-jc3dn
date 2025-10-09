import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/lecturer/study-session/{id}/details:
 *   get:
 *     tags:
 *       - Lecturer
 *     summary: Get detailed session information
 *     description: Returns comprehensive session details including subject info, room details, QR status, and timing information.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study session ID
 *     responses:
 *       200:
 *         description: Session details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     subject_name:
 *                       type: string
 *                     subject_code:
 *                       type: string
 *                     session_type:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *                     day_of_week:
 *                       type: string
 *                     room_name:
 *                       type: string
 *                     room_number:
 *                       type: string
 *                     building_name:
 *                       type: string
 *                     campus_name:
 *                       type: string
 *                     qr_status:
 *                       type: string
 *                       enum: [Active, Inactive, Not Generated]
 *                     qr_validity_count:
 *                       type: integer
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

    // Get session details with room and QR information
    const detailsSql = `
      SELECT
        s.name AS subject_name,
        s.code AS subject_code,
        ss.type AS session_type,
        ss.start_time,
        ss.end_time,
        ss.day_of_week,
        r.room_number,
        r.description AS room_name,
        r.building_number,
        c.name AS campus_name,
        CASE
          WHEN qc.id IS NOT NULL AND NOW() BETWEEN v.start_time AND v.end_time THEN 'Active'
          WHEN qc.id IS NOT NULL THEN 'Inactive'
          ELSE 'Not Generated'
        END AS qr_status,
        v.count AS qr_validity_count
      FROM study_session ss
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      LEFT JOIN room r ON r.id = ss.room_id
      LEFT JOIN campus c ON c.id = r.campus_id
      LEFT JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      LEFT JOIN qr_code qc ON qc.id = qrss.qr_code_id
      LEFT JOIN validity v ON v.qr_code_id = qc.id AND NOW() BETWEEN v.start_time AND v.end_time
      WHERE ss.id = ?
      LIMIT 1
    `;

    const [sessionDetails] = await rawQuery<{
      subject_name: string;
      subject_code: string;
      session_type: string;
      start_time: string;
      end_time: string;
      day_of_week: string;
      room_number: string | null;
      room_name: string | null;
      building_number: string | null;
      campus_name: string | null;
      qr_status: string;
      qr_validity_count: number | null;
    }>(detailsSql, [studySessionId]);

    if (!sessionDetails) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Session details retrieved successfully",
      data: {
        subject_name: sessionDetails.subject_name,
        subject_code: sessionDetails.subject_code,
        session_type: sessionDetails.session_type,
        start_time: sessionDetails.start_time,
        end_time: sessionDetails.end_time,
        day_of_week: sessionDetails.day_of_week,
        room_name: sessionDetails.room_name || "TBD",
        room_number: sessionDetails.room_number || "TBD",
        building_name: sessionDetails.building_number || "TBD",
        campus_name: sessionDetails.campus_name || "TBD",
        qr_status: sessionDetails.qr_status,
        qr_validity_count: sessionDetails.qr_validity_count,
      },
    });
  } catch (error: unknown) {
    console.error("Session details API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
