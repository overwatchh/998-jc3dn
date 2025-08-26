import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { haversineDistance } from "@/lib/server/util";
import {
  AttendanceCheckinRequestBody,
  QRCodeInfoRow,
  RowLocation,
} from "@/types/qr-code";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * @openapi
 * /api/student/attendance/checkin:
 *   post:
 *     tags:
 *       - Student
 *     summary: Student checks in using QR code
 *     description: Allows a student to check in to a course session using a valid QR code and their current location.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_code
 *               - lat
 *               - long
 *             properties:
 *               qr_code:
 *                 type: string
 *                 description: The unique token from the QR code
 *               lat:
 *                 type: number
 *                 description: Student's latitude when checking in
 *               long:
 *                 type: number
 *                 description: Student's longitude when checking in
 *               verify_distance:
 *                 type: boolean
 *                 description: Verify distance between student's location and lecture/lab room's location. Maybe disabled for online student.
 *                 default: true
 *     responses:
 *       200:
 *         description: Check-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Check-in not allowed (e.g., not enrolled, invalid QR code)
 *       404:
 *         description: QR code not found or expired
 */

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const studentId = session.user.id;
  const body = (await req.json()) as AttendanceCheckinRequestBody;

  const schema = z.object({
    qr_code: z.string(),
    lat: z.number(),
    long: z.number(),
    verify_distance: z.boolean().optional().default(true),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body payload" },
      { status: 400 }
    );
  }

  const { qr_code, lat, long, verify_distance } = parsed.data;

  // 1. Get session_qr_code and course_session info
  const [qrCodeRow] = await rawQuery<QRCodeInfoRow>(
    `
    SELECT 
      sqc.id AS qr_code_id,
      sqc.course_session_id,
      sqc.generated_at,
      sqc.valid_until,
      sqc.radius,
      cs.course_id,
      cs.location_id
    FROM session_qr_codes sqc
    JOIN course_sessions cs ON cs.id = sqc.course_session_id
    WHERE sqc.qr_code = ?
    `,
    [qr_code]
  );

  if (!qrCodeRow) {
    return NextResponse.json({ message: "Invalid QR code" }, { status: 404 });
  }

  const now = new Date();
  const validFrom = new Date(qrCodeRow.generated_at);
  const validUntil = new Date(qrCodeRow.valid_until);

  if (now < validFrom || now > validUntil) {
    return NextResponse.json(
      { message: "QR code is not valid at this time" },
      { status: 403 }
    );
  }

  // 2. Check if student is enrolled in the course
  const [enrollment] = await rawQuery(
    `
    SELECT 1 FROM enrollments
    WHERE student_id = ? AND course_id = ?
    `,
    [studentId, qrCodeRow.course_id]
  );

  if (!enrollment) {
    return NextResponse.json(
      { message: "Student not enrolled in this course" },
      { status: 403 }
    );
  }

  // 3. Prevent duplicate check-in
  const [existing] = await rawQuery(
    `
    SELECT 1 FROM attendance
    WHERE student_id = ? AND session_id = ? AND qr_code_id = ?
    `,
    [studentId, qrCodeRow.course_session_id, qrCodeRow.qr_code_id]
  );

  if (existing) {
    return NextResponse.json(
      { message: "Already checked in" },
      { status: 400 }
    );
  }

  // 4. check location based on lat and long
  if (verify_distance) {
    //  Get location lat/long
    const [building] = await rawQuery<RowLocation>(
      `SELECT latitude, longitude FROM locations WHERE id = ?`,
      [qrCodeRow.location_id]
    );

    if (!building) {
      return NextResponse.json(
        { message: "Course session location not found" },
        { status: 404 }
      );
    }

    // Check radius (haversine distance)
    const distance = haversineDistance(
      building.latitude,
      building.longitude,
      lat, // student's lat
      long // student's long
    );

    const allowedRadius = qrCodeRow.radius ?? 100;

    if (distance > allowedRadius) {
      return NextResponse.json(
        {
          message: `You are ${distance} meters far away .You must be within ${allowedRadius} meters to check in`,
        },
        { status: 403 }
      );
    }
  }
  // 5. Insert check-in record
  await rawQuery(
    `
    INSERT INTO attendance (student_id, session_id, qr_code_id, checkin_time, latitude, longitude, verify_distance )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      studentId,
      qrCodeRow.course_session_id,
      qrCodeRow.qr_code_id,
      now,
      lat,
      long,
      verify_distance,
    ]
  );

  return NextResponse.json({
    message: `Check-in successful.`,
  });
}
