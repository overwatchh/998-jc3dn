import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/server/auth"
import { rawQuery } from "@/lib/server/query" // Replace with your DB access method (e.g., mysql2)
import crypto from "crypto"
import QRCode from "qrcode"
import { headers } from "next/headers"
import { RawCourseSessionRow } from "@/types/course"
import { GenerateQrRequestBody, GenerateQrResponse } from "@/types/qr-code"

/**
 * @openapi
 * /api/lecturer/session/{id}/generate-qr:
 *   post:
 *     tags:
 *       - Lecturer
 *     summary: Generate a QR code for a course session
 *     description: Generates a JWT-based QR code for a lecturer's course session, tied to a specific week number.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the course session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - week_number
 *             properties:
 *               week_number:
 *                 type: integer
 *                 example: 4
 *                 description: The teaching week number for which the QR code is being generated
 *               redirect_url:
 *                 type: string
 *                 example: /scan
 *                 description: Relative URL to redirect after scanning the QR code (optional)
 *                 default: /scan
 *               radius:
 *                 type: number
 *                 example: 100
 *                 description: The distance between the building and student's location required when the student checking in
 *                 default: 100
 *     responses:
 *       200:
 *         description: QR code successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The signed JWT token
 *                 qr_url:
 *                   type: string
 *                   description: Base64-encoded QR image URL
 *                 week_number:
 *                   type: integer
 *                   description: The teaching week number
 *                 valid_until:
 *                   type: string
 *                   format: date-time
 *                   description: Expiry date-time for the QR code
 *       400:
 *         description: Missing or invalid `week_number`
 *       401:
 *         description: Unauthorized – user not signed in or not a lecturer
 *       403:
 *         description: Lecturer is not assigned to the session
 *       409:
 *         description: QR code already exists for this session and week.
 *       500:
 *         description: Internal server error
 */

const APP_URL = process.env.BASE_URL!

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const courseSessionId = parseInt(id) // lecture or lab id
    const body = (await req.json()) as GenerateQrRequestBody
    const { week_number, redirect_url, radius } = body
    if (!week_number || typeof week_number !== "number") {
      return NextResponse.json(
        { message: "week_number is required and must be a number" },
        { status: 400 }
      )
    }

    // Step 1: Authenticate
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const lecturerId = session.user.id
    // Step 2: Check if lecturer is assigned to this session
    const sql = `
     SELECT cs.id AS course_session_id, cs.course_id
      FROM course_sessions cs
      JOIN course_lecturers cl ON cl.course_id = cs.course_id
      WHERE cs.id = ? AND cl.lecturer_id = ?
    `
    const [courseSession] = await rawQuery<RawCourseSessionRow>(sql, [
      courseSessionId,
      lecturerId,
    ])
    if (!courseSession) {
      return NextResponse.json(
        { message: "You are not assigned to this course session" },
        { status: 403 }
      )
    }
    // Step 3: Generate token
    // Generate short secure token
    const token = crypto.randomBytes(6).toString("hex") // 12-char token

    // Step 4: Generate QR Code
    const redirectPath = redirect_url || "/scan"
    const qrUrl = `${APP_URL}${redirectPath}?token=${token}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl)
    // Step 5: Store in DB
    const now = new Date()
    const validUntil = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes

    const saveQRSql = `
    INSERT INTO session_qr_codes (course_session_id, qr_code, generated_at, valid_until, week_number, radius)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    await rawQuery(saveQRSql, [
      courseSession.course_session_id,
      token,
      now,
      validUntil,
      week_number,
      radius ?? 100,
    ])
    const response: GenerateQrResponse = {
      message: "Generate Qr sucessfully",
      qr_url: qrDataUrl,
      course_id: courseSession.course_id,
      course_session_id: courseSession.course_session_id,
      week_number,
      valid_until: validUntil.toISOString(),
    }
    return NextResponse.json(response)
  } catch (err: any) {
    if (err.message === "DUPLICATE_ENTRY") {
      return NextResponse.json(
        { message: "QR code already exists for this session and week." },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
