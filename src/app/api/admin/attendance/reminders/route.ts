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
    const { action, courseId, studentId } = body;

    switch (action) {
      case 'process_all':
        const result = await attendanceReminderService.processAllReminders();
        return NextResponse.json({
          success: true,
          message: 'Attendance reminders processed successfully',
          data: result
        });

      case 'process_course':
        if (!courseId) {
          return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
        }
        const courseResult = await attendanceReminderService.processCourseReminders(courseId);
        return NextResponse.json({
          success: true,
          message: `Reminders processed for course ${courseId}`,
          data: courseResult
        });

      case 'process_student':
        if (!studentId || !courseId) {
          return NextResponse.json({ 
            error: 'Student ID and Course ID are required' 
          }, { status: 400 });
        }
        const studentResult = await attendanceReminderService.processStudentReminder(studentId, courseId);
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
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (action) {
      case 'history':
        const history = await attendanceReminderService.getEmailReminderHistory(
          studentId || undefined,
          courseId ? parseInt(courseId) : undefined,
          limit
        );
        return NextResponse.json({
          success: true,
          data: history
        });

      case 'statistics':
        const stats = await attendanceReminderService.getAttendanceStatistics(
          courseId ? parseInt(courseId) : undefined
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