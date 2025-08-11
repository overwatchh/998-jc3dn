// app/api/auth/signup/route.ts
import { auth } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags:
 *      - Auth
 *     summary: Sign up a new user via email & password
 *     description: Creates a new user with email, password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "StrongPassword1!"
 *               name:
 *                 type: string
 *                 example: "Alice Example"
 *     responses:
 *       '200':
 *         description: Signed up successfully.
 *       '422':
 *         description: User already exists
 *       '500':
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    const response = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      asResponse: true,
    });

    const data = await response.json();

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.log("error signup", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}