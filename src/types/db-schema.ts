// ----------------------
// Auth-related tables
// ----------------------

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role?: string | null;
}

export interface Session {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
}

export interface Account {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
  scope?: string | null;
  password?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// ----------------------
// Campus / Room / Semester
// ----------------------

export interface Campus {
  id: number;
  name: string;
}

export interface Room {
  id: number;
  building_number: string;
  room_number: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  campus_id: number;
}

export type SemesterName = "autumn" | "spring" | "summer";

export interface Semester {
  id: number;
  name: SemesterName;
  year: number;
}

// ----------------------
// Subject & Enrolment
// ----------------------

export type SubjectStatus = "active" | "finished";

export interface Subject {
  id: number;
  name: string;
  code: string;
  required_lectures?: number;
  required_attendance_thresh?: number;
  status: SubjectStatus;
  semester_id: number;
}

export interface Enrolment {
  student_id: string;
  subject_id: number;
  date?: Date;
}

// ----------------------
// Study sessions
// ----------------------

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type StudySessionType = "lecture" | "lab" | "tutorial";

export interface StudySession {
  id: number;
  day_of_week: DayOfWeek;
  start_time: string; // TIME stored as string (e.g. "14:00:00")
  end_time: string;
  type: StudySessionType;
  room_id: number;
}

export interface SubjectStudySession {
  subject_id: number;
  study_session_id: number;
}

export interface StudentStudySession {
  student_id: string;
  study_session_id: number;
}

export interface LecturerStudySession {
  lecturer_id: string;
  study_session_id: number;
}

// ----------------------
// QR Code & Validity
// ----------------------

export interface QrCode {
  id: number;
  qr_token: string;
  createdAt: Date;
  valid_radius?: number;
}

export interface Validity {
  id: number;
  qr_code_id: number;
  count: number; // TINYINT (1 or 2)
  start_time: Date;
  end_time: Date;
}

// ----------------------
// QR ↔ Study Session mapping
// ----------------------

export interface QrCodeStudySession {
  id: number;
  study_session_id: number;
  qr_code_id: number;
  week_number: number;
}

// ----------------------
// Check-ins
// ----------------------

export interface Checkin {
  student_id: string;
  qr_code_study_session_id: number;
  checkin_time: Date;
  latitude?: number | null;
  longitude?: number | null;
  verify_distance?: boolean;
}

// ----------------------
// Database type map
// ----------------------

export interface DatabaseTables {
  user: User;
  session: Session;
  account: Account;
  verification: Verification;
  campus: Campus;
  room: Room;
  semester: Semester;
  subject: Subject;
  enrolment: Enrolment;
  study_session: StudySession;
  subject_study_session: SubjectStudySession;
  student_study_session: StudentStudySession;
  lecturer_study_session: LecturerStudySession;
  qr_code: QrCode;
  validity: Validity;
  qr_code_study_session: QrCodeStudySession;
  checkin: Checkin;
}
