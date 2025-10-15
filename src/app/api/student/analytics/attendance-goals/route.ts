import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/student/analytics/attendance-goals:
 *   get:
 *     tags:
 *       - Student Analytics
 *     summary: Get attendance goals and progress tracking
 *     description: Returns progress toward attendance requirements and goals for each subject with projections
 *     responses:
 *       200:
 *         description: Successfully retrieved attendance goals and progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance goals and progress retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall_goal:
 *                       type: object
 *                       properties:
 *                         target_percentage:
 *                           type: number
 *                           format: float
 *                           example: 85.0
 *                         current_percentage:
 *                           type: number
 *                           format: float
 *                           example: 82.3
 *                         progress:
 *                           type: number
 *                           format: float
 *                           example: 96.8
 *                         status:
 *                           type: string
 *                           enum: [on_track, behind, ahead]
 *                           example: behind
 *                     subject_goals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subject_id:
 *                             type: integer
 *                             example: 1
 *                           subject_name:
 *                             type: string
 *                             example: Physics 301
 *                           subject_code:
 *                             type: string
 *                             example: PHYS301
 *                           required_percentage:
 *                             type: number
 *                             format: float
 *                             example: 80.0
 *                           current_percentage:
 *                             type: number
 *                             format: float
 *                             example: 75.0
 *                           sessions_attended:
 *                             type: integer
 *                             example: 9
 *                           total_sessions:
 *                             type: integer
 *                             example: 12
 *                           remaining_sessions:
 *                             type: integer
 *                             example: 4
 *                           sessions_needed:
 *                             type: integer
 *                             example: 3
 *                           can_achieve_goal:
 *                             type: boolean
 *                             example: true
 *                           projection:
 *                             type: object
 *                             properties:
 *                               if_perfect_attendance:
 *                                 type: number
 *                                 format: float
 *                                 example: 81.25
 *                               minimum_sessions_needed:
 *                                 type: integer
 *                                 example: 3
 *                           status:
 *                             type: string
 *                             enum: [achieved, on_track, at_risk, impossible]
 *                             example: at_risk
 *                           recommendation:
 *                             type: string
 *                             example: "Must attend at least 3 of the remaining 4 sessions"
 *       401:
 *         description: Unauthorized - Student role required
 */

interface GoalRow {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  required_attendance_thresh: number;
  current_attendance_percentage: number;
  attended_sessions: number;
  total_sessions_so_far: number;
  total_planned_sessions: number;
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

    // Using EMAIL CALCULATOR METHOD: 2+ checkins = 100 points, 1 checkin = 50 points, 0 checkins = 0 points
    const sql = `
      SELECT
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        s.required_attendance_thresh,
        ROUND(
          (SUM(
            CASE
              WHEN checkin_counts.checkin_count >= 2 THEN 100
              WHEN checkin_counts.checkin_count = 1 THEN 50
              ELSE 0
            END
          ) / (COUNT(DISTINCT qcss.id) * 100)) * 100,
          1
        ) as current_attendance_percentage,
        COUNT(DISTINCT CASE WHEN checkin_counts.checkin_count > 0 THEN qcss.id END) as attended_sessions,
        COUNT(DISTINCT CASE WHEN qcss.week_number <= WEEK(CURDATE()) THEN qcss.id END) as total_sessions_so_far,
        COUNT(DISTINCT qcss.id) as total_planned_sessions
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
      GROUP BY s.id, s.name, s.code, s.required_attendance_thresh;
    `;

    const goalsData = await rawQuery<GoalRow>(sql, [studentId, sessionType]);

    // Calculate subject goals using email calculator percentages
    const subjectGoals = goalsData.map(row => {
      const requiredPercentage = row.required_attendance_thresh * 100;
      const currentPercentage =
        parseFloat(String(row.current_attendance_percentage)) || 0;

      const remainingSessions =
        row.total_planned_sessions - row.total_sessions_so_far;
      const requiredTotalAttended = Math.ceil(
        (requiredPercentage / 100) * row.total_planned_sessions
      );
      const sessionsNeeded = Math.max(
        0,
        requiredTotalAttended - row.attended_sessions
      );

      const canAchieveGoal = sessionsNeeded <= remainingSessions;
      const projectedWithPerfect =
        row.total_planned_sessions > 0
          ? ((row.attended_sessions + remainingSessions) /
              row.total_planned_sessions) *
            100
          : 0;

      // Determine status
      let status = "on_track";
      if (currentPercentage >= requiredPercentage) {
        status = "achieved";
      } else if (!canAchieveGoal) {
        status = "impossible";
      } else if (sessionsNeeded >= remainingSessions * 0.8) {
        status = "at_risk";
      }

      // Generate recommendation
      let recommendation = "Keep up the good work!";
      if (status === "achieved") {
        recommendation = "Goal achieved! Maintain current attendance level.";
      } else if (status === "impossible") {
        recommendation =
          "Required attendance cannot be achieved. Focus on future subjects.";
      } else if (status === "at_risk") {
        recommendation = `Must attend at least ${sessionsNeeded} of the remaining ${remainingSessions} sessions`;
      } else {
        recommendation = `Attend ${sessionsNeeded} more sessions to meet the requirement`;
      }

      return {
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        subject_code: row.subject_code,
        required_percentage: requiredPercentage,
        current_percentage: Math.round(currentPercentage * 100) / 100,
        sessions_attended: row.attended_sessions,
        total_sessions: row.total_sessions_so_far,
        remaining_sessions: remainingSessions,
        sessions_needed: sessionsNeeded,
        can_achieve_goal: canAchieveGoal,
        projection: {
          if_perfect_attendance: Math.round(projectedWithPerfect * 100) / 100,
          minimum_sessions_needed: sessionsNeeded,
        },
        status,
        recommendation,
      };
    });

    // Calculate overall goal (average of all required thresholds)
    const averageRequiredPercentage =
      goalsData.length > 0
        ? goalsData.reduce(
            (sum, row) => sum + row.required_attendance_thresh * 100,
            0
          ) / goalsData.length
        : 80;

    const totalAttended = goalsData.reduce(
      (sum, row) => sum + row.attended_sessions,
      0
    );
    const totalSessions = goalsData.reduce(
      (sum, row) => sum + row.total_sessions_so_far,
      0
    );
    const overallCurrentPercentage =
      totalSessions > 0 ? (totalAttended / totalSessions) * 100 : 0;

    const overallProgress =
      averageRequiredPercentage > 0
        ? (overallCurrentPercentage / averageRequiredPercentage) * 100
        : 0;

    let overallStatus = "on_track";
    if (overallCurrentPercentage >= averageRequiredPercentage) {
      overallStatus = "ahead";
    } else if (overallCurrentPercentage < averageRequiredPercentage - 5) {
      overallStatus = "behind";
    }

    const response = {
      message: "Attendance goals and progress retrieved successfully",
      data: {
        overall_goal: {
          target_percentage: Math.round(averageRequiredPercentage * 100) / 100,
          current_percentage: Math.round(overallCurrentPercentage * 100) / 100,
          progress: Math.round(overallProgress * 100) / 100,
          status: overallStatus,
        },
        subject_goals: subjectGoals,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET_STUDENT_ATTENDANCE_GOALS]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
