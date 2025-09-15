/**
 * @openapi
 * /api/lecturer/study-session/{id}/rooms:
 *   get:
 *     tags: [Lecturer]
 *     summary: List rooms for a study session
 *     description: Returns the room(s) associated with the specified study session. Lecturer must be assigned to this study session.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study session ID
 *     responses:
 *       '200':
 *         description: A list of rooms for the study session.
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
 *                       id:
 *                         type: integer
 *                       building_number:
 *                         type: string
 *                       room_number:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       latitude:
 *                         type: string
 *                         nullable: true
 *                       longitude:
 *                         type: string
 *                         nullable: true
 *                       campus_id:
 *                         type: integer
 *                       campus_name:
 *                         type: string
 *       '400':
 *         description: Invalid study session id.
 *       '401':
 *         description: Not authenticated.
 *       '403':
 *         description: Not authorized or not assigned to study session.
 *       '404':
 *         description: Study session not found.
 *       '500':
 *         description: Server error.
 */
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { ApiArrayResponse } from "@/types/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type RoomRow = {
  id: number;
  building_number: string;
  room_number: string;
  description: string | null;
  latitude: string | null; // DECIMAL(10,7) returned as string
  longitude: string | null; // DECIMAL(10,7) returned as string
  campus_id: number;
  campus_name: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiArrayResponse<RoomRow[]> | { message: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  }
  if (session.user.role !== "lecturer") {
    return NextResponse.json(
      { message: "Forbidden: Only lecturers can access this." },
      { status: 403 }
    );
  }

  const studySessionId = Number(params.id);
  if (!Number.isInteger(studySessionId) || studySessionId <= 0) {
    return NextResponse.json(
      { message: "Invalid study session id" },
      { status: 400 }
    );
  }

  try {
    // 1) Ensure lecturer is assigned to this study session
    const checkSql = `
      SELECT 1
      FROM lecturer_study_session lss
      WHERE lss.lecturer_id = ? AND lss.study_session_id = ?
      LIMIT 1
    `;
    const [check] = await rawQuery<{ 1: number }>(checkSql, [
      session.user.id,
      studySessionId,
    ]);
    if (!check) {
      return NextResponse.json(
        { message: "Forbidden: Lecturer not assigned to this study session" },
        { status: 403 }
      );
    }

    // 2) Return the room linked to the study session
    const sql = `
      SELECT
        r.id,
        r.building_number,
        r.room_number,
        r.description,
        r.latitude,
        r.longitude,
        r.campus_id,
        c.name AS campus_name
      FROM study_session ss
      JOIN room r ON r.id = ss.room_id
      JOIN campus c ON c.id = r.campus_id
      WHERE ss.id = ?
      LIMIT 1
    `;
    const rows = await rawQuery<RoomRow>(sql, [studySessionId]);
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Study session not found" },
        { status: 404 }
      );
    }

    const response: ApiArrayResponse<RoomRow[]> = {
      message: "Fetched study session rooms successfully",
      count: rows.length,
      data: rows,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET_STUDY_SESSION_ROOMS]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
