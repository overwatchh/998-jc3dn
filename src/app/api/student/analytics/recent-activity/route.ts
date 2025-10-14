import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/student/analytics/recent-activity:
 *   get:
 *     tags:
 *       - Student Analytics
 *     summary: Get recent attendance activity and upcoming sessions
 *     description: Returns recent check-ins, missed sessions, and upcoming sessions for the student
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent activities to return
 *     responses:
 *       200:
 *         description: Successfully retrieved recent activity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recent attendance activity retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     recent_checkins:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subject_name:
 *                             type: string
 *                             example: Physics 301
 *                           subject_code:
 *                             type: string
 *                             example: PHYS301
 *                           session_type:
 *                             type: string
 *                             enum: [lecture, tutorial]
 *                             example: lecture
 *                           checkin_time:
 *                             type: string
 *                             format: datetime
 *                             example: "2024-03-15T10:15:30Z"
 *                           week_number:
 *                             type: integer
 *                             example: 8
 *                           location:
 *                             type: object
 *                             properties:
 *                               building_number:
 *                                 type: string
 *                                 example: "17"
 *                               room_number:
 *                                 type: string
 *                                 example: "101"
 *                               campus_name:
 *                                 type: string
 *                                 example: Wollongong
 *                     missed_sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subject_name:
 *                             type: string
 *                             example: Chemistry 301
 *                           subject_code:
 *                             type: string
 *                             example: CHEM301
 *                           session_type:
 *                             type: string
 *                             enum: [lecture, tutorial]
 *                             example: tutorial
 *                           week_number:
 *                             type: integer
 *                             example: 7
 *                           day_of_week:
 *                             type: string
 *                             example: Tuesday
 *                           start_time:
 *                             type: string
 *                             format: time
 *                             example: "14:00:00"
 *                           end_time:
 *                             type: string
 *                             format: time
 *                             example: "16:00:00"
 *                           location:
 *                             type: object
 *                             properties:
 *                               building_number:
 *                                 type: string
 *                                 example: "15"
 *                               room_number:
 *                                 type: string
 *                                 example: "203"
 *                               campus_name:
 *                                 type: string
 *                                 example: Wollongong
 *                     upcoming_sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subject_name:
 *                             type: string
 *                             example: Biology 301
 *                           subject_code:
 *                             type: string
 *                             example: BIOL301
 *                           session_type:
 *                             type: string
 *                             enum: [lecture, tutorial]
 *                             example: lecture
 *                           week_number:
 *                             type: integer
 *                             example: 9
 *                           day_of_week:
 *                             type: string
 *                             example: Wednesday
 *                           start_time:
 *                             type: string
 *                             format: time
 *                             example: "09:00:00"
 *                           end_time:
 *                             type: string
 *                             format: time
 *                             example: "11:00:00"
 *                           location:
 *                             type: object
 *                             properties:
 *                               building_number:
 *                                 type: string
 *                                 example: "18"
 *                               room_number:
 *                                 type: string
 *                                 example: "G01"
 *                               campus_name:
 *                                 type: string
 *                                 example: Wollongong
 *                           days_until:
 *                             type: integer
 *                             example: 2
 *                     activity_summary:
 *                       type: object
 *                       properties:
 *                         total_checkins_this_week:
 *                           type: integer
 *                           example: 3
 *                         total_missed_this_week:
 *                           type: integer
 *                           example: 1
 *                         current_streak:
 *                           type: integer
 *                           example: 5
 *                         longest_streak:
 *                           type: integer
 *                           example: 12
 *       401:
 *         description: Unauthorized - Student role required
 */

interface RecentCheckinRow {
  subject_name: string;
  subject_code: string;
  session_type: string;
  checkin_time: string;
  week_number: number;
  building_number: string;
  room_number: string;
  campus_name: string;
}

interface MissedSessionRow {
  subject_name: string;
  subject_code: string;
  session_type: string;
  week_number: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  building_number: string;
  room_number: string;
  campus_name: string;
}

interface UpcomingSessionRow {
  subject_name: string;
  subject_code: string;
  session_type: string;
  week_number: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  building_number: string;
  room_number: string;
  campus_name: string;
  days_until: number;
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
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sessionType = url.searchParams.get("sessionType") || "lecture";

