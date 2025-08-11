import { RawSessionRow, GroupedCourse } from "@/types/course";

export function groupByCourse(rows: RawSessionRow[]): GroupedCourse[] {
  const grouped: Record<number, GroupedCourse> = {};

  for (const row of rows) {
    if (!grouped[row.course_id]) {
      grouped[row.course_id] = {
        course_id: row.course_id,
        course_name: row.course_name,
        course_code: row.course_code,
        course_status: row.course_status,
        semester_name: row.semester_name,
        semester_year: row.semester_year,
        sessions: [],
      };
    }

    grouped[row.course_id].sessions.push({
      session_id: row.session_id,
      session_type: row.session_type,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      location: row.location_id
        ? {
            location_id: row.location_id,
            building_name: row.building_name!,
            room_number: row.room_number!,
            latitude: row.latitude!,
            longitude: row.longitude!,
          }
        : undefined,
    });
  }

  return Object.values(grouped);
}
