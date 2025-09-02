/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { GenerateQrRequestBody, GenerateQrResponse } from "@/types/qr-code";
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
 *     description: Generates a QR code for a lecturer's study session, tied to a specific week number.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the study session
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
 *               duration:
 *                 type: integer
 *                 example: 15
 *                 description: The duration in minutes for which the QR code is valid (default 15)
 *                 default: 15
 *               radius:
 *                 type: number
 *                 example: 100
 *                 description: Maximum distance (in meters) allowed between student's location and the classroom
 *                 default: 100
 *     responses:
 *       200:
 *         description: QR code successfully generated
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
 *                   description: Base64-encoded QR image URL
 *                 study_session_id:
 *                   type: integer
 *                   example: 1
 *                 week_number:
 *                   type: integer
 *                   example: 1
 *                 valid_until:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing or invalid `week_number`
 *       401:
 *         description: Unauthorized – user not signed in or not a lecturer
 *       403:
 *         description: Lecturer is not assigned to the session
 *       409:
 *         description: QR code already exists for this session and week
 *       500:
 *         description: Internal server error
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
 *     summary: Add second validity window to existing QR code
 *     description: Adds a second validity window to an existing QR code for the study session. The second validity starts when the first one ends and lasts until the end of the study session.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: The ID of the study session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_code_id
 *             properties:
 *               qr_code_id:
 *                 type: integer
 *                 example: 1
 *                 description: the id of the QR code to add validity to
 *     responses:
 *       200:
 *         description: New validity added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Validity added successfully
 *                 qr_code_id:
 *                   type: integer
 *                 week_number:
 *                   type: integer
 *                 validity:
 *                   type: object
 *                   properties:
 *                     validity_id:
 *                       type: integer
 *                     count:
 *                       type: integer
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing or invalid fields
 *       401:
 *         description: Unauthorized – user not signed in or not a lecturer
 *       403:
 *         description: Lecturer is not assigned to the session or QR not found for the given week
 *       409:
 *         description: Maximum validities reached for this QR code
 *       500:
 *         description: Internal server error
 */

const APP_URL = process.env.BASE_URL!;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const studySessionId = parseInt(id); // study session id
    const body = (await req.json()) as GenerateQrRequestBody;
    const { week_number, duration, radius } = body;
    if (!week_number || typeof week_number !== "number") {
      return NextResponse.json(
        { message: "week_number is required and must be a number" },
        { status: 400 }
      );
    }

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
    // Step 2b: Check that it's the correct day and time window
    const timeCheckSql = `
  SELECT 
    ss.day_of_week,
    ss.start_time,
    ss.end_time,
    CASE 
      WHEN ss.day_of_week = DAYNAME(NOW()) 
       AND TIME(NOW()) BETWEEN ss.start_time AND ss.end_time
      THEN 1 ELSE 0 
    END AS valid_time
  FROM study_session ss
  WHERE ss.id = ?
`;

    const [timeCheck] = await rawQuery<{
      day_of_week: string;
      start_time: string;
      end_time: string;
      valid_time: number;
    }>(timeCheckSql, [studySessionId]);

    if (!timeCheck || timeCheck.valid_time === 0) {
      return NextResponse.json(
        {
          message:
            "This request is outside the allowed session time or wrong day",
          valid_day: timeCheck?.day_of_week,
          valid_start_time: timeCheck?.start_time,
          valid_end_time: timeCheck?.end_time,
        },
        { status: 403 }
      );
    }

    // Step 3: Create qr in DB
    const validDuration =
      duration && typeof duration === "number" ? duration : 15; // default 15 minutes
    const now = new Date();
    const validUntil = new Date(now.getTime() + validDuration * 60 * 1000); // valid for `duration` in minutes

    // Insert into qr_code
    const insertQrSql = `
      INSERT INTO qr_code (createdAt, valid_radius)
      VALUES (?, ?)
    `;
    const qrResult: any = await rawQuery(insertQrSql, [now, radius ?? 100]);
    const qrCodeId = qrResult.insertId;
    // Step 4: Generate QR URL
    const redirectPath = "/scan";
    const qrUrl = `${APP_URL}${redirectPath}?qr_code_id=${qrCodeId}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);
    // Insert into validity (1st validity window)
    const insertValiditySql = `
      INSERT INTO validity (qr_code_id, count, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `;
    await rawQuery(insertValiditySql, [qrCodeId, 1, now, validUntil]);

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
      valid_until: validUntil.toISOString(),
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
      valid_radius: number;
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
        valid_radius: number;
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
          valid_radius: row.valid_radius,
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
    const body = await req.json();
    const { qr_code_id } = body;

    if (!qr_code_id || typeof qr_code_id !== "number") {
      return NextResponse.json(
        { message: "qr_code_id is required and must be a number" },
        { status: 400 }
      );
    }

    // Step 1: Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = session.user.id;

    // Step 2: Check if lecturer is assigned to this study session
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

    // Step 3: Check QR code mapping
    const qrCheckSql = `
      SELECT qcss.week_number
      FROM qr_code_study_session qcss
      WHERE qcss.study_session_id = ? AND qcss.qr_code_id = ?
    `;
    const [qrCodeRow] = await rawQuery<{ week_number: number }>(qrCheckSql, [
      studySessionId,
      qr_code_id,
    ]);

    if (!qrCodeRow) {
      return NextResponse.json(
        { message: "QR code not found for this session" },
        { status: 403 }
      );
    }

    // Step 4: Get existing validities
    const validitySql = `
      SELECT id, end_time  FROM validity
      WHERE qr_code_id = ?
      ORDER BY count ASC
    `;
    const validities = await rawQuery<{ id: number; end_time: string }>(
      validitySql,
      [qr_code_id]
    );
    console.log("Existing validities:", validities);
    if (validities.length >= 2) {
      return NextResponse.json(
        { message: "Maximum validities reached for this QR code" },
        { status: 409 }
      );
    }

    const firstValidity = validities[0];
    if (!firstValidity) {
      return NextResponse.json(
        { message: "First validity not found. Cannot create second validity." },
        { status: 400 }
      );
    }
    //Ensure action is after first validity's end_time
    const now = new Date();
    const firstEndTime = new Date(firstValidity.end_time);

    if (now <= firstEndTime) {
      return NextResponse.json(
        {
          message: "Cannot create second validity before first validity ends.",
        },
        { status: 400 }
      );
    }

    // Step 5: Get study session end time
    const ssSql = `SELECT end_time FROM study_session WHERE id = ?`;
    const [ssRow] = await rawQuery<{ end_time: string }>(ssSql, [
      studySessionId,
    ]);
    if (!ssRow) {
      return NextResponse.json(
        { message: "Study session not found" },
        { status: 404 }
      );
    }

    const newStart = new Date(); // starts validity now
    const today = new Date().toISOString().split("T")[0];
    const newEnd = `${today} ${ssRow.end_time}`;

    // Step 6: Insert second validity
    const insertSql = `
      INSERT INTO validity (qr_code_id, count, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `;
    const result: any = await rawQuery(insertSql, [
      qr_code_id,
      2,
      newStart,
      newEnd,
    ]);

    const response = {
      message: "Validity added successfully",
      qr_code_id,
      week_number: qrCodeRow.week_number,
      validity: {
        validity_id: result.insertId,
        count: 2,
        start_time: newStart,
        end_time: newEnd,
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Error adding validity:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
