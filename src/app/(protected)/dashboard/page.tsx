"use client";

import { AdminDashboard } from "@/app/(protected)/(admin)/_components/AdminDashboard";
import { useCurrentUser } from "@/hooks/useAuth";
import { Roles } from "@/types";
import { redirect } from "next/navigation";
import { InstructorDashboard } from "../(lecturer)/_components/lecturer-dashboard";
import { StudentDashboard } from "../(student)/student-dashboard";
import { LoadingScreen } from "@/components/loading-skeleton";

export default function DashboardPage() {
  const { data, isLoading } = useCurrentUser();

  if (isLoading) return <LoadingScreen />;

  if (!data) redirect("/login");

  const userRole = data.user.role;

  switch (userRole) {
    case Roles.STUDENT:
      return <StudentDashboard />;
    case Roles.INSTRUCTOR:
      return <InstructorDashboard />;
    case Roles.ADMIN:
      return <AdminDashboard />;
    default:
      // return <RolePicker userId={user.id} />;
      return null;
  }
}
