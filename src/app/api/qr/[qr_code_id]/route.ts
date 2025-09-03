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
        const sql = `
      SELECT COUNT(*) AS validity_count
      FROM validity
      WHERE qr_code_id = ?
    `;
        const [result] = await rawQuery<{ validity_count: number }>(sql, [qrId]);
        return NextResponse.json({
            message: "Fetched QR info successfully",
            validity_count: result?.validity_count ?? 0,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}