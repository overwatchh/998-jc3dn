"use client";

import { AdminDashboard } from "@/app/(protected)/(admin)/_components/AdminDashboard";
import { LoadingScreen } from "@/components/loading-skeleton";
import { useCurrentUser } from "@/hooks/useAuth";
import { Roles } from "@/types";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { InstructorDashboard } from "../(lecturer)/_components/lecturer-dashboard";
import { StudentDashboard } from "../(student)/student-dashboard";

export default function DashboardPage() {
  const { data, isLoading } = useCurrentUser();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading || !isMounted) return <LoadingScreen />;

  if (!data) redirect("/login");

  const userRole = data.user?.role;

  switch (userRole) {
    case Roles.STUDENT:
      return <StudentDashboard />;
    case Roles.LECTURER:
      return <InstructorDashboard />;
    case Roles.ADMIN:
      return <AdminDashboard />;
    default:
      // return <RolePicker userId={user.id} />;
      return null;
  }
}
