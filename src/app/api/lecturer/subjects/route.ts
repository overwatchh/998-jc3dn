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

export async function GET()





export async function GET() {
  // Hardcoded response based on db_load.sql data
  // for lecturer with id=1 
  // teaching subjects with id 4,5,7,8,9,10,11
  const response = {
    message: "Fetched teaches subjects successfully",
    count: 7,
    data: [
      {
        subject_id: 4,
        subject_name: "Web server programming",
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
        subject_id: 5,
        subject_name: "Computer vision algorithms and systems",
        subject_code: "CSCI935",
        semester_name: "spring",
        semester_year: 2025,
        study_sessions: [
          {
            study_session_id: 14,
            day_of_week: "Wednesday",
            start_time: "15:00:00",
            end_time: "17:00:00",
            session_type: "tutorial",
            location: {
              building_number: "20",
              room_number: "102",
              room_description: "Building 20",
              campus_name: "Wollongong",
            },
          },
        ],
      },
      {
        subject_id: 7,
        subject_name: "Data Mining",
        subject_code: "CSCI910",
        semester_name: "spring",
        semester_year: 2025,
        study_sessions: [
          {
            study_session_id: 16,
            day_of_week: "Monday",
            start_time: "09:00:00",
            end_time: "11:00:00",
            session_type: "lecture",
            location: {
              building_number: "3",
              room_number: "103",
              room_description: "Building 3",
              campus_name: "Wollongong",
            },
          },
          {
            study_session_id: 17,
            day_of_week: "Wednesday",
            start_time: "13:00:00",
            end_time: "15:00:00",
            session_type: "tutorial",
            location: {
              building_number: "22",
              room_number: "103",
              room_description: "Building 22",
              campus_name: "Wollongong",
            },
          },
        ],
      },
      {
        subject_id: 8,
        subject_name: "Artificial Intelligence",
        subject_code: "CSCI920",
        semester_name: "spring",
        semester_year: 2025,
        study_sessions: [
          {
            study_session_id: 18,
            day_of_week: "Tuesday",
            start_time: "10:00:00",
            end_time: "12:00:00",
            session_type: "lecture",
            location: {
              building_number: "40",
              room_number: "103",
              room_description: "Building 40",
              campus_name: "Sydney",
            },
          },
          {
            study_session_id: 19,
            day_of_week: "Thursday",
            start_time: "14:00:00",
            end_time: "16:00:00",
            session_type: "tutorial",
            location: {
              building_number: "35",
              room_number: "103",
              room_description: "Building 35",
              campus_name: "Sydney",
            },
          },
        ],
      },
      {
        subject_id: 9,
        subject_name: "Cybersecurity Fundamentals",
        subject_code: "CSIT930",
        semester_name: "spring",
        semester_year: 2025,
        study_sessions: [
          {
            study_session_id: 20,
            day_of_week: "Wednesday",
            start_time: "09:00:00",
            end_time: "11:00:00",
            session_type: "lecture",
            location: {
              building_number: "67",
              room_number: "202",
              room_description: "Building 67",
              campus_name: "Sydney",
            },
          },
          {
            study_session_id: 21,
            day_of_week: "Friday",
            start_time: "11:00:00",
            end_time: "13:00:00",
            session_type: "tutorial",
            location: {
              building_number: "17",
              room_number: "101",
              room_description: "Library",
              campus_name: "Wollongong",
            },
          },
        ],
      },
      {
        subject_id: 10,
        subject_name: "Cloud Computing",
        subject_code: "CSIT941",
        semester_name: "spring",
        semester_year: 2025,
        study_sessions: [
          {
            study_session_id: 22,
            day_of_week: "Thursday",
            start_time: "09:00:00",
            end_time: "11:00:00",
            session_type: "lecture",
            location: {
              building_number: "20",
              room_number: "102",
              room_description: "Building 20",
              campus_name: "Wollongong",
            },
          },
          {
            study_session_id: 23,
            day_of_week: "Monday",
            start_time: "14:00:00",
            end_time: "16:00:00",
            session_type: "tutorial",
            location: {
              building_number: "14",
              room_number: "201",
              room_description: "Building 14",
              campus_name: "Wollongong",
            },
          },
        ],
      },
      {
        subject_id: 11,
        subject_name: "Machine Learning Applications",
        subject_code: "CSCI950",
        semester_name: "spring",
        semester_year: 2025,
        study_sessions: [
          {
            study_session_id: 24,
            day_of_week: "Friday",
            start_time: "09:00:00",
            end_time: "11:00:00",
            session_type: "lecture",
            location: {
              building_number: "17",
              room_number: "202",
              room_description: "Building 17",
              campus_name: "Wollongong",
            },
          },
          {
            study_session_id: 25,
            day_of_week: "Tuesday",
            start_time: "15:00:00",
            end_time: "17:00:00",
            session_type: "tutorial",
            location: {
              building_number: "2",
              room_number: "103",
              room_description: "Building 2",
              campus_name: "Wollongong",
            },
          },
        ],
      },
    ],
  };
  return NextResponse.json(response, { status: 200 });
}
