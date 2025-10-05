"use client";

import { StudentAnalytics } from "./student-analytics";

export function StudentDashboard() {
  return (
    <div className="bg-background text-foreground space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Analytics</h1>
        <p className="text-muted-foreground">
          Track your attendance performance, goals, and trends
        </p>
      </div>
      <StudentAnalytics />
    </div>
  );
}
