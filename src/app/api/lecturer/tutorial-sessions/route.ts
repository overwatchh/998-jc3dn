import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID required" },
        { status: 400 }
      );
    }

    // Get all tutorial sessions for this subject taught by this lecturer
    const query = `
      SELECT
        ss.id,
        CONCAT('Tutorial ', ss.id, ' (', r.building_number, '-', r.room_number, ')') as name
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN room r ON ss.room_id = r.id
      WHERE lss.lecturer_id = ?
        AND sss.subject_id = ?
        AND ss.type = 'tutorial'
      ORDER BY ss.id
    `;

    const tutorials = await rawQuery<{ id: number; name: string }>(query, [
      lecturerId,
      parseInt(subjectId),
    ]);

    return NextResponse.json(tutorials);
  } catch (error) {
    console.error("Error fetching tutorial sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutorial sessions" },
      { status: 500 }
    );
  }
}
