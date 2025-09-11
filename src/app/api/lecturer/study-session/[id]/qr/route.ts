/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import {
  GenerateQrRequestSchema,
  UpdateQrRequestSchema,
  GenerateQrResponse,
} from "@/types/qr-code";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// Replace with your DB access method (e.g., mysql2)
import QRCode from "qrcode";

/**
 * @openapi
 * /api/lecturer/study-session/{id}/qr:
 *   post:
 *     tags:
 *       - Lecturer
 *     summary: Generate a QR code for a study session
 *     description: |
 *       Allows a lecturer assigned to a study session to generate a QR code for student check-in.
 *       The QR code will be linked to the study session, valid for the specified week, and bound to one or two validity time windows.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the study session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - week_number
 *               - valid_room_id
 *               - radius
 *               - validities
 *             properties:
 *               week_number:
 *                 type: integer
 *                 description: The academic week number for the QR code.
 *                 example: 1
 *               radius:
 *                 type: number
 *                 description: Optional radius (in meters) for geolocation validation.
 *                 example: 100
 *               valid_room_id:
 *                 type: integer
 *                 description: ID of the room where the study session is held. Must exist in the `room` table.
 *                 example: 10
 *               validate_geo:
 *                 type: boolean
 *                 description: Whether to validate geolocation when scanning QR. Defaults to true.
 *                 example: true
 *               validities:
 *                 type: array
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: One or two validity windows (time ranges) for which the QR code is active.
 *                 items:
 *                   type: object
 *                   required:
 *                     - start_time
 *                     - end_time
 *                   properties:
 *                     start_time:
 *                       type: string
 *                       pattern: "^([01]\\d|2[0-3]):[0-5]\\d$"
 *                       description: Start time of the validity window in HH:MM 24-hour format.
 *                       example: "13:45"
 *                     end_time:
 *                       type: string
 *                       pattern: "^([01]\\d|2[0-3]):[0-5]\\d$"
 *                       description: End time of the validity window in HH:MM 24-hour format.
 *                       example: "15:45"
 *                 example:
 *                   - start_time: "13:45"
 *                     end_time: "14:15"
 *                   - start_time: "14:50"
 *                     end_time: "15:15"
 *     responses:
 *       200:
 *         description: QR code successfully generated.
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
 *                   format: uri
 *                   description: Data URL of the generated QR code image.
 *                 study_session_id:
 *                   type: integer
 *                   example: 42
 *                 week_number:
 *                   type: integer
 *                   example: 6
 *                 validities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-10T09:30:00.000Z"
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-10T11:30:00.000Z"
 *       400:
 *         description: Invalid request (schema validation failed or invalid room).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request
 *                 errors:
 *                   type: object
 *                   description: Detailed validation errors (if schema parsing failed).
 *       401:
 *         description: Unauthorized. User is not authenticated or not a lecturer.
 *       403:
 *         description: Lecturer is not assigned to the study session.
 *       404:
 *         description: Study session not found.
 *       409:
 *         description: QR code already exists for this study session and week.
 *       500:
 *         description: Internal server error.
 *
 *   get:
 *     tags:
 *       - Lecturer
 *     summary: Get QR codes for a study session
 *     description: Retrieves QR codes created for the study session (one per week) with their validity windows. Can be filtered by `week_number`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the study session
 *       - in: query
 *         name: week_number
 *         required: false
 *         schema:
 *           type: integer
 *         description: Optional week number to filter QR codes
 *     responses:
 *       200:
 *         description: List of QR codes for the study session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 study_session_id:
 *                   type: integer
 *                 qrs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       qr_code_id:
 *                         type: integer
 *                       qr_url:
 *                         type: string
 *                       week_number:
 *                         type: integer
 *                       valid_radius:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       validities:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             validity_id:
 *                               type: integer
 *                             count:
 *                               type: integer
 *                               description: 1 = first validity, 2 = second validity
 *                             start_time:
 *                               type: string
 *                               format: date-time
 *                             end_time:
 *                               type: string
 *                               format: date-time
 *       401:
 *         description: Unauthorized – user not signed in or not a lecturer
 *       403:
 *         description: Lecturer is not assigned to the session
 *       500:
 *         description: Internal server error
 *
 *   put:
 *     tags:
 *       - Lecturer
 *     summary: Update an existing QR code for a study session
 *     description: |
 *       Allows a lecturer assigned to a study session to update an existing QR code.
 *       The QR code must belong to the study session. The lecturer can modify the
 *       validity windows, room, geolocation validation, and radius.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the study session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_code_id
 *               - valid_room_id
 *               - validities
 *             properties:
 *               qr_code_id:
 *                 type: integer
 *                 description: The ID of the QR code to update (must belong to this study session).
 *                 example: 2
 *               radius:
 *                 type: number
 *                 description: Optional radius (in meters) for geolocation validation.
 *                 example: 150
 *               valid_room_id:
 *                 type: integer
 *                 description: ID of the room where the study session is held. Must exist in the `room` table.
 *                 example: 10
 *               validate_geo:
 *                 type: boolean
 *                 description: Whether to validate geolocation when scanning QR. Defaults to true.
 *                 example: true
 *               validities:
 *                 type: array
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: Exactly two validity windows (time ranges) for which the QR code is active.
 *                 items:
 *                   type: object
 *                   required:
 *                     - start_time
 *                     - end_time
 *                   properties:
 *                     start_time:
 *                       type: string
 *                       pattern: "^([01]\\d|2[0-3]):[0-5]\\d$"
 *                       description: Start time of the validity window in HH:MM 24-hour format.
 *                     end_time:
 *                       type: string
 *                       pattern: "^([01]\\d|2[0-3]):[0-5]\\d$"
 *                       description: End time of the validity window in HH:MM 24-hour format.
 *                 example:
 *                   - start_time: "09:30"
 *                     end_time: "09:45"
 *                   - start_time: "11:15"
 *                     end_time: "11:30"
 *           example:
 *             qr_code_id: 2
 *             radius: 150
 *             valid_room_id: 10
 *             validate_geo: true
 *             validities:
 *               - start_time: "13:50"
 *                 end_time: "14:10"
 *               - start_time: "14:55"
 *                 end_time: "15:05"
 *     responses:
 *       200:
 *         description: QR code successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: QR code updated successfully
 *       400:
 *         description: Invalid request (schema validation failed or invalid room).
 *       401:
 *         description: Unauthorized. User is not authenticated or not a lecturer.
 *       403:
 *         description: Lecturer is not assigned to the study session.
 *       404:
 *         description: QR code not found for this study session, or study session not found.
 *       500:
 *         description: Internal server error.
 */

