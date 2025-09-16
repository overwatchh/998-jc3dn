"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Windows, useQrGenContext } from "../qr-generation/qr-gen-context";

interface TimeWindowSelectorProps {
  classStartTime: Date;
  classEndTime: Date;
  onChange: (windows: Windows) => void;
}

const DURATION_OPTIONS = [
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
] as const;

export function TimeWindowSelector({
  classStartTime,
  classEndTime,
  onChange,
}: TimeWindowSelectorProps) {
  const { windows, setWindowsConfigured } = useQrGenContext();
  const timelineStart = useMemo(
    () => new Date(classStartTime.getTime() - 60 * 60 * 1000),
    [classStartTime]
  );
  const timelineEnd = useMemo(
    () => new Date(classEndTime.getTime() + 60 * 60 * 1000),
    [classEndTime]
  );
  const totalDuration = useMemo(
    () => timelineEnd.getTime() - timelineStart.getTime(),
    [timelineStart, timelineEnd]
  );

  const [entryStartTime, setEntryStartTime] = useState(
    new Date(classStartTime.getTime() - 15 * 60 * 1000)
  );
  const [entryDuration, setEntryDuration] = useState(30);
  const [exitStartTime, setExitStartTime] = useState(
    new Date(classEndTime.getTime() - 15 * 60 * 1000)
  );
  const [exitDuration, setExitDuration] = useState(30);
  const [isDragging, setIsDragging] = useState<"entry" | "exit" | null>(null);

  const isUpdatingRef = useRef(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Initialize from context windows or reset to defaults when class times change
  useEffect(() => {
    // Use milliseconds to prevent unnecessary resets when the times are effectively unchanged
    const startMs = classStartTime.getTime();
    const endMs = classEndTime.getTime();

    // Reset dragging state to avoid stuck handlers across subject changes
    setIsDragging(null);

    // If we have existing windows in context, use them
    if (windows) {
      const entryStart = windows.entryWindow.start;
      const entryEnd = windows.entryWindow.end;
      const exitStart = windows.exitWindow.start;
      const exitEnd = windows.exitWindow.end;

      const entryDurationMs = entryEnd.getTime() - entryStart.getTime();
      const exitDurationMs = exitEnd.getTime() - exitStart.getTime();

      setEntryStartTime(entryStart);
      setEntryDuration(Math.round(entryDurationMs / (60 * 1000))); // Convert to minutes
      setExitStartTime(exitStart);
      setExitDuration(Math.round(exitDurationMs / (60 * 1000))); // Convert to minutes
    } else {
      // Initialize to defaults relative to new class times only if no context windows
      setEntryDuration(30);
      setExitDuration(30);
      setEntryStartTime(new Date(startMs - 15 * 60 * 1000));
      setExitStartTime(new Date(endMs - 15 * 60 * 1000));
    }
    // onChange is triggered by the debounced effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classStartTime.getTime(), classEndTime.getTime(), windows]);

  // Utility functions
  const timeToPercentage = useCallback(
    (time: Date) => {
      return ((time.getTime() - timelineStart.getTime()) / totalDuration) * 100;
    },
    [timelineStart, totalDuration]
  );

  const percentageToTime = useCallback(
    (percentage: number) => {
      return new Date(
        timelineStart.getTime() + (percentage / 100) * totalDuration
      );
    },
    [timelineStart, totalDuration]
  );

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, []);

  const getEntryEndTime = useCallback(
    () => new Date(entryStartTime.getTime() + entryDuration * 60 * 1000),
    [entryStartTime, entryDuration]
  );

  const getExitEndTime = useCallback(
    () => new Date(exitStartTime.getTime() + exitDuration * 60 * 1000),
    [exitStartTime, exitDuration]
  );

  const validateEntryPosition = useCallback(
    (
      newStartTime: Date,
      currentExitStart: Date,
      currentEntryDuration: number
    ) => {
      const entryEndTime = new Date(
        newStartTime.getTime() + currentEntryDuration * 60 * 1000
      );

      const minStart = timelineStart;
      // Entry window can extend past class start, but class start must be within the window
      const maxStartBasedOnExit = new Date(
        currentExitStart.getTime() - currentEntryDuration * 60 * 1000
      );
      const maxStartBasedOnTimeline = new Date(
        timelineEnd.getTime() - currentEntryDuration * 60 * 1000
      );

      // Ensure class start time falls within the entry window
      if (entryEndTime.getTime() < classStartTime.getTime()) {
        // If entry window would end before class starts, adjust to include class start
        return new Date(
          classStartTime.getTime() - currentEntryDuration * 60 * 1000
        );
      }

      const maxStart = new Date(
        Math.min(
          maxStartBasedOnExit.getTime(),
          maxStartBasedOnTimeline.getTime()
        )
      );

      return new Date(
        Math.max(
          minStart.getTime(),
          Math.min(newStartTime.getTime(), maxStart.getTime())
        )
      );
    },
    [classStartTime, timelineStart, timelineEnd]
  );

  const validateExitPosition = useCallback(
    (
      newStartTime: Date,
      currentEntryStart: Date,
      currentEntryDuration: number,
      currentExitDuration: number
    ) => {
      const entryEndTime = new Date(
        currentEntryStart.getTime() + currentEntryDuration * 60 * 1000
      );
      const minStart = entryEndTime;
      const maxStartBasedOnClassEnd = new Date(classEndTime.getTime());
      const maxStartBasedOnTimeline = new Date(
        timelineEnd.getTime() - currentExitDuration * 60 * 1000
      );

      const maxStart = new Date(
        Math.min(
          maxStartBasedOnClassEnd.getTime(),
          maxStartBasedOnTimeline.getTime()
        )
      );

      return new Date(
        Math.max(
          minStart.getTime(),
          Math.min(newStartTime.getTime(), maxStart.getTime())
        )
      );
    },
    [classEndTime, timelineEnd]
  );

  const handleMouseDown = useCallback(
    (windowType: "entry" | "exit") => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(windowType);
    },
    []
  );

  const handleTouchStart = useCallback(
    (windowType: "entry" | "exit") => (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(windowType);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || isUpdatingRef.current || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
      );

      const newTime = percentageToTime(percentage);
      const minutes = newTime.getMinutes();
      const snappedMinutes = Math.round(minutes / 5) * 5;
      const snappedTime = new Date(newTime);
      snappedTime.setMinutes(snappedMinutes, 0, 0);

      isUpdatingRef.current = true;

      if (isDragging === "entry") {
        const validatedTime = validateEntryPosition(
          snappedTime,
          exitStartTime,
          entryDuration
        );
        setEntryStartTime(validatedTime);
      } else if (isDragging === "exit") {
        const validatedTime = validateExitPosition(
          snappedTime,
          entryStartTime,
          entryDuration,
          exitDuration
        );
        setExitStartTime(validatedTime);
      }

      isUpdatingRef.current = false;
    },
    [
      isDragging,
      entryDuration,
      exitDuration,
      exitStartTime,
      entryStartTime,
      percentageToTime,
      validateEntryPosition,
      validateExitPosition,
    ]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || isUpdatingRef.current || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const percentage = Math.max(
        0,
        Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100)
      );

      const newTime = percentageToTime(percentage);
      const minutes = newTime.getMinutes();
      const snappedMinutes = Math.round(minutes / 5) * 5;
      const snappedTime = new Date(newTime);
      snappedTime.setMinutes(snappedMinutes, 0, 0);

      isUpdatingRef.current = true;

      if (isDragging === "entry") {
        const validatedTime = validateEntryPosition(
          snappedTime,
          exitStartTime,
          entryDuration
        );
        setEntryStartTime(validatedTime);
      } else if (isDragging === "exit") {
        const validatedTime = validateExitPosition(
          snappedTime,
          entryStartTime,
          entryDuration,
          exitDuration
        );
        setExitStartTime(validatedTime);
      }

      isUpdatingRef.current = false;
    },
    [
      isDragging,
      entryDuration,
      exitDuration,
      exitStartTime,
      entryStartTime,
      percentageToTime,
      validateEntryPosition,
      validateExitPosition,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Mark windows as configured when user finishes dragging
      setWindowsConfigured(true);
    }
    setIsDragging(null);
  }, [isDragging, setWindowsConfigured]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      // Mark windows as configured when user finishes touch dragging
      setWindowsConfigured(true);
    }
    setIsDragging(null);
  }, [isDragging, setWindowsConfigured]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Duration change handlers
  const handleEntryDurationChange = useCallback(
    (newDuration: string) => {
      if (isUpdatingRef.current) return;

      isUpdatingRef.current = true;
      const duration = Number.parseInt(newDuration);
      setEntryDuration(duration);
      const validatedTime = validateEntryPosition(
        entryStartTime,
        exitStartTime,
        duration
      );
      setEntryStartTime(validatedTime);
      // Mark windows as configured when user manually adjusts duration
      setWindowsConfigured(true);
      isUpdatingRef.current = false;
    },
    [entryStartTime, exitStartTime, validateEntryPosition, setWindowsConfigured]
  );

  const handleExitDurationChange = useCallback(
    (newDuration: string) => {
      if (isUpdatingRef.current) return;

      isUpdatingRef.current = true;
      const duration = Number.parseInt(newDuration);
      setExitDuration(duration);
      const validatedTime = validateExitPosition(
        exitStartTime,
        entryStartTime,
        entryDuration,
        duration
      );
      setExitStartTime(validatedTime);
      // Mark windows as configured when user manually adjusts duration
      setWindowsConfigured(true);
      isUpdatingRef.current = false;
    },
    [
      exitStartTime,
      entryStartTime,
      entryDuration,
      validateExitPosition,
      setWindowsConfigured,
    ]
  );

  const applyPreset = useCallback(
    (preset: "early" | "standard" | "flexible") => {
      if (isUpdatingRef.current) return;

      isUpdatingRef.current = true;

      switch (preset) {
        case "early":
          setEntryStartTime(new Date(classStartTime.getTime() - 5 * 60 * 1000));
          setEntryDuration(15);
          setExitStartTime(new Date(classEndTime.getTime() - 5 * 60 * 1000));
          setExitDuration(15);
          break;
        case "standard":
          setEntryStartTime(new Date(classStartTime.getTime()));
          setEntryDuration(15);
          setExitStartTime(new Date(classEndTime.getTime() - 15 * 60 * 1000));
          setExitDuration(15);
          break;
        case "flexible":
          setEntryStartTime(
            new Date(classStartTime.getTime() - 10 * 60 * 1000)
          );
          setEntryDuration(30);
          setExitStartTime(new Date(classEndTime.getTime() - 10 * 60 * 1000));
          setExitDuration(30);
          break;
      }

      // Mark windows as configured when user applies a preset
      setWindowsConfigured(true);
      isUpdatingRef.current = false;
    },
    [classStartTime, classEndTime, setWindowsConfigured]
  );

  useEffect(() => {
    if (isUpdatingRef.current) return;

    const timeoutId = setTimeout(() => {
      onChange({
        entryWindow: {
          start: entryStartTime,
          end: getEntryEndTime(),
        },
        exitWindow: {
          start: exitStartTime,
          end: getExitEndTime(),
        },
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    entryStartTime,
    entryDuration,
    exitStartTime,
    exitDuration,
    onChange,
    getEntryEndTime,
    getExitEndTime,
  ]);

  const generateTimeMarkers = useCallback(() => {
    const markers = [];
    const startHour = new Date(classStartTime);
    startHour.setHours(classStartTime.getHours() - 1, 0, 0, 0);

    const endHour = new Date(classEndTime);
    endHour.setHours(classEndTime.getHours() + 1, 0, 0, 0);

    for (
      let time = new Date(startHour);
      time <= endHour;
      time.setHours(time.getHours() + 1)
    ) {
      markers.push(new Date(time));
    }

    return markers;
  }, [classStartTime, classEndTime]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground text-lg font-semibold">
          Check-in Time Windows
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Configure when students can check in and out of class
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div>
            <h4 className="text-foreground mb-1 text-sm font-medium">
              Quick Presets
            </h4>
            <p className="text-muted-foreground mb-1 text-xs">
              Choose a preset configuration to quickly set up common time window
              patterns
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div
              className="border-border hover:bg-accent/50 cursor-pointer rounded-md border p-2 transition-colors"
              onClick={() => applyPreset("early")}
            >
              <div className="mb-1 flex items-center justify-between">
                <h5 className="text-foreground text-xs font-medium">
                  Early Entry
                </h5>
                <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs text-[10px]">
                  15 min
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] leading-tight">
                5 min before class start, 5 min before class end
              </p>
            </div>

            <div
              className="border-border hover:bg-accent/50 cursor-pointer rounded-md border p-2 transition-colors"
              onClick={() => applyPreset("standard")}
            >
              <div className="mb-1 flex items-center justify-between">
                <h5 className="text-foreground text-xs font-medium">
                  Standard
                </h5>
                <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs text-[10px]">
                  15 min
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] leading-tight">
                At class start, 15 min before class end
              </p>
            </div>

            <div
              className="border-border hover:bg-accent/50 cursor-pointer rounded-md border p-2 transition-colors"
              onClick={() => applyPreset("flexible")}
            >
              <div className="mb-1 flex items-center justify-between">
                <h5 className="text-foreground text-xs font-medium">
                  Flexible
                </h5>
                <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs text-[10px]">
                  30 min
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] leading-tight">
                10 min before class start, 10 min before class end
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative overflow-x-auto">
            <div className="min-w-[600px] flex-row px-5">
              <div className="relative mb-2 h-12">
                {/* Entry Handle */}
                <div
                  className={`absolute top-0 z-30 -translate-x-1/2 transform cursor-move ${
                    isDragging === "entry" ? "scale-105" : ""
                  } transition-transform`}
                  style={{
                    left: `${timeToPercentage(entryStartTime)}%`,
                    touchAction: "none",
                  }}
                  onMouseDown={handleMouseDown("entry")}
                  onTouchStart={handleTouchStart("entry")}
                >
                  <div className="min-w-[80px] rounded bg-green-600 px-2 py-1 text-center text-xs font-medium text-white shadow-md">
                    <div className="font-semibold">Entry</div>
                    <div className="text-[10px] opacity-90">
                      {formatTime(entryStartTime)} -{" "}
                      {formatTime(getEntryEndTime())}
                    </div>
                  </div>
                  <div className="mx-auto h-6 w-0.5 bg-green-600"></div>
                </div>

                {/* Exit Handle */}
                <div
                  className={`absolute top-0 z-30 -translate-x-1/2 transform cursor-move ${
                    isDragging === "exit" ? "scale-105" : ""
                  } transition-transform`}
                  style={{
                    left: `${timeToPercentage(exitStartTime)}%`,
                    touchAction: "none",
                  }}
                  onMouseDown={handleMouseDown("exit")}
                  onTouchStart={handleTouchStart("exit")}
                >
                  <div className="min-w-[80px] rounded bg-blue-600 px-2 py-1 text-center text-xs font-medium text-white shadow-md">
                    <div className="font-semibold">Exit</div>
                    <div className="text-[10px] opacity-90">
                      {formatTime(exitStartTime)} -{" "}
                      {formatTime(getExitEndTime())}
                    </div>
                  </div>
                  <div className="mx-auto h-6 w-0.5 bg-blue-600"></div>
                </div>
              </div>

              <div
                ref={timelineRef}
                className="border-border bg-muted relative h-8 rounded-lg border select-none"
              >
                {/* Hour markers */}
                {generateTimeMarkers().map((markerTime, index) => (
                  <div
                    key={index}
                    className="bg-border absolute top-0 bottom-0 w-0.5"
                    style={{ left: `${timeToPercentage(markerTime)}%` }}
                  />
                ))}

                {/* Class start/end markers */}
                <div
                  className="absolute top-0 bottom-0 z-10 w-1 rounded-sm bg-blue-500"
                  style={{ left: `${timeToPercentage(classStartTime)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 z-10 w-1 rounded-sm bg-blue-500"
                  style={{ left: `${timeToPercentage(classEndTime)}%` }}
                />

                {/* Window blocks */}
                <div
                  className="absolute top-1 bottom-1 z-20 rounded-sm bg-green-500 opacity-80"
                  style={{
                    left: `${timeToPercentage(entryStartTime)}%`,
                    width: `${((entryDuration * 60 * 1000) / totalDuration) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-1 bottom-1 z-20 rounded-sm bg-blue-500 opacity-80"
                  style={{
                    left: `${timeToPercentage(exitStartTime)}%`,
                    width: `${((exitDuration * 60 * 1000) / totalDuration) * 100}%`,
                  }}
                />
              </div>

              {/* Time labels */}
              <div className="relative mt-1 h-4">
                {generateTimeMarkers().map((markerTime, index) => (
                  <div
                    key={index}
                    className="absolute top-0 -translate-x-1/2 transform"
                    style={{ left: `${timeToPercentage(markerTime)}%` }}
                  >
                    <div className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatTime(markerTime)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative mt-1 h-4">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 transform text-xs font-medium whitespace-nowrap text-blue-600"
                  style={{ left: `${timeToPercentage(classStartTime)}%` }}
                >
                  Class Start
                </div>
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 transform text-xs font-medium whitespace-nowrap text-blue-600"
                  style={{ left: `${timeToPercentage(classEndTime)}%` }}
                >
                  Class End
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-600"></div>
                <Label className="text-foreground text-sm font-medium">
                  Entry Window
                </Label>
              </div>
              <Select
                value={entryDuration.toString()}
                onValueChange={handleEntryDurationChange}
              >
                <SelectTrigger className="border-border bg-background text-foreground h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  {DURATION_OPTIONS.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                      className="hover:bg-accent hover:text-accent-foreground"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-muted-foreground text-xs">
                {formatTime(entryStartTime)} - {formatTime(getEntryEndTime())}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                <Label className="text-foreground text-sm font-medium">
                  Exit Window
                </Label>
              </div>
              <Select
                value={exitDuration.toString()}
                onValueChange={handleExitDurationChange}
              >
                <SelectTrigger className="border-border bg-background text-foreground h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  {DURATION_OPTIONS.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                      className="hover:bg-accent hover:text-accent-foreground"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-muted-foreground text-xs">
                {formatTime(exitStartTime)} - {formatTime(getExitEndTime())}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
