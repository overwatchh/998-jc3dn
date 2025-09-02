import { NextRequest, NextResponse } from 'next/server';
import { attendanceReminderService } from '@/services/server/attendanceReminderService';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron job access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily attendance reminder processing...');
    
    const result = await attendanceReminderService.processAllReminders();
    
    console.log('Daily attendance reminder processing completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Daily attendance reminders processed successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job attendance reminder error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process daily attendance reminders',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}