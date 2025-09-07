/**
 * @openapi
 * /api/admin/attendance/reminders:
 *   post:
 *     summary: Process attendance reminders
 *     description: Process attendance reminders for all courses, specific course, or specific student. Sends email reminders to students below attendance threshold.
 *     tags:
 *       - Admin
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [process_all, process_course, process_student]
 *                 description: The action to perform
 *                 example: process_all
 *               subjectId:
 *                 type: integer
 *                 description: Subject ID (required for process_course and process_student actions)
 *                 example: 1
 *               studentId:
 *                 type: string
 *                 description: Student ID (required for process_student action)
 *                 example: "student123"
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Attendance reminders processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Attendance reminders processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalStudentsProcessed:
 *                       type: integer
 *                       example: 6
 *                     emailsSent:
 *                       type: integer
 *                       example: 6
 *                     emailsFailed:
 *                       type: integer
 *                       example: 0
 *                     studentsSkipped:
 *                       type: integer
 *                       example: 0
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *       400:
 *         description: Bad request - Invalid action or missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Subject ID is required"
 *       401:
 *         description: Unauthorized - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *   get:
 *     summary: Get attendance reminder history and statistics
 *     description: Retrieve attendance reminder history or statistics based on action parameter
 *     tags:
 *       - Admin
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: action
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [history, statistics]
 *         description: The action to perform
 *         example: history
 *       - name: subjectId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter by subject ID
 *         example: 1
 *       - name: studentId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *         example: "student123"
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of records to return
 *         example: 50
 *     responses:
 *       200:
 *         description: Successfully retrieved data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Array of reminder history or statistics
 *       400:
 *         description: Bad request - Invalid action
 *       401:
 *         description: Unauthorized - Admin or lecturer role required
 *       500:
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { attendanceReminderService } from '@/services/server/attendanceReminderService';
import { auth } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, subjectId, studentId } = body;

    switch (action) {
      case 'process_all':
        const result = await attendanceReminderService.processAllReminders();
        return NextResponse.json({
          success: true,
          message: 'Attendance reminders processed successfully',
          data: result
        });

      case 'process_course':
        if (!subjectId) {
          return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
        }
        const courseResult = await attendanceReminderService.processCourseReminders(subjectId);
        return NextResponse.json({
          success: true,
          message: `Reminders processed for subject ${subjectId}`,
          data: courseResult
        });

      case 'process_student':
        if (!studentId || !subjectId) {
          return NextResponse.json({ 
            error: 'Student ID and Subject ID are required' 
          }, { status: 400 });
        }
        const studentResult = await attendanceReminderService.processStudentReminder(studentId, subjectId);
        return NextResponse.json({
          success: true,
          message: studentResult ? 'Student reminder processed' : 'Student reminder failed',
          data: { emailSent: studentResult }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Attendance reminder API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !['admin', 'lecturer'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const subjectId = searchParams.get('subjectId');
    const studentId = searchParams.get('studentId');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (action) {
      case 'history':
        const history = await attendanceReminderService.getEmailReminderHistory(
          studentId || undefined,
          subjectId ? parseInt(subjectId) : undefined,
          limit
        );
        return NextResponse.json({
          success: true,
          data: history
        });

      case 'statistics':
        const stats = await attendanceReminderService.getAttendanceStatistics(
          subjectId ? parseInt(subjectId) : undefined
        );
        return NextResponse.json({
          success: true,
          data: stats
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Attendance reminder GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}