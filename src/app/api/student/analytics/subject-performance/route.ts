import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/student/analytics/subject-performance:
 *   get:
 *     tags:
 *       - Student Analytics
 *     summary: Get detailed performance analysis per subject
 *     description: Returns comprehensive attendance analysis for each enrolled subject including trends, session types, and recommendations
 *     responses:
 *       200:
 *         description: Successfully retrieved subject performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject performance analysis retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subject_id:
 *                         type: integer
 *                         example: 1
 *                       subject_name:
 *                         type: string
 *                         example: Advanced Mathematics
 *                       subject_code:
 *                         type: string
 *                         example: MATH301
 *                       overall_attendance:
 *                         type: object
 *                         properties:
 *                           percentage:
 *                             type: number
 *                             format: float
 *                             example: 85.5
 *                           sessions_attended:
 *                             type: integer
 *                             example: 17
 *                           total_sessions:
 *                             type: integer
 *                             example: 20
 *                           required_threshold:
 *                             type: number
 *                             format: float
 *                             example: 80.0
 *                           status:
 *                             type: string
 *                             enum: [good, warning, at_risk]
 *                             example: good
 *                       session_breakdown:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             session_type:
 *                               type: string
 *                               enum: [lecture, tutorial]
 *                               example: lecture
 *                             attended:
 *                               type: integer
 *                               example: 9
 *                             total:
 *                               type: integer
 *                               example: 10
 *                             percentage:
 *                               type: number
 *                               format: float
 *                               example: 90.0
 *                       recent_trend:
 *                         type: object
 *                         properties:
 *                           last_5_sessions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 week_number:
 *                                   type: integer
 *                                   example: 8
 *                                 attended:
 *                                   type: boolean
 *                                   example: true
 *                                 session_type:
 *                                   type: string
 *                                   example: lecture
 *                           trend_direction:
 *                             type: string
 *                             enum: [improving, declining, stable]
 *                             example: stable
 *                       recommendations:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Attend next 2 lectures to maintain good standing", "Focus on tutorial attendance"]
 *       401:
 *         description: Unauthorized - Student role required
 */

interface SubjectDetailRow {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  required_attendance_thresh: number;
  session_type: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
}

interface RecentSessionRow {
  week_number: number;
  session_type: string;
  attended: number;
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
    const sessionType = url.searchParams.get("sessionType") || "lecture";

    // Get subject performance breakdown by session type using EMAIL CALCULATOR METHOD
    const subjectDetailSql = `
      SELECT
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        s.required_attendance_thresh,
        ss.type as session_type,
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
        ) as attendance_percentage,
        COUNT(DISTINCT CASE WHEN checkin_counts.checkin_count > 0 THEN qcss.id END) as attended_sessions
      FROM enrolment e
      JOIN subject s ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qcss ON qcss.study_session_id = ss.id
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
        AND ss.type = ?
      GROUP BY s.id, s.name, s.code, s.required_attendance_thresh, ss.type
      ORDER BY s.name, ss.type;
    `;

    const subjectDetails = await rawQuery<SubjectDetailRow>(subjectDetailSql, [studentId, sessionType]);

    // Get recent session trends (last 5 sessions per subject)
    const recentTrendSql = `
      SELECT
        s.id as subject_id,
        qcss.week_number,
        ss.type as session_type,
        CASE WHEN c.student_id IS NOT NULL THEN 1 ELSE 0 END as attended
      FROM enrolment e
      JOIN subject s ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qcss ON qcss.study_session_id = ss.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qcss.id AND c.student_id = e.student_id
      WHERE e.student_id = ?
        AND s.status = 'active'
        AND ss.type = ?
        AND qcss.week_number >= WEEK(CURDATE()) - 5
      ORDER BY s.id, qcss.week_number DESC;
    `;

    const recentTrends = await rawQuery<RecentSessionRow & { subject_id: number }>(recentTrendSql, [studentId, sessionType]);

