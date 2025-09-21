import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/available-courses:
 *   get:
 *     summary: Get available courses for analytics
 *     description: Returns all subjects that have study sessions with attendance data for analytics dashboard dropdown selection.
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: Available courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Study session ID
 *                     example: 101
 *                   name:
 *                     type: string
 *                     example: "Web server programming DTN939"
 *                   code:
 *                     type: string
 *                     example: "MTS9307"
 *                   sessionType:
 *                     type: string
 *                     example: "lecture"
 *                   startTime:
 *                     type: string
 *                     example: "10:00"
 *                   endTime:
 *                     type: string
 *                     example: "12:00"
 *                   dayOfWeek:
 *                     type: string
 *                     example: "Tuesday"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch available courses"
 */
export async function GET(_request: NextRequest) {
  try {
    // Get all subjects that have study sessions with attendance data
    const query = `
      SELECT DISTINCT
          s.id,
          s.code,
          s.name,
          'lecture' as session_type,
          MIN(ss.start_time) as start_time,
          MAX(ss.end_time) as end_time,
          GROUP_CONCAT(DISTINCT ss.day_of_week ORDER BY
            CASE ss.day_of_week
              WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
              WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
              WHEN 'Sunday' THEN 7 END
          ) as day_of_week
      FROM subject s
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      JOIN checkin c ON qrss.id = c.qr_code_study_session_id
      WHERE s.status = 'active'
      GROUP BY s.id, s.code, s.name
      ORDER BY s.code
    `;

    const courses = await rawQuery(query, []);

    // Transform to match the expected format
    const transformedCourses = courses.map((course: {
      id: number;
      name: string;
      code: string;
      session_type: string;
      start_time?: string;
      end_time?: string;
      day_of_week: string;
    }) => ({
      id: course.id, // Use subject ID for analytics API consistency
      name: course.name,
      code: course.code,
      sessionType: course.session_type,
      startTime: course.start_time?.slice(0, 5) || '',
      endTime: course.end_time?.slice(0, 5) || '',
      dayOfWeek: course.day_of_week,
    }));

    // console.log('Available courses for analytics:', transformedCourses); // Removed for production

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error('Available courses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch available courses' }, { status: 500 });
  }
}