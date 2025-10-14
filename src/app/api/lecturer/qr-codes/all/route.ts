import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Type definitions for query results
interface StudySession {
  study_session_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  session_type: string;
  subject_name: string;
  subject_code: string;
}

interface QrCodeWithValidity {
  qr_code_id: number;
  valid_radius: number;
  createdAt: string;
  week_number: number;
  validity_id: number | null;
  count: number | null;
  start_time: string | null;
  end_time: string | null;
}

/**
 * @openapi
 * /api/lecturer/qr-codes/all:
 *   get:
 *     tags:
 *       - Lecturer
 *     summary: Get all QR codes for all study sessions for the current lecturer
 *     description: |
 *       Retrieves all QR codes created for all study sessions that the current lecturer is assigned to.
 *       This includes QR codes with their validity windows for attendance tracking.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved QR codes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully retrieved QR codes"
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       study_session_id:
 *                         type: integer
 *                         example: 123
 *                       qr_codes:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/QrCodeWithValidities'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    // Step 1: Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const lecturerId = session.user.id;

    // Step 2: Get all study sessions for this lecturer
    const sessionsQuery = `
      SELECT DISTINCT ss.id as study_session_id, ss.day_of_week, ss.start_time, ss.end_time,
             ss.type as session_type, s.name as subject_name, s.code as subject_code
      FROM study_session ss
      INNER JOIN subject_study_session sss ON ss.id = sss.study_session_id
      INNER JOIN subject s ON sss.subject_id = s.id
      INNER JOIN lecturer_study_session lss ON ss.id = lss.study_session_id
      WHERE lss.lecturer_id = ?
      ORDER BY ss.day_of_week, ss.start_time
    `;

    const sessions = await rawQuery<StudySession>(sessionsQuery, [lecturerId]);

    if (sessions.length === 0) {
      return NextResponse.json({
        message: "No study sessions found for this lecturer",
        count: 0,
        data: [],
      });
    }

    // Step 3: For each study session, get all QR codes with their validity windows
    const result = [];

    for (const session of sessions) {
      const qrCodesQuery = `
        SELECT qr.id as qr_code_id, qr.valid_radius, qr.createdAt, qcss.week_number,
               v.id as validity_id, v.count, v.start_time, v.end_time
        FROM qr_code qr
        INNER JOIN qr_code_study_session qcss ON qr.id = qcss.qr_code_id
        LEFT JOIN validity v ON qr.id = v.qr_code_id
        WHERE qcss.study_session_id = ?
        ORDER BY qcss.week_number, v.count
      `;

      const qrCodes = await rawQuery<QrCodeWithValidity>(qrCodesQuery, [
        session.study_session_id,
      ]);

      // Group QR codes by qr_code_id and organize validities
      const qrCodesMap = new Map();

      for (const qr of qrCodes) {
        if (!qrCodesMap.has(qr.qr_code_id)) {
          qrCodesMap.set(qr.qr_code_id, {
            qr_code_id: qr.qr_code_id,
            valid_radius: qr.valid_radius,
            createdAt: qr.createdAt,
            week_number: qr.week_number,
            validities: [],
          });
        }

        if (qr.validity_id) {
          qrCodesMap.get(qr.qr_code_id).validities.push({
            validity_id: qr.validity_id,
            count: qr.count,
            start_time: qr.start_time,
            end_time: qr.end_time,
          });
        }
      }

      const qrCodesArray = Array.from(qrCodesMap.values());

      // Sort validities within each QR code by count
      for (const qrCode of qrCodesArray) {
        qrCode.validities.sort((a, b) => a.count - b.count);
      }

      result.push({
        study_session_id: session.study_session_id,
        day_of_week: session.day_of_week,
        start_time: session.start_time,
        end_time: session.end_time,
        subject_name: session.subject_name,
        subject_code: session.subject_code,
        session_type: session.session_type,
        qr_codes: qrCodesArray,
      });
    }

    return NextResponse.json({
      message: "Successfully retrieved QR codes",
      count: result.length,
      data: result,
    });
  } catch (err) {
    console.error("GET /lecturer/qr-codes/all error:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
