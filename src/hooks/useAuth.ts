import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';
import { User } from '@/types';
import { queryClient } from '@/lib/queryClient';

// Get current user (me) query
export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/auth/me');
        return response.data;
      } catch (error: unknown) {
        // Check if error is an object with a response property
        if (
          typeof error === 'object' && 
          error !== null && 
          'response' in error && 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typeof (error as any).response === 'object' && 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any).response !== null &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'status' in (error as any).response &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any).response.status === 401
        ) {
          return null;
        }
        throw error;
      }
    },
  });
};

// Login mutation
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the currentUser query to refetch user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

// Register mutation
export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string; role?: string }) => {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the currentUser query to refetch user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

// Logout mutation
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the currentUser query to refetch user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};
