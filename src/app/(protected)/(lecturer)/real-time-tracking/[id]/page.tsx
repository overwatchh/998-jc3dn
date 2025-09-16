"use client";

import {
  useGetCheckedInStudents,
  useGetStudentList,
  useGetCourses,
} from "@/app/(protected)/(lecturer)/qr-generation/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, RefreshCw } from "lucide-react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();

  const studySessionId = Number(params.id);
  const weekNumber = search.get("week_number")
    ? Number(search.get("week_number"))
    : undefined;

  // Validate available course/session for nicer labels (optional)
  const { data: courses } = useGetCourses();
  const course = useMemo(
    () => courses?.find(c => c.id === studySessionId),
    [courses, studySessionId]
  );

  // Live check-ins; API requires week_number, so if missing we disable
  const enabled = Boolean(studySessionId && weekNumber);
  const { data: checkedIn, refetch: refetchChecked } = useGetCheckedInStudents(
    studySessionId || 0,
    weekNumber,
    { enabled, refetchInterval: 5000 }
  );
  const { data: studentList } = useGetStudentList(studySessionId || 0, {
    enabled: Boolean(studySessionId),
  });

  useEffect(() => {
    if (!weekNumber) {
      // If week_number missing, navigate back to qr-generation for context
      // or keep the page but no data. We'll keep the page and prompt.
    }
  }, [weekNumber]);

  const present = checkedIn?.count ?? 0;
  const total = studentList?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Real-time Attendance Tracking
          </h1>
          <p className="text-muted-foreground text-sm">
            {course
              ? `${course.code} • ${course.name}`
              : `Session ${studySessionId}`}
            {typeof weekNumber === "number" ? ` • Week ${weekNumber}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-transparent"
            onClick={() => refetchChecked()}
            disabled={!enabled}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button
            variant="default"
            onClick={() => router.push("/qr-generation")}
          >
            Go to QR Generation
          </Button>
        </div>
      </div>

      {!enabled && (
        <Card className="mb-4">
          <CardContent className="p-4 text-sm text-red-600">
            week_number is missing. Open the QR generation page and navigate
            here via the tracking button.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {total > 0 ? `${Math.round((present / total) * 100)}%` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Live Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Checked At</TableHead>
                  <TableHead>Window</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(checkedIn?.data ?? []).map(s => (
                  <TableRow key={`${s.student_id}-${s.checkin_time}`}>
                    <TableCell>{s.student_name}</TableCell>
                    <TableCell>{s.student_id}</TableCell>
                    <TableCell>
                      {new Date(s.checkin_time).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{s.validity_count}/2</TableCell>
                  </TableRow>
                ))}
                {enabled && (checkedIn?.data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground text-center text-sm"
                    >
                      No check-ins yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
