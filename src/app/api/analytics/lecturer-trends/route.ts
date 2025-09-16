import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/lecturer-trends:
 *   get:
 *     summary: Get comprehensive lecturer performance analytics
 *     description: Returns detailed analytics including subject performance, weekly trends, and performance insights for lecturers. Can be filtered by specific study session.
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
 *     responses:
 *       200:
 *         description: Lecturer trends data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalSubjects:
 *                       type: integer
 *                       example: 4
 *                     totalStudents:
 *                       type: integer
 *                       example: 100
 *                     overallAverage:
 *                       type: number
 *                       format: float
 *                       example: 75.5
 *                     performanceLevels:
 *                       type: object
 *                       properties:
 *                         excellent:
 *                           type: integer
 *                           example: 1
 *                         good:
 *                           type: integer
 *                           example: 2
 *                         average:
 *                           type: integer
 *                           example: 1
 *                         needs_improvement:
 *                           type: integer
 *                           example: 0
 *                     trendDirection:
 *                       type: string
 *                       enum: [improving, declining, stable]
 *                       example: "improving"
 *                 subjectPerformance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subject_code:
 *                         type: string
 *                         example: "MTS9307"
 *                       subject_name:
 *                         type: string
 *                         example: "Web server programming DTN939"
 *                       total_students:
 *                         type: integer
 *                         example: 25
 *                       total_weeks:
 *                         type: integer
 *                         example: 12
 *                       average_attendance:
 *                         type: number
 *                         format: float
 *                         example: 78.5
 *                       at_risk_count:
 *                         type: integer
 *                         example: 5
 *                       performance_level:
 *                         type: string
 *                         enum: [excellent, good, average, needs_improvement]
 *                         example: "good"
 *                 weeklyProgression:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       week_number:
 *                         type: integer
 *                         example: 1
 *                       week_label:
 *                         type: string
 *                         example: "Week 1"
 *                       attendance_rate:
 *                         type: number
 *                         format: float
 *                         example: 85.0
 *                 engagementPatterns:
 *                   type: array
 *                   description: Future implementation for engagement patterns
 *                 insights:
 *                   type: object
 *                   properties:
 *                     bestPerformingSubject:
 *                       type: object
 *                       nullable: true
 *                     worstPerformingSubject:
 *                       type: object
 *                       nullable: true
 *                     peakEngagementDay:
 *                       type: string
 *                       nullable: true
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch lecturer trends data"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('subjectId'); // This is actually a study_session_id

    // Get simple subject performance
    const subjectPerformanceQuery = `
      SELECT
          s.code as subject_code,
          s.name as subject_name,
          COUNT(DISTINCT e.student_id) as total_students,
          COUNT(DISTINCT qrss.week_number) as total_weeks,
          ROUND((COUNT(DISTINCT CASE WHEN c.student_id IS NOT NULL THEN CONCAT(qrss.week_number, '-', e.student_id) END) /
               (COUNT(DISTINCT qrss.week_number) * COUNT(DISTINCT e.student_id))) * 100, 1) as average_attendance
      FROM subject s
      JOIN enrolment e ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = e.student_id
      WHERE ss.type = 'lecture' ${courseId ? 'AND ss.id = ?' : ''}
      GROUP BY s.id, s.code, s.name
      ORDER BY average_attendance DESC
    `;

    // Get weekly trends
    const weeklyTrendsQuery = `
      SELECT
          qrss.week_number,
          CONCAT('Week ', qrss.week_number) as week_label,
          ROUND((COUNT(DISTINCT c.student_id) / COUNT(DISTINCT e.student_id)) * 100, 1) as attendance_rate
      FROM qr_code_study_session qrss
      JOIN study_session ss ON ss.id = qrss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      JOIN enrolment e ON e.subject_id = s.id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qrss.id AND c.student_id = e.student_id
      WHERE ss.type = 'lecture' ${courseId ? 'AND ss.id = ?' : ''}
      GROUP BY qrss.week_number
      ORDER BY qrss.week_number
    `;

    const params = courseId ? [parseInt(courseId)] : [];

    const [subjectPerformance, weeklyTrends] = await Promise.all([
      rawQuery(subjectPerformanceQuery, params),
      rawQuery(weeklyTrendsQuery, params)
    ]);

    // Debug the raw data (removed for production)

    // Calculate summary statistics
    const totalSubjects = subjectPerformance.length;
    const totalStudents = subjectPerformance.reduce((sum, subject) => sum + (subject.total_students || 0), 0);

    // Convert string values to numbers and filter valid attendance values
    const validAttendanceValues = subjectPerformance
      .map(subject => ({
        ...subject,
        average_attendance: parseFloat(subject.average_attendance) || 0
      }))
      .filter(subject => !isNaN(subject.average_attendance) && subject.average_attendance > 0);

    const overallAverage = validAttendanceValues.length > 0
      ? Math.round(validAttendanceValues.reduce((sum, subject) => sum + subject.average_attendance, 0) / validAttendanceValues.length * 10) / 10
      : 0;

    // Add performance levels to subjects
    const subjectsWithPerformance = subjectPerformance.map(subject => {
      const attendance = parseFloat(subject.average_attendance) || 0;
      return {
        ...subject,
        average_attendance: attendance, // Convert to number
        at_risk_count: Math.floor(subject.total_students * 0.2), // Estimate 20% might be at risk
        performance_level: attendance >= 85 ? 'excellent' :
                          attendance >= 75 ? 'good' :
                          attendance >= 65 ? 'average' : 'needs_improvement'
      };
    });

    const performanceLevels = {
      excellent: subjectsWithPerformance.filter(s => s.performance_level === 'excellent').length,
      good: subjectsWithPerformance.filter(s => s.performance_level === 'good').length,
      average: subjectsWithPerformance.filter(s => s.performance_level === 'average').length,
      needs_improvement: subjectsWithPerformance.filter(s => s.performance_level === 'needs_improvement').length
    };

    // Convert weekly trends to numbers and calculate trend direction
    const weeklyTrendsWithNumbers = weeklyTrends.map(week => ({
      ...week,
      attendance_rate: parseFloat(week.attendance_rate) || 0
    }));

    const recentWeeks = weeklyTrendsWithNumbers.slice(-4);
    const trendDirection = recentWeeks.length >= 2
      ? recentWeeks[recentWeeks.length - 1].attendance_rate - recentWeeks[0].attendance_rate
      : 0;

    const responseData = {
      summary: {
        totalSubjects,
        totalStudents,
        overallAverage,
        performanceLevels,
        trendDirection: trendDirection > 0 ? 'improving' : trendDirection < 0 ? 'declining' : 'stable'
      },
      subjectPerformance: subjectsWithPerformance,
      weeklyProgression: weeklyTrendsWithNumbers,
      engagementPatterns: [], // Simplified for now
      insights: {
        bestPerformingSubject: subjectsWithPerformance.length > 0 ? subjectsWithPerformance[0] : null,
        worstPerformingSubject: subjectsWithPerformance.length > 0 ? subjectsWithPerformance[subjectsWithPerformance.length - 1] : null,
        peakEngagementDay: null
      }
    };

    // console.log('Final API response:', responseData); // Removed for production
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Lecturer trends API error:', error);
    return NextResponse.json({ error: 'Failed to fetch lecturer trends data' }, { status: 500 });
  }
}