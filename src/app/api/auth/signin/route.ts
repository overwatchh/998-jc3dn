import { auth } from "@/lib/server/auth";

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
export async function POST(req: Request) {
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
    console.log(data);

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.log("error login", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
