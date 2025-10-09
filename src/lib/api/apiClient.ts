import axios from "axios";
import { createAuthClient } from "better-auth/client";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true, // Important for sending/receiving cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Better Auth client for handling OAuth flows properly
export const authClient = createAuthClient({
  baseURL: process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_APP_URL // Replace with your production domain
    : "http://localhost:3000",
  fetchOptions: {
    onRequest: (context) => {
      // Add any custom headers if needed
      return context;
    },
    onResponse: (context) => {
      // Handle response if needed
      return context;
    },
  },
});

export default apiClient;
