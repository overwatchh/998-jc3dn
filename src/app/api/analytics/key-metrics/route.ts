import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/key-metrics:
 *   get:
 *     summary: Get key attendance metrics and insights
 *     description: Returns essential attendance metrics including average attendance, at-risk students, and best/worst performing sessions for dashboard overview.
 *     tags:
 *       - Statistics
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         required: false
 *         schema:
 *           type: integer
 *           example: 101
 *         description: Study session ID to filter results (optional)
 *       - in: query
 *         name: sessionType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [lecture, tutorial, both]
 *           default: lecture
 *         description: Type of sessions to include in analysis
 *     responses:
 *       200:
 *         description: Key metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageAttendance:
 *                   type: number
 *                   format: float
 *                   example: 78.5
 *                 atRiskStudents:
 *                   type: integer
 *                   description: Number of students with attendance below 80%
 *                   example: 12
 *                 totalStudents:
 *                   type: integer
 *                   example: 45
 *                 totalWeeks:
 *                   type: integer
 *                   example: 12
 *                 mostAttended:
 *                   type: object
 *                   properties:
 *                     week:
 *                       type: string
 *                       example: "Week 3"
 *                     subject:
 *                       type: string
 *                       example: "MTS9307"
 *                     attendance:
 *                       type: number
 *                       format: float
 *                       example: 95.2
 *                 leastAttended:
 *                   type: object
 *                   properties:
 *                     week:
 *                       type: string
 *                       example: "Week 8"
 *                     subject:
 *                       type: string
 *                       example: "MTS9307"
 *                     attendance:
 *                       type: number
 *                       format: float
 *                       example: 62.1
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch key metrics data"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get("subjectId"); // Now correctly using subject ID
    const subjectIdNum = subjectId ? parseInt(subjectId) : null;
    const sessionType = searchParams.get("sessionType") || "tutorial";
    const tutorialSessionId = searchParams.get("tutorialSessionId");

    // Build session filter - if tutorial session ID is provided, filter by that specific session
    let sessionFilter = "";
    if (tutorialSessionId) {
      sessionFilter = `AND ss.id = ${parseInt(tutorialSessionId)}`;
    } else {
      sessionFilter = `AND ss.type = '${sessionType}'`;
    }

    // Use single query approach to avoid connection issues
    let averageAttendance = 0;
    let atRiskStudents = 0;

    // Calculate average session attendance using EMAIL CALCULATOR METHOD
    let avgQuery = "";
    if (tutorialSessionId) {
      avgQuery = `
        SELECT
          ROUND(AVG(attendance_rate), 1) as avg_attendance
        FROM (
          SELECT
            qrss.id,
            ROUND(
              (SUM(
                CASE
                  WHEN checkin_counts.checkin_count >= 2 THEN 100
                  WHEN checkin_counts.checkin_count = 1 THEN 50
                  ELSE 0
                END
              ) / (COUNT(student_ss.student_id) * 100)) * 100,
              1
            ) as attendance_rate
          FROM qr_code_study_session qrss
          JOIN study_session ss ON ss.id = qrss.study_session_id
          JOIN subject_study_session sss ON sss.study_session_id = ss.id
          JOIN student_study_session student_ss ON student_ss.study_session_id = ss.id
          LEFT JOIN (
            SELECT
              qr_code_study_session_id,
              student_id,
              COUNT(*) as checkin_count
            FROM checkin
            GROUP BY qr_code_study_session_id, student_id
          ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                           AND checkin_counts.student_id = student_ss.student_id
          WHERE 1=1 AND ss.id = ${parseInt(tutorialSessionId)} ${subjectIdNum ? "AND sss.subject_id = ?" : ""}
          GROUP BY qrss.id
        ) session_stats
      `;
    } else {
      avgQuery = `
        SELECT
          ROUND(AVG(attendance_rate), 1) as avg_attendance
        FROM (
          SELECT
            qrss.id,
            ROUND(
              (SUM(
                CASE
                  WHEN checkin_counts.checkin_count >= 2 THEN 100
                  WHEN checkin_counts.checkin_count = 1 THEN 50
                  ELSE 0
                END
              ) / (COUNT(e.student_id) * 100)) * 100,
              1
            ) as attendance_rate
          FROM qr_code_study_session qrss
          JOIN study_session ss ON ss.id = qrss.study_session_id
          JOIN subject_study_session sss ON sss.study_session_id = ss.id
          JOIN enrolment e ON e.subject_id = sss.subject_id
          LEFT JOIN (
            SELECT
              qr_code_study_session_id,
              student_id,
              COUNT(*) as checkin_count
            FROM checkin
            GROUP BY qr_code_study_session_id, student_id
          ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                           AND checkin_counts.student_id = e.student_id
          WHERE 1=1 ${sessionFilter} ${subjectIdNum ? "AND sss.subject_id = ?" : ""}
          GROUP BY qrss.id
        ) session_stats
      `;
    }

    const [avgData] = await rawQuery<{ avg_attendance: number }>(
      avgQuery,
      subjectIdNum ? [subjectIdNum] : []
    );

    // Calculate at-risk students using EMAIL CALCULATOR METHOD (students with overall attendance < 80%)
    let atRiskQuery = "";
    if (tutorialSessionId) {
      atRiskQuery = `
        SELECT
          COUNT(*) as at_risk_count
        FROM (
          SELECT
            student_ss.student_id,
            ROUND(
              (SUM(
                CASE
                  WHEN checkin_counts.checkin_count >= 2 THEN 100
                  WHEN checkin_counts.checkin_count = 1 THEN 50
                  ELSE 0
                END
              ) / (COUNT(qrss.id) * 100)) * 100,
              1
            ) as student_attendance
          FROM student_study_session student_ss
          JOIN study_session ss ON ss.id = student_ss.study_session_id
          JOIN subject_study_session sss ON sss.study_session_id = ss.id
          JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
          LEFT JOIN (
            SELECT
              qr_code_study_session_id,
              student_id,
              COUNT(*) as checkin_count
            FROM checkin
            GROUP BY qr_code_study_session_id, student_id
          ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                           AND checkin_counts.student_id = student_ss.student_id
          WHERE 1=1 AND ss.id = ${parseInt(tutorialSessionId)} ${subjectIdNum ? "AND sss.subject_id = ?" : ""}
          GROUP BY student_ss.student_id
          HAVING student_attendance < 80
        ) at_risk_students
      `;
    } else {
      atRiskQuery = `
        SELECT
          COUNT(*) as at_risk_count
        FROM (
          SELECT
            e.student_id,
            ROUND(
              (SUM(
                CASE
                  WHEN checkin_counts.checkin_count >= 2 THEN 100
                  WHEN checkin_counts.checkin_count = 1 THEN 50
                  ELSE 0
                END
              ) / (COUNT(qrss.id) * 100)) * 100,
              1
            ) as student_attendance
          FROM enrolment e
          JOIN subject_study_session sss ON sss.subject_id = e.subject_id
          JOIN study_session ss ON ss.id = sss.study_session_id
          JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
          LEFT JOIN (
            SELECT
              qr_code_study_session_id,
              student_id,
              COUNT(*) as checkin_count
            FROM checkin
            GROUP BY qr_code_study_session_id, student_id
          ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                           AND checkin_counts.student_id = e.student_id
          WHERE 1=1 ${sessionFilter} ${subjectIdNum ? "AND e.subject_id = ?" : ""}
          GROUP BY e.student_id
          HAVING student_attendance < 80
        ) at_risk_students
      `;
    }

    const [atRiskData] = await rawQuery<{ at_risk_count: number }>(
      atRiskQuery,
      subjectIdNum ? [subjectIdNum] : []
    );

    averageAttendance = avgData?.avg_attendance || 0;
    atRiskStudents = atRiskData?.at_risk_count || 0;

    // Get basic counts
    let countsQuery = "";
    if (tutorialSessionId) {
      countsQuery = `
        SELECT
            COUNT(DISTINCT student_ss.student_id) as total_students,
            COUNT(DISTINCT qrss.id) as total_sessions
        FROM study_session ss
        JOIN student_study_session student_ss ON student_ss.study_session_id = ss.id
        JOIN subject_study_session sss ON sss.study_session_id = ss.id
        JOIN subject s ON s.id = sss.subject_id
        JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
        WHERE 1=1 AND ss.id = ${parseInt(tutorialSessionId)} ${subjectIdNum ? "AND s.id = ?" : ""}
      `;
    } else {
      countsQuery = `
        SELECT
            COUNT(DISTINCT e.student_id) as total_students,
            COUNT(DISTINCT qrss.id) as total_sessions
        FROM subject s
        JOIN enrolment e ON e.subject_id = s.id
        JOIN subject_study_session sss ON sss.subject_id = s.id
        JOIN study_session ss ON ss.id = sss.study_session_id
        JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
        WHERE 1=1 ${sessionFilter} ${subjectIdNum ? "AND s.id = ?" : ""}
      `;
    }

    const queryParams = subjectIdNum ? [subjectIdNum] : [];

    const [countsData] = (await rawQuery(countsQuery, queryParams)) as {
      total_students: number;
      total_sessions: number;
    }[];

    // Best/worst sessions using EMAIL CALCULATOR METHOD
    let bestQuery = "";
    let worstQuery = "";

    if (tutorialSessionId) {
      bestQuery = `
        SELECT
            CONCAT('Week ', qrss.week_number) as week_label,
            s.code as subject_code,
            ROUND(
              (SUM(
                CASE
                  WHEN checkin_counts.checkin_count >= 2 THEN 100
                  WHEN checkin_counts.checkin_count = 1 THEN 50
                  ELSE 0
                END
              ) / (COUNT(student_ss.student_id) * 100)) * 100,
              1
            ) as attendance_rate
        FROM qr_code_study_session qrss
        JOIN study_session ss ON ss.id = qrss.study_session_id
        JOIN subject_study_session sss ON sss.study_session_id = ss.id
        JOIN subject s ON s.id = sss.subject_id
        JOIN student_study_session student_ss ON student_ss.study_session_id = ss.id
        LEFT JOIN (
          SELECT
            qr_code_study_session_id,
            student_id,
            COUNT(*) as checkin_count
          FROM checkin
          GROUP BY qr_code_study_session_id, student_id
        ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                         AND checkin_counts.student_id = student_ss.student_id
        WHERE 1=1 AND ss.id = ${parseInt(tutorialSessionId)} ${subjectIdNum ? "AND s.id = ?" : ""}
        GROUP BY s.code, qrss.week_number, qrss.id
        ORDER BY attendance_rate DESC
        LIMIT 1
      `;

      worstQuery = `
        SELECT
            CONCAT('Week ', qrss.week_number) as week_label,
            s.code as subject_code,
            ROUND(
              (SUM(
                CASE
                  WHEN checkin_counts.checkin_count >= 2 THEN 100
                  WHEN checkin_counts.checkin_count = 1 THEN 50
                  ELSE 0
                END
              ) / (COUNT(student_ss.student_id) * 100)) * 100,
              1
            ) as attendance_rate
        FROM qr_code_study_session qrss
        JOIN study_session ss ON ss.id = qrss.study_session_id
        JOIN subject_study_session sss ON sss.study_session_id = ss.id
        JOIN subject s ON s.id = sss.subject_id
        JOIN student_study_session student_ss ON student_ss.study_session_id = ss.id
        LEFT JOIN (
          SELECT
            qr_code_study_session_id,
            student_id,
            COUNT(*) as checkin_count
          FROM checkin
          GROUP BY qr_code_study_session_id, student_id
        ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                         AND checkin_counts.student_id = student_ss.student_id
        WHERE 1=1 AND ss.id = ${parseInt(tutorialSessionId)} ${subjectIdNum ? "AND s.id = ?" : ""}
        GROUP BY s.code, qrss.week_number, qrss.id
        ORDER BY attendance_rate ASC
        LIMIT 1
      `;
    } else {
      bestQuery = `
        SELECT
            CONCAT('Week ', qrss.week_number) as week_label,
            s.code as subject_code,
            ROUND(
              (SUM(
                CASE
                  WHEN checkin_counts.checkin_count >= 2 THEN 100
                  WHEN checkin_counts.checkin_count = 1 THEN 50
                  ELSE 0
                END
              ) / (COUNT(e.student_id) * 100)) * 100,
              1
            ) as attendance_rate
        FROM qr_code_study_session qrss
        JOIN study_session ss ON ss.id = qrss.study_session_id
        JOIN subject_study_session sss ON sss.study_session_id = ss.id
        JOIN subject s ON s.id = sss.subject_id
        JOIN enrolment e ON e.subject_id = s.id
        LEFT JOIN (
          SELECT
            qr_code_study_session_id,
            student_id,
            COUNT(*) as checkin_count
          FROM checkin
          GROUP BY qr_code_study_session_id, student_id
        ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                         AND checkin_counts.student_id = e.student_id
        WHERE 1=1 ${sessionFilter} ${subjectIdNum ? "AND s.id = ?" : ""}
        GROUP BY s.code, qrss.week_number, qrss.id
        ORDER BY attendance_rate DESC
        LIMIT 1
      `;

      worstQuery = `
        SELECT
            CONCAT('Week ', qrss.week_number) as week_label,
            s.code as subject_code,
            ROUND(
              (SUM(
                CASE
                  WHEN checkin_counts.checkin_count >= 2 THEN 100
                  WHEN checkin_counts.checkin_count = 1 THEN 50
                  ELSE 0
                END
              ) / (COUNT(e.student_id) * 100)) * 100,
              1
            ) as attendance_rate
        FROM qr_code_study_session qrss
        JOIN study_session ss ON ss.id = qrss.study_session_id
        JOIN subject_study_session sss ON sss.study_session_id = ss.id
        JOIN subject s ON s.id = sss.subject_id
        JOIN enrolment e ON e.subject_id = s.id
        LEFT JOIN (
          SELECT
            qr_code_study_session_id,
            student_id,
            COUNT(*) as checkin_count
          FROM checkin
          GROUP BY qr_code_study_session_id, student_id
        ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                         AND checkin_counts.student_id = e.student_id
        WHERE 1=1 ${sessionFilter} ${subjectIdNum ? "AND s.id = ?" : ""}
        GROUP BY s.code, qrss.week_number, qrss.id
        ORDER BY attendance_rate ASC
        LIMIT 1
      `;
    }

    const [bestSession] = (await rawQuery(bestQuery, queryParams)) as {
      week_label: string;
      subject_code: string;
      attendance_rate: number;
    }[];
    const [worstSession] = (await rawQuery(worstQuery, queryParams)) as {
      week_label: string;
      subject_code: string;
      attendance_rate: number;
    }[];

    return NextResponse.json({
      averageAttendance: Math.round(averageAttendance * 10) / 10,
      atRiskStudents: atRiskStudents,
      totalStudents: countsData?.total_students || 0,
      totalWeeks: countsData?.total_sessions || 0,
      mostAttended: {
        week: bestSession?.week_label || "N/A",
        subject: bestSession?.subject_code || "",
        attendance: bestSession?.attendance_rate || 0,
      },
      leastAttended: {
        week: worstSession?.week_label || "N/A",
        subject: worstSession?.subject_code || "",
        attendance: worstSession?.attendance_rate || 0,
      },
    });
  } catch (error) {
    console.error("Key metrics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch key metrics data" },
      { status: 500 }
    );
  }
}
