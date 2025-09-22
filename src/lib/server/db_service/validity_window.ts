// src/services/qrCodeService.ts
import { rawQuery } from "@/lib/server/query";

/**
 * Get the earliest anchor start time for a study session.
 *
 * @param studySessionId - The ID of the study session
 * @returns The first anchor with week_number and anchor_start, or null if none found
 */
export async function getAnchorForStudySession(
  studySessionId: number
): Promise<{ week_number: number; date: string } | null> {
  const sql = `
    SELECT qcss.week_number, MIN(v.start_time) AS date
    FROM qr_code_study_session qcss
    JOIN validity v ON v.qr_code_id = qcss.qr_code_id
    WHERE qcss.study_session_id = ?
    GROUP BY qcss.week_number
    ORDER BY qcss.week_number ASC
    LIMIT 1
  `;

  const [anchor] = await rawQuery<{
    week_number: number;
    date: string; // DATETIME in DB
  }>(sql, [studySessionId]);

  return anchor ?? null;
}
