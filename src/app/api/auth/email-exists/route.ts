import { rawQuery } from "@/lib/server/query";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * @openapi
 * /api/auth/email-exists:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Check if a user email exists
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid request
 */
const BodySchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { email } = parsed.data;
    const rows = await rawQuery<{ id: string }>(
      "SELECT id FROM `user` WHERE email = ? LIMIT 1",
      [email]
    );
    const exists = rows.length > 0;
    return NextResponse.json({ exists });
  } catch (e) {
    console.error("email-exists endpoint error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
