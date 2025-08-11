import { auth } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/server/query"; // Update based on your DB client
import { headers } from "next/headers";
import { EnrolledCourse } from "@/types/course";
import { ApiArrayResponse } from "@/types/api";
/**
 * @openapi
 * /api/student/courses:
 *   get:
 *     summary: Get enrolled courses for the current logged in student
 *     description: Returns a list of courses that the currently logged-in student is enrolled in. The user must be authenticated and have the role of 'student'.
 *     tags:
 *       - Student
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of enrolled courses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fetched enrolled courses successfully.
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseId:
 *                         type: integer
 *                         example: 101
 *                       courseName:
 *                         type: string
 *                         example: Introduction to Databases
 *                       courseCode:
 *                         type: string
 *                         example: CS202
 *                       status:
 *                         type: string
 *                         enum: [active, finished]
 *                         example: active
 *                       semesterName:
 *                         type: string
 *                         enum: [spring, autumn, summer]
 *                         example: spring
 *                       semesterYear:
 *                         type: integer
 *                         example: 2025
 *       401:
 *         description: User is not authenticated or not a student.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access. Student role required.
 */

export async function GET() {
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

    const sql = ` SELECT
      c.id AS courseId,
      c.name AS courseName,
      c.code AS courseCode,
      c.status,
      s.name AS semesterName,
      s.year AS semesterYear
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN semesters s ON c.semester_id = s.id
    WHERE e.student_id = ?`;

    const courses = await rawQuery<EnrolledCourse>(sql, [studentId]);
    const response: ApiArrayResponse<EnrolledCourse[]> = {
      message: "Fetched enrolled courses successfully",
      count: courses.length,
      data: courses,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET_STUDENT_COURSES]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
