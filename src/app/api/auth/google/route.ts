// src/app/api/auth/google/route.ts
import { auth } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Sign in with Google
 *     description: Visit this url (/api/auth/google) in browser. Initiates Google OAuth flow and redirects the user to Google's consent screen.
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen. After login successfully redirect back to /
 *       500:
 *         description: Internal Server Error
 */
export async function GET(req: NextRequest) {
  const returnToParam = req.nextUrl.searchParams.get("returnTo");
  const safeReturnTo =
    returnToParam && returnToParam.startsWith("/") && !returnToParam.startsWith("//")
      ? returnToParam
      : "/";

  const response = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: new URL(safeReturnTo, req.nextUrl.origin).toString(),
    },
    asResponse: false,
  });

  // Perform the actual redirect
  return NextResponse.redirect(response.url as string);
}
