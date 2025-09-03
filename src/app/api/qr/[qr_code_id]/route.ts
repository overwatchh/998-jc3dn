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
 *         description: Successfully fetched validity window count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fetched QR info successfully
 *                 validity_count:
 *                   type: integer
 *                   example: 2
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

export async function GET(req: NextRequest,
    context: { params: Promise<{ qr_code_id: string }> }) {
    try {
        const { qr_code_id } = await context.params;
        const qrId = parseInt(qr_code_id, 10);
        // Fetch validity count and optionally room location + radius
        const sql = `
      SELECT 
        (SELECT COUNT(*) FROM validity v WHERE v.qr_code_id = qc.id) AS validity_count,
        r.latitude AS latitude,
        r.longitude AS longitude,
        qc.valid_radius AS radius,
        r.building_number AS building_number,
        r.room_number AS room_number
      FROM qr_code qc
      LEFT JOIN qr_code_study_session qcss ON qcss.qr_code_id = qc.id
      LEFT JOIN study_session ss ON ss.id = qcss.study_session_id
      LEFT JOIN room r ON r.id = ss.room_id
      WHERE qc.id = ?
      LIMIT 1
    `;
        const [result] = await rawQuery<{ validity_count: number; latitude: number | null; longitude: number | null; radius: number | null; building_number: string | null; room_number: string | null }>(sql, [qrId]);
        return NextResponse.json({
            message: "Fetched QR info successfully",
            validity_count: result?.validity_count ?? 0,
            location: result && result.latitude !== null && result.longitude !== null ? {
              latitude: Number(result.latitude),
              longitude: Number(result.longitude),
              radius: result.radius !== null ? Number(result.radius) : null,
              building_number: result.building_number ?? null,
              room_number: result.room_number ?? null,
            } : null,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}