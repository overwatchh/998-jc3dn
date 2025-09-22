import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StudentAnalytics } from "../_components/student-analytics";

export default async function StudentAnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "student") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Analytics</h1>
          <p className="text-muted-foreground">
            Track your attendance performance, goals, and trends
          </p>
        </div>

        <StudentAnalytics />
      </div>
    </div>
  );
}