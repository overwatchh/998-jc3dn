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
 *                               enum: [lecture, lab, tutorial]
 *                               example: lab
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
 *                   example: Unauthorized access. Student role required.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const response = {
    message: "Fetched teaches subjects successfully",
    count: 2,
    data: [
      {
        subject_id: 4,
        subject_name: "Web server programming DTN939",
        subject_code: "MTS9307",
        semester_name: "spring",
        semester_year: 2025,
        study_sessions: [
          {
            study_session_id: 10,
            day_of_week: "Monday",
            start_time: "13:00:00",
            end_time: "15:00:00",
            session_type: "lecture",
            location: {
              building_number: "67",
              room_number: "202",
              room_description: "Building 67",
              campus_name: "Sydney",
            },
          },
        ],
      },
      {
        subject_id: 6,
        subject_name: "Computer vision algorithms and systems",
        subject_code: "CSCI435",
        semester_name: "spring",
        semester_year: 2025,
        study_sessions: [
          {
            study_session_id: 14,
            day_of_week: "Wednesday",
            start_time: "15:00:00",
            end_time: "17:00:00",
            session_type: "lab",
            location: {
              building_number: "20",
              room_number: "102",
              room_description: "Building 20",
              campus_name: "Wollongong",
            },
          },
        ],
      },
    ],
  };
  return NextResponse.json(response, { status: 200 });
}
