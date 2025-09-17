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

// Renamed from GeolocationPosition to avoid conflict with built-in type
export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}
