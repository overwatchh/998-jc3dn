"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  FileText,
  Filter,
  Info,
  Mail,
  MoreHorizontal,
  Printer,
  Search,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  RadialBar,
  RadialBarChart,
  Cell,
} from "recharts";

export default function ReportsAnalytics() {
  const [date, setDate] = useState<DateRange>({
    from: new Date(2025, 2, 1), // Mar 1, 2025
    to: new Date(2025, 3, 24), // Apr 24, 2025
  });
  // Use analytics-specific courses endpoint that shows all courses with attendance data
  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['analytics-courses'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/available-courses');
      const data = await response.json();
      return data;
    }
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Real-time data states
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([]);
  const [studentPerformanceData, setStudentPerformanceData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [keyMetrics, setKeyMetrics] = useState({
    averageAttendance: 0,
    atRiskStudents: 0,
    totalStudents: 0,
    mostAttended: { week: 'N/A', subject: '', attendance: 0 },
    leastAttended: { week: 'N/A', subject: '', attendance: 0 }
  });
  const [lecturerTrends, setLecturerTrends] = useState({
    summary: {
      totalSubjects: 0,
      totalStudents: 0,
      overallAverage: 0,
      performanceLevels: { excellent: 0, good: 0, average: 0, needs_improvement: 0 },
      trendDirection: 'stable'
    },
    subjectPerformance: [],
    weeklyProgression: [],
    engagementPatterns: [],
    insights: {}
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!selectedCourseId && courses && courses.length > 0) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  // Fetch real-time data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!selectedCourseId) return;

      setIsLoadingData(true);
      try {
        // Fetch all analytics data
        const [weeklyRes, studentRes, distributionRes, metricsRes, trendsRes] = await Promise.all([
          fetch(`/api/analytics/weekly-attendance?subjectId=${selectedCourseId}`),
          fetch(`/api/analytics/student-performance?subjectId=${selectedCourseId}&limit=20`),
          fetch(`/api/analytics/attendance-distribution?subjectId=${selectedCourseId}`),
          fetch(`/api/analytics/key-metrics?subjectId=${selectedCourseId}`),
          fetch(`/api/analytics/lecturer-trends`) // Remove course filter to show all courses
        ]);

        const [weeklyData, studentPerformanceData, distributionData, metricsData, trendsData] = await Promise.all([
          weeklyRes.json(),
          studentRes.json(),
          distributionRes.json(),
          metricsRes.json(),
          trendsRes.json()
        ]);

        // Transform data for charts
        setWeeklyAttendanceData(weeklyData.map(item => ({
          week_label: item.week_label,
          date: item.date_label,
          attendance: item.attendance_rate,
          color: item.attendance_rate >= 80 ? '#22c55e' : item.attendance_rate >= 70 ? '#f59e0b' : '#ef4444'
        })));

        setStudentPerformanceData(studentPerformanceData.map(item => ({
          id: item.student_id_anon,
          name: item.student_name,
          email: item.student_email,
          initials: item.initials,
          attendance: item.attendance_percentage,
          attended: item.weeks_attended,
          total: item.total_weeks,
          trend: item.trend
        })));

        setDistributionData(distributionData);
        setKeyMetrics({
          averageAttendance: metricsData?.averageAttendance || 0,
          atRiskStudents: metricsData?.atRiskStudents || 0,
          totalStudents: metricsData?.totalStudents || 0,
          mostAttended: metricsData?.mostAttended || { week: 'N/A', subject: '', attendance: 0 },
          leastAttended: metricsData?.leastAttended || { week: 'N/A', subject: '', attendance: 0 }
        });
        // Debug the trends data (removed for production)

        setLecturerTrends(trendsData || {
          summary: {
            totalSubjects: 0,
            totalStudents: 0,
            overallAverage: 0,
            performanceLevels: { excellent: 0, good: 0, average: 0, needs_improvement: 0 },
            trendDirection: 'stable'
          },
          subjectPerformance: [],
          weeklyProgression: [],
          engagementPatterns: [],
          insights: {}
        });

      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedCourseId]);

  const { data } = useCurrentUser();

  return (
    <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 md:gap-6 md:p-6">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold sm:text-2xl md:text-3xl">
          Welcome, {data?.user?.name}!
        </h1>
      </div>

      {/* Report Configuration Panel */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Course
              </label>
              <Select
                disabled={isCoursesLoading}
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {(courses ?? []).map((c, index) => (
                    <SelectItem key={`course-${c.id}-${index}`} value={String(c.id)}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {date.from ? (
                        date.to ? (
                          <>
                            <span className="hidden sm:inline">
                              {format(date.from, "MMM d, yyyy")} -{" "}
                              {format(date.to, "MMM d, yyyy")}
                            </span>
                            <span className="sm:hidden">
                              {format(date.from, "MMM d")} -{" "}
                              {format(date.to, "MMM d")}
                            </span>
                          </>
                        ) : (
                          format(date.from, "MMM d, yyyy")
                        )
                      ) : (
                        <span>Select date range</span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={date.from}
                    selected={date}
                    onSelect={selectedDate =>
                      selectedDate && setDate(selectedDate)
                    }
                    numberOfMonths={1}
                    className="sm:block"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 md:col-span-2 xl:col-span-2">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Report Type
              </label>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2 lg:grid-cols-4">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="student" className="text-xs sm:text-sm">
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="session" className="text-xs sm:text-sm">
                    Session
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="text-xs sm:text-sm">
                    Trends
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="compare" />
              <label
                htmlFor="compare"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Compare to previous period
              </label>
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={isLoadingData}
            >
              {isLoadingData ? "Loading..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Visualization Dashboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Enhanced Attendance Overview - Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              Weekly Attendance Trend
            </CardTitle>
            <CardDescription className="text-sm">
              Attendance percentages with trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={{
                attendance: {
                  label: "Attendance Rate",
                  color: "#3b82f6",
                },
                threshold: {
                  label: "Target (80%)",
                  color: "#ef4444",
                },
              }}
              className="h-[280px] w-full sm:h-[350px]"
            >
              <AreaChart
                data={Array.isArray(weeklyAttendanceData) ? weeklyAttendanceData : []}
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="week_label"
                  fontSize={11}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={value => `${value}%`}
                  fontSize={11}
                  width={45}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
                          <p className="font-medium text-popover-foreground">{payload[0]?.payload?.week_label}</p>
                          <p className="text-primary">
                            Attendance: {payload[0]?.value}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  opacity={0.7}
                  label={{ value: "Target 80%", position: "insideTopRight", fontSize: 10 }}
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#attendanceGradient)"
                  dot={{ fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: "#3b82f6", strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Class Performance Metrics - Improved Radial Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              Overall Class Performance
            </CardTitle>
            <CardDescription className="text-sm">
              Average attendance and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Radial Chart */}
              <div className="flex justify-center">
                <div className="relative">
                  <ChartContainer
                    config={{
                      attendance: { label: "Attendance", color: "hsl(var(--chart-1))" },
                    }}
                    className="h-[250px] w-[250px]"
                  >
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="85%"
                      data={[{
                        name: "Overall",
                        value: keyMetrics.averageAttendance || 0,
                        fill: keyMetrics.averageAttendance >= 80 ? "hsl(142 76% 36%)" :
                              keyMetrics.averageAttendance >= 60 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)"
                      }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        className="fill-primary"
                      />
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-2xl font-bold ${
                      keyMetrics.averageAttendance >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                      keyMetrics.averageAttendance >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {keyMetrics.averageAttendance}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Average
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {keyMetrics.totalStudents} students
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Legend and Stats */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {distributionData.find(d => d.name === 'Excellent')?.value || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Excellent (90%+)</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {distributionData.find(d => d.name === 'Good')?.value || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Good (80-89%)</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {distributionData.find(d => d.name === 'Average')?.value || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Average (70-79%)</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                      {distributionData.find(d => d.name === 'Poor')?.value || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">At Risk (&lt;70%)</div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary">
                  <div className="text-sm font-medium text-foreground">
                    Class Performance Summary
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {keyMetrics.averageAttendance >= 80
                      ? '✅ Class is performing well above target'
                      : keyMetrics.averageAttendance >= 70
                      ? '⚠️ Class needs improvement to reach target'
                      : '🚨 Class requires immediate attention'
                    }
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Performance Distribution - Enhanced Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              Student Performance Distribution
            </CardTitle>
            <CardDescription className="text-sm">
              Breakdown by attendance performance levels
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center justify-center h-[280px] sm:h-[350px]">
              <div className="relative">
                <ChartContainer
                  config={{
                    excellent: { label: "Excellent", color: "#10b981" },
                    good: { label: "Good", color: "#3b82f6" },
                    average: { label: "Average", color: "#f59e0b" },
                    poor: { label: "Poor", color: "#ef4444" },
                  }}
                  className="h-[240px] w-[240px]"
                >
                  <PieChart>
                    <Pie
                      data={Array.isArray(distributionData) ? distributionData : []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {(Array.isArray(distributionData) ? distributionData : []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          className={`${
                            entry.name === 'Excellent' ? 'fill-emerald-500' :
                            entry.name === 'Good' ? 'fill-blue-500' :
                            entry.name === 'Average' ? 'fill-amber-500' : 'fill-rose-500'
                          }`}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
                              <p className="font-medium text-popover-foreground">{payload[0]?.name}</p>
                              <p className="text-primary">
                                {payload[0]?.value} students ({(((Number(payload[0]?.value) || 0) / (Array.isArray(distributionData) ? distributionData : []).reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold text-foreground">
                    {(Array.isArray(distributionData) ? distributionData : []).reduce((sum, item) => sum + item.value, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Students</div>
                </div>
              </div>
              <div className="ml-6 space-y-3">
                {(Array.isArray(distributionData) ? distributionData : []).map((item, index) => (
                  <div key={`distribution-${item.name}-${index}`} className="flex items-center justify-between min-w-[120px]">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            item.name === 'Excellent' ? '#10b981' :
                            item.name === 'Good' ? '#3b82f6' :
                            item.name === 'Average' ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.value} ({((item.value / (Array.isArray(distributionData) ? distributionData : []).reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(0)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Key Metrics with Visual Indicators */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Key Performance Indicators</CardTitle>
            <CardDescription className="text-sm">
              Critical metrics with visual performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Average Attendance with Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Average Attendance</p>
                  <span className={`text-2xl font-bold ${
                    keyMetrics.averageAttendance >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                    keyMetrics.averageAttendance >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {keyMetrics.averageAttendance}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      keyMetrics.averageAttendance >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                      keyMetrics.averageAttendance >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                      'bg-gradient-to-r from-rose-500 to-rose-600'
                    }`}
                    style={{ width: `${Math.min(keyMetrics.averageAttendance, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: 80% | Current: {keyMetrics.averageAttendance >= 80 ? 'On Track' : keyMetrics.averageAttendance >= 60 ? 'Needs Improvement' : 'Critical'}
                </div>
              </div>

              {/* Students at Risk with Alert Indicator */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Students at Risk</p>
                  <div className="flex items-center space-x-2">
                    {keyMetrics.atRiskStudents > 0 && (
                      <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
                    )}
                    <span className={`text-2xl font-bold ${
                      keyMetrics.atRiskStudents === 0 ? 'text-emerald-600 dark:text-emerald-400' :
                      keyMetrics.atRiskStudents <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {keyMetrics.atRiskStudents}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                      style={{
                        width: keyMetrics.totalStudents > 0 ?
                          `${Math.min((keyMetrics.atRiskStudents / keyMetrics.totalStudents) * 100, 100)}%` : '0%'
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground min-w-max">
                    of {keyMetrics.totalStudents}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {keyMetrics.atRiskStudents === 0 ? 'All students performing well' :
                   keyMetrics.atRiskStudents <= 3 ? 'Manageable risk level' : 'High attention needed'}
                </div>
              </div>
            </div>

            {/* Best vs Worst Session Comparison */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-4">Session Performance Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Best Session */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                      <ArrowUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Best Performance</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{keyMetrics.mostAttended.week}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">{keyMetrics.mostAttended.attendance}% attendance</p>
                    </div>
                  </div>
                </div>

                {/* Worst Session */}
                <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900 rounded-full flex items-center justify-center">
                      <ArrowDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-rose-900 dark:text-rose-100">Needs Attention</p>
                      <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{keyMetrics.leastAttended.week}</p>
                      <p className="text-xs text-rose-600 dark:text-rose-400">{keyMetrics.leastAttended.attendance}% attendance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Advanced Attendance Heatmap */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              Attendance Heatmap by Week
            </CardTitle>
            <CardDescription className="text-sm">
              Visual representation of attendance patterns across weeks
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-4">
              {/* Heatmap Legend */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attendance Rate</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Low</span>
                  <div className="flex space-x-1">
                    <div className="w-4 h-4 bg-red-200 rounded-sm"></div>
                    <div className="w-4 h-4 bg-yellow-200 rounded-sm"></div>
                    <div className="w-4 h-4 bg-green-200 rounded-sm"></div>
                    <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
                    <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
                  </div>
                  <span className="text-xs text-gray-500">High</span>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {(Array.isArray(weeklyAttendanceData) ? weeklyAttendanceData : []).map((week, index) => (
                  <div
                    key={`week-${week.week_label || week.date || index}`}
                    className={`relative p-3 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer ${
                      week.attendance >= 90 ? 'bg-green-500 border-green-600 text-white' :
                      week.attendance >= 80 ? 'bg-green-400 border-green-500 text-white' :
                      week.attendance >= 70 ? 'bg-yellow-400 border-yellow-500 text-gray-900' :
                      week.attendance >= 60 ? 'bg-orange-400 border-orange-500 text-white' :
                      'bg-red-400 border-red-500 text-white'
                    }`}
                    title={`${week.week_label}: ${week.attendance}% attendance`}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium opacity-90">{week.week_label}</div>
                      <div className="text-lg font-bold">{week.attendance}%</div>
                      <div className="text-xs opacity-75">{week.date}</div>
                    </div>
                    {week.attendance >= 90 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Excellent (90%+)</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {(Array.isArray(weeklyAttendanceData) ? weeklyAttendanceData : []).filter(w => w.attendance >= 90).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Good (80-89%)</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {(Array.isArray(weeklyAttendanceData) ? weeklyAttendanceData : []).filter(w => w.attendance >= 80 && w.attendance < 90).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Average (70-79%)</div>
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {(Array.isArray(weeklyAttendanceData) ? weeklyAttendanceData : []).filter(w => w.attendance >= 70 && w.attendance < 80).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Below Target</div>
                    <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                      {(Array.isArray(weeklyAttendanceData) ? weeklyAttendanceData : []).filter(w => w.attendance < 70).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Lecturer Trends & Analytics */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl">
              Teaching Performance Overview
            </CardTitle>
            <CardDescription className="text-sm">
              Comprehensive analytics across all your courses and sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Courses</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{lecturerTrends.summary.totalSubjects}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">%</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Average</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{lecturerTrends.summary.overallAverage}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">👥</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lecturerTrends.summary.totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    {lecturerTrends.summary.trendDirection === 'improving' ? (
                      <ArrowUp className="w-5 h-5 text-white" />
                    ) : lecturerTrends.summary.trendDirection === 'declining' ? (
                      <ArrowDown className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white text-sm">→</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trend</p>
                    <p className={`text-lg font-bold capitalize ${
                      lecturerTrends.summary.trendDirection === 'improving' ? 'text-emerald-600 dark:text-emerald-400' :
                      lecturerTrends.summary.trendDirection === 'declining' ? 'text-rose-600 dark:text-rose-400' :
                      'text-slate-600 dark:text-slate-400'
                    }`}>
                      {lecturerTrends.summary.trendDirection}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Performance Comparison */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-foreground">Course Performance Comparison</h4>
                <div className="text-xs text-muted-foreground">
                  {lecturerTrends.subjectPerformance.length} course{lecturerTrends.subjectPerformance.length !== 1 ? 's' : ''} total
                </div>
              </div>
              {lecturerTrends.subjectPerformance.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {(Array.isArray(lecturerTrends.subjectPerformance) ? lecturerTrends.subjectPerformance : []).map((subject, index) => (
                    <div key={`subject-${subject.subject_code || subject.subject_id || index}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          subject.performance_level === 'excellent' ? 'bg-emerald-500 text-white' :
                          subject.performance_level === 'good' ? 'bg-blue-500 text-white' :
                          subject.performance_level === 'average' ? 'bg-amber-500 text-white' :
                          'bg-rose-500 text-white'
                        }`}>
                          {subject.subject_code?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{subject.subject_code || 'Course ' + (index + 1)}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {subject.subject_name || 'Course Name'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          subject.average_attendance >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                          subject.average_attendance >= 70 ? 'text-amber-600 dark:text-amber-400' :
                          'text-rose-600 dark:text-rose-400'
                        }`}>
                          {subject.average_attendance || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {subject.total_students || 0} students
                        </div>
                        {subject.at_risk_count > 0 && (
                          <div className="text-xs text-rose-600 dark:text-rose-400">
                            {subject.at_risk_count} at risk
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No course data available</p>
                  <p className="text-xs mt-1">Course performance will appear here once data is loaded</p>
                </div>
              )}
            </div>

            {/* Weekly Progression Chart */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-foreground">Weekly Progression Trends</h4>
                <div className="text-xs text-muted-foreground">
                  {lecturerTrends.weeklyProgression.length > 0 ? 'Across all courses' : 'No data available'}
                </div>
              </div>
              {lecturerTrends.weeklyProgression.length > 0 ? (
                <ChartContainer
                  config={{
                    progression: { label: "Average Attendance", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[200px] w-full"
                >
                  <LineChart
                    data={Array.isArray(lecturerTrends.weeklyProgression) ? lecturerTrends.weeklyProgression : []}
                    margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="week_label"
                      fontSize={11}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={value => `${value}%`}
                      fontSize={11}
                      width={45}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
                              <p className="font-medium text-popover-foreground">{payload[0]?.payload?.week_label}</p>
                              <p className="text-primary">
                                Average: {payload[0]?.value}%
                              </p>
                              {payload[0]?.payload?.trend_change !== 0 && (
                                <p className={`text-xs ${
                                  payload[0]?.payload?.trend_change > 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                  {payload[0]?.payload?.trend_change > 0 ? '+' : ''}{payload[0]?.payload?.trend_change}% change
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={80}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="4 4"
                      opacity={0.7}
                      label={{ value: "Target 80%", position: "insideTopRight", fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance_rate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                  <p>No weekly progression data available</p>
                  <p className="text-xs mt-1">Weekly trends will appear here once course data is available</p>
                </div>
              )}
            </div>

            {/* Performance Level Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {lecturerTrends.summary.performanceLevels.excellent}
                </div>
                <div className="text-sm text-emerald-700 dark:text-emerald-300">Excellent Courses</div>
                <div className="text-xs text-muted-foreground">(85%+ avg)</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {lecturerTrends.summary.performanceLevels.good}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Good Courses</div>
                <div className="text-xs text-muted-foreground">(75-84% avg)</div>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {lecturerTrends.summary.performanceLevels.average}
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300">Average Courses</div>
                <div className="text-xs text-muted-foreground">(65-74% avg)</div>
              </div>
              <div className="text-center p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {lecturerTrends.summary.performanceLevels.needs_improvement}
                </div>
                <div className="text-sm text-rose-700 dark:text-rose-300">Needs Attention</div>
                <div className="text-xs text-muted-foreground">(&lt;65% avg)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Attendance Tables */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg sm:text-xl">
            Detailed Attendance
          </CardTitle>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 gap-1">
              <TabsTrigger value="student" className="text-xs sm:text-sm">
                By Student
              </TabsTrigger>
              <TabsTrigger value="session" className="text-xs sm:text-sm">
                By Session
              </TabsTrigger>
              <TabsTrigger value="course" className="text-xs sm:text-sm">
                By Course
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search students..."
                className="bg-background w-full pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Mobile Card View */}
          <div className="block space-y-4 sm:hidden">
            {(Array.isArray(studentPerformanceData) ? studentPerformanceData : []).map((student, index) => (
              <Card key={`mobile-student-${student.id || index}`}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{student.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="leading-none font-medium">
                          {student.name}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Send Notification</DropdownMenuItem>
                        <DropdownMenuItem>Export Data</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          student.attendance >= 80
                            ? "default"
                            : student.attendance >= 70
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {student.attendance}%
                      </Badge>
                      <span className="text-muted-foreground text-sm">
                        {student.attended}/{student.total} sessions
                      </span>
                    </div>
                    <div className="flex items-center">
                      {student.trend === "up" ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : student.trend === "down" ? (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto rounded-md border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[50px] lg:table-cell">
                    ID
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                  <TableHead className="hidden text-center md:table-cell">
                    Sessions
                  </TableHead>
                  <TableHead className="hidden text-center lg:table-cell">
                    Trend
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(studentPerformanceData) ? studentPerformanceData : []).map((student, index) => (
                  <TableRow key={`table-student-${student.id || index}`}>
                    <TableCell className="hidden font-medium lg:table-cell">
                      {student.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{student.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="leading-none font-medium">
                            {student.name}
                          </p>
                          <p className="text-muted-foreground hidden text-sm md:block">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          student.attendance >= 80
                            ? "default"
                            : student.attendance >= 70
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {student.attendance}%
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-center md:table-cell">
                      {student.attended}/{student.total}
                    </TableCell>
                    <TableCell className="hidden text-center lg:table-cell">
                      {student.trend === "up" ? (
                        <div className="flex items-center justify-center text-green-500">
                          <ArrowUp className="h-4 w-4" />
                        </div>
                      ) : student.trend === "down" ? (
                        <div className="flex items-center justify-center text-red-500">
                          <ArrowDown className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="text-muted-foreground flex items-center justify-center">
                          —
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Send Notification</DropdownMenuItem>
                          <DropdownMenuItem>Export Data</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground text-center text-sm sm:text-left">
              Showing <strong>1</strong> to <strong>10</strong> of{" "}
              <strong>42</strong> results
            </div>
            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Export Options</CardTitle>
          <CardDescription>
            Export your report in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <Button
              variant="outline"
              className="flex h-20 flex-col items-center justify-center gap-2 bg-transparent sm:h-24"
            >
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-xs sm:text-sm">PDF Report</span>
            </Button>
            <Button
              variant="outline"
              className="flex h-20 flex-col items-center justify-center gap-2 bg-transparent sm:h-24"
            >
              <Download className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-xs sm:text-sm">Excel/CSV</span>
            </Button>
            <Button
              variant="outline"
              className="flex h-20 flex-col items-center justify-center gap-2 bg-transparent sm:h-24"
            >
              <Printer className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-xs sm:text-sm">Print View</span>
            </Button>
            <Button
              variant="outline"
              className="flex h-20 flex-col items-center justify-center gap-2 bg-transparent sm:h-24"
            >
              <Mail className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-xs sm:text-sm">Email Report</span>
            </Button>
            <Button
              variant="outline"
              className="col-span-2 flex h-20 flex-col items-center justify-center gap-2 bg-transparent sm:col-span-1 sm:h-24"
            >
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-xs sm:text-sm">Schedule Reports</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="text-muted-foreground flex items-center text-sm">
            <Info className="mr-1 h-4 w-4" />
            Preview will be generated based on selected format
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent sm:w-auto"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Report
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

