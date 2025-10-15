import { db } from "@/lib/server/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionType = searchParams.get("sessionType");
    const subjectId = searchParams.get("subjectId");
    // Note: tutorialSessionId is intentionally ignored for day-of-week patterns
    // This analysis only makes sense when comparing across multiple sessions on different days

    // Base query for day-of-week patterns
    let query = `
      SELECT
        DAYNAME(c.checkin_time) as day_name,
        DAYOFWEEK(c.checkin_time) as day_number,
        COUNT(*) as total_checkins,
        COUNT(DISTINCT c.student_id) as unique_students,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as distribution_percentage
      FROM checkin c
      JOIN qr_code_study_session qcss ON c.qr_code_study_session_id = qcss.id
      JOIN study_session ss ON qcss.study_session_id = ss.id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
    `;

    // Add filters
    const params: (string | number)[] = [];
    const conditions = [];

    if (sessionType && sessionType !== "both") {
      conditions.push("ss.type = ?");
      params.push(sessionType);
    }

    if (subjectId && subjectId !== "all") {
      conditions.push("sss.subject_id = ?");
      params.push(parseInt(subjectId));
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += `
      GROUP BY DAYNAME(c.checkin_time), DAYOFWEEK(c.checkin_time)
      ORDER BY DAYOFWEEK(c.checkin_time)
    `;
    const [results] = await db.execute(query, params);

    // Format results for frontend
    const dayPatterns = (results as any[]).map(row => ({
      day: row.day_name,
      dayNumber: row.day_number,
      totalCheckins: row.total_checkins,
      uniqueStudents: row.unique_students,
      distributionPercentage: parseFloat(row.distribution_percentage) || 0,
    }));

    // Get peak hours for each day
    const peakConditions = [];
    if (sessionType && sessionType !== "both") {
      peakConditions.push("ss.type = ?");
    }
    if (subjectId && subjectId !== "all") {
      peakConditions.push("sss.subject_id = ?");
    }

    const whereClause =
      peakConditions.length > 0 ? `WHERE ${peakConditions.join(" AND ")}` : "";

    const peakHoursQuery = `
      SELECT
        DAYNAME(c.checkin_time) as day_name,
        HOUR(c.checkin_time) as hour,
        COUNT(*) as checkin_count
      FROM checkin c
      JOIN qr_code_study_session qcss ON c.qr_code_study_session_id = qcss.id
      JOIN study_session ss ON qcss.study_session_id = ss.id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      ${whereClause}
      GROUP BY day_name, hour
      ORDER BY day_name, checkin_count DESC
    `;

    const [peakResults] = await db.execute(peakHoursQuery, params);

    // Group peak hours by day
    const peakHoursByDay = (peakResults as any[]).reduce((acc, row) => {
      if (!acc[row.day_name]) {
        acc[row.day_name] = [];
      }
      acc[row.day_name].push({
        hour: row.hour,
        count: row.checkin_count,
      });
      return acc;
    }, {});

    // Get the top peak hour for each day
    Object.keys(peakHoursByDay).forEach(day => {
      peakHoursByDay[day] = peakHoursByDay[day][0]?.hour || null;
    });

    // Add peak hours to day patterns
    const enhancedPatterns = dayPatterns.map(pattern => ({
      ...pattern,
      peakHour: peakHoursByDay[pattern.day] || null,
    }));

    // Calculate summary statistics
    const totalCheckins = dayPatterns.reduce(
      (sum, day) => sum + day.totalCheckins,
      0
    );

    const busiestDay = dayPatterns.reduce(
      (max, day) => (day.totalCheckins > max.totalCheckins ? day : max),
      dayPatterns[0] || { day: "N/A", totalCheckins: 0 }
    );

    const bestDistributionDay = dayPatterns.reduce(
      (max, day) =>
        day.distributionPercentage > max.distributionPercentage ? day : max,
      dayPatterns[0] || { day: "N/A", distributionPercentage: 0 }
    );

    return NextResponse.json({
      patterns: enhancedPatterns,
      summary: {
        totalCheckins,
        busiestDay: busiestDay.day,
        bestAttendanceDay: bestDistributionDay.day,
        daysWithData: dayPatterns.length,
      },
    });
  } catch (error) {
    console.error("Error fetching day-of-week patterns:", error);
    return NextResponse.json(
      { error: "Failed to fetch day-of-week attendance patterns" },
      { status: 500 }
    );
  }
}
