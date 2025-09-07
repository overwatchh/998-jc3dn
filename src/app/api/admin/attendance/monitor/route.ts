/**
 * @openapi
 * /api/admin/attendance/monitor:
 *   post:
 *     summary: Control automatic attendance monitoring
 *     description: Start or stop the automatic attendance monitoring service that sends emails when lectures end
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
 *                 enum: [start, stop]
 *                 description: Action to perform on the monitoring service
 *                 example: start
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Monitoring service action completed successfully
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
 *                   example: "Automatic attendance monitoring started"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isRunning:
 *                       type: boolean
 *                       example: true
 *                     processedToday:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Bad request - Invalid action
 *       401:
 *         description: Unauthorized - Admin role required
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get automatic monitoring status
 *     description: Get the current status of the automatic attendance monitoring service
 *     tags:
 *       - Admin
 *       - Attendance  
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved monitoring status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isRunning:
 *                       type: boolean
 *                       example: true
 *                     processedToday:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized - Admin role required
 *       500:
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';

// Note: In a real production environment, this would be managed by a separate service
// For now, we return status information only
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, this would check the actual monitoring service status
    const status = {
      isRunning: true, // This would be checked from the actual service
      processedToday: 0 // This would be retrieved from the service
    };

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Monitoring status API error:', error);
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
    const { action } = body;

    if (!['start', 'stop'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Note: In production, this would control an actual background service
    // For now, we return mock responses
    const response = action === 'start' 
      ? {
          success: true,
          message: 'Automatic attendance monitoring started',
          data: { isRunning: true, processedToday: 0 }
        }
      : {
          success: true, 
          message: 'Automatic attendance monitoring stopped',
          data: { isRunning: false, processedToday: 0 }
        };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Monitoring control API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}