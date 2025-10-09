import { RowDataPacket } from "mysql2";
import { z } from "zod";
import { BaseApiResponse } from "./api";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const GenerateQrRequestSchema = z.object({
  week_number: z.number({
    required_error: "week_number is required",
    invalid_type_error: "week_number must be a number",
  }),
  radius: z.number({
    required_error: "radius is required",
    invalid_type_error: "radius must be a number",
  }),
  valid_room_id: z
    .number({
      required_error: "valid_room_id is required",
      invalid_type_error: "valid_room_id must be a number",
    })
    .min(1, "valid_room_id must be a positive integer"),
  validate_geo: z.coerce.boolean({
    required_error: "validate_geo is required",
    invalid_type_error: "validate_geo must be a boolean",
  }),
  day_of_week: z.enum(
    [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    {
      required_error: "day_of_week is required",
      invalid_type_error: "day_of_week must be one of Monday–Sunday",
    }
  ),
  validities: z
    .array(
      z.object({
        start_time: z.string().regex(HHMM, "start_time must be HH:MM (24h)"),
        end_time: z.string().regex(HHMM, "end_time must be HH:MM (24h)"),
      })
    )
    .length(2, "Exactly two validity windows are required"),
});

// Export the inferred type so it's always in sync with schema
export type GenerateQrRequestBody = z.infer<typeof GenerateQrRequestSchema>;

// PUT schema (extend POST schema with qr_code_id)
export const UpdateQrRequestSchema = GenerateQrRequestSchema.omit({
  week_number: true,
}).extend({
  qr_code_id: z.number({
    required_error: "qr_code_id is required",
    invalid_type_error: "qr_code_id must be a number",
  }),
});

export type UpdateQrRequestBody = z.infer<typeof UpdateQrRequestSchema>;

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
  validities: {
    start_time: string; // ISO datetime
    end_time: string; // ISO datetime
  }[];
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
  valid_radius: number | null;
  createdAt: string; // ISO datetime
  week_number: number;
  validities: QrCodeValidity[];
};

export type GetQrCodesResponse = BaseApiResponse & {
  study_session_id: number;
  count: number;
  data: QrCodeWithValidities[];
};
