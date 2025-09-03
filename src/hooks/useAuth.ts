import apiClient from "@/lib/api/apiClient";
import { queryClient } from "@/lib/queryClient";
import { User } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const CURRENT_USER_QUERY_KEY = ["currentUser"];

// Get current user (me) query
export const useCurrentUser = () => {
  const queryFn = async () => {
    const { data } = await apiClient.get("/auth/me");
    return data;
  };
  return useQuery<{ user: User | null }>({
    queryKey: [CURRENT_USER_QUERY_KEY],
    queryFn,
  });
};

// Login mutation
export const useLogin = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: async (credentials: {
      email: string;
      password: string;
      rememberMe: boolean;
      callbackURL?: string | null;
    }) => {
      const response = await apiClient.post("/auth/signin", credentials);
      console.log(response);
      return response.data;
    },
    onSuccess: data => {
      if (data.redirect) {
        router.push(data.url);
      }

      // Invalidate the currentUser query to refetch user data
      queryClient.invalidateQueries({ queryKey: [CURRENT_USER_QUERY_KEY] });
    },
  });
};

// Register mutation
export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
    }) => {
      const response = await apiClient.post("/auth/signup", userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the currentUser query to refetch user data
      queryClient.invalidateQueries({ queryKey: [CURRENT_USER_QUERY_KEY] });
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/auth/signout");
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the currentUser query to refetch user data
      queryClient.invalidateQueries({ queryKey: [CURRENT_USER_QUERY_KEY] });
      router.push("/login");
    },
  });
};
