import apiClient from "@/lib/api/apiClient";
import {
  AbsentListResponse,
  CheckInListResponse,
  CourseSessionResponse,
} from "@/types/course";
import { GenerateQrResponse } from "@/types/qr-code";
import { useQuery } from "@tanstack/react-query";

const QR_CODE_GENERATION_QUERY_KEY = ["qrCodeGeneration"];

// // Get QR code
// export const useGenerateQr = (id: number) => {
//   const queryClient = useQueryClient();
//   const mutationFn = async (args: GenerateQrRequestBody) => {
//     const { data } = await apiClient.post<GenerateQrResponse>(
//       `/lecturer/session/${id}/generate-qr`,
//       args
//     );
//     return data;
//   };
//   return useMutation({
//     mutationKey: [QR_CODE_GENERATION_QUERY_KEY, id],
//     mutationFn,
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: [QR_CODE_GENERATION_QUERY_KEY],
//       });
//     },
//   });
// };

const COURSES_QUERY_KEY = ["courses"];

// Get courses
export const useGetCourses = () => {
  const queryFn = async () => {
    const { data } =
      await apiClient.get<CourseSessionResponse>("/lecturer/courses");
    return data;
  };
  return useQuery({
    queryKey: [COURSES_QUERY_KEY],
    queryFn,
  });
};

// Get list of absent students
const ABSENT_STUDENTS_QUERY_KEY = ["absentStudents"];
export const useGetAbsentStudents = (id: number) => {
  const queryFn = async () => {
    const { data } = await apiClient.get<AbsentListResponse>(
      `/lecturer/study-session/${id}/absent-list`
    );
    return data;
  };
  return useQuery({
    queryKey: [ABSENT_STUDENTS_QUERY_KEY, id],
    queryFn,
  });
};

// List of students who recently checked in using the QR code
const CHECKED_IN_STUDENTS_QUERY_KEY = ["checkedInStudents"];
export const useGetCheckedInStudents = (id: number) => {
  const queryFn = async () => {
    const { data } = await apiClient.get<CheckInListResponse>(
      `/lecturer/study-session/${id}/checkin-list`
    );
    return data;
  };
  return useQuery({
    queryKey: [CHECKED_IN_STUDENTS_QUERY_KEY, id],
    queryFn,
  });
};

// Retrieves QR code information for a specific study session and QR code ID. The response includes the QR image (base64 Data URL), the associated study session, week number, and the validity window.
const QR_CODE_INFO_QUERY_KEY = ["qrCodeInfo"];
export const useGetQrCode = (id: number, qrCodeId: number) => {
  const queryFn = async () => {
    const { data } = await apiClient.get<GenerateQrResponse>(
      `/lecturer/study-session/${id}/qr/${qrCodeId}`
    );
    return data;
  };
  return useQuery({
    queryKey: [QR_CODE_INFO_QUERY_KEY, id, qrCodeId],
    queryFn,
  });
};

// Retrieves QR codes created for the study session (one per week) with their validity windows. Can be filtered by week_number.
const QR_CODES_QUERY_KEY = ["qrCodes"];
export const useGetQrCodes = (id: number) => {
  // TODO: implement
};
