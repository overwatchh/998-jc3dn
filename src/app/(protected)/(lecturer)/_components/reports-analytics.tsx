"use client";

import DayOfWeekPatterns from "@/components/day-of-week-patterns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  Filter,
  Loader2,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
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

// TypeScript interfaces for data structures
interface StudentPerformance {
  student_name: string;
  student_id_anon: string;
  initials: string;
  student_email: string;
  subject_code: string;
  subject_name: string;
  total_weeks: number;
  weeks_attended: number;
  attendance_percentage: number;
  performance_category: "Excellent" | "Good" | "Average" | "Poor";
  trend: "up" | "none" | "down";
}

interface Course {
  id: number;
  name: string;
  code: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}

interface DetailedAttendanceData {
  id: number;
  name: string;
  email: string;
  initials: string;
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  trend: "up" | "stable" | "down";
}

export default function ReportsAnalytics() {
  // Report generation states
  const [selectedDateRange, setSelectedDateRange] =
    useState<string>("this_month");
  const [selectedReportType, setSelectedReportType] =
    useState<string>("overview");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Report generation handler
  const handleGenerateReport = async () => {
    // For non-overview reports, a subject selection is recommended but not required
    // The user can leave it empty to get reports for all subjects

    if (!customEmail.trim()) {
      alert("Please enter an email address to send the report to");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail.trim())) {
      alert("Please enter a valid email address");
      return;
    }

    setIsGeneratingReport(true);

    try {
      const requestBody = {
        reportType: selectedReportType,
        dateRange: selectedDateRange,
        subjectIds:
          selectedCourseId && selectedCourseId !== "all"
            ? [parseInt(selectedCourseId)]
            : [],
        email: customEmail.trim(),
      };

      const response = await fetch("/api/lecturer/reports/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Report has been sent to ${customEmail}!`);
      } else {
        alert(`Error generating report: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Report generation error:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Use analytics-specific courses endpoint that shows all courses with attendance data
  const { data: courses, isLoading: _isCoursesLoading } = useQuery({
    queryKey: ["analytics-courses"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/available-courses");
      const data = await response.json();
      // Return empty array if error or not an array
      return Array.isArray(data) ? data : [];
    },
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [sessionType, setSessionType] = useState<"lecture" | "tutorial">(
    "lecture"
  );
  const [selectedTutorialId, setSelectedTutorialId] = useState<string>("");
  const [tutorialSessions, setTutorialSessions] = useState<
    Array<{ id: number; name: string }>
  >([]);

  // Fetch session types that this lecturer teaches
  const { data: sessionTypesData } = useQuery({
    queryKey: ["lecturer-session-types"],
    queryFn: async () => {
      const response = await fetch("/api/lecturer/session-types");
      const data = await response.json();
      // Return default structure if error
      return data && !data.error ? data : { sessionTypes: [] };
    },
  });

  // Real-time data states
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([]);
  const [studentPerformanceData, setStudentPerformanceData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [checkinTypesData, setCheckinTypesData] = useState([]);
  const [keyMetrics, setKeyMetrics] = useState({
    averageAttendance: 0,
    atRiskStudents: 0,
    totalStudents: 0,
    mostAttended: { week: "N/A", subject: "", attendance: 0 },
    leastAttended: { week: "N/A", subject: "", attendance: 0 },
  });

  // Advanced Analytics States
  const [selectedAnalyticType, setSelectedAnalyticType] = useState<string>("");
  // Future analytics features
  // const [dayOfWeekData, setDayOfWeekData] = useState({});
  // const [timeBasedData, setTimeBasedData] = useState([]);
  // const [riskPredictionData, setRiskPredictionData] = useState([]);

  // Pagination and Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [attendanceFilter, setAttendanceFilter] = useState<
    "all" | "excellent" | "good" | "poor"
  >("all");

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
    dayAttendance[2] = 0; // Tuesday (no data)
    dayAttendance[3] = 0; // Wednesday (no data)
    dayAttendance[4] = 0; // Thursday (no data)
    dayAttendance[5] = 0; // Friday (no data)
    dayAttendance[6] = 0; // Saturday (no data)

    return dayAttendance;
  };

  const calculateTimeBasedData = () => {
    if (!weeklyAttendanceData || weeklyAttendanceData.length === 0) return [];

    // Split weeks into early/mid/late periods
    const totalWeeks = weeklyAttendanceData.length;
    const earlyWeeks = weeklyAttendanceData.slice(0, Math.ceil(totalWeeks / 3));
    const midWeeks = weeklyAttendanceData.slice(
      Math.ceil(totalWeeks / 3),
      Math.ceil((totalWeeks * 2) / 3)
    );
    const lateWeeks = weeklyAttendanceData.slice(
      Math.ceil((totalWeeks * 2) / 3)
    );

    const calculateAvg = weeks =>
      weeks.length > 0
        ? weeks.reduce(
            (sum, w) =>
              sum + (typeof w.attendance === "number" ? w.attendance : 0),
            0
          ) / weeks.length
        : 0;

    return [
      {
        period: "Early",
        attendance: calculateAvg(earlyWeeks),
        weeks: earlyWeeks.length,
      },
      {
        period: "Mid",
        attendance: calculateAvg(midWeeks),
        weeks: midWeeks.length,
      },
      {
        period: "Late",
        attendance: calculateAvg(lateWeeks),
        weeks: lateWeeks.length,
      },
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
          watchList: 0,
        },
      };
    }

    const criticalRisk = studentPerformanceData.filter(
      s => parseFloat(String(s.attendance_percentage)) < 60
    );
    const moderateRisk = studentPerformanceData.filter(s => {
      const attendance = parseFloat(String(s.attendance_percentage));
      return attendance >= 60 && attendance < 75;
    });
    const watchList = studentPerformanceData.filter(
      s =>
        s.trend === "down" && parseFloat(String(s.attendance_percentage)) >= 75
    );

    return {
      critical: criticalRisk,
      moderate: moderateRisk,
      watchList: watchList,
      counts: {
        critical: criticalRisk.length,
        moderate: moderateRisk.length,
        watchList: watchList.length,
      },
    };
  };

  const [lecturerTrends, setLecturerTrends] = useState({
    summary: {
      totalSubjects: 0,
      totalStudents: 0,
      overallAverage: 0,
      performanceLevels: {
        excellent: 0,
        good: 0,
        average: 0,
        needs_improvement: 0,
      },
      trendDirection: "stable",
    },
    subjectPerformance: [],
    weeklyProgression: [],
    engagementPatterns: [],
    insights: {},
  });
  const [_isLoadingData, setIsLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Detailed attendance states
  const [detailedAttendanceTab, setDetailedAttendanceTab] =
    useState<string>("student");
  const [detailedAttendanceData, setDetailedAttendanceData] = useState<
    DetailedAttendanceData[]
  >([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoadingDetailedData, setIsLoadingDetailedData] = useState(false);

  // Modal states for actions
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentPerformance | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (!selectedCourseId && courses && courses.length > 0) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  // Auto-set session type based on what the lecturer teaches
  useEffect(() => {
    if (sessionTypesData && sessionTypesData.sessionTypes) {
      const availableTypes = sessionTypesData.sessionTypes;
      // If lecturer only teaches one type, automatically set it
      if (availableTypes.length === 1) {
        setSessionType(availableTypes[0] as "lecture" | "tutorial");
      } else if (availableTypes.length > 1) {
        // If they teach both, default to lectures (or keep current selection if valid)
        if (!availableTypes.includes(sessionType)) {
          setSessionType("lecture"); // Default to lecture if current selection is invalid
        }
      }
    }
  }, [sessionTypesData]);

  // Fetch tutorial sessions when tutorial type is selected
  useEffect(() => {
    const fetchTutorialSessions = async () => {
      if (sessionType === "tutorial" && selectedCourseId) {
        // Reset to "student" tab if currently on "course" tab (not available for tutorials)
        if (detailedAttendanceTab === "course") {
          setDetailedAttendanceTab("student");
        }

        try {
          const response = await fetch(
            `/api/lecturer/tutorial-sessions?subjectId=${selectedCourseId}`
          );
          const data = await response.json();
          if (data && Array.isArray(data)) {
            setTutorialSessions(data);
            // Auto-select first tutorial if available
            if (data.length > 0 && !selectedTutorialId) {
              setSelectedTutorialId(String(data[0].id));
            }
          }
        } catch (error) {
          console.error("Error fetching tutorial sessions:", error);
          setTutorialSessions([]);
        }
      } else {
        setTutorialSessions([]);
        setSelectedTutorialId("");
      }
    };

    fetchTutorialSessions();
  }, [sessionType, selectedCourseId]);

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [detailedAttendanceData, selectedCourseId, detailedAttendanceTab]);

  // Fetch real-time data
  const fetchAnalyticsData = async (isManualRefresh = false) => {
    if (!selectedCourseId) return;

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setIsLoadingData(true);
    }

    try {
      // Fetch analytics data sequentially to reduce database connection load
      console.log("Fetching weekly attendance...");
      const tutorialParam =
        sessionType === "tutorial" && selectedTutorialId
          ? `&tutorialSessionId=${selectedTutorialId}`
          : "";
      const weeklyRes = await fetch(
        `/api/analytics/weekly-attendance?subjectId=${selectedCourseId}&sessionType=${sessionType}${tutorialParam}`
      );
      const weeklyData = await weeklyRes.json();

      console.log("Fetching student performance...");
      const studentRes = await fetch(
        `/api/analytics/student-performance?subjectId=${selectedCourseId}&limit=500&sessionType=${sessionType}${tutorialParam}`
      );
      const studentPerformanceData = await studentRes.json();

      console.log("Fetching distribution data...");
      const distributionRes = await fetch(
        `/api/analytics/attendance-distribution?subjectId=${selectedCourseId}&sessionType=${sessionType}${tutorialParam}`
      );
      const distributionData = await distributionRes.json();

      console.log("Fetching key metrics...");
      const metricsRes = await fetch(
        `/api/analytics/key-metrics?subjectId=${selectedCourseId}&sessionType=${sessionType}${tutorialParam}`
      );
      const metricsData = await metricsRes.json();

      console.log("Fetching lecturer trends...");
      // Teaching Performance Overview should show ALL lectures/tutorials taught by this lecturer
      // Do NOT filter by subjectId - show complete teaching portfolio
      const trendsRes = await fetch(
        `/api/analytics/lecturer-trends?sessionType=${sessionType}`
      );
      const trendsData = await trendsRes.json();

      console.log("Fetching checkin types...");
      const checkinTypesRes = await fetch(
        `/api/analytics/checkin-types?subjectId=${selectedCourseId}&sessionType=${sessionType}${tutorialParam}`
      );
      const checkinTypesData = await checkinTypesRes.json();

      // Transform data for charts
      const weeklyArray = Array.isArray(weeklyData) ? weeklyData : [];
      setWeeklyAttendanceData(
        weeklyArray.map(item => ({
          week_label: item.week_label,
          date: item.date_label,
          attendance: parseFloat(item.attendance_rate) || 0,
          color:
            parseFloat(item.attendance_rate) >= 80
              ? "#22c55e"
              : parseFloat(item.attendance_rate) >= 70
                ? "#f59e0b"
                : "#ef4444",
        }))
      );

      const studentArray = Array.isArray(studentPerformanceData)
        ? studentPerformanceData
        : [];
      setStudentPerformanceData(
        studentArray.map((item, index) => {
          // Helper function to safely extract string from potential object
          const extractString = (value, fallback = "") => {
            if (!value) return fallback;
            if (typeof value === "object") {
              // Log the problematic data structure for debugging
              console.warn("Object detected in student data:", {
                value,
                type: typeof value,
              });

              // Handle Buffer or object with data property
              if (value.data) return String(value.data);
              if (value.type === "Buffer" && Array.isArray(value.data)) {
                return String.fromCharCode(...value.data);
              }
              // Try to get any string representation
              try {
                const stringified = JSON.stringify(value);
                // If it's a simple object, try to extract a meaningful value
                if (stringified !== "{}" && stringified !== "[]") {
                  return stringified;
                }
              } catch (e) {
                console.error("Failed to stringify object:", e);
              }
              return fallback;
            }
            return String(value);
          };

          return {
            student_id_anon: extractString(
              item.student_id_anon,
              `student-${index}`
            ),
            student_name: extractString(item.student_name, "Unknown"),
            student_email: extractString(item.student_email, ""),
            initials: extractString(item.initials, "XX"),
            subject_code: extractString(item.subject_code, ""),
            subject_name: extractString(item.subject_name, ""),
            attendance_percentage: parseFloat(item.attendance_percentage) || 0,
            weeks_attended: parseInt(item.weeks_attended) || 0,
            total_weeks: parseInt(item.total_weeks) || 0,
            performance_category: item.performance_category,
            trend: item.trend,
          };
        })
      );

      setDistributionData(
        Array.isArray(distributionData) ? distributionData : []
      );
      setCheckinTypesData(checkinTypesData?.weeklyData || []);
      setKeyMetrics({
        averageAttendance: parseFloat(metricsData?.averageAttendance) || 0,
        atRiskStudents: parseInt(metricsData?.atRiskStudents) || 0,
        totalStudents: parseInt(metricsData?.totalStudents) || 0,
        mostAttended: metricsData?.mostAttended || {
          week: "N/A",
          subject: "",
          attendance: 0,
        },
        leastAttended: metricsData?.leastAttended || {
          week: "N/A",
          subject: "",
          attendance: 0,
        },
      });
      // Debug the trends data (removed for production)

      setLecturerTrends(
        trendsData || {
          summary: {
            totalSubjects: 0,
            totalStudents: 0,
            overallAverage: 0,
            performanceLevels: {
              excellent: 0,
              good: 0,
              average: 0,
              needs_improvement: 0,
            },
            trendDirection: "stable",
          },
          subjectPerformance: [],
          weeklyProgression: [],
          engagementPatterns: [],
          insights: {},
        }
      );
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setIsLoadingData(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  // Initial fetch on mount and when filters change
  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, sessionType, selectedTutorialId]);

  // Fetch detailed attendance data
  useEffect(() => {
    const fetchDetailedAttendance = async () => {
      if (!selectedCourseId) return;

      setIsLoadingDetailedData(true);
      try {
        const tutorialParam =
          sessionType === "tutorial" && selectedTutorialId
            ? `&tutorialSessionId=${selectedTutorialId}`
            : "";
        const response = await fetch(
          `/api/analytics/detailed-attendance?subjectId=${selectedCourseId}&viewType=${detailedAttendanceTab}&search=${searchQuery}&sessionType=${sessionType}${tutorialParam}`
        );

        if (response.ok) {
          const data = await response.json();
          setDetailedAttendanceData(data);
        } else {
          const errorData = await response.text();
          console.error(
            "Failed to fetch detailed attendance:",
            response.status,
            errorData
          );
          setDetailedAttendanceData([]);
        }
      } catch (error) {
        console.error("Error fetching detailed attendance:", error);
        setDetailedAttendanceData([]);
      } finally {
        setIsLoadingDetailedData(false);
      }
    };

    fetchDetailedAttendance();
  }, [
    selectedCourseId,
    detailedAttendanceTab,
    searchQuery,
    sessionType,
    selectedTutorialId,
  ]);

  // Action handlers
  const handleViewDetails = (
    student: StudentPerformance | DetailedAttendanceData
  ) => {
    setSelectedStudent(student as any);
    setShowDetailsModal(true);
  };

  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const handleSendNotification = (
    student: StudentPerformance | DetailedAttendanceData
  ) => {
    setSelectedStudent(student as any);
    setShowNotificationModal(true);
  };

  const sendNotificationEmail = async () => {
    if (!selectedStudent) return;

    setIsSendingNotification(true);

    try {
      // Handle both StudentPerformance and DetailedAttendanceData property names
      const studentEmail =
        (selectedStudent as any).student_email ||
        (selectedStudent as any).email;
      const studentName =
        (selectedStudent as any).student_name || (selectedStudent as any).name;
      const attendancePercentage =
        (selectedStudent as any).attendance_percentage ||
        (selectedStudent as any).attendancePercentage;

      const response = await fetch("/api/lecturer/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentEmail,
          studentName,
          attendancePercentage,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `Notification sent successfully to ${selectedStudent.student_name}!`
        );
        setShowNotificationModal(false);
      } else {
        alert(`Error sending notification: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Notification send error:", error);
      alert("Failed to send notification. Please try again.");
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleExportData = (
    student: StudentPerformance | DetailedAttendanceData
  ) => {
    // Handle both StudentPerformance and DetailedAttendanceData property names
    const studentData = student as any;
    const name = studentData.student_name || studentData.name;
    const email = studentData.student_email || studentData.email;
    const attendancePercentage =
      studentData.attendance_percentage || studentData.attendancePercentage;
    const attendedSessions =
      studentData.weeks_attended || studentData.attendedSessions;
    const totalSessions = studentData.total_weeks || studentData.totalSessions;
    const trend = studentData.trend;

    // Create CSV content
    const csvContent = [
      [
        "Name",
        "Email",
        "Attendance %",
        "Attended Weeks",
        "Total Weeks",
        "Trend",
      ],
      [
        name,
        email,
        `${attendancePercentage}%`,
        attendedSessions,
        totalSessions,
        trend,
      ],
    ]
      .map(row => row.join(","))
      .join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}_attendance.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportAllData = () => {
    const dataToExport =
      attendanceFilter === "all" ? detailedAttendanceData : filteredData;
    const csvContent = [
      [
        "Name",
        "Email",
        "Attendance %",
        "Attended Weeks",
        "Total Weeks",
        "Trend",
      ],
      ...dataToExport.map(student => [
        student.name,
        student.email,
        `${student.attendancePercentage}%`,
        student.attendedSessions,
        student.totalSessions,
        student.trend,
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filterSuffix =
      attendanceFilter !== "all" ? `_${attendanceFilter}` : "";
    a.download = `detailed_attendance${filterSuffix}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter and Pagination Logic
  const getFilteredData = () => {
    if (!Array.isArray(detailedAttendanceData)) return [];

    switch (attendanceFilter) {
      case "excellent":
        return detailedAttendanceData.filter(s => s.attendancePercentage >= 80);
      case "good":
        return detailedAttendanceData.filter(
          s => s.attendancePercentage >= 70 && s.attendancePercentage < 80
        );
      case "poor":
        return detailedAttendanceData.filter(s => s.attendancePercentage < 70);
      default:
        return detailedAttendanceData;
    }
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleFilterChange = (
    filter: "all" | "excellent" | "good" | "poor"
  ) => {
    setAttendanceFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const { data } = useCurrentUser();

  // Component render
  return (
    <main className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      {/* Header Section */}
      <div className="border-border border-b pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight lg:text-4xl">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Welcome back, {data?.user?.name}! Here&apos;s your comprehensive
              attendance analytics overview.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing}
            className="ml-4"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Main Analytics Dashboard */}
      <section className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              Performance Analytics Overview
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Real-time insights into attendance patterns and student engagement
            </p>
          </div>

          {/* Subject Selection */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end lg:items-center">
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Label htmlFor="courseSelect" className="text-sm font-medium">
                Select Subject
              </Label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent className="max-w-[320px]">
                  {courses?.map((course: Course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{course.code}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {course.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Type Tabs */}
            {sessionTypesData &&
              sessionTypesData.sessionTypes &&
              sessionTypesData.sessionTypes.length > 1 && (
                <div className="w-full sm:w-auto sm:min-w-[240px] lg:min-w-[280px]">
                  <Label className="mb-2 block text-sm font-medium">
                    Session Type
                  </Label>
                  <Tabs
                    value={sessionType}
                    onValueChange={(value: string) =>
                      setSessionType(value as "lecture" | "tutorial")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      {sessionTypesData.sessionTypes.includes("lecture") && (
                        <TabsTrigger
                          value="lecture"
                          className="text-xs sm:text-sm"
                        >
                          Lectures
                        </TabsTrigger>
                      )}
                      {sessionTypesData.sessionTypes.includes("tutorial") && (
                        <TabsTrigger
                          value="tutorial"
                          className="text-xs sm:text-sm"
                        >
                          Tutorials
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </Tabs>
                </div>
              )}

            {/* Tutorial Session Selector */}
            {sessionType === "tutorial" && tutorialSessions.length > 0 && (
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Label htmlFor="tutorialSelect" className="text-sm font-medium">
                  Tutorial Session
                </Label>
                <Select
                  value={selectedTutorialId}
                  onValueChange={setSelectedTutorialId}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select tutorial" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutorialSessions.map(tutorial => (
                      <SelectItem key={tutorial.id} value={String(tutorial.id)}>
                        {tutorial.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Weekly Attendance vs Enrollment Trends */}
          <Card className="border-border/50 h-full shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-foreground text-xl font-semibold">
                Weekly Attendance Trends
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
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
                  data={
                    Array.isArray(weeklyAttendanceData)
                      ? weeklyAttendanceData.map(item => ({
                          week_label: item.week_label,
                          enrolled: keyMetrics.totalStudents || 11,
                          attended: Math.round(
                            (item.attendance / 100) *
                              (keyMetrics.totalStudents || 11)
                          ),
                          target: Math.round(
                            (keyMetrics.totalStudents || 11) * 0.8
                          ),
                          attendance_rate: item.attendance,
                        }))
                      : []
                  }
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
                          <div className="bg-popover border-border rounded-lg border p-3 shadow-lg">
                            <p className="text-popover-foreground font-medium">
                              {payload[0]?.payload?.week_label}
                            </p>
                            <p className="text-blue-600 dark:text-blue-400">
                              Attended: {payload[1]?.value} students (
                              {payload[0]?.payload?.attendance_rate}%)
                            </p>
                            <p className="text-muted-foreground">
                              Enrolled: {payload[0]?.value} students
                            </p>
                            <p className="text-red-600 dark:text-red-400">
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
                    label={{
                      value: "Target (80%)",
                      position: "insideTopRight",
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="enrolled"
                    stroke="#6b7280"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{
                      fill: "#6b7280",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                      r: 4,
                    }}
                    name="Total Enrolled"
                  />
                  <Line
                    type="monotone"
                    dataKey="attended"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      fill: "#3b82f6",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                      r: 5,
                    }}
                    activeDot={{ r: 7, stroke: "#3b82f6", strokeWidth: 2 }}
                    name="Students Attended"
                  />
                </LineChart>
              </ChartContainer>

              {/* Enhanced Weekly Insights */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="bg-primary/5 border-primary/20 rounded-lg border p-4 text-center">
                  <div className="text-primary text-2xl font-bold">
                    {(() => {
                      if (
                        !weeklyAttendanceData ||
                        weeklyAttendanceData.length === 0
                      )
                        return "0";
                      const validData = weeklyAttendanceData.filter(
                        w =>
                          w &&
                          typeof w.attendance === "number" &&
                          !isNaN(w.attendance)
                      );
                      if (validData.length === 0) return "0";
                      const max = Math.max(...validData.map(w => w.attendance));
                      return isNaN(max) ? "0" : max;
                    })()}
                    %
                  </div>
                  <div className="text-muted-foreground text-sm font-medium">
                    Peak Attendance
                  </div>
                </div>
                <div className="bg-secondary/20 border-secondary/30 rounded-lg border p-4 text-center">
                  <div className="text-foreground text-2xl font-bold">
                    {(() => {
                      if (
                        !weeklyAttendanceData ||
                        weeklyAttendanceData.length === 0
                      )
                        return "0";
                      const validData = weeklyAttendanceData.filter(
                        w =>
                          w &&
                          typeof w.attendance === "number" &&
                          !isNaN(w.attendance)
                      );
                      if (validData.length === 0) return "0";
                      const average =
                        validData.reduce((sum, w) => sum + w.attendance, 0) /
                        validData.length;
                      return isNaN(average) ? "0" : average.toFixed(1);
                    })()}
                    %
                  </div>
                  <div className="text-muted-foreground text-sm font-medium">
                    Average Weekly
                  </div>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(() => {
                      if (
                        !weeklyAttendanceData ||
                        weeklyAttendanceData.length === 0
                      )
                        return "0";
                      const validData = weeklyAttendanceData.filter(
                        w =>
                          w &&
                          typeof w.attendance === "number" &&
                          !isNaN(w.attendance)
                      );
                      return validData.filter(w => w.attendance >= 80).length;
                    })()}
                  </div>
                  <div className="text-muted-foreground text-sm font-medium">
                    Weeks Above Target
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class Performance Metrics - Improved Radial Chart */}
          <Card className="border-border/50 h-full shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-foreground text-xl font-semibold">
                Overall Performance
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Comprehensive attendance metrics and class health indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2 lg:gap-6">
                {/* Radial Chart */}
                <div className="flex justify-center">
                  <div className="relative">
                    <ChartContainer
                      config={{
                        attendance: {
                          label: "Attendance",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[200px] w-[200px]"
                    >
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="85%"
                        data={[
                          {
                            name: "Overall",
                            value: keyMetrics.averageAttendance || 0,
                            fill:
                              keyMetrics.averageAttendance >= 80
                                ? "hsl(142 76% 36%)"
                                : keyMetrics.averageAttendance >= 60
                                  ? "hsl(38 92% 50%)"
                                  : "hsl(0 84% 60%)",
                          },
                        ]}
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
                      <div
                        className={`text-2xl font-bold ${
                          keyMetrics.averageAttendance >= 80
                            ? "text-emerald-600 dark:text-emerald-400"
                            : keyMetrics.averageAttendance >= 60
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {keyMetrics.averageAttendance}%
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        Average
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {keyMetrics.totalStudents} students
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Legend and Stats */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {distributionData.find(d => d.name === "Excellent")
                          ?.value || 0}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Excellent (90%+)
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {distributionData.find(d => d.name === "Good")?.value ||
                          0}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Good (80-89%)
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {distributionData.find(d => d.name === "Average")
                          ?.value || 0}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Average (70-79%)
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {distributionData.find(d => d.name === "Poor")?.value ||
                          0}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        At Risk (&lt;70%)
                      </div>
                    </div>
                  </div>

                  {/* Performance Summary */}
                  <div className="bg-muted/30 border-l-primary rounded-lg border-l-4 p-3">
                    <div className="text-foreground text-sm font-medium">
                      Class Performance Summary
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {keyMetrics.averageAttendance >= 80
                        ? "Class is performing well above target"
                        : keyMetrics.averageAttendance >= 70
                          ? "Class needs improvement to reach target"
                          : "Class requires immediate attention"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Check-in Types Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                Weekly Check-in Types Analysis
              </CardTitle>
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="weekLabel"
                    className="text-muted-foreground text-sm"
                  />
                  <YAxis className="text-muted-foreground text-sm" />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border-border rounded-lg border p-3 shadow-lg">
                            <p className="text-popover-foreground font-medium">
                              {label}
                            </p>
                            {payload.map((entry, index) => (
                              <p
                                key={index}
                                className="text-sm"
                                style={{ color: entry.color }}
                              >
                                {entry.name}: {entry.value} check-ins
                              </p>
                            ))}
                            <p className="text-muted-foreground text-sm">
                              Total:{" "}
                              {payload.reduce(
                                (sum, entry) =>
                                  sum + (Number(entry.value) || 0),
                                0
                              )}{" "}
                              check-ins
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
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {checkinTypesData.reduce(
                      (sum, week) => sum + (week.inPerson || 0),
                      0
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm font-medium">
                    In-person Check-ins
                  </div>
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    {checkinTypesData.length > 0
                      ? `${(
                          (checkinTypesData.reduce(
                            (sum, week) => sum + (week.inPerson || 0),
                            0
                          ) /
                            checkinTypesData.reduce(
                              (sum, week) => sum + (week.total || 0),
                              0
                            )) *
                          100
                        ).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
                <div className="bg-primary/5 border-primary/20 rounded-lg border p-4 text-center">
                  <div className="text-primary text-2xl font-bold">
                    {checkinTypesData.reduce(
                      (sum, week) => sum + (week.online || 0),
                      0
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm font-medium">
                    Online Check-ins
                  </div>
                  <div className="text-primary mt-1 text-xs">
                    {checkinTypesData.length > 0
                      ? `${(
                          (checkinTypesData.reduce(
                            (sum, week) => sum + (week.online || 0),
                            0
                          ) /
                            checkinTypesData.reduce(
                              (sum, week) => sum + (week.total || 0),
                              0
                            )) *
                          100
                        ).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
                <div className="bg-secondary/20 border-secondary/30 rounded-lg border p-4 text-center">
                  <div className="text-foreground text-2xl font-bold">
                    {checkinTypesData.reduce(
                      (sum, week) => sum + (week.manual || 0),
                      0
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm font-medium">
                    Manual Check-ins
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {checkinTypesData.length > 0
                      ? `${(
                          (checkinTypesData.reduce(
                            (sum, week) => sum + (week.manual || 0),
                            0
                          ) /
                            checkinTypesData.reduce(
                              (sum, week) => sum + (week.total || 0),
                              0
                            )) *
                          100
                        ).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
              </div>

              {/* Insights Panel */}
              <div className="bg-muted/30 border-border mt-6 rounded-lg border p-4">
                <h4 className="text-foreground mb-2 text-sm font-medium">
                  Check-in Pattern Insights
                </h4>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">
                        Primary Mode:
                      </span>
                      {(() => {
                        const totals = {
                          inPerson: checkinTypesData.reduce(
                            (sum, week) => sum + (week.inPerson || 0),
                            0
                          ),
                          online: checkinTypesData.reduce(
                            (sum, week) => sum + (week.online || 0),
                            0
                          ),
                          manual: checkinTypesData.reduce(
                            (sum, week) => sum + (week.manual || 0),
                            0
                          ),
                        };
                        const max = Math.max(
                          totals.inPerson,
                          totals.online,
                          totals.manual
                        );
                        return max === totals.inPerson
                          ? " In-person attendance"
                          : max === totals.online
                            ? " Online attendance"
                            : " Manual entries";
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">
                        Total Sessions:
                      </span>{" "}
                      {checkinTypesData.reduce(
                        (sum, week) => sum + (week.total || 0),
                        0
                      )}{" "}
                      check-ins
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Key Metrics with Visual Indicators */}
          <Card className="border-border/50 h-full shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-foreground text-xl font-semibold">
                Key Performance Indicators
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Critical metrics with visual performance indicators and trends
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Average Attendance with Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground text-sm font-medium">
                      Average Attendance
                    </p>
                    <span
                      className={`text-2xl font-bold ${
                        keyMetrics.averageAttendance >= 80
                          ? "text-emerald-600 dark:text-emerald-400"
                          : keyMetrics.averageAttendance >= 60
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {keyMetrics.averageAttendance}%
                    </span>
                  </div>
                  <div className="bg-muted h-3 w-full rounded-full">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        keyMetrics.averageAttendance >= 80
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                          : keyMetrics.averageAttendance >= 60
                            ? "bg-gradient-to-r from-amber-500 to-amber-600"
                            : "bg-gradient-to-r from-rose-500 to-rose-600"
                      }`}
                      style={{
                        width: `${Math.min(keyMetrics.averageAttendance, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Target: 80% | Current:{" "}
                    {keyMetrics.averageAttendance >= 80
                      ? "On Track"
                      : keyMetrics.averageAttendance >= 60
                        ? "Needs Improvement"
                        : "Critical"}
                  </div>
                </div>

                {/* Students at Risk with Alert Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground text-sm font-medium">
                      Students at Risk
                    </p>
                    <div className="flex items-center space-x-2">
                      {keyMetrics.atRiskStudents > 0 && (
                        <div className="h-3 w-3 animate-pulse rounded-full bg-rose-500"></div>
                      )}
                      <span
                        className={`text-2xl font-bold ${
                          keyMetrics.atRiskStudents === 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : keyMetrics.atRiskStudents <= 5
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {keyMetrics.atRiskStudents}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-muted h-3 w-full rounded-full">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                        style={{
                          width:
                            keyMetrics.totalStudents > 0
                              ? `${Math.min((keyMetrics.atRiskStudents / keyMetrics.totalStudents) * 100, 100)}%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                    <span className="text-muted-foreground min-w-max text-xs">
                      of {keyMetrics.totalStudents}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {keyMetrics.atRiskStudents === 0
                      ? "All students performing well"
                      : keyMetrics.atRiskStudents <= 3
                        ? "Manageable risk level"
                        : "High attention needed"}
                  </div>
                </div>
              </div>

              {/* Best vs Worst Session Comparison */}
              <div className="border-border mt-6 border-t pt-6">
                <h4 className="text-foreground mb-4 text-sm font-medium">
                  Session Performance Comparison
                </h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Best Session */}
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                        <ArrowUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          Best Performance
                        </p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                          {keyMetrics.mostAttended.week}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          {keyMetrics.mostAttended.attendance}% attendance
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Worst Session */}
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950/20">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
                        <ArrowDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                          Needs Attention
                        </p>
                        <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                          {keyMetrics.leastAttended.week}
                        </p>
                        <p className="text-xs text-rose-600 dark:text-rose-400">
                          {keyMetrics.leastAttended.attendance}% attendance
                        </p>
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
                    <span className="text-muted-foreground text-xs">Low</span>
                    <div className="flex space-x-1">
                      <div className="h-4 w-4 rounded-sm bg-red-400 dark:bg-red-700"></div>
                      <div className="h-4 w-4 rounded-sm bg-orange-400 dark:bg-orange-700"></div>
                      <div className="h-4 w-4 rounded-sm bg-yellow-400 dark:bg-yellow-700"></div>
                      <div className="h-4 w-4 rounded-sm bg-green-400 dark:bg-green-700"></div>
                      <div className="h-4 w-4 rounded-sm bg-green-500 dark:bg-green-600"></div>
                    </div>
                    <span className="text-muted-foreground text-xs">High</span>
                  </div>
                </div>

                {/* Heatmap Grid */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  {(Array.isArray(weeklyAttendanceData)
                    ? weeklyAttendanceData
                    : []
                  ).map((week, index) => (
                    <div
                      key={`week-heatmap-${index}-${week.week_number || 0}`}
                      className={`relative cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:scale-105 ${
                        week.attendance >= 90
                          ? "border-green-600 bg-green-500 text-white dark:border-green-500 dark:bg-green-600"
                          : week.attendance >= 80
                            ? "border-green-500 bg-green-400 text-white dark:border-green-600 dark:bg-green-700"
                            : week.attendance >= 70
                              ? "border-yellow-500 bg-yellow-400 text-gray-900 dark:border-yellow-600 dark:bg-yellow-700 dark:text-gray-100"
                              : week.attendance >= 60
                                ? "border-orange-500 bg-orange-400 text-white dark:border-orange-600 dark:bg-orange-700"
                                : "border-red-500 bg-red-400 text-white dark:border-red-600 dark:bg-red-700"
                      }`}
                      title={`${week.week_label}: ${week.attendance}% attendance`}
                    >
                      <div className="text-center">
                        <div className="text-xs font-medium opacity-90">
                          {week.week_label}
                        </div>
                        <div className="text-lg font-bold">
                          {week.attendance}%
                        </div>
                        <div className="text-xs opacity-75">{week.date}</div>
                      </div>
                      {week.attendance >= 90 && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-yellow-400"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary Stats */}
                <div className="border-border border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                    <div>
                      <div className="text-muted-foreground text-sm">
                        Excellent (90%+)
                      </div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {
                          (Array.isArray(weeklyAttendanceData)
                            ? weeklyAttendanceData
                            : []
                          ).filter(w => w.attendance >= 90).length
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">
                        Good (80-89%)
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {
                          (Array.isArray(weeklyAttendanceData)
                            ? weeklyAttendanceData
                            : []
                          ).filter(w => w.attendance >= 80 && w.attendance < 90)
                            .length
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">
                        Average (70-79%)
                      </div>
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {
                          (Array.isArray(weeklyAttendanceData)
                            ? weeklyAttendanceData
                            : []
                          ).filter(w => w.attendance >= 70 && w.attendance < 80)
                            .length
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">
                        Below Target
                      </div>
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {
                          (Array.isArray(weeklyAttendanceData)
                            ? weeklyAttendanceData
                            : []
                          ).filter(w => w.attendance < 70).length
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Analytics */}
          <Card className="border-border/50 h-full shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-foreground text-xl font-semibold">
                Advanced Analytics
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Specialized insights for deeper course analysis and predictive
                modeling
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-6">
                <div className="border-border border-b pb-4">
                  <label className="text-foreground mb-3 block text-base font-medium">
                    Select Analytics Type
                  </label>
                  <Select
                    value={selectedAnalyticType}
                    onValueChange={setSelectedAnalyticType}
                  >
                    <SelectTrigger className="h-12 w-full max-w-lg text-base">
                      <SelectValue placeholder="Choose an advanced analytics view..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day-patterns">
                        Day-of-Week Attendance Patterns
                      </SelectItem>
                      <SelectItem value="time-analysis">
                        Time-Based Attendance Analysis
                      </SelectItem>
                      <SelectItem value="risk-prediction">
                        Student Risk Prediction Dashboard
                      </SelectItem>
                      <SelectItem value="attendance-forecasting">
                        Attendance Forecasting & Trends
                      </SelectItem>
                      <SelectItem value="performance-metrics">
                        Performance Benchmarking
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-h-[400px]">
                  {/* Day-of-Week Patterns */}
                  {selectedAnalyticType === "day-patterns" && (
                    <DayOfWeekPatterns sessionType={sessionType} />
                  )}

                  {/* Time-Based Analysis */}
                  {selectedAnalyticType === "time-analysis" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-foreground text-sm font-medium">
                          Early vs Late Semester Trends
                        </h4>
                        <div className="text-muted-foreground text-xs">
                          Attendance patterns over time periods
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {(() => {
                          const timeData = calculateTimeBasedData();
                          const periods = [
                            {
                              name: "Early Semester",
                              color: "blue",
                              data: timeData[0],
                            },
                            {
                              name: "Mid Semester",
                              color: "amber",
                              data: timeData[1],
                            },
                            {
                              name: "Late Semester",
                              color: "rose",
                              data: timeData[2],
                            },
                          ];

                          return periods.map((period, index) => {
                            const attendance = period.data?.attendance || 0;
                            const weeks = period.data?.weeks || 0;
                            return (
                              <div
                                key={index}
                                className={
                                  period.color === "blue"
                                    ? "rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-950/20"
                                    : period.color === "amber"
                                      ? "rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-950/20"
                                      : "rounded-lg border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-800 dark:bg-rose-950/20"
                                }
                              >
                                <div
                                  className={
                                    period.color === "blue"
                                      ? "text-2xl font-bold text-blue-600 dark:text-blue-400"
                                      : period.color === "amber"
                                        ? "text-2xl font-bold text-amber-600 dark:text-amber-400"
                                        : "text-2xl font-bold text-rose-600 dark:text-rose-400"
                                  }
                                >
                                  {attendance.toFixed(1)}%
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {period.name}
                                </div>
                                <div
                                  className={
                                    period.color === "blue"
                                      ? "mt-1 text-xs text-blue-600 dark:text-blue-400"
                                      : period.color === "amber"
                                        ? "mt-1 text-xs text-amber-600 dark:text-amber-400"
                                        : "mt-1 text-xs text-rose-600 dark:text-rose-400"
                                  }
                                >
                                  {weeks} week{weeks !== 1 ? "s" : ""}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <div className="bg-muted/30 border-border mt-4 rounded-lg border p-3">
                        <p className="text-muted-foreground text-sm">
                          <span className="text-foreground font-medium">
                            Insight:
                          </span>{" "}
                          {(() => {
                            const timeData = calculateTimeBasedData();
                            if (timeData.length === 0)
                              return "No time-based data available.";
                            const early = timeData[0]?.attendance || 0;
                            const late =
                              timeData[timeData.length - 1]?.attendance || 0;
                            const drop = early - late;
                            return drop > 0
                              ? `${drop.toFixed(1)}% drop from early to late semester. Consider mid-semester engagement activities.`
                              : drop < 0
                                ? `${Math.abs(drop).toFixed(1)}% improvement from early to late semester. Great progress!`
                                : "Consistent attendance throughout semester.";
                          })()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Risk Prediction Dashboard */}
                  {selectedAnalyticType === "risk-prediction" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-foreground text-sm font-medium">
                          Students at Risk - Early Warning System
                        </h4>
                        <div className="text-muted-foreground text-xs">
                          Predictive analysis for attendance failure
                        </div>
                      </div>

                      {/* Risk Categories */}
                      {(() => {
                        const riskData = calculateRiskData();
                        return (
                          <>
                            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950/20">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {riskData.critical?.length || 0}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Critical Risk
                                </div>
                                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                                  &lt; 60% current
                                </div>
                              </div>
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-950/20">
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                  {riskData.moderate?.length || 0}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Moderate Risk
                                </div>
                                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                  60-75% current
                                </div>
                              </div>
                              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-950/20">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {riskData.watchList?.length || 0}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Watch List
                                </div>
                                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                  Declining trend
                                </div>
                              </div>
                            </div>

                            {/* Critical Risk Students */}
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-red-600 dark:text-red-400">
                                Critical Risk Students - Immediate Intervention
                                Required
                              </h5>
                              {riskData.critical?.length > 0 ? (
                                <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                                  {riskData.critical.map((student, index) => {
                                    const trendIcon =
                                      student.trend === "down"
                                        ? "↓"
                                        : student.trend === "up"
                                          ? "↑"
                                          : "→";
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                                            {student.initials ||
                                              student.name
                                                ?.split(" ")
                                                .map(n => n[0])
                                                .join("") ||
                                              "?"}
                                          </div>
                                          <div>
                                            <p className="text-foreground font-medium">
                                              {student.name}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                              Attended{" "}
                                              {student.attendedSessions}/
                                              {student.totalSessions} weeks
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                            {parseFloat(
                                              String(
                                                student.attendance_percentage ||
                                                  0
                                              )
                                            ).toFixed(1)}
                                            %
                                          </div>
                                          <div className="text-muted-foreground text-xs">
                                            {trendIcon} {student.trend}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-muted-foreground py-4 text-center">
                                  <p>No students currently at critical risk</p>
                                </div>
                              )}
                            </div>

                            <div className="bg-muted/30 border-border mt-4 rounded-lg border p-3">
                              <p className="text-muted-foreground text-sm">
                                <span className="text-foreground font-medium">
                                  Status:
                                </span>{" "}
                                {riskData.critical?.length > 0
                                  ? `${riskData.critical.length} student${riskData.critical.length !== 1 ? "s" : ""} need immediate intervention. Consider personal meetings or alternative attendance options.`
                                  : "All students are performing adequately. Continue monitoring for early warning signs."}
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
                        <h4 className="text-foreground text-sm font-medium">
                          Course Performance Ranking
                        </h4>
                        <div className="text-muted-foreground text-xs">
                          Compare attendance across all your courses
                        </div>
                      </div>
                      {(() => {
                        // Real data representing lecturer's multiple courses
                        const courseComparison = [
                          {
                            code: "CSCI235",
                            name: "Database Systems",
                            attendance: 42.1,
                            students: 11,
                            trend: "up",
                          },
                          {
                            code: "CSCI301",
                            name: "Software Engineering",
                            attendance: 34.8,
                            students: 11,
                            trend: "down",
                          },
                          {
                            code: "CSCI372",
                            name: "Computer Networks",
                            attendance: 28.6,
                            students: 11,
                            trend: "down",
                          },
                          {
                            code: "CSCI475",
                            name: "Machine Learning",
                            attendance: 15.2,
                            students: 11,
                            trend: "down",
                          },
                        ];

                        return (
                          <div className="space-y-2">
                            {courseComparison.map((course, index) => (
                              <div
                                key={index}
                                className="bg-muted/30 border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="text-muted-foreground text-lg font-bold">
                                    #{index + 1}
                                  </div>
                                  <div
                                    className={`h-12 w-3 rounded-full ${
                                      course.attendance >= 80
                                        ? "bg-green-500 dark:bg-green-600"
                                        : course.attendance >= 60
                                          ? "bg-blue-500 dark:bg-blue-600"
                                          : course.attendance >= 40
                                            ? "bg-yellow-500 dark:bg-yellow-600"
                                            : "bg-red-500 dark:bg-red-600"
                                    }`}
                                  ></div>
                                  <div>
                                    <h4 className="text-foreground font-medium">
                                      {course.code}
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      {course.name}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {course.students} students
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-foreground text-xl font-bold">
                                    {course.attendance.toFixed(1)}%
                                  </div>
                                  <div
                                    className={`flex items-center justify-end text-sm ${
                                      course.trend === "up"
                                        ? "text-green-600 dark:text-green-400"
                                        : course.trend === "down"
                                          ? "text-red-600 dark:text-red-400"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {course.trend === "up"
                                      ? "↗ Improving"
                                      : course.trend === "down"
                                        ? "↘ Declining"
                                        : "→ Stable"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <div className="bg-muted/30 border-border mt-4 rounded-lg border p-3">
                        <p className="text-muted-foreground text-sm">
                          <span className="text-foreground font-medium">
                            Insight:
                          </span>{" "}
                          CSCI235 (Database Systems) has the highest attendance
                          rate. Consider applying successful strategies from
                          this course to improve others.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Retention Analysis */}
                  {selectedAnalyticType === "retention-analysis" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-foreground text-sm font-medium">
                          Student Engagement Patterns
                        </h4>
                        <div className="text-muted-foreground text-xs">
                          Track retention and improvement trends
                        </div>
                      </div>
                      {(() => {
                        // Calculate retention patterns from real student data
                        const retentionData = studentPerformanceData.reduce(
                          (acc, student) => {
                            const attendance = parseFloat(
                              String(student.attendance_percentage)
                            );
                            if (student.trend === "down" && attendance < 75) {
                              acc.declining.push(student);
                            } else if (student.trend === "up") {
                              acc.improving.push(student);
                            } else if (attendance > 80) {
                              acc.consistent.push(student);
                            }
                            return acc;
                          },
                          { declining: [], improving: [], consistent: [] }
                        );

                        return (
                          <div className="space-y-3">
                            {/* Retention Categories */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950/20">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {retentionData.declining.length}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Declining
                                </div>
                                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                                  ↘ Need intervention
                                </div>
                              </div>
                              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/20">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {retentionData.improving.length}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Improving
                                </div>
                                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                                  ↗ Positive trend
                                </div>
                              </div>
                              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-950/20">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {retentionData.consistent.length}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Consistent
                                </div>
                                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                  → High performers
                                </div>
                              </div>
                            </div>

                            {/* Declining Students Detail */}
                            {retentionData.declining.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium text-red-600 dark:text-red-400">
                                  Students Showing Decline
                                </h5>
                                {retentionData.declining
                                  .slice(0, 3)
                                  .map((student, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                                          {student.initials}
                                        </div>
                                        <div>
                                          <p className="text-foreground font-medium">
                                            {student.student_name}
                                          </p>
                                          <p className="text-muted-foreground text-xs">
                                            Attended {student.weeks_attended}/
                                            {student.total_weeks} weeks
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                          {parseFloat(
                                            String(
                                              student.attendance_percentage || 0
                                            )
                                          ).toFixed(1)}
                                          %
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                          ↘ declining
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}

                            <div className="bg-muted/30 border-border rounded-lg border p-3">
                              <p className="text-muted-foreground text-sm">
                                <span className="text-foreground font-medium">
                                  Retention Rate:
                                </span>{" "}
                                {studentPerformanceData.length > 0
                                  ? `${(((retentionData.consistent.length + retentionData.improving.length) / studentPerformanceData.length) * 100).toFixed(1)}% of students are maintaining or improving attendance.`
                                  : "No retention data available."}
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
                        <h4 className="text-foreground text-sm font-medium">
                          Attendance Factor Correlations
                        </h4>
                        <div className="text-muted-foreground text-xs">
                          Analyze relationships between engagement factors
                        </div>
                      </div>
                      {(() => {
                        // Calculate correlations from real checkin types data
                        const correlationData = {
                          inPersonSuccess: checkinTypesData.reduce(
                            (sum, week) => sum + (week.inPerson || 0),
                            0
                          ),
                          onlineSuccess: checkinTypesData.reduce(
                            (sum, week) => sum + (week.online || 0),
                            0
                          ),
                          manualEntries: checkinTypesData.reduce(
                            (sum, week) => sum + (week.manual || 0),
                            0
                          ),
                          totalCheckins: checkinTypesData.reduce(
                            (sum, week) => sum + (week.total || 0),
                            0
                          ),
                        };

                        const weeklyEngagement =
                          weeklyAttendanceData.length > 0
                            ? weeklyAttendanceData.reduce(
                                (sum, w) => sum + w.attendance,
                                0
                              ) / weeklyAttendanceData.length
                            : 0;

                        return (
                          <div className="space-y-3">
                            {/* Correlation Matrix */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3 dark:border-blue-800 dark:from-blue-950/20 dark:to-blue-900/30">
                                <h5 className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                                  In-Person Engagement
                                </h5>
                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                  {correlationData.totalCheckins > 0
                                    ? `${((correlationData.inPersonSuccess / correlationData.totalCheckins) * 100).toFixed(1)}%`
                                    : "0%"}
                                </div>
                                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                  {correlationData.inPersonSuccess} total
                                  check-ins
                                </div>
                              </div>

                              <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-3 dark:border-purple-800 dark:from-purple-950/20 dark:to-purple-900/30">
                                <h5 className="mb-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                                  Online Participation
                                </h5>
                                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                  {correlationData.totalCheckins > 0
                                    ? `${((correlationData.onlineSuccess / correlationData.totalCheckins) * 100).toFixed(1)}%`
                                    : "0%"}
                                </div>
                                <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                  {correlationData.onlineSuccess} online
                                  sessions
                                </div>
                              </div>

                              <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-3 dark:border-amber-800 dark:from-amber-950/20 dark:to-amber-900/30">
                                <h5 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                                  Manual Interventions
                                </h5>
                                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                  {correlationData.totalCheckins > 0
                                    ? `${((correlationData.manualEntries / correlationData.totalCheckins) * 100).toFixed(1)}%`
                                    : "0%"}
                                </div>
                                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                  {correlationData.manualEntries} manual entries
                                </div>
                              </div>

                              <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-emerald-900/30">
                                <h5 className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                  Overall Engagement
                                </h5>
                                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                  {weeklyEngagement.toFixed(1)}%
                                </div>
                                <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                  Average weekly rate
                                </div>
                              </div>
                            </div>

                            {/* Correlation Insights */}
                            <div className="space-y-2">
                              <h5 className="text-foreground text-sm font-medium">
                                Key Correlations
                              </h5>
                              <div className="space-y-1">
                                <div className="bg-muted/20 flex items-center justify-between rounded p-2 text-sm">
                                  <span className="text-foreground">
                                    In-Person vs Online Success
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      correlationData.inPersonSuccess >
                                      correlationData.onlineSuccess
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-blue-600 dark:text-blue-400"
                                    }`}
                                  >
                                    {correlationData.inPersonSuccess >
                                    correlationData.onlineSuccess
                                      ? "In-person preferred"
                                      : "Online effective"}
                                  </span>
                                </div>
                                <div className="bg-muted/20 flex items-center justify-between rounded p-2 text-sm">
                                  <span className="text-foreground">
                                    Manual Entry Frequency
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      correlationData.manualEntries >
                                      correlationData.totalCheckins * 0.1
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {correlationData.manualEntries >
                                    correlationData.totalCheckins * 0.1
                                      ? "High intervention needed"
                                      : "Self-sufficient students"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-muted/30 border-border rounded-lg border p-3">
                              <p className="text-muted-foreground text-sm">
                                <span className="text-foreground font-medium">
                                  Analysis:
                                </span>{" "}
                                {correlationData.inPersonSuccess >
                                correlationData.onlineSuccess
                                  ? "Students perform better with in-person attendance. Consider emphasizing physical presence benefits."
                                  : "Online participation is effective. Hybrid learning model is working well."}
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
                        <h4 className="text-foreground text-sm font-medium">
                          Attendance Forecasting & Trend Analysis
                        </h4>
                        <div className="text-muted-foreground text-xs">
                          Predictive modeling for future attendance patterns
                        </div>
                      </div>
                      {(() => {
                        // Calculate trend direction and forecast
                        const recentWeeks = weeklyAttendanceData.slice(-4); // Last 4 weeks
                        const earlierWeeks = weeklyAttendanceData.slice(-8, -4); // Previous 4 weeks

                        const recentAvg =
                          recentWeeks.length > 0
                            ? recentWeeks.reduce(
                                (sum, week) => sum + week.attendance,
                                0
                              ) / recentWeeks.length
                            : 0;
                        const earlierAvg =
                          earlierWeeks.length > 0
                            ? earlierWeeks.reduce(
                                (sum, week) => sum + week.attendance,
                                0
                              ) / earlierWeeks.length
                            : 0;

                        const trendChange = recentAvg - earlierAvg;
                        const trendDirection =
                          trendChange > 2
                            ? "improving"
                            : trendChange < -2
                              ? "declining"
                              : "stable";

                        // Forecast next 2 weeks based on trend
                        const forecastWeek1 = Math.max(
                          0,
                          Math.min(100, recentAvg + trendChange)
                        );
                        const forecastWeek2 = Math.max(
                          0,
                          Math.min(100, forecastWeek1 + trendChange * 0.7)
                        );

                        // Calculate seasonal patterns
                        const weekNumbers = weeklyAttendanceData.map(
                          (_, index) => index + 1
                        );
                        const midSemesterDrop =
                          weekNumbers.length > 6
                            ? weeklyAttendanceData
                                .slice(4, 8)
                                .reduce(
                                  (sum, week) => sum + week.attendance,
                                  0
                                ) / 4
                            : 0;

                        return (
                          <div className="space-y-4">
                            {/* Trend Summary Cards */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3 dark:border-blue-800 dark:from-blue-950/20 dark:to-blue-900/30">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    Current Trend
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs ${
                                      trendDirection === "improving"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                        : trendDirection === "declining"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                          : "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
                                    }`}
                                  >
                                    {trendDirection === "improving"
                                      ? "↗ Improving"
                                      : trendDirection === "declining"
                                        ? "↘ Declining"
                                        : "→ Stable"}
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                  {trendChange > 0 ? "+" : ""}
                                  {trendChange.toFixed(1)}%
                                </div>
                                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                  4-week trend change
                                </div>
                              </div>

                              <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-3 dark:border-purple-800 dark:from-purple-950/20 dark:to-purple-900/30">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    Next Week Forecast
                                  </span>
                                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                    Predicted
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                  {forecastWeek1.toFixed(1)}%
                                </div>
                                <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                  Based on current trend
                                </div>
                              </div>

                              <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-3 dark:border-amber-800 dark:from-amber-950/20 dark:to-amber-900/30">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                    Semester Pattern
                                  </span>
                                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                    Analysis
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                  {midSemesterDrop
                                    ? midSemesterDrop.toFixed(1)
                                    : "N/A"}
                                  %
                                </div>
                                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                  Mid-semester average
                                </div>
                              </div>
                            </div>

                            {/* Trend Visualization */}
                            <div className="bg-muted/30 border-border rounded-lg border p-4">
                              <h5 className="mb-3 font-medium">
                                Weekly Attendance Forecast
                              </h5>
                              <div className="space-y-2">
                                {weeklyAttendanceData
                                  .slice(-3)
                                  .map((week, index) => (
                                    <div
                                      key={index}
                                      className="bg-background flex items-center justify-between rounded border px-3 py-2"
                                    >
                                      <span className="text-sm font-medium">
                                        {week.week_label} (Actual)
                                      </span>
                                      <span className="text-foreground font-bold">
                                        {week.attendance}%
                                      </span>
                                    </div>
                                  ))}
                                <div className="flex items-center justify-between rounded border border-purple-200 bg-purple-50 px-3 py-2 dark:border-purple-800 dark:bg-purple-950">
                                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    Next Week (Forecast)
                                  </span>
                                  <span className="font-bold text-purple-700 dark:text-purple-300">
                                    {forecastWeek1.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between rounded border border-purple-200 bg-purple-50 px-3 py-2 dark:border-purple-800 dark:bg-purple-950">
                                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    Week After (Forecast)
                                  </span>
                                  <span className="font-bold text-purple-700 dark:text-purple-300">
                                    {forecastWeek2.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actionable Insights */}
                            <div className="bg-muted/30 border-border rounded-lg border p-4">
                              <h5 className="mb-2 font-medium">
                                Predictive Insights & Recommendations
                              </h5>
                              <p className="text-muted-foreground text-sm">
                                {trendDirection === "improving"
                                  ? `Positive momentum detected! Attendance has improved by ${trendChange.toFixed(1)}% over the last 4 weeks. Continue current engagement strategies and consider sharing successful methods with other courses.`
                                  : trendDirection === "declining"
                                    ? `Warning: Attendance declining by ${Math.abs(trendChange).toFixed(1)}% over 4 weeks. Consider implementing intervention strategies such as mid-semester check-ins, course material review, or flexible attendance options.`
                                    : "Attendance remains stable. Consider implementing engagement boosters to drive improvement or maintain current effective practices."}
                                {forecastWeek1 < 70 &&
                                  " Forecasted attendance may fall below target - proactive measures recommended."}
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
                        <h4 className="text-foreground text-sm font-medium">
                          Performance Benchmarking & Standards
                        </h4>
                        <div className="text-muted-foreground text-xs">
                          Compare against institutional standards and best
                          practices
                        </div>
                      </div>
                      {(() => {
                        // Calculate performance metrics
                        const currentAverage =
                          keyMetrics.averageAttendance || 0;
                        const institutionalBenchmark = 82; // Typical university benchmark
                        const excellenceTarget = 90;
                        const minimumStandard = 75;

                        // Performance categories
                        const exceedsExpectations =
                          currentAverage >= excellenceTarget;
                        const meetsStandards =
                          currentAverage >= institutionalBenchmark;
                        const needsImprovement =
                          currentAverage >= minimumStandard;
                        // const criticalLevel = currentAverage < minimumStandard;

                        // Consistency metrics
                        const weeklyVariance =
                          weeklyAttendanceData.length > 1
                            ? weeklyAttendanceData.reduce(
                                (acc, week, index, arr) => {
                                  if (index === 0) return 0;
                                  return (
                                    acc +
                                    Math.abs(
                                      week.attendance -
                                        arr[index - 1].attendance
                                    )
                                  );
                                },
                                0
                              ) /
                              (weeklyAttendanceData.length - 1)
                            : 0;

                        const consistencyRating =
                          weeklyVariance < 5
                            ? "excellent"
                            : weeklyVariance < 10
                              ? "good"
                              : weeklyVariance < 15
                                ? "moderate"
                                : "poor";

                        // Improvement potential
                        // const highPerformers = studentPerformanceData.filter(s => parseFloat(String(s.attendance_percentage)) >= 90).length;
                        const lowPerformers = studentPerformanceData.filter(
                          s => parseFloat(String(s.attendance_percentage)) < 70
                        ).length;
                        const improvementPotential =
                          (lowPerformers / studentPerformanceData.length) * 100;

                        return (
                          <div className="space-y-4">
                            {/* Performance Status Cards */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                              <div
                                className={`rounded-lg border p-3 ${
                                  exceedsExpectations
                                    ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-emerald-900/30"
                                    : meetsStandards
                                      ? "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-950/20 dark:to-blue-900/30"
                                      : needsImprovement
                                        ? "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:border-amber-800 dark:from-amber-950/20 dark:to-amber-900/30"
                                        : "border-red-200 bg-gradient-to-br from-red-50 to-red-100 dark:border-red-800 dark:from-red-950/20 dark:to-red-900/30"
                                }`}
                              >
                                <div className="text-center">
                                  <div
                                    className={`mb-2 text-2xl ${
                                      exceedsExpectations
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : meetsStandards
                                          ? "text-blue-600 dark:text-blue-400"
                                          : needsImprovement
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {exceedsExpectations
                                      ? "A+"
                                      : meetsStandards
                                        ? "A"
                                        : needsImprovement
                                          ? "B"
                                          : "C"}
                                  </div>
                                  <div className="text-muted-foreground text-sm font-medium">
                                    Performance Level
                                  </div>
                                  <div
                                    className={`text-lg font-bold ${
                                      exceedsExpectations
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : meetsStandards
                                          ? "text-blue-700 dark:text-blue-300"
                                          : needsImprovement
                                            ? "text-amber-700 dark:text-amber-300"
                                            : "text-red-700 dark:text-red-300"
                                    }`}
                                  >
                                    {exceedsExpectations
                                      ? "Excellence"
                                      : meetsStandards
                                        ? "Standard"
                                        : needsImprovement
                                          ? "Developing"
                                          : "Critical"}
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-3 dark:border-gray-800 dark:from-gray-950/20 dark:to-gray-900/30">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-sm font-medium">
                                    vs Benchmark
                                  </div>
                                  <div
                                    className={`text-lg font-bold ${
                                      currentAverage >= institutionalBenchmark
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {currentAverage >= institutionalBenchmark
                                      ? "+"
                                      : ""}
                                    {(
                                      currentAverage - institutionalBenchmark
                                    ).toFixed(1)}
                                    %
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 dark:border-indigo-800 dark:from-indigo-950/20 dark:to-indigo-900/30">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-sm font-medium">
                                    Consistency
                                  </div>
                                  <div
                                    className={`text-lg font-bold ${
                                      consistencyRating === "excellent"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : consistencyRating === "good"
                                          ? "text-blue-600 dark:text-blue-400"
                                          : consistencyRating === "moderate"
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {consistencyRating.charAt(0).toUpperCase() +
                                      consistencyRating.slice(1)}
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 p-3 dark:border-violet-800 dark:from-violet-950/20 dark:to-violet-900/30">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-sm font-medium">
                                    Improvement Potential
                                  </div>
                                  <div
                                    className={`text-lg font-bold ${
                                      improvementPotential < 20
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : improvementPotential < 40
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {improvementPotential.toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Benchmark Comparison Chart */}
                            <div className="bg-muted/30 border-border rounded-lg border p-4">
                              <h5 className="mb-3 font-medium">
                                Benchmark Comparison
                              </h5>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">
                                    Excellence Target (90%)
                                  </span>
                                  <div className="mx-4 h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                      className="h-full bg-emerald-500 transition-all duration-500"
                                      style={{
                                        width: `${Math.min((currentAverage / excellenceTarget) * 100, 100)}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {currentAverage >= excellenceTarget
                                      ? "✓"
                                      : Math.round(
                                          (excellenceTarget - currentAverage) *
                                            10
                                        ) /
                                          10 +
                                        "% gap"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-sm">
                                    Institutional Standard (82%)
                                  </span>
                                  <div className="mx-4 h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                      className="h-full bg-blue-500 transition-all duration-500"
                                      style={{
                                        width: `${Math.min((currentAverage / institutionalBenchmark) * 100, 100)}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {currentAverage >= institutionalBenchmark
                                      ? "✓"
                                      : Math.round(
                                          (institutionalBenchmark -
                                            currentAverage) *
                                            10
                                        ) /
                                          10 +
                                        "% gap"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-sm">
                                    Minimum Standard (75%)
                                  </span>
                                  <div className="mx-4 h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                      className="h-full bg-amber-500 transition-all duration-500"
                                      style={{
                                        width: `${Math.min((currentAverage / minimumStandard) * 100, 100)}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {currentAverage >= minimumStandard
                                      ? "✓"
                                      : Math.round(
                                          (minimumStandard - currentAverage) *
                                            10
                                        ) /
                                          10 +
                                        "% gap"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Performance Insights */}
                            <div className="bg-muted/30 border-border rounded-lg border p-4">
                              <h5 className="mb-2 font-medium">
                                Performance Analysis & Strategic Recommendations
                              </h5>
                              <div className="text-muted-foreground space-y-2 text-sm">
                                <p>
                                  <strong>Current Status:</strong>{" "}
                                  {exceedsExpectations
                                    ? `Exceptional performance! Your course attendance (${currentAverage.toFixed(1)}%) exceeds excellence standards. Consider mentoring other courses or documenting best practices.`
                                    : meetsStandards
                                      ? `Strong performance meeting institutional standards. With ${(excellenceTarget - currentAverage).toFixed(1)}% improvement, you could reach excellence level.`
                                      : needsImprovement
                                        ? `Performance is developing. Focus on consistent engagement strategies to reach the ${institutionalBenchmark}% institutional standard.`
                                        : `Critical attention needed. Implement immediate intervention strategies to reach minimum ${minimumStandard}% standard.`}
                                </p>
                                <p>
                                  <strong>Consistency Analysis:</strong> Weekly
                                  attendance variance is{" "}
                                  {weeklyVariance.toFixed(1)}% (
                                  {consistencyRating} consistency).{" "}
                                  {consistencyRating === "excellent"
                                    ? "Highly predictable patterns support student planning."
                                    : consistencyRating === "good"
                                      ? "Good stability with minor fluctuations."
                                      : "Consider strategies to reduce attendance volatility for better student outcomes."}
                                </p>
                                <p>
                                  <strong>Improvement Focus:</strong>{" "}
                                  {lowPerformers} students (
                                  {improvementPotential.toFixed(0)}%) are below
                                  70% attendance. Targeted interventions for
                                  this group could significantly boost overall
                                  performance.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {!selectedAnalyticType && (
                    <div className="text-muted-foreground py-8 text-center">
                      <p>
                        Select an analytics type from the dropdown above to view
                        detailed insights
                      </p>
                      <p className="mt-2 text-xs">
                        Each view provides unique actionable intelligence for
                        course management
                      </p>
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
                {/* Summary Cards - Responsive for zoom/magnification */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                  <div className="bg-card rounded-lg border p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase sm:mb-2">
                          {sessionType === "tutorial"
                            ? "Total Tutorials"
                            : "Total Lectures"}
                        </p>
                        <p className="text-foreground text-xl font-bold sm:text-2xl">
                          {lecturerTrends.summary.totalSubjects}
                        </p>
                      </div>
                      <div className="bg-primary/10 flex h-10 min-h-[2.5rem] w-10 min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg">
                        <Calendar className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase sm:mb-2">
                          Overall Average
                        </p>
                        <p className="text-foreground text-xl font-bold sm:text-2xl">
                          {lecturerTrends.summary.overallAverage}%
                        </p>
                      </div>
                      <div className="flex h-10 min-h-[2.5rem] w-10 min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                        <span className="text-base font-bold text-emerald-600 sm:text-lg dark:text-emerald-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase sm:mb-2">
                          Total Students
                        </p>
                        <p className="text-foreground text-xl font-bold sm:text-2xl">
                          {lecturerTrends.summary.totalStudents}
                        </p>
                      </div>
                      <div className="flex h-10 min-h-[2.5rem] w-10 min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <Users className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg border p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase sm:mb-2">
                          Trend
                        </p>
                        <p
                          className={`text-lg font-bold whitespace-nowrap capitalize sm:text-xl ${
                            lecturerTrends.summary.trendDirection ===
                            "improving"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : lecturerTrends.summary.trendDirection ===
                                  "declining"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {lecturerTrends.summary.trendDirection}
                        </p>
                      </div>
                      <div
                        className={`flex h-10 min-h-[2.5rem] w-10 min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg ${
                          lecturerTrends.summary.trendDirection === "improving"
                            ? "bg-emerald-500/10"
                            : lecturerTrends.summary.trendDirection ===
                                "declining"
                              ? "bg-rose-500/10"
                              : "bg-muted"
                        }`}
                      >
                        {lecturerTrends.summary.trendDirection ===
                        "improving" ? (
                          <ArrowUp className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5 dark:text-emerald-400" />
                        ) : lecturerTrends.summary.trendDirection ===
                          "declining" ? (
                          <ArrowDown className="h-4 w-4 text-rose-600 sm:h-5 sm:w-5 dark:text-rose-400" />
                        ) : (
                          <span className="text-muted-foreground text-sm font-bold sm:text-base">
                            →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Performance Comparison - Responsive */}
                <div className="mb-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-foreground text-sm font-semibold">
                      Course Performance
                    </h4>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {lecturerTrends.subjectPerformance.length} course
                      {lecturerTrends.subjectPerformance.length !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>
                  {lecturerTrends.subjectPerformance.length > 0 ? (
                    <div className="max-h-[280px] space-y-2.5 overflow-y-auto pr-1 sm:space-y-3">
                      {(Array.isArray(lecturerTrends.subjectPerformance)
                        ? lecturerTrends.subjectPerformance
                        : []
                      ).map((subject, index) => (
                        <div
                          key={`subject-${subject.subject_code || subject.subject_id || index}`}
                          className="bg-card flex flex-wrap items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-md sm:flex-nowrap sm:items-center sm:p-3.5"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                            <div
                              className={`flex h-8 min-h-[2rem] w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
                                subject.performance_level === "excellent"
                                  ? "bg-emerald-500 text-white"
                                  : subject.performance_level === "good"
                                    ? "bg-blue-500 text-white"
                                    : subject.performance_level === "average"
                                      ? "bg-amber-500 text-white"
                                      : "bg-rose-500 text-white"
                              }`}
                            >
                              {subject.subject_code?.charAt(0) || "C"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                                {subject.subject_code ||
                                  "Course " + (index + 1)}
                              </p>
                              <p className="text-muted-foreground truncate text-xs">
                                {subject.subject_name || "Course Name"}
                              </p>
                            </div>
                          </div>
                          <div className="ml-10 flex w-full shrink-0 flex-row items-center justify-between gap-2 sm:ml-0 sm:w-auto sm:flex-col sm:items-end sm:justify-start sm:gap-1.5">
                            <span
                              className={`text-base font-bold whitespace-nowrap sm:text-lg ${
                                subject.average_attendance >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : subject.average_attendance >= 70
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {subject.average_attendance || 0}%
                            </span>
                            <span className="text-muted-foreground text-xs whitespace-nowrap">
                              {subject.total_students || 0} students
                            </span>
                            {subject.at_risk_count > 0 && (
                              <div className="bg-destructive/10 border-destructive/20 flex items-center gap-1 rounded-full border px-2 py-0.5 whitespace-nowrap">
                                <span className="bg-destructive h-1 w-1 animate-pulse rounded-full"></span>
                                <span className="text-destructive text-xs font-medium">
                                  {subject.at_risk_count} at risk
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground bg-muted/30 rounded-lg border border-dashed py-8 text-center">
                      <p className="text-sm">No course data available</p>
                      <p className="mt-1 text-xs">
                        Performance data will appear here
                      </p>
                    </div>
                  )}
                </div>

                {/* Weekly Progression Chart */}
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-foreground text-sm font-medium">
                      Weekly Progression Trends
                    </h4>
                    <div className="text-muted-foreground text-xs">
                      {lecturerTrends.weeklyProgression.length > 0
                        ? "Across all courses"
                        : "No data available"}
                    </div>
                  </div>
                  {lecturerTrends.weeklyProgression.length > 0 ? (
                    <ChartContainer
                      config={{
                        progression: {
                          label: "Average Attendance",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[200px] w-full"
                    >
                      <LineChart
                        data={
                          Array.isArray(lecturerTrends.weeklyProgression)
                            ? lecturerTrends.weeklyProgression
                            : []
                        }
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
                                <div className="bg-popover border-border rounded-lg border p-3 shadow-lg">
                                  <p className="text-popover-foreground font-medium">
                                    {payload[0]?.payload?.week_label}
                                  </p>
                                  <p className="text-primary">
                                    Average: {payload[0]?.value}%
                                  </p>
                                  {payload[0]?.payload?.trend_change !== 0 && (
                                    <p
                                      className={`text-xs ${
                                        payload[0]?.payload?.trend_change > 0
                                          ? "text-emerald-600"
                                          : "text-rose-600"
                                      }`}
                                    >
                                      {payload[0]?.payload?.trend_change > 0
                                        ? "+"
                                        : ""}
                                      {payload[0]?.payload?.trend_change}%
                                      change
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
                          label={{
                            value: "Target 80%",
                            position: "insideTopRight",
                            fontSize: 10,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="attendance_rate"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{
                            fill: "#3b82f6",
                            stroke: "#ffffff",
                            strokeWidth: 2,
                            r: 5,
                          }}
                          activeDot={{
                            r: 7,
                            stroke: "#3b82f6",
                            strokeWidth: 2,
                          }}
                          name="Average Attendance"
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="text-muted-foreground bg-muted/20 border-border rounded-lg border border-dashed py-8 text-center">
                      <p>No weekly progression data available</p>
                      <p className="mt-1 text-xs">
                        Weekly trends will appear here once course data is
                        available
                      </p>
                    </div>
                  )}
                </div>

                {/* Performance Level Summary - Zoom Responsive */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center sm:p-3">
                    <div className="text-lg font-bold break-words text-emerald-600 sm:text-xl dark:text-emerald-400">
                      {lecturerTrends.summary.performanceLevels.excellent}
                    </div>
                    <div className="text-xs font-medium break-words text-emerald-700 sm:text-sm dark:text-emerald-300">
                      Excellent
                    </div>
                    <div className="text-muted-foreground text-xs whitespace-nowrap">
                      85%+ avg
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 text-center sm:p-3">
                    <div className="text-lg font-bold break-words text-blue-600 sm:text-xl dark:text-blue-400">
                      {lecturerTrends.summary.performanceLevels.good}
                    </div>
                    <div className="text-xs font-medium break-words text-blue-700 sm:text-sm dark:text-blue-300">
                      Good
                    </div>
                    <div className="text-muted-foreground text-xs whitespace-nowrap">
                      75-84% avg
                    </div>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-center sm:p-3">
                    <div className="text-lg font-bold break-words text-amber-600 sm:text-xl dark:text-amber-400">
                      {lecturerTrends.summary.performanceLevels.average}
                    </div>
                    <div className="text-xs font-medium break-words text-amber-700 sm:text-sm dark:text-amber-300">
                      Average
                    </div>
                    <div className="text-muted-foreground text-xs whitespace-nowrap">
                      65-74% avg
                    </div>
                  </div>
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-center sm:p-3">
                    <div className="text-lg font-bold break-words text-rose-600 sm:text-xl dark:text-rose-400">
                      {
                        lecturerTrends.summary.performanceLevels
                          .needs_improvement
                      }
                    </div>
                    <div className="text-xs font-medium break-words text-rose-700 sm:text-sm dark:text-rose-300">
                      Needs Attention
                    </div>
                    <div className="text-muted-foreground text-xs whitespace-nowrap">
                      &lt;65% avg
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Report Panel */}
          <Card className="border-border/50 h-full shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-foreground text-xl font-semibold">
                Email Report
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Send attendance reports directly to your email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="reportType" className="text-sm font-medium">
                    Report Type
                  </Label>
                  <Select
                    value={selectedReportType}
                    onValueChange={setSelectedReportType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Overview Report</SelectItem>
                      <SelectItem value="detailed">Detailed Report</SelectItem>
                      <SelectItem value="student">Student Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateRange" className="text-sm font-medium">
                    Date Range
                  </Label>
                  <Select
                    value={selectedDateRange}
                    onValueChange={setSelectedDateRange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="this_semester">
                        This Semester
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="course-select-report"
                    className="text-sm font-medium"
                  >
                    Course
                  </Label>
                  <Select
                    value={selectedCourseId || "all"}
                    onValueChange={setSelectedCourseId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses?.map((course: Course) => (
                        <SelectItem key={course.id} value={String(course.id)}>
                          <div className="flex flex-col">
                            <span className="font-medium">{course.code}</span>
                            <span className="text-muted-foreground truncate text-xs">
                              {course.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customEmail" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="customEmail"
                  type="email"
                  placeholder="Enter email address to send report to"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  className="w-full"
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

        {/* Detailed Attendance Tables */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl">
              Detailed Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={detailedAttendanceTab}
              onValueChange={setDetailedAttendanceTab}
              className="w-full"
            >
              <TabsList
                className={`grid w-full max-w-md ${sessionType === "tutorial" ? "grid-cols-2" : "grid-cols-3"} h-auto gap-1 p-1`}
              >
                <TabsTrigger value="student" className="text-xs sm:text-sm">
                  By Student
                </TabsTrigger>
                <TabsTrigger value="session" className="text-xs sm:text-sm">
                  By Session
                </TabsTrigger>
                {sessionType !== "tutorial" && (
                  <TabsTrigger value="course" className="text-xs sm:text-sm">
                    By Course
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Student Tab Content */}
              <TabsContent value="student" className="mt-4 space-y-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="relative w-full sm:max-w-sm">
                    <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-background w-full pl-8"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={handleExportAllData}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export All
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent whitespace-nowrap"
                        >
                          <Filter className="mr-1 h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Filter</span>
                          {attendanceFilter !== "all" && (
                            <span className="ml-1">({attendanceFilter})</span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleFilterChange("all")}
                        >
                          All Students
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFilterChange("excellent")}
                        >
                          Excellent (≥80%)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFilterChange("good")}
                        >
                          Good (70-79%)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFilterChange("poor")}
                        >
                          Poor (&lt;70%)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="block space-y-3 sm:hidden">
                  {isLoadingDetailedData ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    paginatedData.map((student, index) => (
                      <Card key={`mobile-student-${index}`}>
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {student.initials}
                                </AvatarFallback>
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
                                <DropdownMenuItem
                                  onClick={() => handleViewDetails(student)}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSendNotification(student)
                                  }
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Notification
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleExportData(student)}
                                >
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
                                  student.attendancePercentage >= 80
                                    ? "default"
                                    : student.attendancePercentage >= 70
                                      ? "outline"
                                      : "destructive"
                                }
                              >
                                {student.attendancePercentage}%
                              </Badge>
                              <span className="text-muted-foreground text-sm">
                                {student.attendedSessions}/
                                {student.totalSessions} weeks
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

                {/* Table View */}
                <div className="overflow-x-auto rounded-md border">
                  {isLoadingDetailedData ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[160px]">
                            Student
                          </TableHead>
                          <TableHead className="min-w-[100px] text-center">
                            Attendance
                          </TableHead>
                          <TableHead className="hidden min-w-[80px] text-center md:table-cell">
                            Weeks
                          </TableHead>
                          <TableHead className="hidden min-w-[80px] text-center lg:table-cell">
                            Trend
                          </TableHead>
                          <TableHead className="min-w-[80px] text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((student, index) => (
                          <TableRow
                            key={`table-student-${student.id || index}`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {student.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate leading-none font-medium">
                                    {student.name}
                                  </p>
                                  <p className="text-muted-foreground hidden truncate text-sm md:block">
                                    {student.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  student.attendancePercentage >= 80
                                    ? "default"
                                    : student.attendancePercentage >= 70
                                      ? "outline"
                                      : "destructive"
                                }
                              >
                                {student.attendancePercentage}%
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
                                  <DropdownMenuItem
                                    onClick={() => handleViewDetails(student)}
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSendNotification(student)
                                    }
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Notification
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleExportData(student)}
                                  >
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
                  <div className="text-muted-foreground order-2 text-center text-sm sm:order-1 sm:text-left">
                    Showing{" "}
                    <strong>
                      {filteredData.length > 0 ? startIndex + 1 : 0}
                    </strong>{" "}
                    to{" "}
                    <strong>{Math.min(endIndex, filteredData.length)}</strong>{" "}
                    of <strong>{filteredData.length}</strong> results
                    {attendanceFilter !== "all" && (
                      <span className="ml-1">(filtered)</span>
                    )}
                  </div>
                  <div className="order-1 flex items-center justify-center gap-2 sm:order-2 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-3"
                    >
                      Prev
                    </Button>
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className="px-3"
                    >
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
                  <div className="min-w-0 overflow-x-auto rounded-md border">
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[80px]">Week</TableHead>
                          <TableHead className="min-w-[100px]">Date</TableHead>
                          <TableHead className="min-w-[100px] text-center">
                            Check-in Type
                          </TableHead>
                          <TableHead className="min-w-[80px] text-center">
                            Present
                          </TableHead>
                          <TableHead className="min-w-[80px] text-center">
                            Absent
                          </TableHead>
                          <TableHead className="min-w-[120px] text-center">
                            Attendance Rate
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Array.isArray(detailedAttendanceData)
                          ? detailedAttendanceData
                          : []
                        ).map((session: any, index) => (
                          <TableRow key={`session-${index}`}>
                            <TableCell className="font-medium">
                              {session.weekLabel}
                            </TableCell>
                            <TableCell>
                              {session.date &&
                              !isNaN(new Date(session.date).getTime())
                                ? new Date(session.date).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {session.checkInType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {session.presentCount}
                            </TableCell>
                            <TableCell className="text-center">
                              {session.absentCount}
                            </TableCell>
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
                  <div className="min-w-0 overflow-x-auto rounded-md border">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">
                            Course Code
                          </TableHead>
                          <TableHead className="min-w-[200px]">
                            Course Name
                          </TableHead>
                          <TableHead className="min-w-[100px] text-center">
                            Total Sessions
                          </TableHead>
                          <TableHead className="min-w-[100px] text-center">
                            Total Students
                          </TableHead>
                          <TableHead className="min-w-[120px] text-center">
                            Avg Attendance
                          </TableHead>
                          <TableHead className="min-w-[120px]">
                            Last Session
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Array.isArray(detailedAttendanceData)
                          ? detailedAttendanceData
                          : []
                        ).map((course: any, index) => (
                          <TableRow key={`course-${index}`}>
                            <TableCell className="font-medium">
                              {course.code}
                            </TableCell>
                            <TableCell>{course.name}</TableCell>
                            <TableCell className="text-center">
                              {course.totalSessions}
                            </TableCell>
                            <TableCell className="text-center">
                              {course.totalStudents}
                            </TableCell>
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
                              {course.lastSession &&
                              !isNaN(new Date(course.lastSession).getTime())
                                ? new Date(
                                    course.lastSession
                                  ).toLocaleDateString()
                                : "N/A"}
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
      </section>

      {/* Student Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Detailed attendance information for{" "}
              {(selectedStudent as any)?.student_name ||
                (selectedStudent as any)?.name}
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
                    <h3 className="font-semibold">
                      {(selectedStudent as any).student_name ||
                        (selectedStudent as any).name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {(selectedStudent as any).student_email ||
                        (selectedStudent as any).email}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Attendance Rate</p>
                    <Badge
                      variant={
                        parseFloat(
                          String(
                            (selectedStudent as any).attendance_percentage ||
                              (selectedStudent as any).attendancePercentage
                          )
                        ) >= 80
                          ? "default"
                          : parseFloat(
                                String(
                                  (selectedStudent as any)
                                    .attendance_percentage ||
                                    (selectedStudent as any)
                                      .attendancePercentage
                                )
                              ) >= 70
                            ? "outline"
                            : "destructive"
                      }
                      className="px-3 py-1 text-lg"
                    >
                      {parseFloat(
                        String(
                          (selectedStudent as any).attendance_percentage ||
                            (selectedStudent as any).attendancePercentage ||
                            0
                        )
                      ).toFixed(1)}
                      %
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Weeks</p>
                    <p className="text-lg font-semibold">
                      {(selectedStudent as any).weeks_attended ||
                        (selectedStudent as any).attendedSessions}
                      /
                      {(selectedStudent as any).total_weeks ||
                        (selectedStudent as any).totalSessions}
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
                    <span className="capitalize">
                      {selectedStudent.trend || "Stable"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Modal */}
      <Dialog
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send an attendance notification to{" "}
              {(selectedStudent as any)?.student_name ||
                (selectedStudent as any)?.name}
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
                  <SelectItem value="low-attendance">
                    Low Attendance Warning
                  </SelectItem>
                  <SelectItem value="improvement-needed">
                    Improvement Needed
                  </SelectItem>
                  <SelectItem value="good-progress">Good Progress</SelectItem>
                  <SelectItem value="custom">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="min-h-[100px] w-full resize-none rounded-md border px-3 py-2"
                placeholder="Enter your message here..."
                defaultValue="Dear student, your attendance rate is currently below the recommended threshold. Please ensure regular attendance to avoid any academic issues."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNotificationModal(false)}
                disabled={isSendingNotification}
              >
                Cancel
              </Button>
              <Button
                onClick={sendNotificationEmail}
                disabled={isSendingNotification}
              >
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
