import { RowDataPacket } from "mysql2";
export interface RawSubjectRow extends RowDataPacket {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  semester_name: "autumn" | "spring" | "summer";
  semester_year: number;
  study_session_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  session_type: "lecture" | "tutorial";
  building_number: string;
  room_id: number;
  room_number: string;
  room_description: string;
  campus_name: string;
}

export interface GroupedSubject extends RowDataPacket {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  semester_name: "autumn" | "spring" | "summer";
  semester_year: number;
  study_sessions: {
    study_session_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    session_type: "lecture" | "tutorial";
    location: {
      building_number: string;
      room_number: string;
      room_id: number;
      room_description: string;
      campus_name: string;
    };
  }[];
}
