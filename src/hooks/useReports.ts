import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';

// Get attendance statistics for a course
export const useCourseAttendanceStats = (courseId: string) => {
  return useQuery({
    queryKey: ['reports', 'course', courseId],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/course/${courseId}`);
      return response.data;
    },
    enabled: !!courseId, // Only run query if courseId is provided
  });
};

// Get attendance statistics for a student
export const useStudentAttendanceStats = (studentId: string) => {
  return useQuery({
    queryKey: ['reports', 'student', studentId],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId, // Only run query if studentId is provided
  });
};
