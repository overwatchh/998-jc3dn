"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Filter, List } from "lucide-react"
import { useState } from "react"
import { attendanceRecords } from "./mockdata"

export default function AttendanceRecordsScreen() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedCourse, setSelectedCourse] = useState("all")

  const overallStats = {
    percentage: 78,
    attended: 23,
    total: 30,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Present
          </Badge>
        )
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Absent
          </Badge>
        )
      case "late":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Late
          </Badge>
        )
      case "partial":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Partial
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredRecords =
    selectedCourse === "all"
      ? attendanceRecords
      : attendanceRecords.filter(record => record.course === selectedCourse)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-primary">My Attendance</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg
                  className="w-20 h-20 transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray={`${overallStats.percentage}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {overallStats.percentage}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-primary/80">Overall</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {overallStats.attended}/{overallStats.total}
              </p>
              <p className="text-sm text-primary/80">Classes Attended</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Tabs and Filters */}
      <div className="flex items-center justify-between">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="Computer Science 101">
              Computer Science 101
            </SelectItem>
            <SelectItem value="Mathematics 201">Mathematics 201</SelectItem>
            <SelectItem value="Physics 301">Physics 301</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardContent className="p-0">
          {filteredRecords.length > 0 ? (
            <div className="divide-y">
              {filteredRecords.map((record, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-primary">{record.course}</p>
                    <p className="text-sm text-primary/80">{record.date}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(record.status)}
                    <p className="text-sm text-primary mt-1">
                      {record.checkInTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-primary">No attendance records found</p>
              <p className="text-sm text-gray-500">
                Try adjusting your filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
