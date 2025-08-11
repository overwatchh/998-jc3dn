import { BaseApiResponse } from "./api";

export type GenerateQrRequestBody = {
  week_number: number;
  redirect_url?: string;
  radius?: number;
};

export type AttendanceCheckinRequestBody = {
  qr_code: string;
  lat: number;
  long: number;
  verify_distance: boolean;
}

export type GenerateQrResponse = BaseApiResponse & {
  qr_url: string; // base64 image
  course_id: number;
  course_session_id: number;
  week_number: number;
  valid_until: string; // ISO datetime
};

export type QRCodeInfoRow = {
  qr_code_id: number;
  course_session_id:number;
  generated_at: string;
  radius:number;
  valid_until:string;
  course_id:number;
  location_id:number;
}