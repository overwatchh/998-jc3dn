/**
 * @openapi
 * /api/qr/{qr_code_id}:
 *   get:
 *     tags:
 *       - Common
 *     summary: Get QR code validity windows and location/geofence info
 *     description: |
 *       Returns information about a QR code including its validity windows,
 *       whether geolocation validation is enabled, the geofence radius, and
 *       room/location metadata. Also includes which validity window is
 *       currently active (if any).
 *     parameters:
 *       - name: qr_code_id
 *         in: path
 *         required: true
 *         description: ID of the QR code
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: QR code information fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fetched QR info successfully
 *                 validate_geo:
 *                   type: boolean
 *                   description: Indicates whether geolocation validation is required
 *                   example: true
 *                 validities:
 *                   type: array
 *                   description: List of validity windows for the QR code
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       count:
 *                         type: integer
 *                         description: |
 *                           Indicates which validity window:
 *                           - 1 → first validity window
 *                           - 2 → second validity window
 *                         example: 1
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-11T03:01:00.000Z"
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-11T04:11:00.000Z"
 *                 validity_count:
 *                   type: integer
 *                   description: |
 *                     Current request validity status:
 *                     - 1 → within first validity window
 *                     - 2 → within second validity window
 *                     - 0 → not in any validity window
 *                   example: 0
 *                 radius:
 *                   type: integer
 *                   description: Allowed radius in meters for geolocation validation
 *                   example: 150
 *                 location:
 *                   type: object
 *                   description: Room and geolocation details
 *                   properties:
 *                     latitude:
 *                       type: number
 *                       format: double
 *                       example: -34.40582005010667
 *                     longitude:
 *                       type: number
 *                       format: double
 *                       example: 150.88081766767468
 *                     building_number:
 *                       type: string
 *                       example: "35"
 *                     room_number:
 *                       type: string
 *                       example: "103"
 *                     room_id:
 *                       type: integer
 *                       example: 9
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ qr_code_id: string }> }
) {
  try {
    const { qr_code_id } = await context.params;
    const qrId = parseInt(qr_code_id, 10);

    // Get student session for check-in status (optional - could be unauthenticated access)
    let studentId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.role === "student") {
        studentId = session.user.id;
      }
    } catch {
      // Allow unauthenticated access for basic QR info
    }

    // Fetch validity count and optionally room location + radius
    const sql = `
      SELECT         
        r.latitude AS latitude,
        r.longitude AS longitude,
        qc.valid_radius AS radius,
        qc.validate_geo,        
        r.building_number AS building_number,
        r.room_number AS room_number,
        r.id AS room_id
      FROM qr_code qc
      LEFT JOIN qr_code_study_session qcss ON qcss.qr_code_id = qc.id
      LEFT JOIN study_session ss ON ss.id = qcss.study_session_id
      LEFT JOIN room r ON r.id = qc.valid_room_id
      WHERE qc.id = ?
      LIMIT 1
    `;
    const results = await rawQuery<{
      validate_geo: boolean;
      latitude: number | null;
      longitude: number | null;
      radius: number | null;
      building_number: string | null;
      room_number: string | null;
      room_id: number;
    }>(sql, [qrId]);

    // If no QR code found, return NOT_GENERATED status
    if (results.length === 0) {
      return NextResponse.json({
        message: "Fetched QR info successfully",
        validate_geo: false,
        validities: [],
        validity_count: -1, // NOT_GENERATED
        radius: null,
        location: null,
      });
    }

    const [result] = results;
    // query validites information
    const validitiesSql = `
        SELECT        
        v.id AS validity_id,
        v.count,
        start_time,
        end_time,
        (
          CASE
            WHEN EXISTS (
              SELECT 1 FROM validity vx
              WHERE vx.qr_code_id = v.qr_code_id
                AND vx.count = 1
                AND NOW() BETWEEN vx.start_time AND vx.end_time
            ) THEN 1
            WHEN EXISTS (
              SELECT 1 FROM validity vx
              WHERE vx.qr_code_id = v.qr_code_id
                AND vx.count = 2
                AND NOW() BETWEEN vx.start_time AND vx.end_time
            ) THEN 2
            ELSE 0
          END
        ) AS validity_count
      FROM validity v
      WHERE v.qr_code_id = ?
      ORDER BY v.count`;
    const validities = await rawQuery<{
      validity_id: number;
      count: number;
      start_time: string;
      end_time: string;
      validity_count: number;
    }>(validitiesSql, [qrId]);

    // Fetch student check-in status if authenticated
    let studentCheckins: { validity_id: number; checkin_time: string }[] = [];
    if (studentId && validities.length > 0) {
      // Get qr_code_study_session_id first
      const qrSessionSql = `
        SELECT id FROM qr_code_study_session 
        WHERE qr_code_id = ?
        LIMIT 1
      `;
      const qrSessionResult = await rawQuery<{ id: number }>(qrSessionSql, [
        qrId,
      ]);

      if (qrSessionResult.length > 0) {
        const qrSessionId = qrSessionResult[0].id;
        const validityIds = validities.map(v => v.validity_id);
        const placeholders = validityIds.map(() => "?").join(", ");

        const checkinSql = `
          SELECT validity_id, checkin_time
          FROM checkin
          WHERE student_id = ?
            AND qr_code_study_session_id = ?
            AND validity_id IN (${placeholders})
        `;
        studentCheckins = await rawQuery<{
          validity_id: number;
          checkin_time: string;
        }>(checkinSql, [studentId, qrSessionId, ...validityIds]);
      }
    }
    // Create a map of validity_id to check-in status
    const checkinMap = new Map(
      studentCheckins.map(c => [c.validity_id, c.checkin_time])
    );

    return NextResponse.json({
      message: "Fetched QR info successfully",
      validate_geo: result.validate_geo ? true : false,
      validities: validities.map(v => ({
        id: v.validity_id,
        count: v.count,
        start_time: v.start_time,
        end_time: v.end_time,
        is_checked_in: checkinMap.has(v.validity_id),
        checkin_time: checkinMap.get(v.validity_id) || null,
      })),
      validity_count: validities.length > 0 ? validities[0].validity_count : 0,
      radius: result.radius !== null ? Number(result.radius) : null,
      location:
        result && result.latitude !== null && result.longitude !== null
          ? {
              latitude: Number(result.latitude),
              longitude: Number(result.longitude),
              building_number: result.building_number ?? null,
              room_number: result.room_number ?? null,
              room_id: result.room_id ?? null,
            }
          : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
