// File: src/app/api/auth/me/route.ts
import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current authenticated user
 *     description: Returns the current authenticated user's profile from the session.
 *     responses:
 *       200:
 *         description: Authenticated user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique user ID
 *                       example: bxbP309HJIYs9HPt8tYmDXz83hvYTRsp
 *                     name:
 *                       type: string
 *                       example: Alice Example
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: user@example.com
 *                     emailVerified:
 *                       type: integer
 *                       example: 0
 *                     image:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-08-05T13:48:13.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-08-05T13:48:13.000Z
 *                     role:
 *                       type: string
 *                       example: student
 *       401:
 *         description: Unauthorized - No session found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: session.user,
  });
}
