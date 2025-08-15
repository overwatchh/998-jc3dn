"use client"

import { mockData } from "@/app/mockData"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  MapPin,
  QrCode,
} from "lucide-react"
import { redirect } from "next/navigation"

export function StudentDashboard() {
  const { todaysClasses, recentActivity } = mockData
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            Present
          </Badge>
        )
      case "absent":
        return <Badge variant="destructive">Absent</Badge>
      case "upcoming":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            Upcoming
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-4 space-y-6 bg-background text-foreground">
      {/* Warning Banner */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Your Physics 301 attendance is below 75%. Attend upcoming classes to
          maintain eligibility.
        </AlertDescription>
      </Alert>

      {/* Scan QR Code Button */}
      <Button
        onClick={() => redirect("/scan")}
        className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold"
      >
        <QrCode className="mr-3 h-6 w-6" />
        Scan QR Code
      </Button>

      {/* Today's Classes */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{"Today's Classes"}</h2>
        <div className="space-y-3">
          {todaysClasses.map(course => (
            <Card
              key={course.id}
              className="cursor-pointer hover:shadow-md transition-shadow bg-card text-card-foreground"
              onClick={() => {
                redirect("/course-detail")
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{course.name}</h3>
                  {getStatusBadge(course.status)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="mr-4">{course.time}</span>
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{course.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        course.status === "present"
                          ? "bg-green-500"
                          : course.status === "absent"
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <span className="text-sm text-muted-foreground">
                      Attendance: {course.attendance}%
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Attendance Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Attendance Overview</h2>
        <Card className="bg-card text-card-foreground">
          <CardContent className="p-4 space-y-4">
            {todaysClasses.map(course => (
              <div key={course.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{course.name}</span>
                  <span className="text-muted-foreground">
                    {course.attendance}%
                  </span>
                </div>
                <Progress
                  value={course.attendance}
                  className={`h-2 ${
                    course.attendance < 75
                      ? "[&>div]:bg-red-500"
                      : "[&>div]:bg-green-500"
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <Card className="bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {activity.course}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.date}
                    </p>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
