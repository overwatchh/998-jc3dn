"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DayPattern {
  day: string;
  dayNumber: number;
  totalCheckins: number;
  uniqueStudents: number;
  distributionPercentage: number;
  peakHour: number | null;
}

interface DayOfWeekData {
  patterns: DayPattern[];
  summary: {
    totalCheckins: number;
    busiestDay: string;
    bestAttendanceDay: string;
    daysWithData: number;
  };
}

interface DayOfWeekPatternsProps {
  sessionType?: string;
  subjectId?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const formatTime = (hour: number | null) => {
  if (hour === null) return "N/A";
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${ampm}`;
};

export default function DayOfWeekPatterns({ sessionType = "both", subjectId }: DayOfWeekPatternsProps) {
  const [data, setData] = useState<DayOfWeekData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [sessionType, subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sessionType !== "both") {
        params.append("sessionType", sessionType);
      }
      if (subjectId && subjectId !== 'all') {
        params.append("subjectId", subjectId);
      }

      const response = await fetch(`/api/analytics/day-of-week-patterns?${params}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching day-of-week patterns:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No day-of-week attendance data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.patterns.map(pattern => ({
    day: pattern.day.substring(0, 3), // Mon, Tue, etc.
    checkins: pattern.totalCheckins,
    distribution: pattern.distributionPercentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Day-of-Week Attendance Patterns</h2>
        <p className="text-muted-foreground">Analyze attendance patterns across different days of the week</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Check-ins</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  {data.summary.totalCheckins.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Busiest Day</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  {data.summary.busiestDay}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Best Attendance</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  {data.summary.bestAttendanceDay}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-ins by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Check-ins by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'checkins' ? value.toLocaleString() : `${value}%`,
                    name === 'checkins' ? 'Check-ins' : 'Distribution'
                  ]}
                />
                <Bar dataKey="checkins" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Detailed Day Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.patterns.map((pattern, index) => (
          <Card key={pattern.day} className="hover:shadow-lg transition-shadow min-w-0">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm sm:text-base lg:text-lg truncate">{pattern.day}</CardTitle>
                <Badge
                  variant={pattern.distributionPercentage > 30 ? "default" : "secondary"}
                  className="text-xs flex-shrink-0 whitespace-nowrap"
                >
                  {pattern.distributionPercentage}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Check-ins</p>
                  <p className="font-semibold text-foreground truncate text-sm sm:text-base">{pattern.totalCheckins.toLocaleString()}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Students</p>
                  <p className="font-semibold text-foreground truncate text-sm sm:text-base">{pattern.uniqueStudents}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Peak Hour</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 truncate text-sm sm:text-base">{formatTime(pattern.peakHour)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}