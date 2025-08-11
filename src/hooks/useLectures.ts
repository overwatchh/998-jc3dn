import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';
import { Lecture } from '@/types';
import { queryClient } from '@/lib/queryClient';

// Get all lectures
export const useLectures = (courseId?: string) => {
  return useQuery<Lecture[]>({
    queryKey: ['lectures', { courseId }],
    queryFn: async () => {
      const url = courseId ? `/lectures?courseId=${courseId}` : '/lectures';
      const response = await apiClient.get(url);
      return response.data;
    },
  });
};

// Get lecture by ID
export const useLecture = (lectureId: string) => {
  return useQuery<Lecture>({
    queryKey: ['lectures', lectureId],
    queryFn: async () => {
      const response = await apiClient.get(`/lectures/${lectureId}`);
      return response.data;
    },
    enabled: !!lectureId, // Only run query if lectureId is provided
  });
};

// Create lecture mutation
export const useCreateLecture = () => {
  return useMutation({
    mutationFn: async (lectureData: {
      title: string;
      courseId: string;
      date: string;
      startTime: string;
      endTime: string;
      locationId: string;
      attendanceWindow?: number;
    }) => {
      const response = await apiClient.post('/lectures', lectureData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate lectures query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures', { courseId: variables.courseId }] });
    },
  });
};

// Update lecture mutation
export const useUpdateLecture = () => {
  return useMutation({
    mutationFn: async ({ lectureId, lectureData }: { 
      lectureId: string; 
      lectureData: Partial<Lecture> 
    }) => {
      const response = await apiClient.put(`/lectures/${lectureId}`, lectureData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific lecture and lectures list
      queryClient.invalidateQueries({ queryKey: ['lectures', variables.lectureId] });
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
    },
  });
};

// Generate new QR code for lecture
export const useGenerateQRCode = () => {
  return useMutation({
    mutationFn: async ({ lectureId, expiryMinutes }: { 
      lectureId: string; 
      expiryMinutes?: number 
    }) => {
      const response = await apiClient.post(`/lectures/${lectureId}/qrcode`, { expiryMinutes });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific lecture
      queryClient.invalidateQueries({ queryKey: ['lectures', variables.lectureId] });
    },
  });
};
