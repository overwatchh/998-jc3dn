import { rawQuery } from "@/lib/server/query";

/**
 * Get list of students for a given study session.
 *
 * Automatically determines the study session type:
 * - If type = "tutorial" → uses student_study_session table.
 * - If type = "lecture"  → uses enrolment + subject_study_session tables.
 *
 * @param studySessionId - The ID of the study session
 * @returns Array of students with id, name, and email
 */
export async function getStudentsForStudySession(
  studySessionId: number
): Promise<{ student_id: string; name: string; email: string }[]> {
  // 1️. Get the study session type
  const [sessionTypeResult] = await rawQuery<{ type: string }>(
    `SELECT type FROM study_session WHERE id = ?`,
    [studySessionId]
  );

  if (!sessionTypeResult) {
    throw new Error(`Study session with id ${studySessionId} not found`);
  }

  const { type } = sessionTypeResult;
  let studentsQuery = "";
  let params: any[] = [studySessionId];

  // 2️. Choose query based on session type
  if (type === "tutorial") {
    studentsQuery = `
      SELECT 
        u.id AS student_id,
        u.name,
        u.email
      FROM student_study_session sss
      JOIN user u ON u.id = sss.student_id
      WHERE sss.study_session_id = ?
    `;
  } else if (type === "lecture") {
    studentsQuery = `
      SELECT 
        u.id AS student_id,
        u.name,
        u.email
      FROM subject_study_session sub_ss
      JOIN enrolment e ON e.subject_id = sub_ss.subject_id
      JOIN user u ON u.id = e.student_id
      WHERE sub_ss.study_session_id = ?
    `;
  } else {
    throw new Error(`Invalid study session type: ${type}`);
  }

  // 3. Execute the query
  const students = await rawQuery<{
    student_id: string;
    name: string;
    email: string;
  }>(studentsQuery, params);

  return students;
}

/**
 * Verify if a given student is required to attend a specific study session.
 *
 * Logic:
 * - For tutorial → check student_study_session table.
 * - For lecture  → check enrolment via subject_study_session.
 *
 * @param studySessionId - The ID of the study session
 * @param studentId - The student's ID (UUID)
 * @returns boolean - true if student must attend, otherwise false
 */
export async function verifyStudentInStudySession(
  studySessionId: number,
  studentId: string
): Promise<boolean> {
  // 1️. Determine session type
  const [sessionTypeResult] = await rawQuery<{ type: string }>(
    `SELECT type FROM study_session WHERE id = ?`,
    [studySessionId]
  );

  if (!sessionTypeResult) {
    throw new Error(`Study session with id ${studySessionId} not found`);
  }

  const { type } = sessionTypeResult;
  let verifySql = "";
  let params: any[] = [];

  // 2️. Pick correct logic
  if (type === "tutorial") {
    verifySql = `
      SELECT 1
      FROM student_study_session sss
      WHERE sss.study_session_id = ? AND sss.student_id = ?
      LIMIT 1
    `;
    params = [studySessionId, studentId];
  } else if (type === "lecture") {
    verifySql = `
      SELECT 1
      FROM subject_study_session sub_ss
      JOIN enrolment e ON e.subject_id = sub_ss.subject_id
      WHERE sub_ss.study_session_id = ? AND e.student_id = ?
      LIMIT 1
    `;
    params = [studySessionId, studentId];
  } else {
    throw new Error(`Invalid study session type: ${type}`);
  }

  // 3️. Run query
  const [exists] = await rawQuery<{ 1: number }>(verifySql, params);

  return !!exists;
}