import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

interface SessionTypeRow {
  type: string;
}

/**
 * @openapi
 * /api/lecturer/session-types:
 *   get:
 *     summary: Get session types taught by current lecturer
 *     description: Returns the session types (lecture, tutorial) that the current lecturer teaches
 *     tags:
 *       - Lecturer
 *     responses:
 *       200:
 *         description: Session types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [lecture, tutorial]
 *                   example: ["lecture", "tutorial"]
 *                 showSelector:
 *                   type: boolean
 *                   description: Whether to show session type selector (true if teaches both types)
 *                   example: true
 *       401:
 *         description: Unauthorized
 */

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "lecturer") {
      return NextResponse.json(
        { error: "Forbidden: Only lecturers can access this endpoint" },
        { status: 403 }
      );
    }

    // Get all session types taught by this lecturer
    const query = `
      SELECT DISTINCT ss.type
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      WHERE lss.lecturer_id = ?
      ORDER BY ss.type
    `;

    const sessionTypes = await rawQuery(query, [session.user.id]);

    const types = sessionTypes.map((row: SessionTypeRow) => row.type);
    const showSelector = types.length > 1; // Show selector only if lecturer teaches both types

    return NextResponse.json({
      sessionTypes: types,
      showSelector
    });
  } catch (error) {
    console.error('Session types API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session types' },
      { status: 500 }
    );
  }
}