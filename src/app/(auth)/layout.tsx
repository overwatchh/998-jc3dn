"use client";

import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex grow flex-col items-center justify-center">
      {children}
    </div>
  );
}
