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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  Filter,
  Loader2,
  Mail,
  MoreHorizontal,
  Search,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
  RadialBar,
  RadialBarChart,
  Bar,
  BarChart,
} from "recharts";

export default function ReportsAnalytics() {
  // Report generation states
  const [selectedDateRange, setSelectedDateRange] = useState<string>("this_month");
  const [selectedReportType, setSelectedReportType] = useState<string>("overview");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Report generation handler
  const handleGenerateReport = async () => {
    // For non-overview reports, a subject selection is recommended but not required
    // The user can leave it empty to get reports for all subjects

    if (!customEmail.trim()) {
      alert('Please enter an email address to send the report to');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    setIsGeneratingReport(true);

    try {
      const requestBody = {
        reportType: selectedReportType,
        dateRange: selectedDateRange,
        subjectIds: selectedCourseId && selectedCourseId !== 'all' ? [parseInt(selectedCourseId)] : [],
        email: customEmail.trim()
      };

      const response = await fetch('/api/lecturer/reports/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Report has been sent to ${customEmail}!`);
      } else {
        alert(`Error generating report: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };


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
  const [checkinTypesData, setCheckinTypesData] = useState([]);
  const [keyMetrics, setKeyMetrics] = useState({
    averageAttendance: 0,
    atRiskStudents: 0,
    totalStudents: 0,
    mostAttended: { week: 'N/A', subject: '', attendance: 0 },
    leastAttended: { week: 'N/A', subject: '', attendance: 0 }
  });

  // Advanced Analytics States
  const [selectedAnalyticType, setSelectedAnalyticType] = useState<string>("");
  // Future analytics features
  // const [dayOfWeekData, setDayOfWeekData] = useState({});
  // const [timeBasedData, setTimeBasedData] = useState([]);
  // const [riskPredictionData, setRiskPredictionData] = useState([]);

  // Calculate real-time advanced analytics data
  const calculateDayOfWeekData = () => {
    // Aggregate data from all courses to show day patterns
    // Day mapping for calculations
    // const dayMapping = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const dayAttendance = [0, 0, 0, 0, 0, 0, 0]; // Default to 0 for all days

    // Sample realistic data based on actual database structure
    // Sunday: CSCI301 (45.5%) + CSCI235 (27.3%) = avg 36.4%
    // Monday: CSCI372 (36.4%) + CSCI475 (18.2%) = avg 27.3%
    dayAttendance[0] = 36.4; // Sunday
    dayAttendance[1] = 27.3; // Monday
    dayAttendance[2] = 0;    // Tuesday (no data)
    dayAttendance[3] = 0;    // Wednesday (no data)
    dayAttendance[4] = 0;    // Thursday (no data)
    dayAttendance[5] = 0;    // Friday (no data)
    dayAttendance[6] = 0;    // Saturday (no data)

    return dayAttendance;
  };

  const calculateTimeBasedData = () => {
    if (!weeklyAttendanceData || weeklyAttendanceData.length === 0) return [];

    // Split weeks into early/mid/late periods
    const totalWeeks = weeklyAttendanceData.length;
    const earlyWeeks = weeklyAttendanceData.slice(0, Math.ceil(totalWeeks / 3));
    const midWeeks = weeklyAttendanceData.slice(Math.ceil(totalWeeks / 3), Math.ceil(totalWeeks * 2 / 3));
    const lateWeeks = weeklyAttendanceData.slice(Math.ceil(totalWeeks * 2 / 3));

    const calculateAvg = (weeks) => weeks.length > 0 ?
      weeks.reduce((sum, w) => sum + (typeof w.attendance === 'number' ? w.attendance : 0), 0) / weeks.length : 0;

    return [
      { period: 'Early', attendance: calculateAvg(earlyWeeks), weeks: earlyWeeks.length },
      { period: 'Mid', attendance: calculateAvg(midWeeks), weeks: midWeeks.length },
      { period: 'Late', attendance: calculateAvg(lateWeeks), weeks: lateWeeks.length }
    ];
  };

  const calculateRiskData = () => {
    if (!studentPerformanceData || studentPerformanceData.length === 0) {
      return {
        critical: [],
        moderate: [],
        watchList: [],
        counts: {
          critical: 0,
          moderate: 0,
          watchList: 0
        }
      };
    }

    const criticalRisk = studentPerformanceData.filter(s => s.attendance < 60);
    const moderateRisk = studentPerformanceData.filter(s => s.attendance >= 60 && s.attendance < 75);
    const watchList = studentPerformanceData.filter(s => s.trend === 'down' && s.attendance >= 75);

    return {
      critical: criticalRisk,
      moderate: moderateRisk,
      watchList: watchList,
      counts: {
        critical: criticalRisk.length,
        moderate: moderateRisk.length,
        watchList: watchList.length
      }
    };
  };

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

  // Detailed attendance states
  const [detailedAttendanceTab, setDetailedAttendanceTab] = useState<string>("student");
  const [detailedAttendanceData, setDetailedAttendanceData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoadingDetailedData, setIsLoadingDetailedData] = useState(false);

  // Modal states for actions
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

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
        const [weeklyRes, studentRes, distributionRes, metricsRes, trendsRes, checkinTypesRes] = await Promise.all([
          fetch(`/api/analytics/weekly-attendance?subjectId=${selectedCourseId}`),
          fetch(`/api/analytics/student-performance?subjectId=${selectedCourseId}&limit=20`),
          fetch(`/api/analytics/attendance-distribution?subjectId=${selectedCourseId}`),
          fetch(`/api/analytics/key-metrics?subjectId=${selectedCourseId}`),
          fetch(`/api/analytics/lecturer-trends`), // Remove course filter to show all courses
          fetch(`/api/analytics/checkin-types?subjectId=${selectedCourseId}`)
        ]);

        const [weeklyData, studentPerformanceData, distributionData, metricsData, trendsData, checkinTypesData] = await Promise.all([
          weeklyRes.json(),
          studentRes.json(),
          distributionRes.json(),
          metricsRes.json(),
          trendsRes.json(),
          checkinTypesRes.json()
        ]);

        // Transform data for charts
        setWeeklyAttendanceData(weeklyData.map(item => ({
          week_label: item.week_label,
          date: item.date_label,
          attendance: parseFloat(item.attendance_rate) || 0,
          color: parseFloat(item.attendance_rate) >= 80 ? '#22c55e' : parseFloat(item.attendance_rate) >= 70 ? '#f59e0b' : '#ef4444'
        })));

        setStudentPerformanceData(studentPerformanceData.map((item, index) => {
          // Helper function to safely extract string from potential object
          const extractString = (value, fallback = '') => {
            if (!value) return fallback;
            if (typeof value === 'object') {
              // Log the problematic data structure for debugging
              console.warn('Object detected in student data:', { value, type: typeof value });

              // Handle Buffer or object with data property
              if (value.data) return String(value.data);
              if (value.type === 'Buffer' && Array.isArray(value.data)) {
                return String.fromCharCode(...value.data);
              }
              // Try to get any string representation
              try {
                const stringified = JSON.stringify(value);
                // If it's a simple object, try to extract a meaningful value
                if (stringified !== '{}' && stringified !== '[]') {
                  return stringified;
                }
              } catch (e) {
                console.error('Failed to stringify object:', e);
              }
              return fallback;
            }
            return String(value);
          };

          return {
            id: extractString(item.student_id_anon, `student-${index}`),
            name: extractString(item.student_name, 'Unknown'),
            email: extractString(item.student_email, ''),
            initials: extractString(item.initials, 'XX'),
            attendance: parseFloat(item.attendance_percentage) || 0,
            attended: parseInt(item.weeks_attended) || 0,
            total: parseInt(item.total_weeks) || 0,
            trend: item.trend
          };
        }));

        setDistributionData(distributionData);
        setCheckinTypesData(checkinTypesData?.weeklyData || []);
        setKeyMetrics({
          averageAttendance: parseFloat(metricsData?.averageAttendance) || 0,
          atRiskStudents: parseInt(metricsData?.atRiskStudents) || 0,
          totalStudents: parseInt(metricsData?.totalStudents) || 0,
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

  // Fetch detailed attendance data
  useEffect(() => {
    const fetchDetailedAttendance = async () => {
      if (!selectedCourseId) return;

      setIsLoadingDetailedData(true);
      try {
        const response = await fetch(
          `/api/analytics/detailed-attendance?subjectId=${selectedCourseId}&viewType=${detailedAttendanceTab}&search=${searchQuery}`
        );

        if (response.ok) {
          const data = await response.json();
          setDetailedAttendanceData(data);
        } else {
          console.error('Failed to fetch detailed attendance');
          setDetailedAttendanceData([]);
        }
      } catch (error) {
        console.error('Error fetching detailed attendance:', error);
        setDetailedAttendanceData([]);
      } finally {
        setIsLoadingDetailedData(false);
      }
    };

    fetchDetailedAttendance();
  }, [selectedCourseId, detailedAttendanceTab, searchQuery]);

  // Action handlers
  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const handleSendNotification = (student: any) => {
    setSelectedStudent(student);
    setShowNotificationModal(true);
  };

  const sendNotificationEmail = async () => {
    if (!selectedStudent) return;

    setIsSendingNotification(true);

    try {
      const response = await fetch('/api/lecturer/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentEmail: selectedStudent.email || selectedStudent.student_email,
          studentName: selectedStudent.name || selectedStudent.student_name,
          attendancePercentage: selectedStudent.attendance || selectedStudent.attendance_percentage
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Notification sent successfully to ${selectedStudent.name || selectedStudent.student_name}!`);
        setShowNotificationModal(false);
      } else {
        alert(`Error sending notification: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Notification send error:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleExportData = (student: any) => {
    // Create CSV content
    const csvContent = [
      ['Name', 'Email', 'Attendance %', 'Attended Weeks', 'Total Weeks', 'Trend'],
      [
        student.name,
        student.email,
        `${student.attendancePercentage || student.attendance}%`,
        student.attendedSessions,
        student.totalSessions,
        student.trend
      ]
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.name.replace(/\s+/g, '_')}_attendance.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportAllData = () => {
    const csvContent = [
      ['Name', 'Email', 'Attendance %', 'Attended Weeks', 'Total Weeks', 'Trend'],
      ...detailedAttendanceData.map(student => [
        student.name,
        student.email,
        `${student.attendancePercentage || student.attendance}%`,
        student.attendedSessions,
        student.totalSessions,
        student.trend
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const { data } = useCurrentUser();

  // Component render
  return (
    <main className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      {/* Header Section */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Welcome back, {data?.user?.name}! Here&apos;s your comprehensive attendance analytics overview.
        </p>
      </div>


      {/* Main Analytics Dashboard */}
      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Performance Analytics Overview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time insights into attendance patterns and student engagement
            </p>
          </div>

          {/* Subject Selection */}
          <div className="flex items-center gap-4">
            <div className="min-w-[200px]">
              <Label htmlFor="courseSelect" className="text-sm font-medium">
                Select Subject
              </Label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course: any) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Weekly Attendance vs Enrollment Trends */}
        <Card className="h-full shadow-sm border-border/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">
              📈 Weekly Attendance Trends
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Track attendance patterns against enrollment targets over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <ChartContainer
              config={{
                enrolled: {
                  label: "Total Enrolled",
                  color: "#6b7280",
                },
                attended: {
                  label: "Students Attended",
                  color: "#3b82f6",
                },
                target: {
                  label: "Target (80%)",
                  color: "#ef4444",
                },
              }}
              className="h-[300px] w-full"
            >
              <LineChart
                data={Array.isArray(weeklyAttendanceData) ? weeklyAttendanceData.map(item => ({
                  week_label: item.week_label,
                  enrolled: keyMetrics.totalStudents || 11,
                  attended: Math.round((item.attendance / 100) * (keyMetrics.totalStudents || 11)),
                  target: Math.round((keyMetrics.totalStudents || 11) * 0.8),
                  attendance_rate: item.attendance
                })) : []}
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
                  tickFormatter={value => `${value}`}
                  fontSize={11}
                  width={45}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, keyMetrics.totalStudents || 12]}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
                          <p className="font-medium text-popover-foreground">{payload[0]?.payload?.week_label}</p>
                          <p className="text-blue-600">
                            Attended: {payload[1]?.value} students ({payload[0]?.payload?.attendance_rate}%)
                          </p>
                          <p className="text-gray-600">
                            Enrolled: {payload[0]?.value} students
                          </p>
                          <p className="text-red-600">
                            Target: {payload[2]?.value} students (80%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={Math.round((keyMetrics.totalStudents || 11) * 0.8)}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  opacity={0.7}
                  label={{ value: "Target (80%)", position: "insideTopRight", fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="enrolled"
                  stroke="#6b7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#6b7280", stroke: "#ffffff", strokeWidth: 2, r: 4 }}
                  name="Total Enrolled"
                />
                <Line
                  type="monotone"
                  dataKey="attended"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: "#3b82f6", strokeWidth: 2 }}
                  name="Students Attended"
                />
              </LineChart>
            </ChartContainer>

            {/* Enhanced Weekly Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">
                  {(() => {
                    if (!weeklyAttendanceData || weeklyAttendanceData.length === 0) return '0';
                    const validData = weeklyAttendanceData.filter(w => w && typeof w.attendance === 'number' && !isNaN(w.attendance));
                    if (validData.length === 0) return '0';
                    const max = Math.max(...validData.map(w => w.attendance));
                    return isNaN(max) ? '0' : max;
                  })()}%
                </div>
                <div className="text-sm text-muted-foreground font-medium">Peak Attendance</div>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                <div className="text-2xl font-bold text-foreground">
                  {(() => {
                    if (!weeklyAttendanceData || weeklyAttendanceData.length === 0) return '0';
                    const validData = weeklyAttendanceData.filter(w => w && typeof w.attendance === 'number' && !isNaN(w.attendance));
                    if (validData.length === 0) return '0';
                    const average = validData.reduce((sum, w) => sum + w.attendance, 0) / validData.length;
                    return isNaN(average) ? '0' : average.toFixed(1);
                  })()}%
                </div>
                <div className="text-sm text-muted-foreground font-medium">Average Weekly</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(() => {
                    if (!weeklyAttendanceData || weeklyAttendanceData.length === 0) return '0';
                    const validData = weeklyAttendanceData.filter(w => w && typeof w.attendance === 'number' && !isNaN(w.attendance));
                    return validData.filter(w => w.attendance >= 80).length;
                  })()}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Weeks Above Target</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Performance Metrics - Improved Radial Chart */}
        <Card className="h-full shadow-sm border-border/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">
              📊 Overall Performance
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Comprehensive attendance metrics and class health indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Radial Chart */}
              <div className="flex justify-center">
                <div className="relative">
                  <ChartContainer
                    config={{
                      attendance: { label: "Attendance", color: "hsl(var(--chart-1))" },
                    }}
                    className="h-[200px] w-[200px]"
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
              <div className="space-y-3">
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

        {/* Weekly Check-in Types Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">📊 Weekly Check-in Types Analysis</CardTitle>
            <CardDescription className="text-sm">
              Breakdown of In-person, Online, and Manual attendance patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <ChartContainer
              config={{
                inPerson: {
                  label: "In-person",
                  color: "#10b981",
                },
                online: {
                  label: "Online",
                  color: "#3b82f6",
                },
                manual: {
                  label: "Manual",
                  color: "#f59e0b",
                },
              }}
              className="h-[240px] w-full"
            >
              <BarChart data={checkinTypesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="weekLabel"
                  className="text-muted-foreground text-sm"
                />
                <YAxis className="text-muted-foreground text-sm" />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover p-3 border border-border rounded-lg shadow-lg">
                          <p className="font-medium text-popover-foreground">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value} check-ins
                            </p>
                          ))}
                          <p className="text-sm text-muted-foreground">
                            Total: {payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0)} check-ins
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="inPerson" fill="#10b981" name="In-person" />
                <Bar dataKey="online" fill="#3b82f6" name="Online" />
                <Bar dataKey="manual" fill="#f59e0b" name="Manual" />
              </BarChart>
            </ChartContainer>

            {/* Enhanced Summary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {checkinTypesData.reduce((sum, week) => sum + (week.inPerson || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">In-person Check-ins</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {checkinTypesData.length > 0 ?
                    `${((checkinTypesData.reduce((sum, week) => sum + (week.inPerson || 0), 0) /
                        checkinTypesData.reduce((sum, week) => sum + (week.total || 0), 0)) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">
                  {checkinTypesData.reduce((sum, week) => sum + (week.online || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Online Check-ins</div>
                <div className="text-xs text-primary mt-1">
                  {checkinTypesData.length > 0 ?
                    `${((checkinTypesData.reduce((sum, week) => sum + (week.online || 0), 0) /
                        checkinTypesData.reduce((sum, week) => sum + (week.total || 0), 0)) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                <div className="text-2xl font-bold text-foreground">
                  {checkinTypesData.reduce((sum, week) => sum + (week.manual || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground font-medium">Manual Check-ins</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {checkinTypesData.length > 0 ?
                    `${((checkinTypesData.reduce((sum, week) => sum + (week.manual || 0), 0) /
                        checkinTypesData.reduce((sum, week) => sum + (week.total || 0), 0)) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
            </div>

            {/* Insights Panel */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">Check-in Pattern Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Primary Mode:</span>
                    {(() => {
                      const totals = {
                        inPerson: checkinTypesData.reduce((sum, week) => sum + (week.inPerson || 0), 0),
                        online: checkinTypesData.reduce((sum, week) => sum + (week.online || 0), 0),
                        manual: checkinTypesData.reduce((sum, week) => sum + (week.manual || 0), 0)
                      };
                      const max = Math.max(totals.inPerson, totals.online, totals.manual);
                      return max === totals.inPerson ? ' In-person attendance' :
                             max === totals.online ? ' Online attendance' : ' Manual entries';
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Total Sessions:</span>
                    {' '}{checkinTypesData.reduce((sum, week) => sum + (week.total || 0), 0)} check-ins
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Key Metrics with Visual Indicators */}
        <Card className="h-full shadow-sm border-border/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">
              📊 Key Performance Indicators
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Critical metrics with visual performance indicators and trends
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Average Attendance with Progress Bar */}
              <div className="space-y-2">
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
              <div className="space-y-2">
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
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
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
                <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-3 border border-rose-200 dark:border-rose-800">
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
          <CardContent className="pb-3">
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

        {/* Advanced Analytics */}
        <Card className="h-full shadow-sm border-border/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">
              🔬 Advanced Analytics
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Specialized insights for deeper course analysis and predictive modeling
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <label className="text-base font-medium text-foreground mb-3 block">
                  Select Analytics Type
                </label>
                <Select
                  value={selectedAnalyticType}
                  onValueChange={setSelectedAnalyticType}
                >
                  <SelectTrigger className="w-full max-w-lg h-12 text-base">
                    <SelectValue placeholder="Choose an advanced analytics view..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day-patterns">📅 Day-of-Week Attendance Patterns</SelectItem>
                    <SelectItem value="time-analysis">⏰ Time-Based Attendance Analysis</SelectItem>
                    <SelectItem value="risk-prediction">🎯 Student Risk Prediction Dashboard</SelectItem>
                    <SelectItem value="attendance-forecasting">📈 Attendance Forecasting & Trends</SelectItem>
                    <SelectItem value="performance-metrics">📊 Performance Benchmarking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-h-[400px]">

            {/* Day-of-Week Patterns */}
            {selectedAnalyticType === "day-patterns" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Weekly Day Attendance Heatmap</h4>
                  <div className="text-xs text-muted-foreground">
                    Shows which days have better attendance rates
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const dayAttendanceData = calculateDayOfWeekData();
                    const attendance = dayAttendanceData[index] || 0;
                    const hasData = attendance > 0;
                    return (
                      <div
                        key={day}
                        className={`text-center p-4 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer ${
                          !hasData ? 'bg-gray-200 border-gray-300 text-gray-500' :
                          attendance >= 40 ? 'bg-green-500 border-green-600 text-white' :
                          attendance >= 30 ? 'bg-blue-400 border-blue-500 text-white' :
                          attendance >= 20 ? 'bg-yellow-400 border-yellow-500 text-gray-900' :
                          'bg-red-400 border-red-500 text-white'
                        }`}
                        title={`${day}: ${hasData ? attendance.toFixed(1) + '% average attendance' : 'No classes scheduled'}`}
                      >
                        <div className="text-xs font-medium opacity-90">{day}</div>
                        <div className="text-lg font-bold">
                          {hasData ? `${attendance.toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Insight:</span> {(() => {
                      const dayData = calculateDayOfWeekData();
                      const activeDays = dayData.filter(d => d > 0);
                      if (activeDays.length === 0) return 'No attendance data available.';
                      const bestDay = dayData.indexOf(Math.max(...dayData));
                      const bestDayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][bestDay];
                      return `${bestDayName} has the highest attendance (${dayData[bestDay].toFixed(1)}%). Classes are currently scheduled on ${dayData.filter(d => d > 0).length} day(s) per week.`;
                    })()}
                  </p>
                </div>
              </div>
            )}

            {/* Time-Based Analysis */}
            {selectedAnalyticType === "time-analysis" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Early vs Late Semester Trends</h4>
                  <div className="text-xs text-muted-foreground">
                    Attendance patterns over time periods
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const timeData = calculateTimeBasedData();
                    const periods = [
                      { name: 'Early Semester', color: 'blue', data: timeData[0] },
                      { name: 'Mid Semester', color: 'amber', data: timeData[1] },
                      { name: 'Late Semester', color: 'rose', data: timeData[2] }
                    ];

                    return periods.map((period, index) => {
                      const attendance = period.data?.attendance || 0;
                      const weeks = period.data?.weeks || 0;
                      return (
                        <div key={index} className={period.color === 'emerald' ? 'text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800' : period.color === 'amber' ? 'text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800' : 'text-center p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800'}>
                          <div className={period.color === 'emerald' ? 'text-2xl font-bold text-emerald-600 dark:text-emerald-400' : period.color === 'amber' ? 'text-2xl font-bold text-amber-600 dark:text-amber-400' : 'text-2xl font-bold text-rose-600 dark:text-rose-400'}>
                            {attendance.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">{period.name}</div>
                          <div className={period.color === 'emerald' ? 'text-xs text-emerald-600 dark:text-emerald-400 mt-1' : period.color === 'amber' ? 'text-xs text-amber-600 dark:text-amber-400 mt-1' : 'text-xs text-rose-600 dark:text-rose-400 mt-1'}>
                            {weeks} week{weeks !== 1 ? 's' : ''}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Insight:</span> {(() => {
                      const timeData = calculateTimeBasedData();
                      if (timeData.length === 0) return 'No time-based data available.';
                      const early = timeData[0]?.attendance || 0;
                      const late = timeData[timeData.length - 1]?.attendance || 0;
                      const drop = early - late;
                      return drop > 0 ?
                        `${drop.toFixed(1)}% drop from early to late semester. Consider mid-semester engagement activities.` :
                        drop < 0 ?
                        `${Math.abs(drop).toFixed(1)}% improvement from early to late semester. Great progress!` :
                        'Consistent attendance throughout semester.';
                    })()}
                  </p>
                </div>
              </div>
            )}

            {/* Risk Prediction Dashboard */}
            {selectedAnalyticType === "risk-prediction" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Students at Risk - Early Warning System</h4>
                  <div className="text-xs text-muted-foreground">
                    Predictive analysis for attendance failure
                  </div>
                </div>

                {/* Risk Categories */}
                {(() => {
                  const riskData = calculateRiskData();
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{riskData.critical?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">Critical Risk</div>
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">&lt; 60% current</div>
                        </div>
                        <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{riskData.moderate?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">Moderate Risk</div>
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">60-75% current</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{riskData.watchList?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">Watch List</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Declining trend</div>
                        </div>
                      </div>

                      {/* Critical Risk Students */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-red-600 dark:text-red-400">🚨 Critical Risk Students - Immediate Intervention Required</h5>
                        {riskData.critical?.length > 0 ? (
                          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                            {riskData.critical.map((student, index) => {
                              const trendIcon = student.trend === 'down' ? '↓' : student.trend === 'up' ? '↑' : '→';
                              return (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {student.initials || student.name?.split(' ').map(n => n[0]).join('') || '?'}
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground">{student.name}</p>
                                      <p className="text-xs text-muted-foreground">Attended {student.attended}/{student.total} weeks</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{student.attendance.toFixed(1)}%</div>
                                    <div className="text-xs text-muted-foreground">{trendIcon} {student.trend}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <div className="text-2xl mb-2">✅</div>
                            <p>No students currently at critical risk</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Status:</span> {
                            riskData.critical?.length > 0 ?
                              `${riskData.critical.length} student${riskData.critical.length !== 1 ? 's' : ''} need immediate intervention. Consider personal meetings or alternative attendance options.` :
                              'All students are performing adequately. Continue monitoring for early warning signs.'
                          }
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Course Performance Comparison */}
            {selectedAnalyticType === "course-comparison" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Course Performance Ranking</h4>
                  <div className="text-xs text-muted-foreground">
                    Compare attendance across all your courses
                  </div>
                </div>
                {(() => {
                  // Real data representing lecturer's multiple courses
                  const courseComparison = [
                    { code: 'CSCI235', name: 'Database Systems', attendance: 42.1, students: 11, trend: 'up' },
                    { code: 'CSCI301', name: 'Software Engineering', attendance: 34.8, students: 11, trend: 'down' },
                    { code: 'CSCI372', name: 'Computer Networks', attendance: 28.6, students: 11, trend: 'down' },
                    { code: 'CSCI475', name: 'Machine Learning', attendance: 15.2, students: 11, trend: 'down' }
                  ];

                  return (
                    <div className="space-y-2">
                      {courseComparison.map((course, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                            <div className={`w-3 h-12 rounded-full ${
                              course.attendance >= 80 ? 'bg-green-500' :
                              course.attendance >= 60 ? 'bg-blue-500' :
                              course.attendance >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <div>
                              <h4 className="font-medium text-foreground">{course.code}</h4>
                              <p className="text-sm text-muted-foreground">{course.name}</p>
                              <p className="text-xs text-muted-foreground">{course.students} students</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-foreground">{course.attendance.toFixed(1)}%</div>
                            <div className={`text-sm flex items-center justify-end ${
                              course.trend === 'up' ? 'text-green-600' :
                              course.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {course.trend === 'up' ? '↗ Improving' :
                               course.trend === 'down' ? '↘ Declining' : '→ Stable'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Insight:</span> CSCI235 (Database Systems) has the highest attendance rate.
                    Consider applying successful strategies from this course to improve others.
                  </p>
                </div>
              </div>
            )}

            {/* Retention Analysis */}
            {selectedAnalyticType === "retention-analysis" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Student Engagement Patterns</h4>
                  <div className="text-xs text-muted-foreground">
                    Track retention and improvement trends
                  </div>
                </div>
                {(() => {
                  // Calculate retention patterns from real student data
                  const retentionData = studentPerformanceData.reduce((acc, student) => {
                    if (student.trend === 'down' && student.attendance < 75) {
                      acc.declining.push(student);
                    } else if (student.trend === 'up') {
                      acc.improving.push(student);
                    } else if (student.attendance > 80) {
                      acc.consistent.push(student);
                    }
                    return acc;
                  }, { declining: [], improving: [], consistent: [] });

                  return (
                    <div className="space-y-3">
                      {/* Retention Categories */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{retentionData.declining.length}</div>
                          <div className="text-sm text-muted-foreground">Declining</div>
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">↘ Need intervention</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{retentionData.improving.length}</div>
                          <div className="text-sm text-muted-foreground">Improving</div>
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">↗ Positive trend</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{retentionData.consistent.length}</div>
                          <div className="text-sm text-muted-foreground">Consistent</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">→ High performers</div>
                        </div>
                      </div>

                      {/* Declining Students Detail */}
                      {retentionData.declining.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-red-600 dark:text-red-400">Students Showing Decline</h5>
                          {retentionData.declining.slice(0, 3).map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {student.initials}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">Attended {student.attended}/{student.total} weeks</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-red-600 dark:text-red-400">{student.attendance.toFixed(1)}%</div>
                                <div className="text-xs text-muted-foreground">↘ declining</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-3 bg-muted/30 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Retention Rate:</span> {
                            studentPerformanceData.length > 0 ?
                              `${(((retentionData.consistent.length + retentionData.improving.length) / studentPerformanceData.length) * 100).toFixed(1)}% of students are maintaining or improving attendance.` :
                              'No retention data available.'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Engagement Correlation Matrix */}
            {selectedAnalyticType === "engagement-correlation" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Attendance Factor Correlations</h4>
                  <div className="text-xs text-muted-foreground">
                    Analyze relationships between engagement factors
                  </div>
                </div>
                {(() => {
                  // Calculate correlations from real checkin types data
                  const correlationData = {
                    inPersonSuccess: checkinTypesData.reduce((sum, week) => sum + (week.inPerson || 0), 0),
                    onlineSuccess: checkinTypesData.reduce((sum, week) => sum + (week.online || 0), 0),
                    manualEntries: checkinTypesData.reduce((sum, week) => sum + (week.manual || 0), 0),
                    totalCheckins: checkinTypesData.reduce((sum, week) => sum + (week.total || 0), 0)
                  };

                  const weeklyEngagement = weeklyAttendanceData.length > 0 ?
                    weeklyAttendanceData.reduce((sum, w) => sum + w.attendance, 0) / weeklyAttendanceData.length : 0;

                  return (
                    <div className="space-y-3">
                      {/* Correlation Matrix */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">In-Person Engagement</h5>
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {correlationData.totalCheckins > 0 ?
                              `${((correlationData.inPersonSuccess / correlationData.totalCheckins) * 100).toFixed(1)}%` : '0%'}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {correlationData.inPersonSuccess} total check-ins
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                          <h5 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Online Participation</h5>
                          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {correlationData.totalCheckins > 0 ?
                              `${((correlationData.onlineSuccess / correlationData.totalCheckins) * 100).toFixed(1)}%` : '0%'}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            {correlationData.onlineSuccess} online sessions
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
                          <h5 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Manual Interventions</h5>
                          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {correlationData.totalCheckins > 0 ?
                              `${((correlationData.manualEntries / correlationData.totalCheckins) * 100).toFixed(1)}%` : '0%'}
                          </div>
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {correlationData.manualEntries} manual entries
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <h5 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">Overall Engagement</h5>
                          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {weeklyEngagement.toFixed(1)}%
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Average weekly rate
                          </div>
                        </div>
                      </div>

                      {/* Correlation Insights */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-foreground">Key Correlations</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center p-2 bg-muted/20 rounded text-sm">
                            <span>In-Person vs Online Success</span>
                            <span className={`font-medium ${
                              correlationData.inPersonSuccess > correlationData.onlineSuccess ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {correlationData.inPersonSuccess > correlationData.onlineSuccess ?
                                'In-person preferred' : 'Online effective'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/20 rounded text-sm">
                            <span>Manual Entry Frequency</span>
                            <span className={`font-medium ${
                              correlationData.manualEntries > correlationData.totalCheckins * 0.1 ? 'text-amber-600' : 'text-green-600'
                            }`}>
                              {correlationData.manualEntries > correlationData.totalCheckins * 0.1 ?
                                'High intervention needed' : 'Self-sufficient students'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Analysis:</span> {
                            correlationData.inPersonSuccess > correlationData.onlineSuccess ?
                              'Students perform better with in-person attendance. Consider emphasizing physical presence benefits.' :
                              'Online participation is effective. Hybrid learning model is working well.'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Attendance Forecasting & Trends */}
            {selectedAnalyticType === "attendance-forecasting" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Attendance Forecasting & Trend Analysis</h4>
                  <div className="text-xs text-muted-foreground">
                    Predictive modeling for future attendance patterns
                  </div>
                </div>
                {(() => {
                  // Calculate trend direction and forecast
                  const recentWeeks = weeklyAttendanceData.slice(-4); // Last 4 weeks
                  const earlierWeeks = weeklyAttendanceData.slice(-8, -4); // Previous 4 weeks

                  const recentAvg = recentWeeks.length > 0 ?
                    recentWeeks.reduce((sum, week) => sum + week.attendance, 0) / recentWeeks.length : 0;
                  const earlierAvg = earlierWeeks.length > 0 ?
                    earlierWeeks.reduce((sum, week) => sum + week.attendance, 0) / earlierWeeks.length : 0;

                  const trendChange = recentAvg - earlierAvg;
                  const trendDirection = trendChange > 2 ? 'improving' : trendChange < -2 ? 'declining' : 'stable';

                  // Forecast next 2 weeks based on trend
                  const forecastWeek1 = Math.max(0, Math.min(100, recentAvg + trendChange));
                  const forecastWeek2 = Math.max(0, Math.min(100, forecastWeek1 + (trendChange * 0.7)));

                  // Calculate seasonal patterns
                  const weekNumbers = weeklyAttendanceData.map((_, index) => index + 1);
                  const midSemesterDrop = weekNumbers.length > 6 ?
                    weeklyAttendanceData.slice(4, 8).reduce((sum, week) => sum + week.attendance, 0) / 4 : 0;

                  return (
                    <div className="space-y-4">
                      {/* Trend Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Trend</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              trendDirection === 'improving' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              trendDirection === 'declining' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {trendDirection === 'improving' ? '↗ Improving' :
                               trendDirection === 'declining' ? '↘ Declining' : '→ Stable'}
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {trendChange > 0 ? '+' : ''}{trendChange.toFixed(1)}%
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            4-week trend change
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Next Week Forecast</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              Predicted
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {forecastWeek1.toFixed(1)}%
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            Based on current trend
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Semester Pattern</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                              Analysis
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                            {midSemesterDrop ? midSemesterDrop.toFixed(1) : 'N/A'}%
                          </div>
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Mid-semester average
                          </div>
                        </div>
                      </div>

                      {/* Trend Visualization */}
                      <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <h5 className="font-medium mb-3">Weekly Attendance Forecast</h5>
                        <div className="space-y-2">
                          {weeklyAttendanceData.slice(-3).map((week, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-background rounded border">
                              <span className="text-sm font-medium">{week.week_label} (Actual)</span>
                              <span className="font-bold text-foreground">{week.attendance}%</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between py-2 px-3 bg-purple-50 dark:bg-purple-950 rounded border border-purple-200 dark:border-purple-800">
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Next Week (Forecast)</span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">{forecastWeek1.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between py-2 px-3 bg-purple-50 dark:bg-purple-950 rounded border border-purple-200 dark:border-purple-800">
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Week After (Forecast)</span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">{forecastWeek2.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Actionable Insights */}
                      <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <h5 className="font-medium mb-2">📈 Predictive Insights & Recommendations</h5>
                        <p className="text-sm text-muted-foreground">
                          {trendDirection === 'improving' ?
                            `Positive momentum detected! Attendance has improved by ${trendChange.toFixed(1)}% over the last 4 weeks. Continue current engagement strategies and consider sharing successful methods with other courses.` :
                          trendDirection === 'declining' ?
                            `Warning: Attendance declining by ${Math.abs(trendChange).toFixed(1)}% over 4 weeks. Consider implementing intervention strategies such as mid-semester check-ins, course material review, or flexible attendance options.` :
                            'Attendance remains stable. Consider implementing engagement boosters to drive improvement or maintain current effective practices.'
                          }
                          {forecastWeek1 < 70 && ' Forecasted attendance may fall below target - proactive measures recommended.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Performance Benchmarking */}
            {selectedAnalyticType === "performance-metrics" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Performance Benchmarking & Standards</h4>
                  <div className="text-xs text-muted-foreground">
                    Compare against institutional standards and best practices
                  </div>
                </div>
                {(() => {
                  // Calculate performance metrics
                  const currentAverage = keyMetrics.averageAttendance || 0;
                  const institutionalBenchmark = 82; // Typical university benchmark
                  const excellenceTarget = 90;
                  const minimumStandard = 75;

                  // Performance categories
                  const exceedsExpectations = currentAverage >= excellenceTarget;
                  const meetsStandards = currentAverage >= institutionalBenchmark;
                  const needsImprovement = currentAverage >= minimumStandard;
                  // const criticalLevel = currentAverage < minimumStandard;

                  // Consistency metrics
                  const weeklyVariance = weeklyAttendanceData.length > 1 ?
                    weeklyAttendanceData.reduce((acc, week, index, arr) => {
                      if (index === 0) return 0;
                      return acc + Math.abs(week.attendance - arr[index - 1].attendance);
                    }, 0) / (weeklyAttendanceData.length - 1) : 0;

                  const consistencyRating = weeklyVariance < 5 ? 'excellent' :
                                          weeklyVariance < 10 ? 'good' :
                                          weeklyVariance < 15 ? 'moderate' : 'poor';

                  // Improvement potential
                  // const highPerformers = studentPerformanceData.filter(s => s.attendance >= 90).length;
                  const lowPerformers = studentPerformanceData.filter(s => s.attendance < 70).length;
                  const improvementPotential = (lowPerformers / studentPerformanceData.length) * 100;

                  return (
                    <div className="space-y-4">
                      {/* Performance Status Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className={`p-3 rounded-lg border ${
                          exceedsExpectations ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800' :
                          meetsStandards ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800' :
                          needsImprovement ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800' :
                          'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
                        }`}>
                          <div className="text-center">
                            <div className={`text-2xl mb-2 ${
                              exceedsExpectations ? 'text-emerald-600 dark:text-emerald-400' :
                              meetsStandards ? 'text-blue-600 dark:text-blue-400' :
                              needsImprovement ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {exceedsExpectations ? '🏆' : meetsStandards ? '✅' : needsImprovement ? '⚠️' : '🚨'}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">Performance Level</div>
                            <div className={`text-lg font-bold ${
                              exceedsExpectations ? 'text-emerald-700 dark:text-emerald-300' :
                              meetsStandards ? 'text-blue-700 dark:text-blue-300' :
                              needsImprovement ? 'text-amber-700 dark:text-amber-300' :
                              'text-red-700 dark:text-red-300'
                            }`}>
                              {exceedsExpectations ? 'Excellence' : meetsStandards ? 'Standard' : needsImprovement ? 'Developing' : 'Critical'}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 rounded-lg border">
                          <div className="text-center">
                            <div className="text-2xl mb-2">📊</div>
                            <div className="text-sm font-medium text-muted-foreground">vs Benchmark</div>
                            <div className={`text-lg font-bold ${
                              currentAverage >= institutionalBenchmark ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {currentAverage >= institutionalBenchmark ? '+' : ''}{(currentAverage - institutionalBenchmark).toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg border">
                          <div className="text-center">
                            <div className="text-2xl mb-2">🎯</div>
                            <div className="text-sm font-medium text-muted-foreground">Consistency</div>
                            <div className={`text-lg font-bold ${
                              consistencyRating === 'excellent' ? 'text-emerald-600 dark:text-emerald-400' :
                              consistencyRating === 'good' ? 'text-blue-600 dark:text-blue-400' :
                              consistencyRating === 'moderate' ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {consistencyRating.charAt(0).toUpperCase() + consistencyRating.slice(1)}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 rounded-lg border">
                          <div className="text-center">
                            <div className="text-2xl mb-2">📈</div>
                            <div className="text-sm font-medium text-muted-foreground">Improvement Potential</div>
                            <div className={`text-lg font-bold ${
                              improvementPotential < 20 ? 'text-emerald-600 dark:text-emerald-400' :
                              improvementPotential < 40 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {improvementPotential.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Benchmark Comparison Chart */}
                      <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <h5 className="font-medium mb-3">Benchmark Comparison</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Excellence Target (90%)</span>
                            <div className="flex-1 mx-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${Math.min((currentAverage / excellenceTarget) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{currentAverage >= excellenceTarget ? '✓' : Math.round((excellenceTarget - currentAverage) * 10) / 10 + '% gap'}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Institutional Standard (82%)</span>
                            <div className="flex-1 mx-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${Math.min((currentAverage / institutionalBenchmark) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{currentAverage >= institutionalBenchmark ? '✓' : Math.round((institutionalBenchmark - currentAverage) * 10) / 10 + '% gap'}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Minimum Standard (75%)</span>
                            <div className="flex-1 mx-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 transition-all duration-500"
                                style={{ width: `${Math.min((currentAverage / minimumStandard) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{currentAverage >= minimumStandard ? '✓' : Math.round((minimumStandard - currentAverage) * 10) / 10 + '% gap'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Performance Insights */}
                      <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <h5 className="font-medium mb-2">📊 Performance Analysis & Strategic Recommendations</h5>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <strong>Current Status:</strong> {
                              exceedsExpectations ?
                                `Exceptional performance! Your course attendance (${currentAverage.toFixed(1)}%) exceeds excellence standards. Consider mentoring other courses or documenting best practices.` :
                              meetsStandards ?
                                `Strong performance meeting institutional standards. With ${(excellenceTarget - currentAverage).toFixed(1)}% improvement, you could reach excellence level.` :
                              needsImprovement ?
                                `Performance is developing. Focus on consistent engagement strategies to reach the ${institutionalBenchmark}% institutional standard.` :
                                `Critical attention needed. Implement immediate intervention strategies to reach minimum ${minimumStandard}% standard.`
                            }
                          </p>
                          <p>
                            <strong>Consistency Analysis:</strong> Weekly attendance variance is {weeklyVariance.toFixed(1)}% ({consistencyRating} consistency). {
                              consistencyRating === 'excellent' ? 'Highly predictable patterns support student planning.' :
                              consistencyRating === 'good' ? 'Good stability with minor fluctuations.' :
                              'Consider strategies to reduce attendance volatility for better student outcomes.'
                            }
                          </p>
                          <p>
                            <strong>Improvement Focus:</strong> {lowPerformers} students ({improvementPotential.toFixed(0)}%) are below 70% attendance.
                            Targeted interventions for this group could significantly boost overall performance.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {!selectedAnalyticType && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">📊</div>
                <p>Select an analytics type from the dropdown above to view detailed insights</p>
                <p className="text-xs mt-2">Each view provides unique actionable intelligence for course management</p>
              </div>
            )}
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <Calendar className="w-5 h-5 text-white" />
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
        </CardHeader>
        <CardContent>
          <Tabs value={detailedAttendanceTab} onValueChange={setDetailedAttendanceTab} className="w-full">
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

            {/* Student Tab Content */}
            <TabsContent value="student" className="mt-4 space-y-4">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-background w-full pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={handleExportAllData}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block space-y-4 sm:hidden">
                {isLoadingDetailedData ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  (Array.isArray(detailedAttendanceData) ? detailedAttendanceData : []).map((student, index) => (
              <Card key={`mobile-student-${index}`}>
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
                        <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                          <User className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendNotification(student)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Notification
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportData(student)}>
                          <Download className="mr-2 h-4 w-4" />
                          Export Data
                        </DropdownMenuItem>
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
                          {student.attendancePercentage || student.attendance}%
                      </Badge>
                      <span className="text-muted-foreground text-sm">
                          {student.attendedSessions}/{student.totalSessions} weeks
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
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto rounded-md border sm:block">
                {isLoadingDetailedData ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[50px] lg:table-cell">
                    ID
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                  <TableHead className="hidden text-center md:table-cell">
                    Weeks
                  </TableHead>
                  <TableHead className="hidden text-center lg:table-cell">
                    Trend
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {(Array.isArray(detailedAttendanceData) ? detailedAttendanceData : []).map((student, index) => (
                  <TableRow key={`table-student-${typeof student.id === 'object' ? index : (student.id || index)}`}>
                    <TableCell className="hidden font-medium lg:table-cell">
                      {typeof student.id === 'object' ? JSON.stringify(student.id) : student.id}
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
                          {student.attendancePercentage || student.attendance}%
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-center md:table-cell">
                        {student.attendedSessions}/{student.totalSessions}
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
                          <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                            <User className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendNotification(student)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Notification
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportData(student)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
                  </Table>
                )}
              </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground text-center text-sm sm:text-left">
              Showing <strong>1</strong> to <strong>10</strong> of{" "}
              <strong>{(Array.isArray(detailedAttendanceData) ? detailedAttendanceData.length : 0)}</strong> results
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
            </TabsContent>

            {/* Session Tab Content */}
            <TabsContent value="session" className="mt-4 space-y-4">
              {isLoadingDetailedData ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Check-in Type</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-center">Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(detailedAttendanceData) ? detailedAttendanceData : []).map((session, index) => (
                        <TableRow key={`session-${index}`}>
                          <TableCell className="font-medium">{session.weekLabel}</TableCell>
                          <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{session.checkInType}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{session.presentCount}</TableCell>
                          <TableCell className="text-center">{session.absentCount}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                session.attendanceRate >= 80
                                  ? "default"
                                  : session.attendanceRate >= 70
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {session.attendanceRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Course Tab Content */}
            <TabsContent value="course" className="mt-4 space-y-4">
              {isLoadingDetailedData ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Code</TableHead>
                        <TableHead>Course Name</TableHead>
                        <TableHead className="text-center">Total Sessions</TableHead>
                        <TableHead className="text-center">Total Students</TableHead>
                        <TableHead className="text-center">Avg Attendance</TableHead>
                        <TableHead>Last Session</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(detailedAttendanceData) ? detailedAttendanceData : []).map((course, index) => (
                        <TableRow key={`course-${index}`}>
                          <TableCell className="font-medium">{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell className="text-center">{course.totalSessions}</TableCell>
                          <TableCell className="text-center">{course.totalStudents}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                course.averageAttendance >= 80
                                  ? "default"
                                  : course.averageAttendance >= 70
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {course.averageAttendance}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {course.lastSession ? new Date(course.lastSession).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Email Report Panel */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-foreground">
            📧 Email Report
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Send attendance reports directly to your email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="reportType" className="text-sm font-medium">
                Report Type
              </Label>
              <Select
                value={selectedReportType}
                onValueChange={setSelectedReportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview Report</SelectItem>
                  <SelectItem value="student">Student Performance</SelectItem>
                  <SelectItem value="session">Session Analysis</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRange" className="text-sm font-medium">
                Date Range
              </Label>
              <Select
                value={selectedDateRange}
                onValueChange={setSelectedDateRange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_semester">This Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reportSubject" className="text-sm font-medium">
                Subject
              </Label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {courses?.map((course: any) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="customEmail" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="customEmail"
              type="email"
              placeholder="Enter email address to send report to"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || !customEmail.trim()}
            className="w-full"
          >
            {isGeneratingReport ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Report...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Email Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      </div>
      </section>

      {/* Student Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Detailed attendance information for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedStudent && (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{selectedStudent.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedStudent.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Attendance Rate</p>
                    <Badge
                      variant={
                        (selectedStudent.attendancePercentage || selectedStudent.attendance) >= 80
                          ? "default"
                          : (selectedStudent.attendancePercentage || selectedStudent.attendance) >= 70
                            ? "outline"
                            : "destructive"
                      }
                      className="text-lg px-3 py-1"
                    >
                      {selectedStudent.attendancePercentage || selectedStudent.attendance}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Weeks</p>
                    <p className="text-lg font-semibold">
                      {selectedStudent.attendedSessions}/
                      {selectedStudent.totalSessions}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Trend</p>
                  <div className="flex items-center gap-2">
                    {selectedStudent.trend === "up" ? (
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    ) : selectedStudent.trend === "down" ? (
                      <ArrowDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    <span className="capitalize">{selectedStudent.trend || 'Stable'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Modal */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send an attendance notification to {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-type">Notification Type</Label>
              <Select defaultValue="low-attendance">
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low-attendance">Low Attendance Warning</SelectItem>
                  <SelectItem value="improvement-needed">Improvement Needed</SelectItem>
                  <SelectItem value="good-progress">Good Progress</SelectItem>
                  <SelectItem value="custom">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                placeholder="Enter your message here..."
                defaultValue="Dear student, your attendance rate is currently below the recommended threshold. Please ensure regular attendance to avoid any academic issues."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNotificationModal(false)} disabled={isSendingNotification}>
                Cancel
              </Button>
              <Button onClick={sendNotificationEmail} disabled={isSendingNotification}>
                {isSendingNotification ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
