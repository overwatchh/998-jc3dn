import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/auth/signout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Sign out the currently logged-in user
 *     description: Ends the user session. Requires a valid session cookie to be present in the request.
 *     responses:
 *       200:
 *         description: Successfully signed out
 *       401:
 *         description: Unauthorized or session not found
 */
export async function POST() {
  try {
    const response = await auth.api.signOut({
      headers: await headers(),
      asResponse: true,
    });

    const data = await response.json();

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.log("error signoutsignout", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
