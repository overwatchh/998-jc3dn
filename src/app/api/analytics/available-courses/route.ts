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
          ss.id as study_session_id,
          ss.type as session_type,
          ss.start_time,
          ss.end_time,
          ss.day_of_week
      FROM subject s
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN study_session ss ON ss.id = sss.study_session_id
      JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      WHERE ss.type = 'lecture'
        AND s.status = 'Active'
      ORDER BY s.code, ss.start_time
    `;

    interface RawCourseRow {
      id: number;
      code: string;
      name: string;
      study_session_id: number;
      session_type: string;
      start_time: string;
      end_time: string;
      day_of_week: string;
    }
    const courses = await rawQuery<RawCourseRow>(query, []);

    // Transform to match the expected format
    const transformedCourses = courses.map(course => ({
      id: course.study_session_id,
      name: course.name,
      code: course.code,
      sessionType: course.session_type,
      startTime: course.start_time?.slice(0, 5) || "",
      endTime: course.end_time?.slice(0, 5) || "",
      dayOfWeek: course.day_of_week,
    }));

    // console.log('Available courses for analytics:', transformedCourses); // Removed for production

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error("Available courses API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch available courses" },
      { status: 500 }
    );
  }
}
