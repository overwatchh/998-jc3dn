import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { RowDataPacket } from "mysql2";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

interface Course extends RowDataPacket {
  course_id: number;
  course_name: string;
  course_code: string;
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const lecturerId = session.user.id;

    const courses = (await rawQuery(
      `SELECT c.id, c.name, c.code
       FROM courses c
       JOIN course_lecturers lc ON c.id = lc.course_id
       WHERE lc.lecturer_id = ?`,
      [lecturerId]
    )) as Course[];

    return new NextResponse(JSON.stringify(courses), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
