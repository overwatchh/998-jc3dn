"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  HelpCircle,
  MapPin,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const mockData = {
  todaysClasses: [
    {
      id: 1,
      name: "Physics 301",
      time: "10:00 AM - 12:00 PM",
      location: "Room 101",
      attendance: 75,
      status: "present",
    },
    {
      id: 2,
      name: "Chemistry 301",
      time: "10:00 AM - 12:00 PM",
      location: "Room 102",
      attendance: 75,
      status: "present",
    },
    {
      id: 3,
      name: "Biology 301",
      time: "10:00 AM - 12:00 PM",
      location: "Room 103",
      attendance: 75,
      status: "present",
    },
  ],
  recentActivity: [
    {
      course: "Physics 301",
      date: "2023-03-01",
      status: "present",
    },
    {
      course: "Chemistry 301",
      date: "2023-03-02",
      status: "absent",
    },
    {
      course: "Biology 301",
      date: "2023-03-03",
      status: "upcoming",
    },
  ],
};

export function StudentDashboard() {
  const { todaysClasses, recentActivity } = mockData;
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            Present
          </Badge>
        );
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "upcoming":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Upcoming
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="bg-background text-foreground space-y-6 p-4">
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
        onClick={() => redirect("/scan-qr")}
        className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 w-full text-lg font-semibold"
      >
        <QrCode className="mr-3 h-6 w-6" />
        Scan QR Code
      </Button>

      <Link href="/tutorial" passHref className="w-full">
        <Button variant="outline" className="w-full">
          <HelpCircle className="mr-2 h-4 w-4" />
          How it works? View Tutorial
        </Button>
      </Link>

      {/* Today's Classes */}
      <div className="mt-3">
        <h2 className="mb-3 text-lg font-semibold">{"Today's Classes"}</h2>
        <div className="space-y-3">
          {todaysClasses.map(course => (
            <Card
              key={course.id}
              className="bg-card text-card-foreground cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                redirect("/course-detail");
              }}
            >
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{course.name}</h3>
                  {getStatusBadge(course.status)}
                </div>
                <div className="text-muted-foreground mb-2 flex items-center text-sm">
                  <Clock className="mr-1 h-4 w-4" />
                  <span className="mr-4">{course.time}</span>
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>{course.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`mr-2 h-3 w-3 rounded-full ${
                        course.status === "present"
                          ? "bg-green-500"
                          : course.status === "absent"
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <span className="text-muted-foreground text-sm">
                      Attendance: {course.attendance}%
                    </span>
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Attendance Overview */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Attendance Overview</h2>
        <Card className="bg-card text-card-foreground">
          <CardContent className="space-y-4 p-4">
            {todaysClasses.map(course => (
              <div key={course.id}>
                <div className="mb-1 flex justify-between text-sm">
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
        <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
        <Card className="bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      {activity.course}
                    </p>
                    <p className="text-muted-foreground text-xs">
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
  );
}
