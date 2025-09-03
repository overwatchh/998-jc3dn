import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export enum QRStatusEnum {
  NOT_GENERATED,
  FIRST_CHECKIN,
  SECOND_CHECKIN,
}

interface QRStatusResponse {
  message: string;
  validity_count: QRStatusEnum;
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
