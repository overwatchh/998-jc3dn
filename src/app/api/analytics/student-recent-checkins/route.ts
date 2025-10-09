import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/analytics/student-recent-checkins:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get recent attendance check-ins for a student
 *     description: |
 *       Returns the most recent attendance records (grouped per study session occurrence / QR instance) for a student.
 *       By default returns the authenticated student's data. Lecturers or admins may supply a `student_id` query param
 *       to fetch another student's records.
 *
 *       Attendance status is derived from validity window check-ins: one window = partial (50 points), two = present (100 points).
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of recent records to return
 *       - in: query
 *         name: session_type
 *         schema:
 *           type: string
 *           enum: [lecture, lab, tutorial]
 *         description: Optional filter by study session type
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *         description: Student ID (allowed only for lecturer/admin roles)
 *     responses:
 *       200:
 *         description: Successfully retrieved recent check-ins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subject_name: { type: string }
 *                       subject_code: { type: string }
 *                       session_type: { type: string, enum: [lecture, lab, tutorial] }
 *                       week_number: { type: integer }
 *                       latest_checkin_time: { type: string, format: date-time }
 *                       building_number: { type: string }
 *                       room_number: { type: string }
 *                       campus_name: { type: string }
 *                       checkin_count: { type: integer, description: "Number of validity windows checked in (1 or 2)" }
 *                       attendance_status: { type: string, enum: [absent, partial, present] }
 *                       points_awarded: { type: integer, description: "Points per attendance rule (0 absent, 50 partial, 100 present)" }
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (attempt to access another student's data without proper role)
 */

interface RecentCheckinAggregateRow {
  subject_name: string;
  subject_code: string;
  session_type: string; // lecture | lab | tutorial
  week_number: number;
  latest_checkin_time: string; // DATETIME
  building_number: string;
  room_number: string;
  campus_name: string;
  checkin_count: number;
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20"))
    );
    const sessionType = url.searchParams.get("session_type");
    const requestedStudentId = url.searchParams.get("student_id");

    const callerRole = session.user.role;
    const callerId = session.user.id;

    let targetStudentId = callerId; // default to self
    if (requestedStudentId && requestedStudentId !== callerId) {
      if (callerRole === "lecturer" || callerRole === "admin") {
        targetStudentId = requestedStudentId;
      } else {
        return NextResponse.json(
          { message: "Forbidden: Cannot access another student's records" },
          { status: 403 }
        );
      }
    }

    const values: (string | number)[] = [targetStudentId, targetStudentId];
    let sessionTypeFilter = "";
    if (sessionType) {
      sessionTypeFilter = " AND ss.type = ? ";
      values.push(sessionType);
    }
    values.push(limit);

    // We want to include sessions with zero check-ins (absent). Strategy:
    // 1. Get all qr_code_study_session (qcss) rows for subjects the student is enrolled in (active subjects) where a QR was generated.
    // 2. LEFT JOIN aggregated checkins for the target student.
    // This returns rows with NULL latest_checkin_time when absent.
    const sql = `
      SELECT
        s.name AS subject_name,
        s.code AS subject_code,
        ss.type AS session_type,
        qcss.week_number,
        ca.latest_checkin_time,
        r.building_number,
        r.room_number,
        cam.name AS campus_name,
        COALESCE(ca.checkin_count, 0) AS checkin_count
      FROM qr_code_study_session qcss
      JOIN study_session ss           ON qcss.study_session_id = ss.id
      JOIN subject_study_session sss  ON sss.study_session_id = ss.id
      JOIN subject s                  ON s.id = sss.subject_id
      JOIN enrolment e                ON e.subject_id = s.id AND e.student_id = ?
      JOIN room r                     ON ss.room_id = r.id
      JOIN campus cam                 ON r.campus_id = cam.id
      LEFT JOIN (
        SELECT
          qr_code_study_session_id,
          student_id,
          COUNT(*) AS checkin_count,
          MAX(checkin_time) AS latest_checkin_time
        FROM checkin
        WHERE student_id = ?
        GROUP BY qr_code_study_session_id, student_id
      ) ca
        ON ca.qr_code_study_session_id = qcss.id
      AND ca.student_id = e.student_id
      WHERE s.status = 'active'
        ${sessionTypeFilter}
      ORDER BY
        (ca.latest_checkin_time IS NULL),
        ca.latest_checkin_time DESC,
        qcss.week_number DESC
      LIMIT ?;
    `;

    const rows = await rawQuery<RecentCheckinAggregateRow>(sql, values);

    const data = rows.map(r => {
      let attendance_status: "absent" | "partial" | "present";
      if (r.checkin_count >= 2) attendance_status = "present";
      else if (r.checkin_count === 1) attendance_status = "partial";
      else attendance_status = "absent";
      const points_awarded =
        attendance_status === "present"
          ? 100
          : attendance_status === "partial"
            ? 50
            : 0;
      return {
        subject_name: r.subject_name,
        subject_code: r.subject_code,
        session_type: r.session_type,
        week_number: r.week_number,
        latest_checkin_time: r.latest_checkin_time,
        building_number: r.building_number,
        room_number: r.room_number,
        campus_name: r.campus_name,
        checkin_count: r.checkin_count,
        attendance_status,
        points_awarded,
      };
    });

    return NextResponse.json({
      message: "Recent check-ins fetched successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("[GET_STUDENT_RECENT_CHECKINS]", error);
    return NextResponse.json(
      { message: "Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
