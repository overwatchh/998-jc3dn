import { authClient } from "@/lib/api/apiClient";
import apiClient from "@/lib/api/apiClient";
import { queryClient } from "@/lib/queryClient";
import { User } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const CURRENT_USER_QUERY_KEY = ["currentUser"];

// Get current user (me) query
export const useCurrentUser = () => {
  const queryFn = async () => {
    const { data } = await apiClient.get<{ user: User | null }>("/auth/me");
    return data;
  };
  return useQuery({
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
      callbackURL: string;
    }) => {
      const response = await apiClient.post("/auth/signin", credentials);
      return response.data;
    },
    onSuccess: res => {
      queryClient.invalidateQueries({ queryKey: [CURRENT_USER_QUERY_KEY] });

      if (res.redirect) {
        router.push(res.url);
      }
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
      queryClient.invalidateQueries({ queryKey: [CURRENT_USER_QUERY_KEY] });
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CURRENT_USER_QUERY_KEY] });
      router.push("/login");
    },
  });
};