    // Recent check-ins
    const recentCheckinsSql = `
      SELECT
        s.name as subject_name,
        s.code as subject_code,
        ss.type as session_type,
        c.checkin_time,
        qcss.week_number,
        r.building_number,
        r.room_number,
        cam.name as campus_name
      FROM checkin c
      JOIN qr_code_study_session qcss ON c.qr_code_study_session_id = qcss.id
      JOIN study_session ss ON qcss.study_session_id = ss.id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON sss.subject_id = s.id
      JOIN room r ON ss.room_id = r.id
      JOIN campus cam ON r.campus_id = cam.id
      WHERE c.student_id = ?
        AND s.status = 'active'
        AND ss.type = ?
      ORDER BY c.checkin_time DESC
      LIMIT ?;
    `;

    // Missed sessions (sessions that happened but student didn't attend)
    const missedSessionsSql = `
      SELECT
        s.name as subject_name,
        s.code as subject_code,
        ss.type as session_type,
        qcss.week_number,
        ss.day_of_week,
        ss.start_time,
        ss.end_time,
        r.building_number,
        r.room_number,
        cam.name as campus_name
      FROM enrolment e
      JOIN subject s ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON sss.study_session_id = ss.id
      JOIN qr_code_study_session qcss ON qcss.study_session_id = ss.id
      JOIN room r ON ss.room_id = r.id
      JOIN campus cam ON r.campus_id = cam.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qcss.id AND c.student_id = e.student_id
      WHERE e.student_id = ?
        AND s.status = 'active'
        AND ss.type = ?
        AND qcss.week_number <= WEEK(CURDATE())
        AND qcss.week_number >= WEEK(CURDATE()) - 4
        AND c.student_id IS NULL
      ORDER BY qcss.week_number DESC, ss.start_time DESC
      LIMIT ?;
    `;

    // Upcoming sessions
    const upcomingSessionsSql = `
      SELECT
        s.name as subject_name,
        s.code as subject_code,
        ss.type as session_type,
        qcss.week_number,
        ss.day_of_week,
        ss.start_time,
        ss.end_time,
        r.building_number,
        r.room_number,
        cam.name as campus_name,
        DATEDIFF(
          DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
                   INTERVAL (qcss.week_number - WEEK(CURDATE())) * 7 +
                           CASE ss.day_of_week
                             WHEN 'Monday' THEN 0
                             WHEN 'Tuesday' THEN 1
                             WHEN 'Wednesday' THEN 2
                             WHEN 'Thursday' THEN 3
                             WHEN 'Friday' THEN 4
                             WHEN 'Saturday' THEN 5
                             WHEN 'Sunday' THEN 6
                           END DAY),
          CURDATE()
        ) as days_until
      FROM enrolment e
      JOIN subject s ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON sss.study_session_id = ss.id
      JOIN qr_code_study_session qcss ON qcss.study_session_id = ss.id
      JOIN room r ON ss.room_id = r.id
      JOIN campus cam ON r.campus_id = cam.id
      WHERE e.student_id = ?
        AND s.status = 'active'
        AND ss.type = ?
        AND qcss.week_number > WEEK(CURDATE())
        AND qcss.week_number <= WEEK(CURDATE()) + 2
      ORDER BY qcss.week_number, ss.start_time
      LIMIT ?;
    `;

    const [recentCheckins, missedSessions, upcomingSessions] =
      await Promise.all([
        rawQuery<RecentCheckinRow>(recentCheckinsSql, [
          studentId,
          sessionType,
          limit,
        ]),
        rawQuery<MissedSessionRow>(missedSessionsSql, [
          studentId,
          sessionType,
          limit,
        ]),
        rawQuery<UpcomingSessionRow>(upcomingSessionsSql, [
          studentId,
          sessionType,
          limit,
        ]),
      ]);

    // Calculate activity summary
    // Count unique sessions attended this week (with 2+ checkins = fully attended)
    const thisWeekCheckinsSql = `
      SELECT COUNT(*) as count
      FROM (
        SELECT qcss.id
        FROM checkin c
        JOIN qr_code_study_session qcss ON c.qr_code_study_session_id = qcss.id
        JOIN study_session ss ON qcss.study_session_id = ss.id
        WHERE c.student_id = ?
          AND qcss.week_number = WEEK(CURDATE())
          AND ss.type = ?
        GROUP BY qcss.id
        HAVING COUNT(c.student_id) >= 2
      ) as attended_sessions;
    `;

