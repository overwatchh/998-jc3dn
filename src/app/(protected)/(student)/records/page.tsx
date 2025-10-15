"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Filter, List, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

type RecentCheckinRecord = {
  subject_name: string;
  subject_code: string;
  session_type: string;
  week_number: number;
  latest_checkin_time: string;
  building_number: string;
  room_number: string;
  campus_name: string;
  checkin_count: number; // 1 or 2
  attendance_status: "absent" | "partial" | "present";
  points_awarded: number; // 50 or 100
};

interface ApiResponse {
  message: string;
  count: number;
  data: RecentCheckinRecord[];
}

export default function AttendanceRecordsScreen() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");

  const { data, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["student", "recent-checkins"],
    queryFn: async () => {
      const res = await fetch(
        "/api/analytics/student-recent-checkins?limit=100"
      );
      if (!res.ok) throw new Error("Failed to load attendance records");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const records = useMemo(() => {
    const base = data?.data || [];
    return [...base].sort(
      (a, b) =>
        new Date(b.latest_checkin_time).getTime() -
        new Date(a.latest_checkin_time).getTime()
    );
  }, [data]);

  const courseOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.subject_name));
    return Array.from(set).sort();
  }, [records]);

  const courseIdOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.subject_code));
    return Array.from(set).sort();
  }, [records]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.session_type));
    return Array.from(set).sort();
  }, [records]);

  const weekOptions = useMemo(() => {
    const set = new Set<number>();
    records.forEach(r => set.add(r.week_number));
    return Array.from(set).sort((a, b) => a - b);
  }, [records]);

  const campusOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.campus_name));
    return Array.from(set).sort();
  }, [records]);

  const buildingOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.building_number));
    return Array.from(set).sort();
  }, [records]);

  const roomOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.room_number));
    return Array.from(set).sort();
  }, [records]);

  const filteredRecords = useMemo(
    () =>
      records.filter(r => {
        const courseMatch =
          selectedCourse === "all" || r.subject_name === selectedCourse;
        const courseIdMatch =
          selectedCourseId === "all" || r.subject_code === selectedCourseId;
        const typeMatch =
          selectedType === "all" || r.session_type === selectedType;
        const weekMatch =
          selectedWeek === "all" || r.week_number === Number(selectedWeek);
        const campusMatch =
          selectedCampus === "all" || r.campus_name === selectedCampus;
        const buildingMatch =
          selectedBuilding === "all" || r.building_number === selectedBuilding;
        const roomMatch =
          selectedRoom === "all" || r.room_number === selectedRoom;
        return (
          courseMatch &&
          courseIdMatch &&
          typeMatch &&
          weekMatch &&
          campusMatch &&
          buildingMatch &&
          roomMatch
        );
      }),
    [
      records,
      selectedCourse,
      selectedType,
      selectedWeek,
      selectedCampus,
      selectedBuilding,
      selectedRoom,
      selectedCourseId,
    ]
  );

  // Derive overall stats for currently filtered set (present=100, partial=50)
  const overallStats = useMemo(() => {
    if (filteredRecords.length === 0)
      return { percentage: 0, attended: 0, total: 0 };
    const totalPossible = filteredRecords.length * 100; // each session max 100 points
    const earned = filteredRecords.reduce(
      (acc, r) => acc + r.points_awarded,
      0
    );
    const attended = filteredRecords.filter(
      r => r.attendance_status !== "absent"
    ).length;
    const percentage = Math.round((earned / totalPossible) * 100);
    return { percentage, attended, total: filteredRecords.length };
  }, [filteredRecords]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Absent
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Late
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Partial
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDisplayDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-GB", {
        hour12: false,
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const capitalize = (val: string) =>
    val ? val.charAt(0).toUpperCase() + val.slice(1) : val;

  const resetFilters = () => {
    setSelectedCourse("all");
    setSelectedType("all");
    setSelectedCourseId("all");
    setSelectedWeek("all");
    setSelectedCampus("all");
    setSelectedBuilding("all");
    setSelectedRoom("all");
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-primary text-xl font-semibold">My Attendance</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review your recent check-ins and overall progress.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            aria-label="Calendar view"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
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
                  <span className="text-primary text-lg font-bold">
                    {overallStats.percentage}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-primary/80 text-xs">Progress</p>
                <p className="text-primary text-2xl font-bold">
                  {overallStats.attended}/{overallStats.total}
                </p>
                <p className="text-muted-foreground text-xs">
                  Sessions attended
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Filters & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courseOptions.map(c => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Course ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All IDs</SelectItem>
                    {courseIdOptions.map(id => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {typeOptions.map(t => (
                      <SelectItem key={t} value={t}>
                        {capitalize(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-full sm:w-28">
                    <SelectValue placeholder="Week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weeks</SelectItem>
                    {weekOptions.map(w => (
                      <SelectItem key={w} value={String(w)}>
                        Week {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCampus}
                  onValueChange={setSelectedCampus}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campuses</SelectItem>
                    {campusOptions.map(c => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedBuilding}
                  onValueChange={setSelectedBuilding}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Building" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buildings</SelectItem>
                    {buildingOptions.map(b => (
                      <SelectItem key={b} value={b}>
                        Building {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {roomOptions.map(rm => (
                      <SelectItem key={rm} value={rm}>
                        Room {rm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetFilters();
                    refetch();
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" /> Reset
                </Button>
              </div>
              <div className="text-muted-foreground text-xs">
                {filteredRecords.length} record
                {filteredRecords.length !== 1 && "s"}
                {(selectedCourse !== "all" ||
                  selectedType !== "all" ||
                  selectedWeek !== "all" ||
                  selectedCampus !== "all" ||
                  selectedBuilding !== "all" ||
                  selectedRoom !== "all" ||
                  selectedCourseId !== "all") && <span> matching filters</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Recent Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading recent
              check-ins...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-600">
              Failed to load attendance records
            </div>
          ) : filteredRecords.length > 0 ? (
            <>
              {/* Mobile: Card list */}
              <div className="space-y-3 md:hidden">
                {filteredRecords.map((r, idx) => (
                  <div key={idx} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {r.subject_name} - {r.subject_code}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          Week {r.week_number} · {capitalize(r.session_type)}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(r.attendance_status)}
                      </div>
                    </div>
                    <div className="text-muted-foreground mt-2 text-xs">
                      {r.building_number}-{r.room_number} · {r.campus_name}
                    </div>
                    <div className="mt-2 text-xs">
                      {getDisplayDate(r.latest_checkin_time)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/Tablets: Table with horizontal scroll */}
              <div className="hidden md:block">
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium">
                          Course
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Week
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Location
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Check-in Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r, idx) => (
                        <tr key={idx} className="hover:bg-muted/40">
                          <td className="px-3 py-2 font-medium">
                            {r.subject_name} - {r.subject_code}
                          </td>
                          <td className="px-3 py-2">{r.week_number}</td>
                          <td className="px-3 py-2">
                            {capitalize(r.session_type)}
                          </td>
                          <td className="text-muted-foreground px-3 py-2 text-xs">
                            {r.building_number}-{r.room_number} ·{" "}
                            {r.campus_name}
                          </td>
                          <td className="px-3 py-2">
                            {getStatusBadge(r.attendance_status)}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {getDisplayDate(r.latest_checkin_time)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-primary">No attendance records found</p>
              <p className="text-sm text-gray-500">
                Try adjusting your filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
