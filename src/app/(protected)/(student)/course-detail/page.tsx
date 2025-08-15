"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  MapPin,
  QrCode,
  User,
} from "lucide-react"
import { CourseStatusBadge } from "./_components/CourseStatusBadge"
import { CourseStatusIcon } from "./_components/CourseStatusIcon"
import { courseData } from "./mockdata"

export default function CourseDetailScreen() {
  const course = courseData.cs101

  if (!course) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            Course Not Found
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {course.name}
          </h1>
          <p className="text-sm text-muted-foreground">{course.code}</p>
        </div>
      </div>

      {/* Low Attendance Alert */}
      {course.attendance < 75 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your attendance is below the required 75%. Attend upcoming classes
            to maintain eligibility.
          </AlertDescription>
        </Alert>
      )}

      {/* Course Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {course.instructor}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {course.schedule}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {course.location}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg
                  className="w-16 h-16 transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    className="stroke-border"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    className={
                      course.attendance >= 75
                        ? "stroke-green-500 dark:stroke-green-400"
                        : "stroke-destructive"
                    }
                    strokeWidth="3"
                    strokeDasharray={`${course.attendance}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground">
                    {course.attendance}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">
                {course.attendedClasses}/{course.totalClasses}
              </p>
              <p className="text-sm text-muted-foreground">Classes Attended</p>
            </div>
          </div>
          <Progress
            value={course.attendance}
            className={`h-2 ${
              course.attendance < 75
                ? "[&>div]:bg-destructive"
                : "[&>div]:bg-green-500 dark:[&>div]:bg-green-400"
            }`}
          />
        </CardContent>
      </Card>

      {/* Next Session */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
                {course.nextSession.date}
              </p>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Clock className="h-4 w-4 mr-1" />
                <span className="mr-4">{course.nextSession.time}</span>
                <MapPin className="h-4 w-4 mr-1" />
                <span>{course.nextSession.location}</span>
              </div>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {course.recentAttendance.map((record, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <CourseStatusIcon
                    status={record.status}
                    verified={record.verified}
                    locationAccuracy={record.locationAccuracy}
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">
                      {record.date}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>{record.time}</span>
                      {record.locationAccuracy > 0 && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          📍 {record.locationAccuracy}% accuracy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <CourseStatusBadge
                  status={record.status}
                  verified={record.verified}
                  locationAccuracy={record.locationAccuracy}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button className="w-full">
          <QrCode className="h-4 w-4 mr-2" />
          Scan QR Code
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Contact Instructor
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Schedule
          </Button>
        </div>
      </div>
    </div>
  )
}
