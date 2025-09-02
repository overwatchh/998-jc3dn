import { NextRequest, NextResponse } from 'next/server';
import { attendanceReminderService } from '@/services/server/attendanceReminderService';
import { auth } from '@/lib/server/auth';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, settings } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const validSettings: Partial<{
      lectureCount: number;
      labCount: number;
      attendanceThreshold: number;
      emailEnabled: boolean;
    }> = {};
    
    if (typeof settings.lectureCount === 'number' && settings.lectureCount > 0) {
      validSettings.lectureCount = settings.lectureCount;
    }
    
    if (typeof settings.labCount === 'number' && settings.labCount > 0) {
      validSettings.labCount = settings.labCount;
    }
    
    if (typeof settings.attendanceThreshold === 'number' && 
        settings.attendanceThreshold > 0 && 
        settings.attendanceThreshold <= 1) {
      validSettings.attendanceThreshold = settings.attendanceThreshold;
    }
    
    if (typeof settings.emailEnabled === 'boolean') {
      validSettings.emailEnabled = settings.emailEnabled;
    }

    await attendanceReminderService.updateCourseSettings(courseId, validSettings);

    return NextResponse.json({
      success: true,
      message: 'Course reminder settings updated successfully'
    });
  } catch (error) {
    console.error('Attendance settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, action } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'enable':
        await attendanceReminderService.enableEmailReminders(courseId);
        return NextResponse.json({
          success: true,
          message: 'Email reminders enabled for course'
        });

      case 'disable':
        await attendanceReminderService.disableEmailReminders(courseId);
        return NextResponse.json({
          success: true,
          message: 'Email reminders disabled for course'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Attendance settings action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}