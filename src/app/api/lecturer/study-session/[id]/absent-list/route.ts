/**
 * @openapi
 * /lecturer/study-session/{id}/absent-list:
 *   get:
 *     summary: Get list of absent students for a study session
 *     description: This API only works if the study session has already finished.
 *     tags: [Lecturer]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the study session
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of absent students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   student_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *       400:
 *         description: Cannot fetch absent list until the study session has ended
 */

export async function GET() {}
