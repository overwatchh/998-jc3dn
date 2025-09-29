import { db } from "@/lib/server/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionType = searchParams.get("sessionType");

    // Base query for day-of-week patterns
    let query = `
      SELECT
        DAYNAME(c.checkin_time) as day_name,
        DAYOFWEEK(c.checkin_time) as day_number,
        COUNT(*) as total_checkins,
        COUNT(DISTINCT c.student_id) as unique_students,
        ROUND(AVG(CASE
          WHEN c.checkin_time <= DATE_ADD(
            CONCAT(DATE(c.checkin_time), ' ', ss.start_time),
            INTERVAL 15 MINUTE
          ) THEN 1 ELSE 0 END) * 100, 1) as on_time_percentage,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as distribution_percentage
      FROM checkin c
      JOIN qr_code_study_session qcss ON c.qr_code_study_session_id = qcss.id
      JOIN study_session ss ON qcss.study_session_id = ss.id
    `;

    // Add session type filter if specified
    if (sessionType && sessionType !== "both") {
      query += ` WHERE ss.type = ?`;
    }

    query += `
      GROUP BY DAYNAME(c.checkin_time), DAYOFWEEK(c.checkin_time)
      ORDER BY DAYOFWEEK(c.checkin_time)
    `;

    const params = sessionType && sessionType !== "both" ? [sessionType] : [];
    const [results] = await db.execute(query, params);

    // Format results for frontend
    const dayPatterns = (results as any[]).map(row => ({
      day: row.day_name,
      dayNumber: row.day_number,
      totalCheckins: row.total_checkins,
      uniqueStudents: row.unique_students,
      onTimePercentage: parseFloat(row.on_time_percentage) || 0,
      distributionPercentage: parseFloat(row.distribution_percentage) || 0,
    }));

    // Get peak hours for each day
    const peakHoursQuery = `
      SELECT
        DAYNAME(c.checkin_time) as day_name,
        HOUR(c.checkin_time) as hour,
        COUNT(*) as checkin_count
      FROM checkin c
      JOIN qr_code_study_session qcss ON c.qr_code_study_session_id = qcss.id
      JOIN study_session ss ON qcss.study_session_id = ss.id
      ${sessionType && sessionType !== "both" ? "WHERE ss.type = ?" : ""}
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
        count: row.checkin_count
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
      peakHour: peakHoursByDay[pattern.day] || null
    }));

    // Calculate summary statistics
    const totalCheckins = dayPatterns.reduce((sum, day) => sum + day.totalCheckins, 0);
    const averageOnTime = dayPatterns.reduce((sum, day) => sum + day.onTimePercentage, 0) / dayPatterns.length;

    const busiestDay = dayPatterns.reduce((max, day) =>
      day.totalCheckins > max.totalCheckins ? day : max, dayPatterns[0] || { day: "N/A", totalCheckins: 0 });

    const bestAttendanceDay = dayPatterns.reduce((max, day) =>
      day.onTimePercentage > max.onTimePercentage ? day : max, dayPatterns[0] || { day: "N/A", onTimePercentage: 0 });

    return NextResponse.json({
      patterns: enhancedPatterns,
      summary: {
        totalCheckins,
        averageOnTimePercentage: Math.round(averageOnTime * 10) / 10,
        busiestDay: busiestDay.day,
        bestAttendanceDay: bestAttendanceDay.day,
        daysWithData: dayPatterns.length
      }
    });

  } catch (error) {
    console.error("Error fetching day-of-week patterns:", error);
    return NextResponse.json(
      { error: "Failed to fetch day-of-week attendance patterns" },
      { status: 500 }
    );
  }
}