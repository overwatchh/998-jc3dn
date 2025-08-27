"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DownloadIcon,
  FilterIcon,
  ListIcon,
  MapIcon,
  MoreVerticalIcon,
  RefreshCwIcon as RefreshIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useGetCheckedInStudents,
  useGetCourses,
  useGetStudentList,
} from "@/app/(protected)/(lecturer)/qr-generation/queries";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

// Mock AttendanceMap component
function AttendanceMap() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="bg-muted flex h-[400px] items-center justify-center rounded-lg">
          <div className="text-center">
            <MapIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              Map view would be displayed here
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AttendanceTrackingScreen() {
  const [view, setView] = useState<"list" | "map">("list");
  const { data: courses } = useGetCourses();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  useEffect(() => {
    if (!selectedSessionId && courses && courses.length > 0) {
      setSelectedSessionId(courses[0].id);
    }
  }, [courses, selectedSessionId]);

  const { data: checkedIn } = useGetCheckedInStudents(selectedSessionId ?? 0, {
    enabled: Boolean(selectedSessionId),
    refetchInterval: 5000,
  });
  const { data: studentList } = useGetStudentList(selectedSessionId ?? 0, {
    enabled: Boolean(selectedSessionId),
  });

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <main className="flex-1 space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-8">
          {/* Header - Stack on mobile */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Real-time Attendance Tracking
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent sm:flex-none"
              >
                <RefreshIcon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent sm:flex-none"
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                  <DropdownMenuItem>Print</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <SessionInfoCard />

          {/* Cards Grid - Single column on mobile */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PresentStudentsCard />
            <AbsentStudentsCard />
            <CheckinTimelineCard />
          </div>

          {/* Search and View Controls - Stack on mobile */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Input
                placeholder="Search students..."
                className="h-9 w-full sm:w-[250px] md:w-[300px]"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent sm:w-auto"
                  >
                    <FilterIcon className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>All Students</DropdownMenuItem>
                  <DropdownMenuItem>Present Only</DropdownMenuItem>
                  <DropdownMenuItem>Absent Only</DropdownMenuItem>
                  <DropdownMenuItem>Valid Location</DropdownMenuItem>
                  <DropdownMenuItem>Invalid Location</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* View Toggle - Full width on mobile */}
            <Tabs defaultValue="list" className="w-full sm:w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="list"
                  onClick={() => setView("list")}
                  className="text-xs sm:text-sm"
                >
                  <ListIcon className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  List
                </TabsTrigger>
                <TabsTrigger
                  value="map"
                  onClick={() => setView("map")}
                  className="text-xs sm:text-sm"
                >
                  <MapIcon className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {view === "list" ? (
            <AttendanceTable
              checkedIn={checkedIn ?? []}
              totalEnrolled={studentList?.length ?? 0}
            />
          ) : (
            <AttendanceMap />
          )}
        </main>
      </div>
    </div>
  );
}

function SessionInfoCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg sm:text-xl">
          Introduction to Computer Science - CSIT883
        </CardTitle>
        <CardDescription>Monday, April 24, 2025 - 10:00 AM</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground text-sm">
              Room Location:
            </span>
            <span className="font-medium">Engineering Building, Room 302</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground text-sm">
              QR Code Status:
            </span>
            <div className="flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
              <span className="font-medium text-green-600">
                Active - Check-in QR
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Generate New QR</Button>
      </CardFooter>
    </Card>
  );
}

function PresentStudentsCard() {
  const data = [
    { name: "Week 1", value: 10 },
    { name: "Week 2", value: 50 },
    { name: "Week 3", value: 48 },
    { name: "Week 4", value: 100 },
  ];

  const chartConfig = {
    value: {
      label: "Attendance %",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Present Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">24/45 (53%)</div>
        <div className="mt-1 flex items-center text-sm text-green-600">
          <span className="font-medium">+5%</span>
          <span className="ml-1">compared to average</span>
        </div>
        <div className="mt-4 h-[60px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={data}>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                fontSize={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={2} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AbsentStudentsCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Absent Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">21/45 (47%)</div>
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-medium">Frequently Absent:</h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center justify-between">
              <span>John Smith</span>
              <span className="text-muted-foreground">4 sessions</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Emily Johnson</span>
              <span className="text-muted-foreground">3 sessions</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Michael Brown</span>
              <span className="text-muted-foreground">3 sessions</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckinTimelineCard() {
  const data = [
    { time: "9:50", value: 2 },
    { time: "9:55", value: 8 },
    { time: "10:00", value: 12 },
    { time: "10:05", value: 5 },
    { time: "10:10", value: 3 },
    { time: "10:15", value: 1 },
  ];

  const chartConfig = {
    value: {
      label: "Students",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="sm:col-span-2 lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Check-in Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[120px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart accessibilityLayer data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{ fill: "var(--color-value)" }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

type AttendanceTableProps = {
  checkedIn: Array<{ student_id: string; name: string; checkin_time: string }>;
  totalEnrolled: number;
};

function AttendanceTable({ checkedIn, totalEnrolled }: AttendanceTableProps) {
  const students = useMemo(
    () =>
      (checkedIn ?? []).map(s => ({
        id: s.student_id,
        name: s.name,
        avatar: "/placeholder.svg?height=32&width=32",
        checkInTime: new Date(s.checkin_time).toLocaleTimeString(),
        checkInType: "QR Code",
        locationStatus: "Valid",
        distance: "-",
      })),
    [checkedIn]
  );

  return (
    <div className="rounded-md border">
      {/* Mobile Card View */}
      <div className="block sm:hidden">
        <div className="space-y-3 p-4">
          {students.map(student => (
            <Card
              key={student.id}
              className={
                student.locationStatus === "Valid"
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={student.avatar || "/placeholder.svg"}
                        alt={student.name}
                      />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {student.id}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Mark as Present</DropdownMenuItem>
                      <DropdownMenuItem>Mark as Absent</DropdownMenuItem>
                      <DropdownMenuItem>Contact Student</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">Check-in:</span>{" "}
                    {student.checkInTime}
                  </div>
                  <Badge
                    variant={
                      student.locationStatus === "Valid"
                        ? "outline"
                        : "destructive"
                    }
                    className={
                      student.locationStatus === "Valid"
                        ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30"
                        : ""
                    }
                  >
                    {student.locationStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Check-in Time</TableHead>
              <TableHead className="hidden md:table-cell">
                Check-in Type
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Location Status
              </TableHead>
              <TableHead className="hidden lg:table-cell">Distance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(student => (
              <TableRow
                key={student.id}
                className={
                  student.locationStatus === "Valid"
                    ? "bg-green-50 dark:bg-green-950/20"
                    : "bg-red-50 dark:bg-red-950/20"
                }
              >
                <TableCell className="font-medium">{student.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={student.avatar || "/placeholder.svg"}
                        alt={student.name}
                      />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{student.name}</span>
                  </div>
                </TableCell>
                <TableCell>{student.checkInTime}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {student.checkInType}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant={
                      student.locationStatus === "Valid"
                        ? "outline"
                        : "destructive"
                    }
                    className={
                      student.locationStatus === "Valid"
                        ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30"
                        : ""
                    }
                  >
                    {student.locationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {student.distance}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Mark as Present</DropdownMenuItem>
                      <DropdownMenuItem>Mark as Absent</DropdownMenuItem>
                      <DropdownMenuItem>Contact Student</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-center text-sm sm:text-left">
          Showing {students.length} of {totalEnrolled} students
        </div>
        <Pagination />
      </div>
    </div>
  );
}
