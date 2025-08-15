"use client"

import { AdminDashboard } from "@/app/(protected)/(admin)/_components/AdminDashboard"
import { RolePicker } from "@/components/role-picker"
import { authClient } from "@/lib/auth/auth-client"
import { Roles } from "@/lib/auth/permission"
import { redirect } from "next/navigation"
import { LecturerDashboard } from "../(lecturer)/_components/lecturer-dashboard"
import { StudentDashboard } from "../(student)/student-dashboard"

export default function DashboardPage() {
  const { data: session } = authClient.useSession()

  if (!session) {
    redirect("/login")
  }

  const userRole = session.user.role

  switch (userRole) {
    case Roles.STUDENT:
      return <StudentDashboard />
    case Roles.LECTURER:
      return <LecturerDashboard />
    case Roles.ADMIN:
      return <AdminDashboard />
    default:
      return <RolePicker userId={session.user.id} />
  }
}
