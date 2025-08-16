"use client";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";
import "./globals.css";
import { Header } from "@/components/header";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add necessary head elements here, like meta tags, title, etc. */}
        <title>QR Attendance System</title>
      </head>
      <body className="flex flex-col h-screen overflow-scroll">
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            {children}
            <Toaster richColors />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
