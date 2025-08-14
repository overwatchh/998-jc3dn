export type RawSessionRow = {
  session_id: number
  session_type: string
  day_of_week: string
  start_time: string
  end_time: string
  course_id: number
  course_name: string
  course_code: string
  course_status: string
  semester_name: string
  semester_year: number
  location_id: number | null
  building_name: string | null
  room_number: string | null
  latitude: string | null
  longitude: string | null
}

export type GroupedCourse = {
  course_id: number
  course_name: string
  course_code: string
  course_status: string
  semester_name: string
  semester_year: number
  sessions: {
    session_id: number
    session_type: string
    day_of_week: string
    start_time: string
    end_time: string
    location?: {
      location_id: number
      building_name: string
      room_number: string
      description: string
      latitude: string
      longitude: string
    }
  }[]
}

export type EnrolledCourse = {
  courseId: number
  courseName: string
  courseCode: string
  status: "active" | "finished"
  semesterName: "autumn" | "spring" | "summer"
  semesterYear: number
}

export type RawCourseSessionRow = {
  course_session_id: number
  course_id: number
}
