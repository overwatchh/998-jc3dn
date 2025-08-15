"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LecturerDashboard() {
  return (
    <div className="p-4 space-y-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Lecturer!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This is the lecturer&apos;s view. You can manage your courses and
            students here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
