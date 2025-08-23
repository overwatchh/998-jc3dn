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