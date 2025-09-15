"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { QRGenScreens } from "../qr-generation/types";
import { QRGenerator } from "./qr-generator";
import { RoomSelector } from "./room-selector";
import { SessionSelector } from "./session-header";
import { TimeWindowSelector } from "./time-window-selector";

export function NewQrGeneration() {
  const { setCurrentScreen, currentCourse, selectedCourse, setWindows } =
    useQrGenContext();

  function backToCourseSelection(): void {
    setCurrentScreen(QRGenScreens.COURSE_SELECTION);
  }

  const { classStartTime, classEndTime } = useMemo(() => {
    const start = new Date();
    const end = new Date();
    if (currentCourse) {
      const [startHour, startMin] = currentCourse.startTime
        .split(":")
        .map(Number);
      const [endHour, endMin] = currentCourse.endTime.split(":").map(Number);
      start.setHours(startHour, startMin, 0, 0);
      end.setHours(endHour, endMin, 0, 0);
    } else {
      start.setHours(9, 0, 0, 0);
      end.setHours(11, 0, 0, 0);
    }
    return { classStartTime: start, classEndTime: end };
  }, [currentCourse]);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-4 lg:py-6">
        {/* Header */}
        <div className="mb-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground p-2"
            onClick={backToCourseSelection}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-border h-4 w-px" />
          <span className="text-muted-foreground text-sm">
            QR Code Generation
          </span>
        </div>

        <SessionSelector />

        {/* Two-column layout on desktop */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-6 lg:grid-cols-12 lg:gap-6">
          {/* Left: Settings column (scrolls within viewport) */}
          <div className="order-2 space-y-4 pr-2 lg:order-1 lg:col-span-7 lg:max-h-[calc(100vh-11rem)] lg:overflow-auto xl:col-span-8">
            <TimeWindowSelector
              key={`${selectedCourse?.sessionId ?? "-"}-${selectedCourse?.weekNumber ?? "-"}`}
              classStartTime={classStartTime}
              classEndTime={classEndTime}
              onChange={setWindows}
            />
            <RoomSelector />
            {/* Time window selector stays above QR visually; it's already compact */}
            {/* The selector is imported and rendered within QRGenerator previously; now it lives in left column
                If you expose TimeWindowSelector here, ensure it writes to context, which it already does via onChange in its props consumer.
            */}
          </div>

          {/* Right: Sticky QR panel */}
          <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-16">
              <QRGenerator />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