    // Group data by subject
    const subjectMap = new Map();

    // Process subject details
    subjectDetails.forEach(row => {
      const subjectId = row.subject_id;

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject_id: subjectId,
          subject_name: row.subject_name,
          subject_code: row.subject_code,
          required_threshold: row.required_attendance_thresh * 100,
          sessions_by_type: new Map(),
          total_attendance_points: 0,
          total_attended: 0,
          total_sessions: 0,
          recent_sessions: []
        });
      }

      const subject = subjectMap.get(subjectId);
      subject.sessions_by_type.set(row.session_type, {
        attended: row.attended_sessions,
        total: row.total_sessions,
        percentage: parseFloat(String(row.attendance_percentage)) || 0
      });

      // Use the EMAIL CALCULATOR percentage for overall calculation
      subject.total_attendance_points += (parseFloat(String(row.attendance_percentage)) || 0) * row.total_sessions;
      subject.total_sessions += row.total_sessions;
      subject.total_attended += row.attended_sessions;
    });

    // Process recent trends
    recentTrends.forEach(row => {
      if (subjectMap.has(row.subject_id)) {
        const subject = subjectMap.get(row.subject_id);
        subject.recent_sessions.push({
          week_number: row.week_number,
          attended: row.attended === 1,
          session_type: row.session_type
        });
      }
    });

    // Convert to final format
    const subjectPerformance = Array.from(subjectMap.values()).map(subject => {
      const overallPercentage = subject.total_sessions > 0
        ? subject.total_attendance_points / subject.total_sessions
        : 0;

      // Determine status based on overall percentage vs required threshold
      let status = 'good';

      // If attendance percentage is below the required threshold, it's at risk
      if (overallPercentage < subject.required_threshold) {
        status = 'at_risk';
      }
      // If meeting or exceeding the requirement, it's good

      // Calculate trend direction
      const recentAttended = subject.recent_sessions.slice(0, 5);
      let trendDirection = 'stable';
      if (recentAttended.length >= 3) {
        const recentRate = recentAttended.filter(s => s.attended).length / recentAttended.length;
        const subjectRate = overallPercentage / 100;

        if (recentRate > subjectRate + 0.1) {
          trendDirection = 'improving';
        } else if (recentRate < subjectRate - 0.1) {
          trendDirection = 'declining';
        }
      }

      // Generate recommendations
      const recommendations = [];
      if (status === 'at_risk') {
        const sessionsNeeded = Math.ceil((subject.required_threshold / 100) * subject.total_sessions) - subject.total_attended;
        recommendations.push(`Attend next ${sessionsNeeded} sessions to meet minimum requirements`);
      } else if (status === 'warning') {
        recommendations.push(`Attend next 2 sessions to maintain good standing`);
      }

      if (subject.sessions_by_type.has('tutorial')) {
        const tutorialPerf = subject.sessions_by_type.get('tutorial');
        if (tutorialPerf.percentage < overallPercentage - 10) {
          recommendations.push('Focus on tutorial attendance');
        }
      }

      return {
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        subject_code: subject.subject_code,
        overall_attendance: {
          percentage: Math.round(overallPercentage * 100) / 100,
          sessions_attended: subject.total_attended,
          total_sessions: subject.total_sessions,
          required_threshold: subject.required_threshold,
          status
        },
        session_breakdown: Array.from(subject.sessions_by_type.entries()).map(([type, data]) => ({
          session_type: type,
          attended: data.attended,
          total: data.total,
          percentage: Math.round(data.percentage * 100) / 100
        })),
        recent_trend: {
          last_5_sessions: subject.recent_sessions.slice(0, 5),
          trend_direction: trendDirection
        },
        recommendations
      };
    });

    return NextResponse.json({
      message: "Subject performance analysis retrieved successfully",
      data: subjectPerformance
    });
  } catch (err) {
    console.error("[GET_STUDENT_SUBJECT_PERFORMANCE]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}