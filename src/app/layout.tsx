"use client";
import { ReactNode, useEffect } from "react";
import { ReactQueryProvider } from "@/lib/queryClient";
import { useCurrentUser } from "@/hooks/useAuth";
import useAuthStore from "@/store/authStore";
import "./globals.css"; // Assuming you have global styles

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        {/* Add necessary head elements here, like meta tags, title, etc. */}
        <title>QR Attendance System</title>
      </head>
      <body>
        <ReactQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser();
  const { setUser, setLoading, clearAuth } = useAuthStore();

  // Update Zustand store based on React Query results
  useEffect(() => {
    if (isLoading) {
      setLoading(true);
    } else if (isError) {
      clearAuth();
    } else {
      setUser(user || null);
    }
  }, [user, isLoading, isError, setUser, setLoading, clearAuth]);

  return <>{children}</>;
}
