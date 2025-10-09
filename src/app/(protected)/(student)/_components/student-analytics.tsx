"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Award,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Types
interface AttendanceSummary {
  overall_stats: {
    total_sessions: number;
    attended_sessions: number;
    attendance_percentage: number;
    total_subjects: number;
  };
  subject_breakdown: Array<{
    subject_name: string;
    subject_code: string;
    attendance_percentage: number;
    sessions_attended: number;
    total_sessions: number;
    required_threshold: number;
    status: "good" | "warning" | "at_risk";
  }>;
}

interface WeeklyProgress {
  weekly_stats: Array<{
    week_number: number;
    week_start_date: string;
    total_sessions: number;
    attended_sessions: number;
    attendance_rate: number;
  }>;
  trends: {
    average_weekly_attendance: number;
    trend_direction: "improving" | "declining" | "stable";
    best_week: { week_number: number; attendance_rate: number };
    worst_week: { week_number: number; attendance_rate: number };
  };
}

interface SubjectPerformance {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  overall_attendance: {
    percentage: number;
    sessions_attended: number;
    total_sessions: number;
    required_threshold: number;
    status: "good" | "warning" | "at_risk";
  };
  session_breakdown: Array<{
    session_type: string;
    attended: number;
    total: number;
    percentage: number;
  }>;
  recent_trend: {
    last_5_sessions: Array<{
      week_number: number;
      attended: boolean;
      session_type: string;
    }>;
    trend_direction: "improving" | "declining" | "stable";
  };
  recommendations: string[];
}

interface AttendanceGoals {
  overall_goal: {
    target_percentage: number;
    current_percentage: number;
    progress: number;
    status: "on_track" | "behind" | "ahead";
  };
  subject_goals: Array<{
    subject_id: number;
    subject_name: string;
    subject_code: string;
    required_percentage: number;
    current_percentage: number;
    sessions_attended: number;
    total_sessions: number;
    remaining_sessions: number;
    sessions_needed: number;
    can_achieve_goal: boolean;
    projection: {
      if_perfect_attendance: number;
      minimum_sessions_needed: number;
    };
    status: "achieved" | "on_track" | "at_risk" | "impossible";
    recommendation: string;
  }>;
}

interface RecentActivity {
  recent_checkins: Array<{
    subject_name: string;
    subject_code: string;
    session_type: string;
    checkin_time: string;
    week_number: number;
    location: {
      building_number: string;
      room_number: string;
      campus_name: string;
    };
  }>;
  missed_sessions: Array<{
    subject_name: string;
    subject_code: string;
    session_type: string;
    week_number: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location: {
      building_number: string;
      room_number: string;
      campus_name: string;
    };
  }>;
  upcoming_sessions: Array<{
    subject_name: string;
    subject_code: string;
    session_type: string;
    week_number: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location: {
      building_number: string;
      room_number: string;
      campus_name: string;
    };
    days_until: number;
  }>;
  activity_summary: {
    total_checkins_this_week: number;
    total_missed_this_week: number;
    current_streak: number;
    longest_streak: number;
  };
}

