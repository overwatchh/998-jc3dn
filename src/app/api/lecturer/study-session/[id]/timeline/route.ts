import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/lecturer/study-session/{id}/timeline:
 *   get:
 *     tags:
 *       - Lecturer
 *     summary: Get check-in timeline data for a study session
 *     description: Returns check-in timeline data grouped by time intervals for the current active QR validity window.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study session ID
 *       - in: query
 *         name: week_number
 *         required: false
 *         schema:
 *           type: integer
 *         description: Week number (optional - uses current active week if not provided)
 *     responses:
 *       200:
 *         description: Timeline data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                         example: "10:00"
 *                       value:
 *                         type: integer
 *                         example: 5
 *                       cumulative:
 *                         type: integer
 *                         example: 15
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Lecturer not assigned to session
 *       500:
 *         description: Server error
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const studySessionId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const week_number = parseInt(searchParams.get("week_number") || "");

    if (!studySessionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const lecturerId = session.user.id;

    // Check if lecturer is assigned to this session
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

    // Get current week number if not provided
    let actualWeekNumber = week_number;

    if (!actualWeekNumber) {
      // Get the current active week (most recent week with active QR)
      const currentWeekSql = `
        SELECT qrss.week_number
        FROM qr_code_study_session qrss
        JOIN validity v ON v.qr_code_id = qrss.qr_code_id
        WHERE qrss.study_session_id = ? 
          AND NOW() BETWEEN v.start_time AND v.end_time
        ORDER BY qrss.week_number DESC
        LIMIT 1
      `;
      const currentWeekRows = await rawQuery<{ week_number: number }>(
        currentWeekSql,
        [studySessionId]
      );

      if (currentWeekRows.length === 0) {
        // Fallback: get the most recent week
        const recentWeekSql = `
          SELECT week_number
          FROM qr_code_study_session
          WHERE study_session_id = ?
          ORDER BY week_number DESC
          LIMIT 1
        `;
        const recentWeekRows = await rawQuery<{ week_number: number }>(
          recentWeekSql,
          [studySessionId]
        );
        actualWeekNumber = recentWeekRows[0]?.week_number || 1;
      } else {
        actualWeekNumber = currentWeekRows[0].week_number;
      }
    }

    // Get check-in timeline data for the current validity window
    const timelineSql = `
      SELECT
        DATE_FORMAT(c.checkin_time, '%H:%i') AS time,
        COUNT(*) AS value
      FROM checkin c
      JOIN qr_code_study_session qrss ON qrss.id = c.qr_code_study_session_id
      JOIN validity v ON v.id = c.validity_id
      WHERE qrss.study_session_id = ? 
        AND qrss.week_number = ?
        AND NOW() BETWEEN v.start_time AND v.end_time
      GROUP BY DATE_FORMAT(c.checkin_time, '%H:%i')
      ORDER BY time ASC
    `;

    const timelineData = await rawQuery<{
      time: string;
      value: number;
    }>(timelineSql, [studySessionId, actualWeekNumber]);

    // Calculate cumulative values
    let cumulative = 0;
    const timelineWithCumulative = timelineData.map(item => {
      cumulative += item.value;
      return {
        time: item.time,
        value: item.value,
        cumulative: cumulative,
      };
    });

    return NextResponse.json({
      message: "Timeline data retrieved successfully",
      data: timelineWithCumulative,
    });
  } catch (error: unknown) {
    console.error("Timeline API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
