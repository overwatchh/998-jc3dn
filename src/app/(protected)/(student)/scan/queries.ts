import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export enum QRStatusEnum {
  NO_ACTIVE_WINDOW = 0,
  FIRST_CHECKIN = 1,
  SECOND_CHECKIN = 2,
  NOT_GENERATED = -1,
}

interface QRStatusResponse {
  message: string;
  validity_count: QRStatusEnum;
  validate_geo: boolean;
  validities: {
    id: number;
    count: number;
    start_time: string;
    end_time: string;
  }[];
  location?: {
    latitude: number;
    longitude: number;
    radius: number | null;
    building_number: string | null;
    room_number: string | null;
  } | null;
}

const CHECKIN_STATUS_QUERY_KEY = ["checkin-status"];

export function useGetCheckinStatus(qrCodeId?: string | null) {
  async function queryFn() {
    const res = await axios.get<QRStatusResponse>(`/api/qr/${qrCodeId}`);
    return res.data;
  }
  return useQuery({
    enabled: !!qrCodeId,
    queryKey: [CHECKIN_STATUS_QUERY_KEY, qrCodeId],
    queryFn,
  });
}
