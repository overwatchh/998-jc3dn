import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";
// Replace with your DB access method (e.g., mysql2)
import QRCode from "qrcode";

/**
 * @openapi
 * /api/lecturer/study-session/{id}/qr/{qr_code_id}:
 *   get:
 *     tags:
 *       - Lecturer
 *     summary: Get QR code base64 data for a study session
 *     description: >
 *       Retrieves QR code information for a specific study session and QR code ID.
 *       The response includes the QR image (base64 Data URL), the associated study session,
 *       week number, and the validity window.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the study session
 *       - in: path
 *         name: qr_code_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the QR code
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Generate QR successfully
 *                 qr_url:
 *                   type: string
 *                   description: QR code as a base64-encoded Data URL
 *                 study_session_id:
 *                   type: integer
 *                   example: 1
 *                 week_number:
 *                   type: integer
 *                   example: 1
 *                 valid_until:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-25T13:34:36.698Z
 *       404:
 *         description: QR code not found for the specified study session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: QR code not found for this study session
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */
const APP_URL = process.env.BASE_URL!;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; qr_code_id: string }> }
) {
  try {
    const { id, qr_code_id } = await context.params;
    const studySessionId = parseInt(id, 10);
    const qrId = parseInt(qr_code_id, 10);

    const redirect_path = "/scan";

    // Prefer the currently active validity window, otherwise use the latest end_time
    const activeSql = `
      SELECT 
        qrs.study_session_id,
        qrs.week_number,
        v.end_time AS valid_until
      FROM qr_code_study_session qrs
      JOIN qr_code qc ON qrs.qr_code_id = qc.id
      JOIN validity v ON v.qr_code_id = qc.id
      WHERE qrs.study_session_id = ? AND qc.id = ?
        AND NOW() BETWEEN v.start_time AND v.end_time
      ORDER BY v.count DESC
      LIMIT 1
    `;
    const fallbackSql = `
      SELECT 
        qrs.study_session_id,
        qrs.week_number,
        v.end_time AS valid_until
      FROM qr_code_study_session qrs
      JOIN qr_code qc ON qrs.qr_code_id = qc.id
      JOIN validity v ON v.qr_code_id = qc.id
      WHERE qrs.study_session_id = ? AND qc.id = ?
      ORDER BY v.end_time DESC
      LIMIT 1
    `;

    let rows = await rawQuery<{
      study_session_id: number;
      week_number: number;
      valid_until: string;
    }>(activeSql, [studySessionId, qrId]);

    if (rows.length === 0) {
      rows = await rawQuery(activeSql.replace("ORDER BY v.count DESC", "ORDER BY v.end_time DESC"), [studySessionId, qrId]);
    }

    if (rows.length === 0) {
      rows = await rawQuery(fallbackSql, [studySessionId, qrId]);
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "QR code not found for this study session" },
        { status: 404 }
      );
    }

    const { study_session_id, week_number, valid_until } = rows[0];

    // Build QR url
    const qrUrl = `${APP_URL}${redirect_path}?qr_code_id=${qrId}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);

    return NextResponse.json({
      message: "Generate QR successfully",
      qr_url: qrDataUrl,
      study_session_id,
      week_number,
      valid_until,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
