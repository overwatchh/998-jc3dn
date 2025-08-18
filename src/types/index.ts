import { RowDataPacket } from "mysql2";

export enum Roles {
  STUDENT = "student",
  LECTURER = "lecturer",
  ADMIN = "admin",
}

export type Role = `${Roles}`;

export interface User extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface Course {
  _id: string;
  name: string;
  code: string;
  description: string;
  instructor: User | string;
  students: (User | string)[];
  semester: string;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lecture {
  _id: string;
  title: string;
  course: Course | string;
  instructor: User | string;
  date: string;
  startTime: string;
  endTime: string;
  location: Location | string;
  qrCodeData: string;
  qrCodeExpiry: string;
  attendanceWindow: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  _id: string;
  name: string;
  building: string;
  room: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  _id: string;
  student: User | string;
  lecture: Lecture | string;
  timestamp: string;
  status: "present" | "late" | "absent" | "excused";
  locationVerified: boolean;
  ipAddress: string;
  deviceInfo: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Renamed from GeolocationPosition to avoid conflict with built-in type
export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
