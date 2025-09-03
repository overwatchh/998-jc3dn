"use client";

import { useGetCourses } from "@/app/(protected)/(lecturer)/qr-generation/queries";
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
  ChartTooltipContent,
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
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

export default function ReportsAnalytics() {
  const [date, setDate] = useState<DateRange>({
    from: new Date(2025, 2, 1), // Mar 1, 2025
    to: new Date(2025, 3, 24), // Apr 24, 2025
  });
  const { data: courses, isLoading: isCoursesLoading } = useGetCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  useEffect(() => {
    if (!selectedCourseId && courses && courses.length > 0) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

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
                  {(courses ?? []).map(c => (
                    <SelectItem key={c.id + c.code} value={String(c.id)}>
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
            <Button className="w-full sm:w-auto">Generate Report</Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Visualization Dashboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Attendance Overview Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              Attendance Overview
            </CardTitle>
            <CardDescription className="text-sm">
              Attendance percentages across sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={{
                attendance: {
                  label: "Attendance",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[250px] w-full sm:h-[300px]"
            >
              <BarChart
                data={attendanceData}
                margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={12} tickMargin={8} />
                <YAxis
                  tickFormatter={value => `${value}%`}
                  fontSize={12}
                  width={40}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="3 3" />
                <Bar
                  dataKey="attendance"
                  radius={[4, 4, 0, 0]}
                  fill="var(--color-attendance)"
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Attendance Trend Line */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              Attendance Trend
            </CardTitle>
            <CardDescription className="text-sm">
              Attendance trends over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={{
                current: {
                  label: "Current Period",
                  color: "hsl(var(--chart-1))",
                },
                previous: {
                  label: "Previous Period",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[250px] w-full sm:h-[300px]"
            >
              <LineChart
                data={trendData}
                margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" fontSize={12} tickMargin={8} />
                <YAxis
                  tickFormatter={value => `${value}%`}
                  fontSize={12}
                  width={40}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="var(--color-current)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-current)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  stroke="var(--color-previous)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "var(--color-previous)" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Student Engagement Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              Student Engagement Distribution
            </CardTitle>
            <CardDescription className="text-sm">
              Distribution by attendance category
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={{
                excellent: {
                  label: "Excellent (90-100%)",
                  color: "#22c55e",
                },
                good: {
                  label: "Good (80-89%)",
                  color: "#84cc16",
                },
                average: {
                  label: "Average (70-79%)",
                  color: "#f59e0b",
                },
                belowAverage: {
                  label: "Below Average (60-69%)",
                  color: "#f97316",
                },
                poor: {
                  label: "Poor (Below 60%)",
                  color: "#ef4444",
                },
              }}
              className="h-[250px] w-full sm:h-[300px]"
            >
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => {
                    const shortName = name.split(" ")[0]; // Get first word only on mobile
                    return `${shortName} ${(percent * 100).toFixed(0)}%`;
                  }}
                  labelLine={false}
                  fontSize={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Key Metrics</CardTitle>
            <CardDescription className="text-sm">
              Summary of attendance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-muted-foreground text-sm">
                  Average Attendance
                </p>
                <p className="text-2xl font-bold">78%</p>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-muted-foreground text-sm">Most Attended</p>
                <p className="text-2xl font-bold">Apr 10</p>
                <p className="text-muted-foreground text-xs">92% attendance</p>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-muted-foreground text-sm">Least Attended</p>
                <p className="text-2xl font-bold">Mar 15</p>
                <p className="text-muted-foreground text-xs">64% attendance</p>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-muted-foreground text-sm">Below Threshold</p>
                <p className="text-2xl font-bold text-red-500">12</p>
                <p className="text-muted-foreground text-xs">
                  students at risk
                </p>
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
            {studentData.map(student => (
              <Card key={student.id}>
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
                {studentData.map(student => (
                  <TableRow key={student.id}>
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

// Sample data for charts
const attendanceData = [
  { date: "Mar 1", attendance: 82, color: "#22c55e" },
  { date: "Mar 8", attendance: 75, color: "#f59e0b" },
  { date: "Mar 15", attendance: 64, color: "#ef4444" },
  { date: "Mar 22", attendance: 78, color: "#f59e0b" },
  { date: "Mar 29", attendance: 85, color: "#22c55e" },
  { date: "Apr 5", attendance: 80, color: "#22c55e" },
  { date: "Apr 10", attendance: 92, color: "#22c55e" },
  { date: "Apr 17", attendance: 76, color: "#f59e0b" },
  { date: "Apr 24", attendance: 88, color: "#22c55e" },
];

const trendData = [
  { week: "Week 1", current: 82, previous: 78 },
  { week: "Week 2", current: 75, previous: 80 },
  { week: "Week 3", current: 64, previous: 72 },
  { week: "Week 4", current: 78, previous: 76 },
  { week: "Week 5", current: 85, previous: 70 },
  { week: "Week 6", current: 80, previous: 74 },
  { week: "Week 7", current: 92, previous: 82 },
  { week: "Week 8", current: 76, previous: 78 },
];

const distributionData = [
  { name: "Excellent", value: 15, fill: "#22c55e" },
  { name: "Good", value: 20, fill: "#84cc16" },
  { name: "Average", value: 25, fill: "#f59e0b" },
  { name: "Below Average", value: 18, fill: "#f97316" },
  { name: "Poor", value: 12, fill: "#ef4444" },
];

// Sample data for student table
const studentData = [
  {
    id: "S001",
    name: "Justin",
    email: "justin.j@uow.edu.au",
    initials: "JJ",
    attendance: 92,
    attended: 11,
    total: 12,
    trend: "up",
  },
  {
    id: "S002",
    name: "Deepak",
    email: "deepak.d@uow.edu.au",
    initials: "DD",
    attendance: 83,
    attended: 10,
    total: 12,
    trend: "none",
  },
  {
    id: "S003",
    name: "Thu Nguyen",
    email: "thu.n@uow.edu.au",
    initials: "TN",
    attendance: 75,
    attended: 9,
    total: 12,
    trend: "down",
  },
  {
    id: "S004",
    name: "Tuan Nguyen",
    email: "tuan.n@uow.edu.au",
    initials: "TN",
    attendance: 58,
    attended: 7,
    total: 12,
    trend: "down",
  },
  {
    id: "S005",
    name: "Chang",
    email: "chang.c@uow.edu.au",
    initials: "CC",
    attendance: 67,
    attended: 8,
    total: 12,
    trend: "up",
  },
  {
    id: "S006",
    name: "Sophia Chen",
    email: "sophia.c@university.edu",
    initials: "SC",
    attendance: 100,
    attended: 12,
    total: 12,
    trend: "none",
  },
  {
    id: "S007",
    name: "David Rodriguez",
    email: "david.r@university.edu",
    initials: "DR",
    attendance: 92,
    attended: 11,
    total: 12,
    trend: "up",
  },
  {
    id: "S008",
    name: "Olivia Martinez",
    email: "olivia.m@university.edu",
    initials: "OM",
    attendance: 50,
    attended: 6,
    total: 12,
    trend: "down",
  },
  {
    id: "S009",
    name: "William Taylor",
    email: "william.t@university.edu",
    initials: "WT",
    attendance: 83,
    attended: 10,
    total: 12,
    trend: "none",
  },
  {
    id: "S010",
    name: "Ava Anderson",
    email: "ava.a@university.edu",
    initials: "AA",
    attendance: 75,
    attended: 9,
    total: 12,
    trend: "up",
  },
];
