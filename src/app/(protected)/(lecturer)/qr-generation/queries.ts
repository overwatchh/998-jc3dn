import apiClient from "@/lib/api/apiClient";
import {
  AbsentListResponse,
  LiveCheckinResponse,
  CourseSessionResponse,
  StudentListResponse,
  LecturerSubjectsResponse,
} from "@/types/course";
import {
  GenerateQrRequestBody,
  GenerateQrResponse,
  GetQrCodesResponse,
} from "@/types/qr-code";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QR_CODE_GENERATION_QUERY_KEY = ["qrCodeGeneration"];

// Generate QR code (POST /lecturer/study-session/{id}/qr)
export const useGenerateQr = (id: number) => {
  const queryClient = useQueryClient();
  const mutationFn = async (args: GenerateQrRequestBody) => {
    const { data } = await apiClient.post<GenerateQrResponse>(
      `/lecturer/study-session/${id}/qr`,
      args
    );
    return data;
  };
  return useMutation({
    mutationKey: [QR_CODE_GENERATION_QUERY_KEY, id],
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["qrCodes"], id],
      });
    },
  });
};

// Add second validity window to an existing QR code (PUT /lecturer/study-session/{id}/qr)
type AddSecondValidityRequestBody = {
  qr_code_id: number;
};

type AddSecondValidityResponse = {
  message: string;
  qr_code_id: number;
  week_number: number;
  validity: {
    validity_id: number;
    count: number;
    start_time: string;
    end_time: string;
  };
};

export const useAddSecondValidity = (id: number) => {
  const queryClient = useQueryClient();
  const mutationFn = async (args: AddSecondValidityRequestBody) => {
    const { data } = await apiClient.put<AddSecondValidityResponse>(
      `/lecturer/study-session/${id}/qr`,
      args
    );
    return data;
  };
  return useMutation({
    mutationKey: [QR_CODE_GENERATION_QUERY_KEY, id, "addValidity"],
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["qrCodes"], id],
      });
    },
  });
};

const COURSES_QUERY_KEY = ["courses"];

// Get courses (flatten subjects + study_sessions to UI-friendly list)
export const useGetCourses = () => {
  const queryFn = async () => {
    const { data } =
      await apiClient.get<LecturerSubjectsResponse>("/lecturer/subjects");
    const flattened: CourseSessionResponse = data.data.flatMap(subject =>
      subject.study_sessions.map(ss => ({
        id: ss.study_session_id,
        name: subject.subject_name,
        code: subject.subject_code,
      }))
    );
    return flattened;
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
export const useGetCheckedInStudents = (
  id: number,
  weekNumber?: number,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  const queryFn = async () => {
    const { data } = await apiClient.get<LiveCheckinResponse>(
      `/lecturer/study-session/${id}/checkin-list`,
      weekNumber !== undefined ? { params: { week_number: weekNumber } } : {}
    );
    return data;
  };
  return useQuery({
    queryKey: [CHECKED_IN_STUDENTS_QUERY_KEY, id, weekNumber],
    queryFn,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
};

// Retrieves QR code information for a specific study session and QR code ID. The response includes the QR image (base64 Data URL), the associated study session, week number, and the validity window.
const QR_CODE_INFO_QUERY_KEY = ["qrCodeInfo"];
export const useGetQrCode = (
  id: number,
  qrCodeId: number,
  options?: { enabled?: boolean }
) => {
  const queryFn = async () => {
    const { data } = await apiClient.get<GenerateQrResponse>(
      `/lecturer/study-session/${id}/qr/${qrCodeId}`
    );
    return data;
  };
  return useQuery({
    queryKey: [QR_CODE_INFO_QUERY_KEY, id, qrCodeId],
    queryFn,
    enabled: options?.enabled,
  });
};

// Retrieves QR codes created for the study session (one per week) with their validity windows. Can be filtered by week_number.
const QR_CODES_QUERY_KEY = ["qrCodes"];
export const useGetQrCodes = (
  id: number,
  weekNumber?: number,
  options?: { enabled?: boolean }
) => {
  const queryFn = async () => {
    const { data } = await apiClient.get<GetQrCodesResponse>(
      `/lecturer/study-session/${id}/qr`,
      weekNumber !== undefined ? { params: { week_number: weekNumber } } : {}
    );
    return data;
  };
  return useQuery({
    queryKey: [QR_CODES_QUERY_KEY, id, weekNumber],
    queryFn,
    enabled: options?.enabled,
  });
};

// Get student list expected in the study session
const STUDENT_LIST_QUERY_KEY = ["studentList"];
export const useGetStudentList = (
  id: number,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  const queryFn = async () => {
    const { data } = await apiClient.get<StudentListResponse>(
      `/lecturer/study-session/${id}/student-list`
    );
    return data;
  };
  return useQuery({
    queryKey: [STUDENT_LIST_QUERY_KEY, id],
    queryFn,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
};

// Get subjects taught by lecturer with grouped study sessions
const LECTURER_SUBJECTS_QUERY_KEY = ["lecturerSubjects"];
export const useGetLecturerSubjects = () => {
  const queryFn = async () => {
    const { data } =
      await apiClient.get<LecturerSubjectsResponse>(`/lecturer/subjects`);
    return data;
  };
  return useQuery({
    queryKey: [LECTURER_SUBJECTS_QUERY_KEY],
    queryFn,
  });
};
