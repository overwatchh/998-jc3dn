"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Award,
  Activity
} from "lucide-react";
import { useEffect, useState } from "react";

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
    status: 'good' | 'warning' | 'at_risk';
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
    trend_direction: 'improving' | 'declining' | 'stable';
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
    status: 'good' | 'warning' | 'at_risk';
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
    trend_direction: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
}

interface AttendanceGoals {
  overall_goal: {
    target_percentage: number;
    current_percentage: number;
    progress: number;
    status: 'on_track' | 'behind' | 'ahead';
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
    status: 'achieved' | 'on_track' | 'at_risk' | 'impossible';
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
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[] | null>(null);
  const [attendanceGoals, setAttendanceGoals] = useState<AttendanceGoals | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState<'lecture' | 'tutorial'>('lecture');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [summaryRes, weeklyRes, performanceRes, goalsRes, activityRes] = await Promise.all([
          fetch(`/api/student/analytics/attendance-summary?sessionType=${sessionType}`),
          fetch(`/api/student/analytics/weekly-progress?sessionType=${sessionType}`),
          fetch(`/api/student/analytics/subject-performance?sessionType=${sessionType}`),
          fetch(`/api/student/analytics/attendance-goals?sessionType=${sessionType}`),
          fetch(`/api/student/analytics/recent-activity?sessionType=${sessionType}`)
        ]);

        const [summaryData, weeklyData, performanceData, goalsData, activityData] = await Promise.all([
          summaryRes.json(),
          weeklyRes.json(),
          performanceRes.json(),
          goalsRes.json(),
          activityRes.json()
        ]);

        if (summaryRes.ok && summaryData.data) {
          setAttendanceSummary(summaryData.data);
        }

        if (weeklyRes.ok && weeklyData.data) {
          setWeeklyProgress(weeklyData.data);
        }

        if (performanceRes.ok && performanceData.data) {
          setSubjectPerformance(performanceData.data);
        }

        if (goalsRes.ok && goalsData.data) {
          setAttendanceGoals(goalsData.data);
        }

        if (activityRes.ok && activityData.data) {
          setRecentActivity(activityData.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sessionType]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
      case 'achieved':
      case 'on_track':
        return <Badge className="bg-green-100 text-green-800">Good</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'at_risk':
        return <Badge className="bg-red-100 text-red-800">At Risk</Badge>;
      case 'impossible':
        return <Badge className="bg-gray-100 text-gray-800">Cannot Achieve</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show message if no data is available
  if (!attendanceSummary && !weeklyProgress && !subjectPerformance && !attendanceGoals && !recentActivity) {
    return (
      <div className="p-6 space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No analytics data available. This could be because:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>You haven&apos;t enrolled in any subjects yet</li>
              <li>No attendance records exist for your enrolled subjects</li>
              <li>The data is still being processed</li>
            </ul>
            Please try refreshing the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Session Type Filter */}
      <Tabs value={sessionType} onValueChange={(value) => setSessionType(value as 'lecture' | 'tutorial')} className="w-full">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Attendance</p>
                <p className="text-2xl font-bold">
                  {attendanceSummary?.overall_stats.attendance_percentage.toFixed(1)}%
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
                <p className="text-sm font-medium text-muted-foreground">Sessions Attended</p>
                <p className="text-2xl font-bold">
                  {attendanceSummary?.overall_stats.attended_sessions} / {attendanceSummary?.overall_stats.total_sessions}
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
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {recentActivity?.activity_summary.total_checkins_this_week || 0}
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
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
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
          {attendanceSummary?.subject_breakdown.some(s => s.status === 'at_risk') && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have subjects with attendance below the required threshold. Check the Subjects tab for details.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Attendance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Attendance Overview</CardTitle>
                <CardDescription>Your attendance percentage by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceSummary?.subject_breakdown.map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{subject.subject_code}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {subject.attendance_percentage.toFixed(1)}%
                          </span>
                          {getStatusBadge(subject.status)}
                        </div>
                      </div>
                      <Progress
                        value={subject.attendance_percentage}
                        className={`h-2 ${
                          subject.status === 'at_risk'
                            ? '[&>div]:bg-red-500'
                            : subject.status === 'warning'
                            ? '[&>div]:bg-yellow-500'
                            : '[&>div]:bg-green-500'
                        }`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{subject.sessions_attended} attended</span>
                        <span>Required: {subject.required_threshold}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
                <CardDescription>Your attendance pattern over recent weeks</CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyProgress?.weekly_stats?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyProgress.weekly_stats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week_number" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                      <Line
                        type="monotone"
                        dataKey="attendance_rate"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-500 mb-2">No weekly data available</p>
                      <p className="text-sm text-gray-400">Weekly attendance trends will appear here once you have more attendance records</p>
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
            {subjectPerformance?.map((subject) => (
              <Card key={subject.subject_id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Overall Attendance</p>
                      <p className="text-2xl font-bold">
                        {subject.overall_attendance.percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {subject.overall_attendance.sessions_attended} / {subject.overall_attendance.total_sessions} sessions
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
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="capitalize">{session.session_type}:</span>
                            <span>{session.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {subject.recommendations.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">Recommendations:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                    <Bar dataKey="attendance_rate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Key insights about your attendance patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Best Week</p>
                    <p className="text-lg font-bold text-green-800">
                      Week {weeklyProgress?.trends.best_week.week_number}
                    </p>
                    <p className="text-sm text-green-700">
                      {weeklyProgress?.trends.best_week.attendance_rate}% attendance
                    </p>
                  </div>

                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-900">Needs Improvement</p>
                    <p className="text-lg font-bold text-red-800">
                      Week {weeklyProgress?.trends.worst_week.week_number}
                    </p>
                    <p className="text-sm text-red-700">
                      {weeklyProgress?.trends.worst_week.attendance_rate}% attendance
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Overall Trend:</span>
                  {getTrendIcon(weeklyProgress?.trends.trend_direction || 'stable')}
                  <span className="text-sm capitalize">
                    {weeklyProgress?.trends.trend_direction}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium">Average Weekly Attendance: </span>
                  <span className="text-lg font-bold">
                    {weeklyProgress?.trends.average_weekly_attendance.toFixed(1)}%
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
              <CardDescription>Your progress toward attendance requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Overall Target: {attendanceGoals?.overall_goal.target_percentage}%</span>
                  {getStatusBadge(attendanceGoals?.overall_goal.status || '')}
                </div>
                <Progress
                  value={attendanceGoals?.overall_goal.progress || 0}
                  className="h-3"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Current: {attendanceGoals?.overall_goal.current_percentage}%</span>
                  <span>Progress: {attendanceGoals?.overall_goal.progress.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {attendanceGoals?.subject_goals.map((goal) => (
              <Card key={goal.subject_id}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="font-medium">{goal.subject_code}</p>
                      <p className="text-sm text-muted-foreground">{goal.subject_name}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold">{goal.current_percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.sessions_attended} / {goal.total_sessions}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-medium">Need {goal.sessions_needed} more</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.remaining_sessions} sessions left
                      </p>
                    </div>

                    <div className="text-center">
                      {getStatusBadge(goal.status)}
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    {goal.recommendation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>Your latest attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity?.recent_checkins.slice(0, 5).map((checkin, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{checkin.subject_code}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {checkin.session_type} • Week {checkin.week_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {checkin.location.building_number}-{checkin.location.room_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(checkin.checkin_time).toLocaleDateString()}
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
                  {recentActivity?.upcoming_sessions.slice(0, 5).map((session, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{session.subject_code}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {session.session_type} • {session.day_of_week}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.days_until === 0 ? 'Today' : `${session.days_until} days`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {recentActivity?.missed_sessions && recentActivity.missed_sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Missed Sessions</CardTitle>
                <CardDescription>Sessions you didn&apos;t attend recently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.missed_sessions.slice(0, 3).map((missed, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border border-red-200 rounded bg-red-50">
                      <div>
                        <p className="font-medium text-red-900">{missed.subject_code}</p>
                        <p className="text-sm text-red-700 capitalize">
                          {missed.session_type} • {missed.day_of_week} • Week {missed.week_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-800">
                          {missed.start_time.slice(0, 5)} - {missed.end_time.slice(0, 5)}
                        </p>
                        <p className="text-xs text-red-600">
                          {missed.location.building_number}-{missed.location.room_number}
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