    const thisWeekMissedSql = `
      SELECT COUNT(*) as count
      FROM enrolment e
      JOIN subject s ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qcss ON qcss.study_session_id = ss.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qcss.id AND c.student_id = e.student_id
      WHERE e.student_id = ?
        AND s.status = 'active'
        AND ss.type = ?
        AND qcss.week_number = WEEK(CURDATE())
        AND c.student_id IS NULL;
    `;

    const [thisWeekCheckins, thisWeekMissed] = await Promise.all([
      rawQuery<{ count: number }>(thisWeekCheckinsSql, [
        studentId,
        sessionType,
      ]),
      rawQuery<{ count: number }>(thisWeekMissedSql, [studentId, sessionType]),
    ]);

    // Calculate attendance streaks using email calculator method
    // Group by week - student attended if they have at least one session with 2+ checkins that week
    const streakSql = `
      SELECT
        week_number,
        MAX(CASE WHEN checkin_count >= 2 THEN 1 ELSE 0 END) as week_attended
      FROM (
        SELECT
          qcss.week_number,
          qcss.id,
          COUNT(c.student_id) as checkin_count
        FROM enrolment e
        JOIN subject s ON e.subject_id = s.id
        JOIN subject_study_session sss ON sss.subject_id = s.id
        JOIN study_session ss ON sss.study_session_id = ss.id
        JOIN qr_code_study_session qcss ON qcss.study_session_id = ss.id
        LEFT JOIN checkin c ON c.qr_code_study_session_id = qcss.id AND c.student_id = e.student_id
        WHERE e.student_id = ?
          AND s.status = 'active'
          AND ss.type = ?
          AND qcss.week_number <= WEEK(CURDATE())
        GROUP BY qcss.week_number, qcss.id
      ) as session_checkins
      GROUP BY week_number
      ORDER BY week_number DESC;
    `;

    const streakData = await rawQuery<{
      week_number: number;
      week_attended: number;
    }>(streakSql, [studentId, sessionType]);

    // Calculate current streak (consecutive weeks with at least one fully attended session)
    let currentStreak = 0;
    for (const week of streakData) {
      const attended = parseInt(String(week.week_attended)) || 0;
      // Week is attended if student has at least one session with 2+ checkins
      if (attended === 1) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    for (const week of streakData.reverse()) {
      // Reverse to go from oldest to newest
      const attended = parseInt(String(week.week_attended)) || 0;
      if (attended === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const response = {
      message: "Recent attendance activity retrieved successfully",
      data: {
        recent_checkins: recentCheckins.map(checkin => ({
          subject_name: checkin.subject_name,
          subject_code: checkin.subject_code,
          session_type: checkin.session_type,
          checkin_time: checkin.checkin_time,
          week_number: checkin.week_number,
          location: {
            building_number: checkin.building_number,
            room_number: checkin.room_number,
            campus_name: checkin.campus_name,
          },
        })),
        missed_sessions: missedSessions.map(missed => ({
          subject_name: missed.subject_name,
          subject_code: missed.subject_code,
          session_type: missed.session_type,
          week_number: missed.week_number,
          day_of_week: missed.day_of_week,
          start_time: missed.start_time,
          end_time: missed.end_time,
          location: {
            building_number: missed.building_number,
            room_number: missed.room_number,
            campus_name: missed.campus_name,
          },
        })),
        upcoming_sessions: upcomingSessions.map(upcoming => ({
          subject_name: upcoming.subject_name,
          subject_code: upcoming.subject_code,
          session_type: upcoming.session_type,
          week_number: upcoming.week_number,
          day_of_week: upcoming.day_of_week,
          start_time: upcoming.start_time,
          end_time: upcoming.end_time,
          location: {
            building_number: upcoming.building_number,
            room_number: upcoming.room_number,
            campus_name: upcoming.campus_name,
          },
          days_until: upcoming.days_until,
        })),
        activity_summary: {
          total_checkins_this_week: thisWeekCheckins[0]?.count || 0,
          total_missed_this_week: thisWeekMissed[0]?.count || 0,
          current_streak: currentStreak,
          longest_streak: longestStreak,
        },
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET_STUDENT_RECENT_ACTIVITY]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
