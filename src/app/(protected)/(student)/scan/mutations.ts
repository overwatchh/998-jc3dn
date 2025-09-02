import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

interface CheckinBody {
  qr_code_id: number;
  lat: number;
  long: number;
}
export function useStudentQRCheckin() {
  async function mutationFn({ lat, long, qr_code_id }: CheckinBody) {
    return await axios.post("/api/student/attendance/checkin", {
      qr_code_id,
      lat,
      long,
    });
  }
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success("Checkin successful");
    },
    onError: error => {
      toast.error(
        (error as AxiosError<{ message: string }>).response?.data.message ||
          `Checkin failed with error: ${error.message}`
      );
    },
  });
}
