import { NextRequest, NextResponse } from "next/server";
import { initializeServer } from "@/lib/server/init";

/**
 * @openapi
 * /api/system/init:
 *   get:
 *     tags:
 *       - System
 *     summary: Initialize server systems and email scheduler
 *     description: |
 *       **System Initialization Endpoint**
 *       
 *       This endpoint manually initializes server-side systems. Normally, the system auto-initializes when the Next.js application starts, but this endpoint can be used for:
 *       
 *       **Functions:**
 *       - Initialize the automatic email reminder scheduler
 *       - Start the cron job that checks for ended lectures every minute
 *       - Verify system components are properly loaded
 *       - Recover from initialization failures
 *       
 *       **Automatic Scheduler Features:**
 *       - Runs every minute checking for completed lectures
 *       - Detects when all QR codes have expired (lecture ended)
 *       - Automatically triggers email sending process
 *       - No manual intervention required
 *       
 *       **Safety Features:**
 *       - Idempotent operation (safe to call multiple times)
 *       - Returns success if already initialized
 *       - Handles initialization failures gracefully
 *       
 *       **Use Cases:**
 *       - Manual system recovery after errors
 *       - Health check for system status
 *       - Development and testing scenarios
 *       - Deployment verification
 *     responses:
 *       200:
 *         description: Server initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server systems initialized successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-09-15T01:00:30.123Z"
 *       500:
 *         description: Server initialization failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server initialization failed"
 *                 error:
 *                   type: string
 *                   description: Detailed error message for debugging
 *                   example: "Failed to start email scheduler: SMTP configuration missing"
 */

export async function GET(_req: NextRequest) {
  try {
    initializeServer();
    
    return NextResponse.json({
      message: "Server systems initialized successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to initialize server systems:", error);
    return NextResponse.json(
      { 
        message: "Server initialization failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
