import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api/apiClient";
import { queryClient } from "@/lib/queryClient";

export interface ReminderProcessingResult {
  totalStudentsProcessed: number;
  emailsSent: number;
  emailsFailed: number;
  studentsSkipped: number;
  errors: string[];
}

export interface EmailReminderHistory {
  id: number;
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: number;
  course_name: string;
  course_code: string;
  reminder_type: 'first_absence' | 'second_absence' | 'critical_absence';
  session_type: 'lecture' | 'lab';
  missed_count: number;
  total_sessions: number;
  attendance_percentage: number;
  email_subject: string;
  email_status: 'sent' | 'failed' | 'pending';
  sent_at: string;
}

export interface AttendanceStatistics {
  course_id: number;
  course_name: string;
  course_code: string;
  total_students: number;
  students_below_threshold: number;
  average_attendance_percentage: number;
}

export interface CourseReminderSettings {
  lectureCount: number;
  labCount: number;
  attendanceThreshold: number;
  emailEnabled: boolean;
}

export const useProcessAllReminders = () => {
  return useMutation<ReminderProcessingResult>({
    mutationFn: async () => {
      const response = await apiClient.post("/admin/attendance/reminders", {
        action: "process_all"
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "reminders"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "statistics"] });
    },
  });
};

export const useProcessCourseReminders = () => {
  return useMutation<ReminderProcessingResult, Error, number>({
    mutationFn: async (courseId: number) => {
      const response = await apiClient.post("/admin/attendance/reminders", {
        action: "process_course",
        courseId
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "reminders"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "statistics"] });
    },
  });
};

export const useProcessStudentReminder = () => {
  return useMutation<{ emailSent: boolean }, Error, { studentId: string; courseId: number }>({
    mutationFn: async ({ studentId, courseId }) => {
      const response = await apiClient.post("/admin/attendance/reminders", {
        action: "process_student",
        studentId,
        courseId
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "reminders"] });
    },
  });
};

export const useReminderHistory = (studentId?: string, courseId?: number, limit: number = 50) => {
  return useQuery<EmailReminderHistory[]>({
    queryKey: ["attendance", "reminders", "history", studentId, courseId, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "history", limit: limit.toString() });
      
      if (studentId) params.append("studentId", studentId);
      if (courseId) params.append("courseId", courseId.toString());
      
      const response = await apiClient.get(`/admin/attendance/reminders?${params}`);
      return response.data.data;
    },
  });
};

export const useAttendanceStatistics = (courseId?: number) => {
  return useQuery<AttendanceStatistics[]>({
    queryKey: ["attendance", "statistics", courseId],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "statistics" });
      
      if (courseId) params.append("courseId", courseId.toString());
      
      const response = await apiClient.get(`/admin/attendance/reminders?${params}`);
      return response.data.data;
    },
  });
};

export const useUpdateReminderSettings = () => {
  return useMutation<void, Error, { courseId: number; settings: Partial<CourseReminderSettings> }>({
    mutationFn: async ({ courseId, settings }) => {
      const response = await apiClient.put("/admin/attendance/settings", {
        courseId,
        settings
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "settings"] });
    },
  });
};

export const useToggleReminderEmails = () => {
  return useMutation<void, Error, { courseId: number; enabled: boolean }>({
    mutationFn: async ({ courseId, enabled }) => {
      const response = await apiClient.post("/admin/attendance/settings", {
        courseId,
        action: enabled ? "enable" : "disable"
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "settings"] });
    },
  });
};