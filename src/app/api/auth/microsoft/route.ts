import { auth } from "@/lib/server/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/auth/microsoft:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Sign in with Microsoft
 *     description: Visit this url (/api/auth/microsoft) in browser. Initiates Microsoft OAuth flow and redirects the user to Microsoft's consent screen.
 *     responses:
 *       302:
 *         description: Redirect to Microsfot OAuth consent screen. After login successfully redirect back to /
 *       500:
 *         description: Internal Server Error
 */

export async function GET(req: NextRequest) {
  const returnToParam = req.nextUrl.searchParams.get("returnTo");
  const safeReturnTo =
    returnToParam &&
    returnToParam.startsWith("/") &&
    !returnToParam.startsWith("//")
      ? returnToParam
      : "/";

  const response = await auth.api.signInSocial({
    body: {
      provider: "microsoft",
      // Ensure absolute URL so redirect returns to the correct domain (e.g., ngrok)
      callbackURL: new URL(safeReturnTo, req.nextUrl.origin).toString(),
    },
    asResponse: false,
  });

  // Perform the actual redirect
  return NextResponse.redirect(response.url as string);
}
