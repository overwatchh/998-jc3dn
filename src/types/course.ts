import { RowDataPacket } from "mysql2";

export interface RawSessionRow extends RowDataPacket {
  session_id: number;
  session_type: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_id: number;
  course_name: string;
  course_code: string;
  course_status: string;
  semester_name: string;
  semester_year: number;
  location_id: number | null;
  building_name: string | null;
  room_number: string | null;
  description: string;
  latitude: string | null;
  longitude: string | null;
}

export interface GroupedCourse extends RowDataPacket {
  course_id: number;
  course_name: string;
  course_code: string;
  course_status: string;
  semester_name: string;
  semester_year: number;
  sessions: {
    session_id: number;
    session_type: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location?: {
      location_id: number;
      building_name: string;
      room_number: string;
      description: string;
      latitude: string;
      longitude: string;
    };
  }[];
}

export interface EnrolledCourse extends RowDataPacket {
  courseId: number;
  courseName: string;
  courseCode: string;
  status: "active" | "finished";
  semesterName: "autumn" | "spring" | "summer";
  semesterYear: number;
}

export interface RawCourseSessionRow extends RowDataPacket {
  course_session_id: number;
  course_id: number;
}

export type CourseSessionResponse = Array<{
  id: number;
  name: string;
  code: string;
  sessionType: string; // lecture | tutorial
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  dayOfWeek: string; // e.g., Monday
}>;

export type AbsentListResponse = Array<{
  student_id: string;
  name: string;
  email: string;
}>;

// Live check-in list (lecturer) GET /api/lecturer/study-session/{id}/checkin-list
export type LiveCheckinStudent = {
  student_id: string;
  student_name: string;
  student_email: string;
  checkin_time: string;
  validity_count: number; // 1 for first window, 2 for second
};

export type LiveCheckinResponse = {
  message: string;
  validity_count: number | null;
  count: number;
  data: LiveCheckinStudent[];
};

// Lecturer GET /lecturer/study-session/{id}/student-list
export type StudentListResponse = Array<{
  student_id: string;
  name: string;
  email: string;
}>;

// Lecturer GET /api/lecturer/subjects
export type LecturerSubjectStudySession = {
  study_session_id: number;
  day_of_week: string;
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  session_type: string; // lecture | lab | tutorial
  location: {
    building_number: string;
    room_number: string;
    room_description: string;
    campus_name: string;
  };
};

export type LecturerSubject = {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  semester_name: "autumn" | "spring" | "summer";
  semester_year: number;
  study_sessions: LecturerSubjectStudySession[];
};

export type LecturerSubjectsResponse = {
  message: string;
  count: number;
  data: LecturerSubject[];
};