export function StudentAnalytics() {
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummary | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(
    null
  );
  const [subjectPerformance, setSubjectPerformance] = useState<
    SubjectPerformance[] | null
  >(null);
  const [attendanceGoals, setAttendanceGoals] =
    useState<AttendanceGoals | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionType, setSessionType] = useState<"lecture" | "tutorial">(
    "lecture"
  );
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAnalytics = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const [summaryRes, weeklyRes, performanceRes, goalsRes, activityRes] =
        await Promise.all([
          fetch(
            `/api/student/analytics/attendance-summary?sessionType=${sessionType}`
          ),
          fetch(
            `/api/student/analytics/weekly-progress?sessionType=${sessionType}`
          ),
          fetch(
            `/api/student/analytics/subject-performance?sessionType=${sessionType}`
          ),
          fetch(
            `/api/student/analytics/attendance-goals?sessionType=${sessionType}`
          ),
          fetch(
            `/api/student/analytics/recent-activity?sessionType=${sessionType}`
          ),
        ]);

      // Parse responses with error handling
      const parseResponse = async (response: Response) => {
        const text = await response.text();
        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('JSON parse error:', e, 'Response:', text);
          return null;
        }
      };

      const [
        summaryData,
        weeklyData,
        performanceData,
        goalsData,
        activityData,
      ] = await Promise.all([
        parseResponse(summaryRes),
        parseResponse(weeklyRes),
        parseResponse(performanceRes),
        parseResponse(goalsRes),
        parseResponse(activityRes),
      ]);

      if (summaryRes.ok && summaryData?.data) {
        setAttendanceSummary(summaryData.data);
      }

      if (weeklyRes.ok && weeklyData?.data) {
        setWeeklyProgress(weeklyData.data);
      }

      if (performanceRes.ok && performanceData?.data) {
        setSubjectPerformance(performanceData.data);
      }

      if (goalsRes.ok && goalsData?.data) {
        setAttendanceGoals(goalsData.data);
      }

      if (activityRes.ok && activityData?.data) {
        setRecentActivity(activityData.data);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount and when session type changes
  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionType]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "good":
      case "achieved":
      case "on_track":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Good
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            Warning
          </Badge>
        );
      case "at_risk":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            At Risk
          </Badge>
        );
      case "impossible":
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            Cannot Achieve
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-8 w-1/2 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show message if no data is available
  if (
    !attendanceSummary &&
    !weeklyProgress &&
    !subjectPerformance &&
    !attendanceGoals &&
    !recentActivity
  ) {
    return (
      <div className="space-y-6 p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No analytics data available. This could be because:
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>You haven&apos;t enrolled in any subjects yet</li>
              <li>No attendance records exist for your enrolled subjects</li>
              <li>The data is still being processed</li>
            </ul>
            Please try refreshing the page or contact support if the issue
            persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Session Type Filter */}
      <Tabs
        value={sessionType}
        onValueChange={value => setSessionType(value as "lecture" | "tutorial")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lecture" className="text-sm">
            📚 Lectures
          </TabsTrigger>
          <TabsTrigger value="tutorial" className="text-sm">
            🎯 Tutorials
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Header with Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Overall Attendance
                </p>
                <p className="text-2xl font-bold">
                  {attendanceSummary?.overall_stats.attendance_percentage.toFixed(
                    1
                  )}
                  %
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Sessions Attended
                </p>
                <p className="text-2xl font-bold">
                  {attendanceSummary?.overall_stats.attended_sessions} /{" "}
                  {attendanceSummary?.overall_stats.total_sessions}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Attended This Week
                </p>
                <p className="text-2xl font-bold">
                  {recentActivity?.activity_summary.total_checkins_this_week ||
                    0}
                </p>
                <p className="text-xs text-muted-foreground">
                  sessions
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Current Streak
                </p>
                <p className="text-2xl font-bold">
                  {recentActivity?.activity_summary.current_streak || 0}
                </p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* At-Risk Subjects Alert */}
          {attendanceSummary?.subject_breakdown.some(
            s => s.status === "at_risk"
          ) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have subjects with attendance below the required threshold.
                Check the Subjects tab for details.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Subject Attendance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Attendance Overview</CardTitle>
                <CardDescription>
                  Your attendance percentage by subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceSummary?.subject_breakdown.map(
                    (subject, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {subject.subject_code}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground text-sm">
                              {subject.attendance_percentage.toFixed(1)}%
                            </span>
                            {getStatusBadge(subject.status)}
                          </div>
                        </div>
                        <Progress
                          value={subject.attendance_percentage}
                          className={`h-2 ${
                            subject.status === "at_risk"
                              ? "[&>div]:bg-red-500"
                              : subject.status === "warning"
                                ? "[&>div]:bg-yellow-500"
                                : "[&>div]:bg-green-500"
                          }`}
                        />
                        <div className="text-muted-foreground flex justify-between text-xs">
                          <span>{subject.sessions_attended} attended</span>
                          <span>Required: {subject.required_threshold}%</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
                <CardDescription>
                  Your attendance pattern over recent weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyProgress?.weekly_stats?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyProgress.weekly_stats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week_number" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={value => [`${value}%`, "Attendance"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="attendance_rate"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: "#8884d8" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="text-center">
                      <p className="mb-2 text-gray-500 dark:text-gray-400">
                        No weekly data available
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Weekly attendance trends will appear here once you have
                        more attendance records
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          <div className="grid gap-6">
            {subjectPerformance?.map(subject => (
              <Card key={subject.subject_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{subject.subject_name}</CardTitle>
                      <CardDescription>{subject.subject_code}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(subject.overall_attendance.status)}
                      {getTrendIcon(subject.recent_trend.trend_direction)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium">Overall Attendance</p>
                      <p className="text-2xl font-bold">
                        {subject.overall_attendance.percentage}%
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {subject.overall_attendance.sessions_attended} /{" "}
                        {subject.overall_attendance.total_sessions} sessions
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Required</p>
                      <p className="text-2xl font-bold">
                        {subject.overall_attendance.required_threshold}%
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Session Breakdown</p>
                      <div className="space-y-1">
                        {subject.session_breakdown.map((session, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="capitalize">
                              {session.session_type}:
                            </span>
                            <span>{session.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {subject.recommendations.length > 0 && (
                    <div className="rounded-lg bg-blue-50 p-3 dark:border dark:border-blue-800/40 dark:bg-blue-950/40">
                      <p className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-300">
                        Recommendations:
                      </p>
                      <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                        {subject.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Pattern</CardTitle>
                <CardDescription>Your attendance rate by week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyProgress?.weekly_stats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week_number" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={value => [`${value}%`, "Attendance Rate"]}
                    />
                    <Bar dataKey="attendance_rate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>
                  Key insights about your attendance patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-3 dark:border dark:border-green-800/40 dark:bg-green-950/40">
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">
                      Best Week
                    </p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-400">
                      Week {weeklyProgress?.trends.best_week.week_number}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {weeklyProgress?.trends.best_week.attendance_rate}%
                      attendance
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-50 p-3 dark:border dark:border-red-800/40 dark:bg-red-950/40">
                    <p className="text-sm font-medium text-red-900 dark:text-red-300">
                      Needs Improvement
                    </p>
                    <p className="text-lg font-bold text-red-800 dark:text-red-400">
                      Week {weeklyProgress?.trends.worst_week.week_number}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {weeklyProgress?.trends.worst_week.attendance_rate}%
                      attendance
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Overall Trend:</span>
                  {getTrendIcon(
                    weeklyProgress?.trends.trend_direction || "stable"
                  )}
                  <span className="text-sm capitalize">
                    {weeklyProgress?.trends.trend_direction}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium">
                    Average Weekly Attendance:{" "}
                  </span>
                  <span className="text-lg font-bold">
                    {weeklyProgress?.trends.average_weekly_attendance.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Goal Progress</CardTitle>
              <CardDescription>
                Your progress toward attendance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">
                    Overall Target:{" "}
                    {attendanceGoals?.overall_goal.target_percentage}%
                  </span>
                  {getStatusBadge(attendanceGoals?.overall_goal.status || "")}
                </div>
                <Progress
                  value={attendanceGoals?.overall_goal.progress || 0}
                  className="h-3"
                />
                <div className="text-muted-foreground flex justify-between text-sm">
                  <span>
                    Current: {attendanceGoals?.overall_goal.current_percentage}%
                  </span>
                  <span>
                    Progress:{" "}
                    {attendanceGoals?.overall_goal.progress.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {attendanceGoals?.subject_goals.map(goal => (
              <Card key={goal.subject_id}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-4">
                    <div>
                      <p className="font-medium">{goal.subject_code}</p>
                      <p className="text-muted-foreground text-sm">
                        {goal.subject_name}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {goal.current_percentage}%
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {goal.sessions_attended} / {goal.total_sessions}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-medium">
                        Need {goal.sessions_needed} more
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {goal.remaining_sessions} sessions left
                      </p>
                    </div>

                    <div className="text-center">
                      {getStatusBadge(goal.status)}
                    </div>
                  </div>

                  <div className="mt-3 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800/60">
                    {goal.recommendation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>
                  Your latest attendance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity?.recent_checkins
                    .slice(0, 5)
                    .map((checkin, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border p-2 dark:border-gray-700"
                      >
                        <div>
                          <p className="font-medium">{checkin.subject_code}</p>
                          <p className="text-muted-foreground text-sm capitalize">
                            {checkin.session_type} • Week {checkin.week_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {checkin.location.building_number}-
                            {checkin.location.room_number}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(
                              checkin.checkin_time
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Sessions you should attend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity?.upcoming_sessions
                    .slice(0, 5)
                    .map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border p-2 dark:border-gray-700"
                      >
                        <div>
                          <p className="font-medium">{session.subject_code}</p>
                          <p className="text-muted-foreground text-sm capitalize">
                            {session.session_type} • {session.day_of_week}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {session.start_time.slice(0, 5)} -{" "}
                            {session.end_time.slice(0, 5)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {session.days_until === 0
                              ? "Today"
                              : `${session.days_until} days`}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {recentActivity?.missed_sessions &&
            recentActivity.missed_sessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Missed Sessions</CardTitle>
                  <CardDescription>
                    Sessions you didn&apos;t attend recently
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 dark:[&_div.border]:border-gray-700">
                    {recentActivity.missed_sessions
                      .slice(0, 3)
                      .map((missed, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-2 dark:border-red-400/40 dark:bg-red-950/40"
                        >
                          <div>
                            <p className="font-medium text-red-900">
                              {missed.subject_code}
                            </p>
                            <p className="text-sm text-red-700 capitalize">
                              {missed.session_type} • {missed.day_of_week} •
                              Week {missed.week_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-red-800">
                              {missed.start_time.slice(0, 5)} -{" "}
                              {missed.end_time.slice(0, 5)}
                            </p>
                            <p className="text-xs text-red-600">
                              {missed.location.building_number}-
                              {missed.location.room_number}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
