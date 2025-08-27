import { RowDataPacket } from "mysql2";
import { BaseApiResponse } from "./api";

export type GenerateQrRequestBody = {
  week_number: number;
  duration?: number;
  redirect_url?: string;
  radius?: number;
};

export type AttendanceCheckinRequestBody = {
  qr_code: string;
  lat: number;
  long: number;
  verify_distance: boolean;
};

export type GenerateQrResponse = BaseApiResponse & {
  qr_url: string; // base64 image
  study_session_id: number;
  week_number: number;
  valid_until: string; // ISO datetime
};

export interface QRCodeInfoRow extends RowDataPacket {
  qr_code_id: number;
  course_session_id: number;
  generated_at: string;
  radius: number;
  valid_until: string;
  course_id: number;
  location_id: number;
}

export interface RowLocation extends RowDataPacket {
  latitude: number;
  longitude: number;
}

// Lecturer GET /api/lecturer/study-session/{id}/qr response types
export type QrCodeValidity = {
  validity_id: number;
  count: number; // 1 = first validity, 2 = second validity
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
};

export type QrCodeWithValidities = {
  qr_code_id: number;
  valid_radius: number;
  createdAt: string; // ISO datetime
  week_number: number;
  validities: QrCodeValidity[];
};

export type GetQrCodesResponse = BaseApiResponse & {
  study_session_id: number;
  count: number;
  data: QrCodeWithValidities[];
};
