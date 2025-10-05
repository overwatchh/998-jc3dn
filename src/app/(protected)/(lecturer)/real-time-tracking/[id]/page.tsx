"use client";

import {
  useGetCheckedInStudents,
  useGetStudentList,
  useGetCourses,
  useGetQrCodes,
  useGetQrCode,
} from "@/app/(protected)/(lecturer)/qr-generation/queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  RefreshCw,
  UserPlus,
  UserCheck,
  ChevronDown,
  QrCode,
} from "lucide-react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

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
  const { data: qrCodes } = useGetQrCodes(studySessionId || 0, weekNumber, {
    enabled: Boolean(studySessionId && weekNumber),
  });

  // Get the QR code image for the current week's QR code
  const currentQrCodeId = qrCodes?.data?.[0]?.qr_code_id;
  const { data: qrCodeImage } = useGetQrCode(
    studySessionId || 0,
    currentQrCodeId || 0,
    {
      enabled: Boolean(studySessionId && currentQrCodeId),
    }
  );

  const checkedInData = useMemo(() => checkedIn?.data ?? [], [checkedIn]);

  // Group check-ins by student for the live check-ins table
  const groupedCheckins = useMemo(() => {
    const grouped = new Map<
      string,
      {
        student_id: string;
        student_name: string;
        student_email: string;
        checkin: {
          time: string;
          type: string;
        } | null;
        checkout: {
          time: string;
          type: string;
        } | null;
      }
    >();

    for (const c of checkedInData) {
      const key = c.student_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          student_id: c.student_id,
          student_name: c.student_name,
          student_email: c.student_email,
          checkin: null,
          checkout: null,
        });
      }

      const entry = grouped.get(key)!;
      if (c.validity_count === 1) {
        entry.checkin = {
          time: c.checkin_time,
          type: c.checkin_type,
        };
      } else if (c.validity_count === 2) {
        entry.checkout = {
          time: c.checkin_time,
          type: c.checkin_type,
        };
      }
    }

    return Array.from(grouped.values()).sort((a, b) => {
      // Sort by most recent activity
      const aTime = Math.max(
        a.checkin ? new Date(a.checkin.time).getTime() : 0,
        a.checkout ? new Date(a.checkout.time).getTime() : 0
      );
      const bTime = Math.max(
        b.checkin ? new Date(b.checkin.time).getTime() : 0,
        b.checkout ? new Date(b.checkout.time).getTime() : 0
      );
      return bTime - aTime;
    });
  }, [checkedInData]);
  const studentIdToMaxValidity = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of checkedInData) {
      const current = map.get(c.student_id) ?? 0;
      if ((c.validity_count ?? 0) > current)
        map.set(c.student_id, c.validity_count);
    }
    return map;
  }, [checkedInData]);
  const studentIdToLatestCheckinTime = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of checkedInData) {
      const prev = map.get(c.student_id);
      if (!prev || new Date(c.checkin_time) > new Date(prev)) {
        map.set(c.student_id, c.checkin_time);
      }
    }
    return map;
  }, [checkedInData]);

  useEffect(() => {
    if (!weekNumber) {
      // If week_number missing, navigate back to qr-generation for context
      // or keep the page but no data. We'll keep the page and prompt.
    }
  }, [weekNumber]);

  const present = studentIdToMaxValidity.size;
  const total = studentList?.length ?? 0;

  // Determine current session status based on QR validity windows
  const sessionStatus = useMemo(() => {
    if (!qrCodes?.data?.length) return null;

    const currentQr = qrCodes.data[0]; // Current week's QR code
    if (!currentQr?.validities?.length) return null;

    const now = new Date();

    // Check which validity window we're currently in
    for (const validity of currentQr.validities) {
      const startTime = new Date(validity.start_time);
      const endTime = new Date(validity.end_time);

      if (now >= startTime && now <= endTime) {
        return {
          isActive: true,
          windowType: validity.count === 1 ? "check-in" : "check-out",
          windowNumber: validity.count,
          endTime: validity.end_time,
        };
      }
    }

    return {
      isActive: false,
      windowType: null,
      windowNumber: null,
      endTime: null,
    };
  }, [qrCodes]);

  const [isManualCheckinLoading, setIsManualCheckinLoading] = useState<
    string | null
  >(null);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isCourseInfoOpen, setIsCourseInfoOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return studentList ?? [];
    return (studentList ?? []).filter(
      s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [studentList, query]);

  const handleManualCheckin = async (
    studentId: string,
    studentName: string
  ) => {
    if (!weekNumber || !studySessionId) {
      toast.error("Missing session information");
      return;
    }

    setIsManualCheckinLoading(studentId);

    try {
      const response = await fetch("/api/lecturer/manual-checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentId,
          study_session_id: studySessionId,
          week_number: weekNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check in student");
      }

      const _result = await response.json();
      toast.success(`${studentName} has been checked in successfully`);

      // Refresh the check-in data
      refetchChecked();
    } catch (error) {
      console.error("Manual check-in error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to check in student"
      );
    } finally {
      setIsManualCheckinLoading(null);
    }
  };

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
            size="sm"
            onClick={() => setShowQrCode(!showQrCode)}
            disabled={!weekNumber || !studySessionId}
          >
            <QrCode className="mr-2 h-4 w-4" />
            {showQrCode ? "Hide QR Code" : "View QR Code"}
          </Button>
          <Sheet
            open={isStudentDialogOpen}
            onOpenChange={setIsStudentDialogOpen}
          >
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                View Student List ({studentList?.length ?? 0})
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-4xl sm:max-w-3xl lg:max-w-4xl"
            >
              <div className="flex h-full flex-col">
                <SheetHeader className="border-b px-6 py-4">
                  <SheetTitle className="text-xl font-semibold">
                    All Enrolled Students
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground">
                    {course
                      ? `${course.code} • ${course.name}`
                      : `Session ${studySessionId}`}
                    {typeof weekNumber === "number"
                      ? ` • Week ${weekNumber}`
                      : ""}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-auto px-6 pb-6">
                  <div className="space-y-6">
                    <div className="pt-6">
                      <Input
                        placeholder="Search by name or email..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Checked</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map(student => {
                            const isCheckedIn = studentIdToMaxValidity.has(
                              student.student_id
                            );
                            const maxValidity =
                              studentIdToMaxValidity.get(student.student_id) ??
                              0;
                            const lastTime = studentIdToLatestCheckinTime.get(
                              student.student_id
                            );
                            return (
                              <TableRow key={student.student_id}>
                                <TableCell className="font-medium">
                                  {student.name}
                                </TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>
                                  {isCheckedIn ? (
                                    <Badge
                                      variant="default"
                                      className="bg-green-500"
                                    >
                                      <UserCheck className="mr-1 h-3 w-3" />
                                      Present (Window {maxValidity}/2)
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">Absent</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isCheckedIn && lastTime
                                    ? new Date(lastTime).toLocaleTimeString()
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {enabled && maxValidity < 2 && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={
                                            isManualCheckinLoading ===
                                            student.student_id
                                          }
                                        >
                                          <UserPlus className="mr-1 h-3 w-3" />
                                          {isManualCheckinLoading ===
                                          student.student_id
                                            ? "Checking..."
                                            : "Check In"}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Confirm Manual Check-in
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to manually
                                            check in{" "}
                                            <strong>{student.name}</strong> (
                                            {student.email})?
                                            <br />
                                            <br />
                                            This action will mark them as
                                            present for the current attendance
                                            session and cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleManualCheckin(
                                                student.student_id,
                                                student.name
                                              )
                                            }
                                            disabled={
                                              isManualCheckinLoading ===
                                              student.student_id
                                            }
                                          >
                                            {isManualCheckinLoading ===
                                            student.student_id
                                              ? "Checking in..."
                                              : "Check In"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {filteredStudents.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-muted-foreground text-center text-sm"
                              >
                                No matching students
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {!enabled && (
                        <div className="text-muted-foreground py-4 text-center text-sm">
                          Manual check-in is only available when a QR session is
                          active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
            onClick={() => {
              if (weekNumber && studySessionId) {
                router.push(
                  `/qr-generation?sessionId=${studySessionId}&weekNumber=${weekNumber}`
                );
              } else {
                router.push("/qr-generation");
              }
            }}
            disabled={!weekNumber || !studySessionId}
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

      {/* QR Code Display */}
      {showQrCode && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code - Week {weekNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {qrCodeImage?.qr_url ? (
              <div className="bg-white p-4 rounded-lg border">
                <div className="relative" style={{ width: "300px", height: "300px" }}>
                  <Image
                    src={qrCodeImage.qr_url}
                    alt={`QR Code for Week ${weekNumber}`}
                    fill
                    className="object-contain"
                    sizes="300px"
                  />
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm text-muted-foreground">
                    QR Code ID: {qrCodes?.data?.[0]?.qr_code_id || "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-muted-foreground text-center">
                  QR Code image will be displayed here when available.
                  <br />
                  <span className="text-sm">
                    QR Code ID: {qrCodes?.data?.[0]?.qr_code_id || "N/A"}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {course && (
        <Collapsible
          open={isCourseInfoOpen}
          onOpenChange={setIsCourseInfoOpen}
          className="mb-4"
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardContent className="hover:bg-muted/50 cursor-pointer p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{course.code}</h3>
                      <p className="text-muted-foreground text-sm">
                        {course.name}
                      </p>
                    </div>
                    <div>
                      {sessionStatus ? (
                        sessionStatus.isActive ? (
                          <Badge
                            variant="default"
                            className={
                              sessionStatus.windowType === "check-in"
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }
                          >
                            {sessionStatus.windowType === "check-in"
                              ? "Check-in Active"
                              : "Check-out Active"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Session Inactive</Badge>
                        )
                      ) : (
                        <Badge variant="outline">No QR Session</Badge>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isCourseInfoOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </CardContent>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="px-4 pt-0 pb-4">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Session Type
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {course.sessionType}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Schedule
                      </p>
                      <p className="text-sm font-semibold">
                        {course.dayOfWeek}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Time
                      </p>
                      <p className="text-sm font-semibold">
                        {course.startTime} - {course.endTime}
                      </p>
                    </div>
                  </div>

                  {typeof weekNumber === "number" && (
                    <div className="border-t pt-3">
                      <p className="text-muted-foreground mb-1 text-sm font-medium">
                        Current Session
                      </p>
                      <p className="text-sm">
                        Week {weekNumber} Attendance Tracking
                      </p>
                      {sessionStatus?.isActive && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {sessionStatus.windowType === "check-in"
                            ? "First"
                            : "Second"}{" "}
                          validity window active
                          {sessionStatus.endTime &&
                            ` until ${new Date(sessionStatus.endTime).toLocaleTimeString()}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedCheckins.map(student => {
                  const getCheckinDisplay = (
                    checkinData: { time: string; type: string } | null
                  ) => {
                    if (!checkinData) {
                      return (
                        <span className="text-muted-foreground text-sm">—</span>
                      );
                    }

                    const getTypeBadge = (type: string) => {
                      switch (type) {
                        case "Manual":
                          return (
                            <Badge
                              variant="outline"
                              className="border-orange-300 bg-orange-50 text-orange-700"
                            >
                              Manual
                            </Badge>
                          );
                        case "Online":
                          return (
                            <Badge
                              variant="outline"
                              className="border-blue-300 bg-blue-50 text-blue-700"
                            >
                              Online
                            </Badge>
                          );
                        case "In-person":
                        default:
                          return (
                            <Badge
                              variant="outline"
                              className="border-green-300 bg-green-50 text-green-700"
                            >
                              In-person
                            </Badge>
                          );
                      }
                    };

                    return (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {new Date(checkinData.time).toLocaleTimeString()}
                        </div>
                        {getTypeBadge(checkinData.type)}
                      </div>
                    );
                  };

                  return (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium">
                        {student.student_name}
                      </TableCell>
                      <TableCell>{student.student_email}</TableCell>
                      <TableCell>
                        {getCheckinDisplay(student.checkin)}
                      </TableCell>
                      <TableCell>
                        {getCheckinDisplay(student.checkout)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {enabled && groupedCheckins.length === 0 && (
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
