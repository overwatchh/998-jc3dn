"use client";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { useGetCourses, useGetQrCodes } from "../qr-generation/queries";

export function SessionSelector() {
  const { selectedCourse, setSelectedCourse } = useQrGenContext();
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

  return (
    <Card className="border-border bg-card mx-0 py-0">
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
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Week Section */}
        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground text-sm font-medium">Week</h3>
          </div>
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
            <SelectTrigger className="border-border bg-background text-foreground w-full">
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
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
