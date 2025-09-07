/**
 * @openapi
 * /api/cron/attendance-reminders:
 *   get:
 *     summary: Process daily attendance reminders (Cron Job)
 *     description: Automated endpoint for processing daily attendance reminders. Requires CRON_SECRET authorization.
 *     tags:
 *       - Cron
 *       - Attendance
 *     security:
 *       - CronAuth: []
 *     responses:
 *       200:
 *         description: Daily attendance reminders processed successfully
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
 *                   example: "Daily attendance reminders processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalStudentsProcessed:
 *                       type: integer
 *                       example: 15
 *                     emailsSent:
 *                       type: integer
 *                       example: 12
 *                     emailsFailed:
 *                       type: integer
 *                       example: 0
 *                     studentsSkipped:
 *                       type: integer
 *                       example: 3
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-05T10:15:30.123Z"
 *       401:
 *         description: Unauthorized - Invalid cron secret
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Failed to process daily attendance reminders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to process daily attendance reminders"
 *                 message:
 *                   type: string
 *                   example: "Database connection failed"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-05T10:15:30.123Z"
 *   post:
 *     summary: Process daily attendance reminders (Cron Job) - POST method
 *     description: Same as GET method, provided for compatibility with cron services that require POST
 *     tags:
 *       - Cron
 *       - Attendance
 *     security:
 *       - CronAuth: []
 *     responses:
 *       200:
 *         description: Same as GET method
 *       401:
 *         description: Same as GET method
 *       500:
 *         description: Same as GET method
 */
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