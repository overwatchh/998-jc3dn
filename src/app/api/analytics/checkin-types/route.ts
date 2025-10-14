import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/checkin-types:
 *   get:
 *     summary: Get weekly In-person vs Online vs Manual check-in analytics
 *     description: Returns weekly breakdown of In-person vs Online vs Manual attendance for bar chart visualization
 *     tags:
 *       - Analytics
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         required: false
 *         schema:
 *           type: integer
 *           example: 101
 *         description: Subject ID to filter results (optional)
 *     responses:
 *       200:
 *         description: Weekly In-person vs Online vs Manual analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 weeklyData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       week:
 *                         type: integer
 *                         example: 1
 *                       weekLabel:
 *                         type: string
 *                         example: "Week 1"
 *                       inPerson:
 *                         type: integer
 *                         example: 45
 *                       online:
 *                         type: integer
 *                         example: 38
 *                       manual:
 *                         type: integer
 *                         example: 5
 *                       total:
 *                         type: integer
 *                         example: 88
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get("subjectId");
    const sessionType = searchParams.get("sessionType");
    const tutorialSessionId = searchParams.get("tutorialSessionId");

    // Build WHERE conditions
    const conditions = [];
    const params: (string | number)[] = [];

    if (subjectId && subjectId !== "all") {
      conditions.push("sss.subject_id = ?");
      params.push(parseInt(subjectId));
    }

    // If tutorial session ID is provided, filter by that specific session
    if (tutorialSessionId) {
      conditions.push("ss.id = ?");
      params.push(parseInt(tutorialSessionId));
    } else if (sessionType && sessionType !== "both") {
      conditions.push("ss.type = ?");
      params.push(sessionType);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // If filtering by tutorial session, join with student_study_session to only count students in that tutorial
    const studentSessionJoin = tutorialSessionId
      ? "JOIN student_study_session student_ss ON student_ss.student_id = c.student_id AND student_ss.study_session_id = ss.id"
      : "";

    // Get weekly breakdown of UNIQUE STUDENTS by checkin type
    // This shows how many students used each check-in mode per week (preferred attendance method)
    const needsSubjectJoin = subjectId && subjectId !== "all";
    const weeklyQuery = `
      SELECT
        qrss.week_number,
        c.checkin_type,
        COUNT(DISTINCT c.student_id) as count
      FROM checkin c
      JOIN qr_code_study_session qrss ON qrss.id = c.qr_code_study_session_id
      JOIN study_session ss ON ss.id = qrss.study_session_id
      ${studentSessionJoin}
      ${needsSubjectJoin ? "JOIN subject_study_session sss ON sss.study_session_id = ss.id" : ""}
      ${whereClause}
      GROUP BY qrss.week_number, c.checkin_type
      ORDER BY qrss.week_number, c.checkin_type
    `;

    const weeklyResults = (await rawQuery(weeklyQuery, params)) as {
      week_number: number;
      checkin_type: string;
      count: number;
    }[];

    // Process data for bar chart
    const weeklyMap = new Map();

    weeklyResults.forEach(row => {
      if (!weeklyMap.has(row.week_number)) {
        weeklyMap.set(row.week_number, {
          week: row.week_number,
          weekLabel: `Week ${row.week_number}`,
          inPerson: 0,
          online: 0,
          manual: 0,
          total: 0,
        });
      }

      const weekData = weeklyMap.get(row.week_number);

      // Map database checkin_type values to frontend property names
      if (row.checkin_type === "In-person") {
        weekData.inPerson += row.count;
        weekData.total += row.count;
      } else if (row.checkin_type === "Online") {
        weekData.online += row.count;
        weekData.total += row.count;
      } else if (row.checkin_type === "Manual") {
        weekData.manual += row.count;
        weekData.total += row.count;
      }
    });

    const weeklyData = Array.from(weeklyMap.values()).sort(
      (a, b) => a.week - b.week
    );

    return NextResponse.json({
      weeklyData,
    });
  } catch (error) {
    console.error("Check-in types analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-in type analytics" },
      { status: 500 }
    );
  }
}
