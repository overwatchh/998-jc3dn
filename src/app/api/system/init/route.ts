import { NextRequest, NextResponse } from "next/server";
import { initializeServer } from "@/lib/server/init";

/**
 * @openapi
 * /api/system/init:
 *   get:
 *     tags:
 *       - System
 *     summary: Initialize server systems
 *     description: Initializes server-side systems including the automatic email scheduler
 *     responses:
 *       200:
 *         description: Server initialized successfully
 */

export async function GET(req: NextRequest) {
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