const APP_URL = process.env.BASE_URL!;
const DOW_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};
function parseTimeToDate(baseDate: Date, hhmm: string) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return d;
}

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function nextOccurrenceOfWeekday(from: Date, weekdayIdx: number) {
  const diff = (weekdayIdx - from.getDay() + 7) % 7;
  return addDays(from, diff); // 0 means today, >0 means future day
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const studySessionId = parseInt(id); // study session id
    const json = await req.json();
    const parseResult = GenerateQrRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parseResult.error.format() },
        { status: 400 }
      );
    }
    const body = parseResult.data; // fully typed and validated

    const { week_number, radius, validities, validate_geo, valid_room_id } =
      body;

    // Step 1: Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = session.user.id;
    // Step 2a: Check if lecturer is assigned to this session
    const checkSql = `
      SELECT ss.id AS study_session_id
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      WHERE ss.id = ? AND lss.lecturer_id = ?
    `;

    const [studySessionRow] = await rawQuery<{ study_session_id: number }>(
      checkSql,
      [studySessionId, lecturerId]
    );
    if (!studySessionRow) {
      return NextResponse.json(
        { message: "You are not assigned to this course session" },
        { status: 403 }
      );
    }
    // 2b) Fetch session schedule info (used for validity window calculation)
    const sessionInfoSql = `
      SELECT day_of_week, start_time, end_time
      FROM study_session
      WHERE id = ?
      LIMIT 1
    `;
    const [sessionInfo] = await rawQuery<{
      day_of_week: string;
      start_time: string;
      end_time: string;
    }>(sessionInfoSql, [studySessionId]);

    if (!sessionInfo) {
      return NextResponse.json(
        { message: "Study session not found" },
        { status: 404 }
      );
    }

    const weekdayIdx =
      DOW_INDEX[String(sessionInfo.day_of_week || "").toLowerCase()];
    if (weekdayIdx == null) {
      return NextResponse.json(
        { message: `Invalid day_of_week: ${sessionInfo.day_of_week}` },
        { status: 500 }
      );
    }
    // Determine the calendar DATE for the requested week_number.
    // Strategy:
    //  - If there is an existing QR for this session with any week_number,
    //    use the earliest known week as a baseline, then offset by weeks.
    //  - Else, anchor on the next occurrence of the session's weekday from "now",
    //    and treat that as the requested week_number's date (so future weeks are consistent).
    const existingAnchorSql = `
      SELECT qcss.week_number, MIN(v.start_time) AS anchor_start
      FROM qr_code_study_session qcss
      JOIN validity v ON v.qr_code_id = qcss.qr_code_id
      WHERE qcss.study_session_id = ?
      GROUP BY qcss.week_number
      ORDER BY qcss.week_number ASC
      LIMIT 1
    `;
    const [anchor] = await rawQuery<{
      week_number: number;
      anchor_start: string; // DATETIME in DB
    }>(existingAnchorSql, [studySessionId]);

    let sessionDate: Date;
    if (anchor && anchor.anchor_start) {
      // Baseline from earliest existing week
      const baselineWeek = Number(anchor.week_number);
      const baselineDate = new Date(anchor.anchor_start); // includes date of that session's start_time
      const deltaWeeks = week_number - baselineWeek;
      sessionDate = addDays(baselineDate, deltaWeeks * 7);
      // Ensure weekday aligns (should already, but in case data was inconsistent)
      const adjust = (weekdayIdx - sessionDate.getDay() + 7) % 7;
      sessionDate = addDays(sessionDate, adjust);
    } else {
      // No prior QR exists: anchor on next occurrence of weekday from now
      const now = new Date();
      sessionDate = nextOccurrenceOfWeekday(now, weekdayIdx);
    }
    // Step 3: Create qr in DB
    // Query to check room existence
    const roomCheckSql = `SELECT id FROM room WHERE id = ? LIMIT 1`;
    const [roomRow] = await rawQuery<{ id: number }>(roomCheckSql, [
      valid_room_id,
    ]);

    if (!roomRow) {
      return NextResponse.json(
        { message: `Room with id ${valid_room_id} does not exist` },
        { status: 400 }
      );
    }
    // Create QR code record
    const createdAt = new Date();
    const validateGeoFlag =
    typeof validate_geo === "boolean" ? validate_geo : true;
    const insertQrSql = `
      INSERT INTO qr_code (createdAt, valid_radius, validate_geo, valid_room_id)
      VALUES (?, ?, ?, ?)
    `;
    const qrResult: any = await rawQuery(insertQrSql, [
      createdAt,
      radius,
      validateGeoFlag ? 1 : 0,
      valid_room_id,
    ]);
    const qrCodeId = qrResult.insertId;
    // Step 4: Generate QR URL
    const redirectPath = "/scan";
    const qrUrl = `${APP_URL}${redirectPath}?qr_code_id=${qrCodeId}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);
    // Build validity windows from HH:MM strings on sessionDate
    type ValidityWindow = { start_time: string; end_time: string };

    const windows: ValidityWindow[] = [];
    for (let i = 0; i < validities.length; i++) {
      const win = validities[i];
      const start = parseTimeToDate(sessionDate, win.start_time);
      const end = parseTimeToDate(sessionDate, win.end_time);

      if (end <= start) {
        return NextResponse.json(
          { message: `validities[${i}]: end_time must be after start_time` },
          { status: 400 }
        );
      }

      // Insert each window
      const insertValiditySql = `
    INSERT INTO validity (qr_code_id, count, start_time, end_time)
    VALUES (?, ?, ?, ?)
  `;
      await rawQuery(insertValiditySql, [qrCodeId, i + 1, start, end]);

      windows.push({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
    }

    // Insert into qr_code_study_session
    const insertMapSql = `
      INSERT INTO qr_code_study_session (study_session_id, qr_code_id, week_number)
      VALUES (?, ?, ?)
    `;
    try {
      await rawQuery(insertMapSql, [studySessionId, qrCodeId, week_number]);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { message: "QR code already exists for this session and week." },
          { status: 409 }
        );
      }
      throw err;
    }

    // Response
    const response: GenerateQrResponse = {
      message: "Generate QR successfully",
      qr_url: qrDataUrl,
      study_session_id: studySessionId,
      week_number,
      validities: windows,
    };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error(err);
    if (err.message === "DUPLICATE_ENTRY") {
      return NextResponse.json(
        { message: "QR code already exists for this session and week." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const studySessionId = parseInt(id, 10);
    // Get optional week_number from query params
    const url = new URL(req.url);
    const weekNumberParam = url.searchParams.get("week_number");
    const weekNumber = weekNumberParam ? Number(weekNumberParam) : undefined;

    // Step 1: Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const lecturerId = session.user.id;

    // Step 2: Check lecturer assignment
    const checkSql = `
      SELECT ss.id AS study_session_id
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      WHERE ss.id = ? AND lss.lecturer_id = ?
    `;
    const [studySessionRow] = await rawQuery<{ study_session_id: number }>(
      checkSql,
      [studySessionId, lecturerId]
    );
    if (!studySessionRow) {
      return NextResponse.json(
        { message: "You are not assigned to this study session" },
        { status: 403 }
      );
    }

    // Step 3: Fetch QR codes with validities
    const qrSqlBase = `
    SELECT 
      qrs.qr_code_id,      
      qc.valid_radius,
      qc.validate_geo,
      qc.createdAt,
      qrs.week_number,
      v.id AS validity_id,
      v.count,
      v.start_time,
      v.end_time
    FROM qr_code_study_session qrs
    JOIN qr_code qc ON qc.id = qrs.qr_code_id
    LEFT JOIN validity v ON v.qr_code_id = qc.id
    WHERE qrs.study_session_id = ?
  `;

    const values: (number | undefined)[] = [studySessionId];

    // Add optional week_number filter
    let qrSql = qrSqlBase;
    if (weekNumber !== undefined) {
      qrSql += " AND qrs.week_number = ?";
      values.push(weekNumber);
    }

    qrSql += " ORDER BY qc.createdAt DESC, v.count ASC";
    interface QrCodeWithValidity {
      qr_code_id: number;
      valid_radius: number | null;
      validate_geo: boolean;
      createdAt: string;
      week_number: number;
      validity_id: number;
      count: number;
      start_time: string;
      end_time: string;
    }
    const qrRows = await rawQuery<QrCodeWithValidity>(qrSql, values);

    // Step 4: Group by qr_code
    const qrMap: Record<
      number,
      {
        qr_code_id: number;
        valid_radius: number | null;
        validate_geo: boolean;
        createdAt: string;
        week_number: number;
        validities: {
          validity_id: number;
          count: number;
          start_time: string;
          end_time: string;
        }[];
      }
    > = {};

    for (const row of qrRows) {
      if (!qrMap[row.qr_code_id]) {
        qrMap[row.qr_code_id] = {
          qr_code_id: row.qr_code_id,
          valid_radius: Number(row.valid_radius),
          validate_geo: row.validate_geo ? true : false,
          createdAt: row.createdAt,
          week_number: row.week_number,
          validities: [],
        };
      }
      if (row.validity_id) {
        qrMap[row.qr_code_id].validities.push({
          validity_id: row.validity_id,
          count: row.count,
          start_time: row.start_time,
          end_time: row.end_time,
        });
      }
    }

    const qrs = Object.values(qrMap);
    const response = {
      message: "QR codes fetched successfully",
      study_session_id: studySessionId,
      count: qrs.length,
      data: Object.values(qrMap),
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("GET /qr error:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const studySessionId = parseInt(id);
    const json = await req.json();
    const parseResult = UpdateQrRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { qr_code_id, radius, validities, validate_geo, valid_room_id } =
      parseResult.data;

    // Step 1: Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = session.user.id;

    // Step 2: Check lecturer assignment
    const checkSql = `
      SELECT ss.id AS study_session_id
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      WHERE ss.id = ? AND lss.lecturer_id = ?
    `;
    const [studySessionRow] = await rawQuery<{ study_session_id: number }>(
      checkSql,
      [studySessionId, lecturerId]
    );
    if (!studySessionRow) {
      return NextResponse.json(
        { message: "You are not assigned to this course session" },
        { status: 403 }
      );
    }

    // Step 3: Validate QR belongs to this session
    const qrCheckSql = `
      SELECT qcss.qr_code_id
      FROM qr_code_study_session qcss
      WHERE qcss.study_session_id = ? AND qcss.qr_code_id = ?
    `;
    const [qrRow] = await rawQuery<{ qr_code_id: number }>(qrCheckSql, [
      studySessionId,
      qr_code_id,
    ]);

    if (!qrRow) {
      return NextResponse.json(
        { message: "QR code does not belong to this study session" },
        { status: 404 }
      );
    }

    // Step 4: Validate room
    const roomCheckSql = `SELECT id FROM room WHERE id = ? LIMIT 1`;
    const [roomRow] = await rawQuery<{ id: number }>(roomCheckSql, [
      valid_room_id,
    ]);
    if (!roomRow) {
      return NextResponse.json(
        { message: `Room with id ${valid_room_id} does not exist` },
        { status: 400 }
      );
    }

    // Step 5: Update qr_code record(validate_geo, radius, valid_room_id,)
    const updateQrSql = `
      UPDATE qr_code
      SET valid_radius = ?, validate_geo = ?, valid_room_id = ?
      WHERE id = ?
    `;
    await rawQuery(updateQrSql, [
      radius ?? 100,
      validate_geo ? 1 : 0,
      valid_room_id,
      qr_code_id,
    ]);

    // Step 6) Update validity windows in place (no delete/insert)
    type ValidityRow = { count: number; start_time: string; end_time: string };

    const existing = await rawQuery<ValidityRow>(
      `SELECT count, start_time, end_time
   FROM validity
   WHERE qr_code_id = ?
   ORDER BY count ASC`,
      [qr_code_id]
    );

    // Expect exactly 2 validity rows (count = 1 and 2)
    if (existing.length !== validities.length) {
      return NextResponse.json(
        {
          message:
            "Existing validity windows do not match the request. Expected exactly two windows.",
          details: {
            existing_count: existing.length,
            requested_count: validities.length,
          },
        },
        { status: 409 }
      );
    }

    for (let i = 0; i < validities.length; i++) {
      const win = validities[i];
      const row = existing[i];
      // Derive the base date from the existing row (prefer start_time; fallback to end_time)
      const baseDateString = row.start_time ?? row.end_time;
      const sessionDate = new Date(baseDateString);
      const start = parseTimeToDate(sessionDate, win.start_time);
      const end = parseTimeToDate(sessionDate, win.end_time);

      if (end <= start) {
        return NextResponse.json(
          { message: `validities[${i}]: end_time must be after start_time` },
          { status: 400 }
        );
      }

      // Update by (qr_code_id, count)
      const updateValiditySql = `
    UPDATE validity
    SET start_time = ?, end_time = ?
    WHERE qr_code_id = ? AND count = ?
    LIMIT 1
  `;
      await rawQuery(updateValiditySql, [start, end, qr_code_id, i + 1]);
    }
    return NextResponse.json({
      message: "QR code updated successfully",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
