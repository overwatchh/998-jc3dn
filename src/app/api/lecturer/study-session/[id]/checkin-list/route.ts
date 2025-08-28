/**
 * @openapi
 * /lecturer/study-session/{id}/checkin-list:
 *   get:
 *     summary: Get recently checked-in students for a study session
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
 *         description: List of students who recently checked in using the QR code
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
 *                   checkin_time:
 *                     type: string
 *                     format: date-time
 */

export async function GET() {}
