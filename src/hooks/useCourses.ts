import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';
import { Course } from '@/types';
import { queryClient } from '@/lib/queryClient';

// Get all courses
export const useCourses = () => {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await apiClient.get('/courses');
      return response.data;
    },
  });
};

// Get course by ID
export const useCourse = (courseId: string) => {
  return useQuery<Course>({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      const response = await apiClient.get(`/courses/${courseId}`);
      return response.data;
    },
    enabled: !!courseId, // Only run query if courseId is provided
  });
};

// Create course mutation
export const useCreateCourse = () => {
  return useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      const response = await apiClient.post('/courses', courseData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate courses query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

// Update course mutation
export const useUpdateCourse = () => {
  return useMutation({
    mutationFn: async ({ courseId, courseData }: { courseId: string; courseData: Partial<Course> }) => {
      const response = await apiClient.put(`/courses/${courseId}`, courseData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific course and courses list
      queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

// Add student to course mutation
export const useAddStudentToCourse = () => {
  return useMutation({
    mutationFn: async ({ courseId, studentId }: { courseId: string; studentId: string }) => {
      const response = await apiClient.post(`/courses/${courseId}/students`, { studentId });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific course
      queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId] });
    },
  });
};

// Remove student from course mutation
export const useRemoveStudentFromCourse = () => {
  return useMutation({
    mutationFn: async ({ courseId, studentId }: { courseId: string; studentId: string }) => {
      const response = await apiClient.delete(`/courses/${courseId}/students/${studentId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific course
      queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId] });
    },
  });
};
