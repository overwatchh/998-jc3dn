/**
 * @openapi
 * /api/lecturer/subjects:
 *   get:
 *     summary: Get subjects with grouped study sessions taught by a lecturer
 *     description: Returns a list of subjects that the lecturer teaches, including semester information and grouped study sessions. The user must be authenticated and have the role of 'lecturer'.
 *     tags:
 *       - Lecturer
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of enrolled subjects with grouped study sessions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fetched enrolled subjects successfully
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subject_id:
 *                         type: integer
 *                         example: 4
 *                       subject_name:
 *                         type: string
 *                         example: Web server programming DTN939
 *                       subject_code:
 *                         type: string
 *                         example: MTS9307
 *                       semester_name:
 *                         type: string
 *                         enum: [autumn, spring, summer]
 *                         example: spring
 *                       semester_year:
 *                         type: integer
 *                         example: 2025
 *                       study_sessions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             study_session_id:
 *                               type: integer
 *                               example: 11
 *                             day_of_week:
 *                               type: string
 *                               example: Tuesday
 *                             start_time:
 *                               type: string
 *                               example: "10:00:00"
 *                             end_time:
 *                               type: string
 *                               example: "12:00:00"
 *                             session_type:
 *                               type: string
 *                               enum: [lecture, tutorial]
 *                               example: lecture
 *                             location:
 *                               type: object
 *                               properties:
 *                                 building_number:
 *                                   type: string
 *                                   example: "17"
 *                                 room_number:
 *                                   type: string
 *                                   example: "101"
 *                                 room_description:
 *                                   type: string
 *                                   example: Library
 *                                 campus_name:
 *                                   type: string
 *                                   example: Wollongong
 *       401:
 *         description: User is not authenticated or does not have the student role.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorised access. Student role required.
 */
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { ApiArrayResponse } from "@/types/api";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { GroupedSubject, RawSubjectRow } from "./type";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  }
  // ensure proper user role
  if (session.user.role !== "lecturer") {
    return NextResponse.json(
      { message: "Forbidden: Only lecturers can access this." },
      { status: 403 }
    );
  }

  try {
    const lecturer_id = session.user.id;

    const sql = ` SELECT
      sub.id AS subject_id,
      sub.name AS subject_name,
      sub.code AS subject_code,
      sem.name AS semester_name,
      sem.year AS semester_year,
      ss.id AS study_session_id,
      ss.day_of_week,
      ss.start_time,
      ss.end_time,
      ss.type AS session_type,
      ro.building_number AS building_number,
      ro.room_number AS room_number,
      ro.description AS room_description,
      cam.name AS campus_name
    

FROM lecturer_study_session lss
JOIN study_session ss ON lss.study_session_id = ss.id
JOIN subject_study_session sss ON ss.id = sss.study_session_id
JOIN subject sub ON sss.subject_id = sub.id
JOIN semester sem ON sub.semester_id = sem.id
JOIN room ro ON ss.room_id = ro.id
JOIN campus cam ON ro.campus_id = cam.id


WHERE lss.lecturer_id = ?
  AND sub.status = 'Active'
  
ORDER BY sub.id,
         FIELD(ss.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
         ss.start_time;
`;

    const subjects = await rawQuery<RawSubjectRow>(sql, [lecturer_id]);
    const grouped: GroupedSubject[] = [];

    subjects.forEach(row => {
      // Check if the subject already exists in the grouped array
      let subject = grouped.find(s => s.subject_id === row.subject_id);

      if (!subject) {
        subject = {
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          subject_code: row.subject_code,
          semester_name: row.semester_name,
          semester_year: row.semester_year,
          study_sessions: [],
        } as GroupedSubject;
        grouped.push(subject);
      }

      // Add the study session
      subject.study_sessions.push({
        study_session_id: row.study_session_id,
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
        session_type: row.session_type,
        location: {
          building_number: row.building_number,
          room_number: row.room_number,
          room_description: row.room_description,
          campus_name: row.campus_name,
        },
      });
    });

    const response: ApiArrayResponse<GroupedSubject[]> = {
      message: "Fetched taught subjects successfully",
      count: grouped.length,
      data: grouped,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET_LECTURER_SUBJECTS]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
