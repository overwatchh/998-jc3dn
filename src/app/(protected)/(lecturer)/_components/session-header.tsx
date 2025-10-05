"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DayOfWeek, getQrDateForWeek } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { useGetCourses, useGetQrCodes } from "../qr-generation/queries";

export function SessionSelector() {
  const {
    selectedCourse,
    setSelectedCourse,
    selectedDayOfWeek,
    setSelectedDayOfWeek,
  } = useQrGenContext();
  const { data: courses, isLoading: isCoursesLoading } = useGetCourses();

  // Get all existing QR codes for this session to determine used weeks
  const { data: allQrCodesData } = useGetQrCodes(
    selectedCourse?.sessionId || 0,
    undefined, // Get all weeks
    { enabled: !!selectedCourse }
  );

  // Get used weeks and calculate next available week
  const usedWeeks = useMemo(() => {
    if (!allQrCodesData?.data) return new Set<number>();
    return new Set(allQrCodesData.data.map(qr => qr.week_number));
  }, [allQrCodesData]);

  const nextAvailableWeek = useMemo(() => {
    for (let week = 1; week <= 13; week++) {
      if (!usedWeeks.has(week)) {
        return week;
      }
    }
    return 1; // Fallback
  }, [usedWeeks]);

  // Derive anchor QR (earliest created week) for stable date computation
  const anchorQr = useMemo(() => {
    const list = allQrCodesData?.data;
    if (!list || list.length === 0) return null;
    const earliest = [...list].sort((a, b) => a.week_number - b.week_number)[0];
    const date =
      (earliest.validities?.[0]?.start_time as string | undefined) ||
      earliest.createdAt;
    return { week_number: earliest.week_number, date } as {
      week_number: number;
      date: string;
    };
  }, [allQrCodesData]);

  // Ensure a default course is selected if none
  useEffect(() => {
    if (!selectedCourse && courses && courses.length > 0) {
      setSelectedCourse({
        sessionId: courses[0].id,
        weekNumber: nextAvailableWeek,
      });
    }
  }, [courses, selectedCourse, setSelectedCourse, nextAvailableWeek]);

  // Get current course info
  const currentCourse = courses?.find(c => c.id === selectedCourse?.sessionId);
  const defaultDay = currentCourse?.dayOfWeek as DayOfWeek | undefined;

  // Day override confirmation
  const [pendingDay, setPendingDay] = useState<DayOfWeek | null>(null);
  const [showConfirmDayDialog, setShowConfirmDayDialog] = useState(false);

  function handleDayChange(nextDay: DayOfWeek) {
    if (defaultDay && nextDay !== defaultDay) {
      setPendingDay(nextDay);
      setShowConfirmDayDialog(true);
    } else {
      setSelectedDayOfWeek(nextDay);
    }
  }

  return (
    <Card className="border-border bg-card session-selector-step mx-0 py-0">
      <div className="divide-border grid grid-cols-1 divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Subject Section */}
        <div className="space-y-2 p-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground text-sm font-medium">Subject</h3>
          </div>
          <Select
            value={selectedCourse ? String(selectedCourse.sessionId) : ""}
            onValueChange={value =>
              setSelectedCourse({
                sessionId: Number(value),
                weekNumber: selectedCourse?.weekNumber ?? nextAvailableWeek,
              })
            }
            disabled={isCoursesLoading}
          >
            <SelectTrigger className="border-border bg-background text-foreground w-full">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover">
              {(courses ?? []).map(c => (
                <SelectItem
                  key={c.id + c.code}
                  value={String(c.id)}
                  className="hover:bg-accent hover:text-accent-foreground"
                >
                  {c.code} - {c.name} (
                  {c.sessionType
                    ? `${c.sessionType.slice(0, 1).toUpperCase()}${c.sessionType.slice(1).toLowerCase()}`
                    : c.sessionType}
                  )
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Week + Day (inline) */}
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <h3 className="text-foreground text-sm font-medium">Schedule</h3>
            </div>
            {selectedCourse && currentCourse && (
              <div className="text-muted-foreground flex items-center text-xs sm:text-sm">
                <span className="text-foreground/90">
                  {(selectedDayOfWeek || currentCourse.dayOfWeek) &&
                    `${selectedDayOfWeek || currentCourse.dayOfWeek}, ${currentCourse.startTime} - ${currentCourse.endTime}`}
                </span>
                <span className="mx-2">•</span>
                <span className="text-foreground/90">
                  {getQrDateForWeek(
                    selectedDayOfWeek,
                    selectedCourse.weekNumber,
                    anchorQr
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-end gap-3">
            {/* Week */}
            <div className="min-w-[9rem]">
              <Select
                value={selectedCourse ? String(selectedCourse.weekNumber) : ""}
                onValueChange={value =>
                  setSelectedCourse({
                    sessionId: selectedCourse?.sessionId ?? 0,
                    weekNumber: Number(value),
                  })
                }
                disabled={!selectedCourse}
              >
                <SelectTrigger className="border-border bg-background text-foreground h-8 w-full gap-1 px-2 text-sm">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  {Array.from({ length: 13 }, (_, i) => i + 1).map(week => {
                    const isUsed = usedWeeks.has(week);
                    const isNextAvailable = week === nextAvailableWeek;
                    return (
                      <SelectItem
                        key={week}
                        value={String(week)}
                        className="hover:bg-accent hover:text-accent-foreground"
                      >
                        Week {week}
                        {isUsed && " (Created)"}
                        {isNextAvailable && !isUsed && " (Recommended)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Day of week */}
            <div className="min-w-[11rem]">
              <Select
                value={selectedDayOfWeek}
                onValueChange={value => handleDayChange(value as DayOfWeek)}
                disabled={!selectedCourse}
              >
                <SelectTrigger className="border-border bg-background text-foreground h-8 w-full gap-1 px-2 text-sm">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  {[
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ].map(dow => (
                    <SelectItem
                      key={dow}
                      value={dow}
                      className="hover:bg-accent hover:text-accent-foreground"
                    >
                      {dow}
                      {defaultDay === (dow as DayOfWeek) && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Confirm non-default day selection */}
          <AlertDialog
            open={showConfirmDayDialog}
            onOpenChange={setShowConfirmDayDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Use a non-default day?</AlertDialogTitle>
                <AlertDialogDescription>
                  The default day for this session is {defaultDay || "unknown"}.
                  Using a different day will affect the QR date.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setPendingDay(null);
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (pendingDay) {
                      setSelectedDayOfWeek(pendingDay);
                    }
                    setPendingDay(null);
                  }}
                >
                  Yes, use {pendingDay || "this day"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Study Session Section */}
        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground text-sm font-medium">
              Study Session
            </h3>
          </div>
          <div className="pt-2">
            <p className="text-foreground font-semibold">
              {currentCourse
                ? `${currentCourse.code} - Week ${selectedCourse?.weekNumber || 1}`
                : "No session selected"}
            </p>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>
                {currentCourse
                  ? `${currentCourse.dayOfWeek ? `${currentCourse.dayOfWeek}, ` : ""}${currentCourse.startTime} - ${currentCourse.endTime}`
                  : "No schedule"}
              </span>
              {/* Date now shown in Schedule header */}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
