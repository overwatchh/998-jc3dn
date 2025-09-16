/**
 * @openapi
 * /api/qr/{qr_code_id}:
 *   get:
 *     tags:
 *       - Common
 *     summary: Get validity window count for a QR code
 *     description: Returns the number of validity windows associated with the given QR code.
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
import { rawQuery } from "@/lib/server/query";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ qr_code_id: string }> }
) {
  try {
    const { qr_code_id } = await context.params;
    const qrId = parseInt(qr_code_id, 10);
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
    const [result] = await rawQuery<{
      validate_geo: boolean;
      latitude: number | null;
      longitude: number | null;
      radius: number | null;
      building_number: string | null;
      room_number: string | null;
      room_id:number;
    }>(sql, [qrId]);
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
    return NextResponse.json({
      message: "Fetched QR info successfully",
      validate_geo: result.validate_geo ? true : false,
      validities: validities.map(v => ({
        id: v.validity_id,
        count: v.count,
        start_time: v.start_time,
        end_time: v.end_time,
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
            room_id:result.room_id ?? null,
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
