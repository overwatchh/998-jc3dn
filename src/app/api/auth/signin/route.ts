import { auth } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/auth/signin:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Sign in user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: stu1@uowmail.edu.com
 *               password:
 *                 type: string
 *                 example: Abcd@1234
 *               rememberMe:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe, callbackURL } = body;

    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe,
        callbackURL,
      },
      asResponse: true,
    });

    const data = await response.json();

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.log("error login", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
