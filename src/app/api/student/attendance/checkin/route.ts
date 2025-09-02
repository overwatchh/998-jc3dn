import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { z } from "zod";
import { headers } from "next/headers";
/**
 * @openapi
 * /api/student/attendance/checkin:
 *   post:
 *     tags:
 *       - Student
 *     summary: Student checks in using QR code
 *     description: Allows a student to check in to a study session using a valid QR code and their current location.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_code_id
 *               - lat
 *               - long
 *             properties:
 *               qr_code_id:
 *                 type: integer
 *                 description: The numeric QR code identifier
 *               lat:
 *                 type: number
 *                 description: Student's latitude when checking in
 *               long:
 *                 type: number
 *                 description: Student's longitude when checking in
 *     responses:
 *       200:
 *         description: Check-in successful
 *       400:
 *         description: Invalid request or already checked in
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Check-in not allowed (e.g., not enrolled, invalid QR code)
 *       404:
 *         description: QR code not found or expired
 */
type QrSessionRow = {
  qr_code_study_session_id: number;
  study_session_id: number;
  week_number: number;
  type: "lecture" | "lab" | "tutorial";
  subject_id: number;
  subject_code: string;
  subject_name: string;
  room_id: number | null;
  room_latitude: number | null;
  room_longitude: number | null;
  valid_radius: number | null;
};

type ValidityRow = {
  count: number;
  start_time: string; // DATETIME
  end_time: string; // DATETIME
  id: number;
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const studentId = session.user.id;
  const body = await req.json();

  const schema = z.object({
    qr_code_id: z.number(),
    lat: z.number(),
    long: z.number(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body payload" },
      { status: 400 }
    );
  }

  const { qr_code_id, lat, long } = parsed.data;

  // Step 1: From qr_code_id, figure out study session, week, subject, and whether the student is allowed ---
  const [qrRow] = await rawQuery<QrSessionRow>(
    `
    SELECT
      qrss.id AS qr_code_study_session_id,
      qrss.study_session_id,
      qrss.week_number,
      ss.type,
      sss.subject_id,
      subj.code AS subject_code,
      subj.name AS subject_name,
      ss.room_id,
      r.latitude AS room_latitude,
      r.longitude AS room_longitude,
      qc.valid_radius
    FROM qr_code_study_session qrss
    JOIN study_session ss           ON ss.id = qrss.study_session_id
    JOIN subject_study_session sss  ON sss.study_session_id = ss.id
    JOIN subject subj               ON subj.id = sss.subject_id
    JOIN qr_code qc                 ON qc.id = qrss.qr_code_id
    LEFT JOIN room r                ON r.id = ss.room_id
    WHERE qc.id = ?
    `,
    [qr_code_id]
  );

  const studySessionDetails = {
    subject_code: qrRow.subject_code,
    subject_name: qrRow.subject_name,
    study_session_type: qrRow.type,
    week_number: qrRow.week_number,
    study_session_id: qrRow.study_session_id,
  };

  if (!qrRow) {
    return NextResponse.json({ message: "Invalid QR code" }, { status: 404 });
  }

  // Determine allowance based on session type
  let allowed = false;
  if (qrRow.type === "lecture") {
    const [enrol] = await rawQuery<{ one: 1 }>(
      `
      SELECT 1 AS one
      FROM enrolment
      WHERE student_id = ? AND subject_id = ?
      `,
      [studentId, qrRow.subject_id]
    );
    allowed = !!enrol;
  } else {
    const [inSession] = await rawQuery<{ one: 1 }>(
      `
      SELECT 1 AS one
      FROM student_study_session
      WHERE student_id = ? AND study_session_id = ?
      `,
      [studentId, qrRow.study_session_id]
    );
    allowed = !!inSession;
  }

  if (!allowed) {
    return NextResponse.json(
      {
        message: `You are not allowed to check (not enrolled for this session).`,
        ...studySessionDetails,
      },
      { status: 403 }
    );
  }

  // Step 2: Verify the QR code is valid right now using its validity windows ---
  const windows = await rawQuery<ValidityRow>(
    `
    SELECT v.start_time, v.end_time, v.id, v.count
    FROM validity v
    JOIN qr_code qc ON qc.id = v.qr_code_id
    WHERE qc.id = ?
    ORDER BY v.start_time ASC
    `,
    [qr_code_id]
  );

  if (!windows || windows.length === 0) {
    return NextResponse.json(
      { message: "No validity window configured for this QR code." },
      { status: 404 }
    );
  }
  // set currentWindow to second window if there are two windows
  // default to first window if only one window
  const currentWindow: ValidityRow =
    windows.length === 1 ? windows[0] : windows[1];
  const now = new Date();
  const validStart = new Date(currentWindow.start_time);
  const validEnd = new Date(currentWindow.end_time);
  const isValidTime = now >= validStart && now <= validEnd;

  if (!isValidTime) {
    const startTime = new Date(currentWindow.start_time)
      .toLocaleString("en-GB", { hour12: false }) // local zone
      .replace(",", "");

    const endTime = new Date(currentWindow.end_time)
      .toLocaleString("en-GB", { hour12: false }) // local zone
      .replace(",", "");
    return NextResponse.json(
      {
        message: `You are not within the valid check-in time.`,
        ...studySessionDetails,
        start_time: startTime,
        end_time: endTime,
      },
      { status: 403 }
    );
  }

  // Step 3: Prevent duplicate check-in for this validity window ---
  // NOTE: The current schema PK (student_id, qr_code_study_session_id) allows only ONE total check-in per QR+session+student.
  // We still guard "per window" logically here, but a second window check-in will also be blocked by the PK.
  const [dupInWindow] = await rawQuery<{ checkin_time: number }>(
    `
    SELECT checkin_time
    FROM checkin
    WHERE student_id = ?
      AND qr_code_study_session_id = ?
      AND validity_id = ?      
    `,
    [studentId, qrRow.qr_code_study_session_id, currentWindow.id]
  );

  if (dupInWindow) {
    return NextResponse.json(
      {
        message: "Already checked in",
        ...studySessionDetails,
        checkin_time: new Date(dupInWindow.checkin_time)
          .toLocaleString("en-GB", { hour12: false }) // local zone
          .replace(",", ""),
      },
      { status: 400 }
    );
  }

  // Step 4: Insert check-in
  await rawQuery(
    `
    INSERT INTO checkin
      (student_id, qr_code_study_session_id, validity_id, checkin_time, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      studentId,
      qrRow.qr_code_study_session_id,
      currentWindow.id,
      now,
      lat,
      long,
    ]
  );

  return NextResponse.json({
    message: "Check-in successfully",
    ...studySessionDetails,
    checkin_time: now
      .toLocaleString("en-GB", { hour12: false }) // local zone
      .replace(",", ""),
  });
}
