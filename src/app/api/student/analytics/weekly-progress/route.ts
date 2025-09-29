import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/student/analytics/weekly-progress:
 *   get:
 *     tags:
 *       - Student Analytics
 *     summary: Get weekly attendance progress for student
 *     description: Returns attendance data grouped by week to show attendance patterns and trends over time
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of weeks to include in the analysis
 *     responses:
 *       200:
 *         description: Successfully retrieved weekly progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Weekly attendance progress retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     weekly_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           week_number:
 *                             type: integer
 *                             example: 8
 *                           week_start_date:
 *                             type: string
 *                             format: date
 *                             example: "2024-02-19"
 *                           total_sessions:
 *                             type: integer
 *                             example: 4
 *                           attended_sessions:
 *                             type: integer
 *                             example: 3
 *                           attendance_rate:
 *                             type: number
 *                             format: float
 *                             example: 75.0
 *                     trends:
 *                       type: object
 *                       properties:
 *                         average_weekly_attendance:
 *                           type: number
 *                           format: float
 *                           example: 82.5
 *                         trend_direction:
 *                           type: string
 *                           enum: [improving, declining, stable]
 *                           example: improving
 *                         best_week:
 *                           type: object
 *                           properties:
 *                             week_number:
 *                               type: integer
 *                               example: 6
 *                             attendance_rate:
 *                               type: number
 *                               format: float
 *                               example: 100.0
 *                         worst_week:
 *                           type: object
 *                           properties:
 *                             week_number:
 *                               type: integer
 *                               example: 3
 *                             attendance_rate:
 *                               type: number
 *                               format: float
 *                               example: 50.0
 *       401:
 *         description: Unauthorized - Student role required
 */

interface WeeklyRow {
  week_number: number;
  week_start_date: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_rate: number;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "student") {
    return NextResponse.json(
      { message: "Forbidden: Only students can access this." },
      { status: 403 }
    );
  }

  try {
    const studentId = session.user.id;
    const url = new URL(request.url);
    const weeks = parseInt(url.searchParams.get('weeks') || '12');

    // Using EMAIL CALCULATOR METHOD: 2+ checkins = 100 points, 1 checkin = 50 points, 0 checkins = 0 points
    const sql = `
      SELECT
        qcss.week_number,
        DATE_ADD('2024-01-01', INTERVAL (qcss.week_number - 1) * 7 DAY) as week_start_date,
        COUNT(DISTINCT qcss.id) as total_sessions,
        ROUND(
          (SUM(
            CASE
              WHEN checkin_counts.checkin_count >= 2 THEN 100
              WHEN checkin_counts.checkin_count = 1 THEN 50
              ELSE 0
            END
          ) / (COUNT(DISTINCT qcss.id) * 100)) * 100,
          1
        ) as attendance_rate,
        COUNT(DISTINCT CASE WHEN checkin_counts.checkin_count > 0 THEN qcss.id END) as attended_sessions
      FROM enrolment e
      JOIN subject s ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN qr_code_study_session qcss ON qcss.study_session_id = sss.study_session_id
      LEFT JOIN (
        SELECT
          qr_code_study_session_id,
          student_id,
          COUNT(*) as checkin_count
        FROM checkin
        GROUP BY qr_code_study_session_id, student_id
      ) checkin_counts ON checkin_counts.qr_code_study_session_id = qcss.id
                       AND checkin_counts.student_id = e.student_id
      WHERE e.student_id = ?
        AND s.status = 'active'
        AND qcss.week_number BETWEEN 1 AND ?
      GROUP BY qcss.week_number
      ORDER BY qcss.week_number;
    `;

    const weeklyData = await rawQuery<WeeklyRow>(sql, [studentId, weeks]);

    // Use attendance rates from email calculator method
    const weeklyStats = weeklyData.map(row => ({
      week_number: row.week_number,
      week_start_date: row.week_start_date,
      total_sessions: row.total_sessions,
      attended_sessions: row.attended_sessions,
      attendance_rate: parseFloat(String(row.attendance_rate)) || 0
    }));

    // Calculate trends
    const rates = weeklyStats.map(w => w.attendance_rate);
    const averageWeeklyAttendance = rates.length > 0
      ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length
      : 0;

    // Determine trend direction (comparing first half vs second half)
    let trendDirection = 'stable';
    if (rates.length >= 4) {
      const firstHalf = rates.slice(0, Math.floor(rates.length / 2));
      const secondHalf = rates.slice(Math.ceil(rates.length / 2));
      const firstAvg = firstHalf.reduce((sum, rate) => sum + rate, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, rate) => sum + rate, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 5) {
        trendDirection = 'improving';
      } else if (secondAvg < firstAvg - 5) {
        trendDirection = 'declining';
      }
    }

    // Find best and worst weeks
    const bestWeek = weeklyStats.reduce((best, current) =>
      current.attendance_rate > best.attendance_rate ? current : best,
      weeklyStats[0] || { week_number: 0, attendance_rate: 0 }
    );

    const worstWeek = weeklyStats.reduce((worst, current) =>
      current.attendance_rate < worst.attendance_rate ? current : worst,
      weeklyStats[0] || { week_number: 0, attendance_rate: 0 }
    );

    const response = {
      message: "Weekly attendance progress retrieved successfully",
      data: {
        weekly_stats: weeklyStats,
        trends: {
          average_weekly_attendance: Math.round(averageWeeklyAttendance * 100) / 100,
          trend_direction: trendDirection,
          best_week: {
            week_number: bestWeek.week_number,
            attendance_rate: bestWeek.attendance_rate
          },
          worst_week: {
            week_number: worstWeek.week_number,
            attendance_rate: worstWeek.attendance_rate
          }
        }
      }
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET_STUDENT_WEEKLY_PROGRESS]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}