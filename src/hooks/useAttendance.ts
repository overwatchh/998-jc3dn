import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';
import { AttendanceRecord } from '@/types';
import { queryClient } from '@/lib/queryClient';

// Mark attendance for a lecture
export const useMarkAttendance = () => {
  return useMutation({
    mutationFn: async ({ 
      lectureId, 
      qrCodeData, 
      coordinates 
    }: { 
      lectureId: string; 
      qrCodeData: string; 
      coordinates?: { latitude: number; longitude: number } 
    }) => {
      const response = await apiClient.post('/attendance', {
        lectureId,
        qrCodeData,
        coordinates,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Get attendance records for a lecture
export const useAttendanceByLecture = (lectureId: string) => {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'lecture', lectureId],
    queryFn: async () => {
      const response = await apiClient.get(`/attendance/lecture/${lectureId}`);
      return response.data;
    },
    enabled: !!lectureId, // Only run query if lectureId is provided
  });
};

// Get attendance records for a student
export const useAttendanceByStudent = (studentId: string) => {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'student', studentId],
    queryFn: async () => {
      const response = await apiClient.get(`/attendance/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId, // Only run query if studentId is provided
  });
};

// Update attendance record
export const useUpdateAttendanceRecord = () => {
  return useMutation({
    mutationFn: async ({ 
      recordId, 
      data 
    }: { 
      recordId: string; 
      data: { status?: string; notes?: string } 
    }) => {
      const response = await apiClient.put(`/attendance/${recordId}`, data);
      return response.data;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (_, _variables) => {
      // Invalidate specific attendance record queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};
