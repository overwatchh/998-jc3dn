import { NextRequest, NextResponse } from "next/server"
import { GroupedCourse, RawSessionRow } from "@/types/course"
import { ApiArrayResponse } from "@/types/api"
import { rawQuery } from "@/lib/server/query"
import { groupByCourse } from "@/lib/server/process-data"
/**
 * @openapi
 * /api/admin/courses:
 *   get:
 *     summary: Get course list with grouped sessions
 *     description: >
 *       Returns a list of all courses with their corresponding weekly course sessions,
 *       grouped by course. Allows filtering by course status (`active` or `finished`).
 *     parameters:
 *       - in: query
 *         name: course_status
 *         schema:
 *           type: string
 *           enum: [active, finished]
 *         required: false
 *         description: Filter by course status (e.g., "active" or "finished")
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: List of courses with grouped sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   course_id:
 *                     type: integer
 *                   course_name:
 *                     type: string
 *                   course_code:
 *                     type: string
 *                   course_status:
 *                     type: string
 *                     enum: [active, finished]
 *                   semester_name:
 *                     type: string
 *                     enum: [autumn, spring, summer]
 *                   semester_year:
 *                     type: integer
 *                   sessions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         session_id:
 *                           type: integer
 *                         session_type:
 *                           type: string
 *                           enum: [lecture, lab]
 *                         day_of_week:
 *                           type: string
 *                         start_time:
 *                           type: string
 *                           format: time
 *                         end_time:
 *                           type: string
 *                           format: time
 *                         location:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             location_id:
 *                               type: integer
 *                             building_name:
 *                               type: string
 *                             room_number:
 *                               type: string
 *                             latitude:
 *                               type: string
 *                             longitude:
 *                               type: string
 *       500:
 *         description: Server error
 */

export async function GET(req: NextRequest) {
  //Parse query param from URL
  const { searchParams } = new URL(req.url)
  const courseStatus = searchParams.get("course_status")

  //Validate payload
  const validStatuses = ["active", "finished"]

  if (courseStatus && !validStatuses.includes(courseStatus)) {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid course_status value. Expected 'active' or 'finished', got '${courseStatus}'`,
        count: 0,
        data: [],
      },
      { status: 400 }
    )
  }

  const sql = `
    SELECT 
      cs.id AS session_id,
      cs.type AS session_type,
      cs.day_of_week,
      cs.start_time,
      cs.end_time,
      c.id AS course_id,
      c.name AS course_name,
      c.code AS course_code,
      c.status AS course_status,
      s.name AS semester_name,
      s.year AS semester_year,
      l.id AS location_id,
      l.building_name,
      l.room_number,
      l.description,
      l.latitude,
      l.longitude
    FROM course_sessions cs
    JOIN courses c ON cs.course_id = c.id
    JOIN semesters s ON c.semester_id = s.id
    LEFT JOIN locations l ON cs.location_id = l.id
    ${courseStatus ? "WHERE c.status = ?" : ""}
    ORDER BY s.year DESC, s.name, c.code, cs.day_of_week, cs.start_time
  `

  const rows = await rawQuery<RawSessionRow>(
    sql,
    courseStatus ? [courseStatus] : []
  )

  const groupedCourses = groupByCourse(rows)
  const apiResponse: ApiArrayResponse<GroupedCourse[]> = {
    message: "Courses fetched successfully",
    count: groupedCourses.length,
    data: groupedCourses,
  }

  return NextResponse.json(apiResponse)
}
