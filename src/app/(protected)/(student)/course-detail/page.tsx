"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  MapPin,
  QrCode,
  User,
} from "lucide-react";
import { CourseStatusBadge } from "./_components/CourseStatusBadge";
import { CourseStatusIcon } from "./_components/CourseStatusIcon";
import { courseData } from "./mockdata";

export default function CourseDetailScreen() {
  const course = courseData.cs101;

  if (!course) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center">
          <Button variant="ghost" size="icon" className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-foreground text-xl font-semibold">
            Course Not Found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center">
        <div>
          <h1 className="text-foreground text-xl font-semibold">
            {course.name}
          </h1>
          <p className="text-muted-foreground text-sm">{course.code}</p>
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
            <User className="text-muted-foreground mr-2 h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              {course.instructor}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="text-muted-foreground mr-2 h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              {course.schedule}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="text-muted-foreground mr-2 h-4 w-4" />
            <span className="text-muted-foreground text-sm">
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
          <div className="mb-4 flex items-center justify-between">
            <div className="text-center">
              <div className="relative mx-auto mb-2 h-16 w-16">
                <svg
                  className="h-16 w-16 -rotate-90 transform"
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
                  <span className="text-foreground text-sm font-bold">
                    {course.attendance}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-foreground text-xl font-bold">
                {course.attendedClasses}/{course.totalClasses}
              </p>
              <p className="text-muted-foreground text-sm">Classes Attended</p>
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
              <p className="text-foreground font-medium">
                {course.nextSession.date}
              </p>
              <div className="text-muted-foreground mt-1 flex items-center text-sm">
                <Clock className="mr-1 h-4 w-4" />
                <span className="mr-4">{course.nextSession.time}</span>
                <MapPin className="mr-1 h-4 w-4" />
                <span>{course.nextSession.location}</span>
              </div>
            </div>
            <Calendar className="text-muted-foreground h-8 w-8" />
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
                    <p className="text-foreground text-sm font-medium">
                      {record.date}
                    </p>
                    <div className="text-muted-foreground flex items-center text-xs">
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
          <QrCode className="mr-2 h-4 w-4" />
          Scan QR Code
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Contact Instructor
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            View Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
