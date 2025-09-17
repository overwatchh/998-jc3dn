/**
 * @openapi
 * /api/lecturer/rooms:
 *   get:
 *     tags: [Lecturer]
 *     summary: List all rooms
 *     description: Returns every room across campuses. Requires a logged-in Lecturer or Admin.
 *     responses:
 *       '200':
 *         description: A list of rooms.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *       '401':
 *         description: Not authenticated.
 *       '403':
 *         description: Not authorized.
 *       '500':
 *         description: Server error.
 */
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { ApiArrayResponse } from "@/types/api";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type RoomRow = {
  id: number;
  building_number: string;
  room_number: string;
  description: string | null;
  latitude: string | null; // DECIMAL comes back as string
  longitude: string | null; // DECIMAL comes back as string
  campus_id: number;
  campus_name: string;
};

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  }
  // ensure proper user role
  if (session.user.role !== "lecturer") {
    return NextResponse.json(
      { message: "Forbidden: Only lecturers can access this." },
      { status: 403 }
    );
  }
  try {
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
      FROM room r
      INNER JOIN campus c ON c.id = r.campus_id
      ORDER BY c.name, r.building_number, r.room_number
    `;
    const rooms = await rawQuery<RoomRow>(sql);
    const response: ApiArrayResponse<RoomRow[]> = {
      message: "Fetched rooms successfully",
      count: rooms.length,
      data: rooms,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET_LECTURER_ROOMS]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
