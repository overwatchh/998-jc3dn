import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/student/analytics/attendance-summary:
 *   get:
 *     tags:
 *       - Student Analytics
 *     summary: Get personal attendance summary for student
 *     description: Returns overall attendance statistics including total sessions, attended sessions, attendance percentage, and at-risk subjects
 *     responses:
 *       200:
 *         description: Successfully retrieved attendance summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Personal attendance summary retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall_stats:
 *                       type: object
 *                       properties:
 *                         total_sessions:
 *                           type: integer
 *                           example: 48
 *                         attended_sessions:
 *                           type: integer
 *                           example: 42
 *                         attendance_percentage:
 *                           type: number
 *                           format: float
 *                           example: 87.5
 *                         total_subjects:
 *                           type: integer
 *                           example: 4
 *                     subject_breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subject_name:
 *                             type: string
 *                             example: Physics 301
 *                           subject_code:
 *                             type: string
 *                             example: PHYS301
 *                           attendance_percentage:
 *                             type: number
 *                             format: float
 *                             example: 75.0
 *                           sessions_attended:
 *                             type: integer
 *                             example: 9
 *                           total_sessions:
 *                             type: integer
 *                             example: 12
 *                           required_threshold:
 *                             type: number
 *                             format: float
 *                             example: 80.0
 *                           status:
 *                             type: string
 *                             enum: [good, warning, at_risk]
 *                             example: warning
 *       401:
 *         description: Unauthorized - Student role required
 */

interface AttendanceRow {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  required_attendance_thresh: number;
  total_sessions: number;
  attended_sessions: number;
}

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

    const sql = `
      SELECT
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        s.required_attendance_thresh,
        COUNT(DISTINCT qcss.id) as total_sessions,
        COUNT(DISTINCT c.qr_code_study_session_id) as attended_sessions
      FROM enrolment e
      JOIN subject s ON e.subject_id = s.id
      JOIN subject_study_session sss ON sss.subject_id = s.id
      JOIN qr_code_study_session qcss ON qcss.study_session_id = sss.study_session_id
      LEFT JOIN checkin c ON c.qr_code_study_session_id = qcss.id AND c.student_id = e.student_id
      WHERE e.student_id = ?
        AND s.status = 'active'
      GROUP BY s.id, s.name, s.code, s.required_attendance_thresh
      ORDER BY s.name;
    `;

    const attendanceData = await rawQuery<AttendanceRow>(sql, [studentId]);

    // Calculate overall statistics
    const totalSessions = attendanceData.reduce((sum, row) => sum + row.total_sessions, 0);
    const totalAttended = attendanceData.reduce((sum, row) => sum + row.attended_sessions, 0);
    const overallPercentage = totalSessions > 0 ? (totalAttended / totalSessions) * 100 : 0;

    // Process subject breakdown
    const subjectBreakdown = attendanceData.map(row => {
      const attendancePercentage = row.total_sessions > 0
        ? (row.attended_sessions / row.total_sessions) * 100
        : 0;

      let status = 'good';
      if (attendancePercentage < row.required_attendance_thresh) {
        status = 'at_risk';
      } else if (attendancePercentage < row.required_attendance_thresh + 10) {
        status = 'warning';
      }

      return {
        subject_name: row.subject_name,
        subject_code: row.subject_code,
        attendance_percentage: Math.round(attendancePercentage * 100) / 100,
        sessions_attended: row.attended_sessions,
        total_sessions: row.total_sessions,
        required_threshold: row.required_attendance_thresh * 100,
        status
      };
    });

    const response = {
      message: "Personal attendance summary retrieved successfully",
      data: {
        overall_stats: {
          total_sessions: totalSessions,
          attended_sessions: totalAttended,
          attendance_percentage: Math.round(overallPercentage * 100) / 100,
          total_subjects: attendanceData.length
        },
        subject_breakdown: subjectBreakdown
      }
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET_STUDENT_ATTENDANCE_SUMMARY]", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}