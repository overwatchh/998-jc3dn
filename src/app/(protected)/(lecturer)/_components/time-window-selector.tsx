"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TimeWindow {
  start: Date
  end: Date
}

interface TimeWindowSelectorProps {
  classStartTime: Date
  classEndTime: Date
  onChange: (windows: {
    entryWindow: TimeWindow
    exitWindow: TimeWindow
  }) => void
}

const DURATION_OPTIONS = [
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
]

export function TimeWindowSelector({ classStartTime, classEndTime, onChange }: TimeWindowSelectorProps) {
  const timelineStart = new Date(classStartTime.getTime() - 60 * 60 * 1000)
  const timelineEnd = new Date(classEndTime.getTime() + 60 * 60 * 1000)
  const totalDuration = timelineEnd.getTime() - timelineStart.getTime()

  const [entryStartTime, setEntryStartTime] = useState(new Date(classStartTime.getTime() - 15 * 60 * 1000))
  const [entryDuration, setEntryDuration] = useState(30)
  const [exitStartTime, setExitStartTime] = useState(new Date(classEndTime.getTime() - 15 * 60 * 1000))
  const [exitDuration, setExitDuration] = useState(30)
  const [isDragging, setIsDragging] = useState<"entry" | "exit" | null>(null)

  const isUpdatingRef = useRef(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Utility functions
  const timeToPercentage = useCallback(
    (time: Date) => {
      return ((time.getTime() - timelineStart.getTime()) / totalDuration) * 100
    },
    [timelineStart, totalDuration],
  )

  const percentageToTime = useCallback(
    (percentage: number) => {
      return new Date(timelineStart.getTime() + (percentage / 100) * totalDuration)
    },
    [timelineStart, totalDuration],
  )

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }, [])

  const getEntryEndTime = useCallback(
    () => new Date(entryStartTime.getTime() + entryDuration * 60 * 1000),
    [entryStartTime, entryDuration],
  )

  const getExitEndTime = useCallback(
    () => new Date(exitStartTime.getTime() + exitDuration * 60 * 1000),
    [exitStartTime, exitDuration],
  )

  const validateEntryPosition = useCallback(
    (newStartTime: Date, currentExitStart: Date, currentEntryDuration: number) => {
      const entryEndTime = new Date(newStartTime.getTime() + currentEntryDuration * 60 * 1000)

      const minStart = timelineStart
      // Entry window can extend past class start, but class start must be within the window
      const maxStartBasedOnClassTime = new Date(classStartTime.getTime()) // Allow starting at class time
      const maxStartBasedOnExit = new Date(currentExitStart.getTime() - currentEntryDuration * 60 * 1000)
      const maxStartBasedOnTimeline = new Date(timelineEnd.getTime() - currentEntryDuration * 60 * 1000)

      // Ensure class start time falls within the entry window
      if (entryEndTime.getTime() < classStartTime.getTime()) {
        // If entry window would end before class starts, adjust to include class start
        return new Date(classStartTime.getTime() - currentEntryDuration * 60 * 1000)
      }

      const maxStart = new Date(Math.min(maxStartBasedOnExit.getTime(), maxStartBasedOnTimeline.getTime()))

      return new Date(Math.max(minStart.getTime(), Math.min(newStartTime.getTime(), maxStart.getTime())))
    },
    [classStartTime, timelineStart, timelineEnd],
  )

  const validateExitPosition = useCallback(
    (newStartTime: Date, currentEntryStart: Date, currentEntryDuration: number, currentExitDuration: number) => {
      const entryEndTime = new Date(currentEntryStart.getTime() + currentEntryDuration * 60 * 1000)
      const minStart = entryEndTime
      const maxStartBasedOnClassEnd = new Date(classEndTime.getTime())
      const maxStartBasedOnTimeline = new Date(timelineEnd.getTime() - currentExitDuration * 60 * 1000)

      const maxStart = new Date(Math.min(maxStartBasedOnClassEnd.getTime(), maxStartBasedOnTimeline.getTime()))

      return new Date(Math.max(minStart.getTime(), Math.min(newStartTime.getTime(), maxStart.getTime())))
    },
    [classEndTime, timelineEnd],
  )

  const handleMouseDown = useCallback(
    (windowType: "entry" | "exit") => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(windowType)
    },
    [],
  )

  const handleTouchStart = useCallback(
    (windowType: "entry" | "exit") => (e: React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(windowType)
    },
    [],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || isUpdatingRef.current || !timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))

      const newTime = percentageToTime(percentage)
      const minutes = newTime.getMinutes()
      const snappedMinutes = Math.round(minutes / 5) * 5
      const snappedTime = new Date(newTime)
      snappedTime.setMinutes(snappedMinutes, 0, 0)

      isUpdatingRef.current = true

      if (isDragging === "entry") {
        const validatedTime = validateEntryPosition(snappedTime, exitStartTime, entryDuration)
        setEntryStartTime(validatedTime)
      } else if (isDragging === "exit") {
        const validatedTime = validateExitPosition(snappedTime, entryStartTime, entryDuration, exitDuration)
        setExitStartTime(validatedTime)
      }

      isUpdatingRef.current = false
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
    ],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || isUpdatingRef.current || !timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const touch = e.touches[0]
      const percentage = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100))

      const newTime = percentageToTime(percentage)
      const minutes = newTime.getMinutes()
      const snappedMinutes = Math.round(minutes / 5) * 5
      const snappedTime = new Date(newTime)
      snappedTime.setMinutes(snappedMinutes, 0, 0)

      isUpdatingRef.current = true

      if (isDragging === "entry") {
        const validatedTime = validateEntryPosition(snappedTime, exitStartTime, entryDuration)
        setEntryStartTime(validatedTime)
      } else if (isDragging === "exit") {
        const validatedTime = validateExitPosition(snappedTime, entryStartTime, entryDuration, exitDuration)
        setExitStartTime(validatedTime)
      }

      isUpdatingRef.current = false
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
    ],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Duration change handlers
  const handleEntryDurationChange = useCallback(
    (newDuration: string) => {
      if (isUpdatingRef.current) return

      isUpdatingRef.current = true
      const duration = Number.parseInt(newDuration)
      setEntryDuration(duration)
      const validatedTime = validateEntryPosition(entryStartTime, exitStartTime, duration)
      setEntryStartTime(validatedTime)
      isUpdatingRef.current = false
    },
    [entryStartTime, exitStartTime, validateEntryPosition],
  )

  const handleExitDurationChange = useCallback(
    (newDuration: string) => {
      if (isUpdatingRef.current) return

      isUpdatingRef.current = true
      const duration = Number.parseInt(newDuration)
      setExitDuration(duration)
      const validatedTime = validateExitPosition(exitStartTime, entryStartTime, entryDuration, duration)
      setExitStartTime(validatedTime)
      isUpdatingRef.current = false
    },
    [exitStartTime, entryStartTime, entryDuration, validateExitPosition],
  )

  const applyPreset = useCallback(
    (preset: "early" | "standard" | "flexible") => {
      if (isUpdatingRef.current) return

      isUpdatingRef.current = true

      switch (preset) {
        case "early":
          setEntryStartTime(new Date(classStartTime.getTime() - 5 * 60 * 1000))
          setEntryDuration(15)
          setExitStartTime(new Date(classEndTime.getTime() - 5 * 60 * 1000))
          setExitDuration(15)
          break
        case "standard":
          setEntryStartTime(new Date(classStartTime.getTime() - 0 * 60 * 1000))
          setEntryDuration(15)
          setExitStartTime(new Date(classEndTime.getTime() - 15 * 60 * 1000))
          setExitDuration(15)
          break
        case "flexible":
          setEntryStartTime(new Date(classStartTime.getTime() - 10 * 60 * 1000))
          setEntryDuration(30)
          setExitStartTime(new Date(classEndTime.getTime() - 10 * 60 * 1000))
          setExitDuration(30)
          break
      }

      isUpdatingRef.current = false
    },
    [classStartTime, classEndTime],
  )

  useEffect(() => {
    if (isUpdatingRef.current) return

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
      })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [entryStartTime, entryDuration, exitStartTime, exitDuration, onChange, getEntryEndTime, getExitEndTime])

  const generateTimeMarkers = useCallback(() => {
    const markers = []
    const startHour = new Date(classStartTime)
    startHour.setHours(classStartTime.getHours() - 1, 0, 0, 0)

    const endHour = new Date(classEndTime)
    endHour.setHours(classEndTime.getHours() + 1, 0, 0, 0)

    for (let time = new Date(startHour); time <= endHour; time.setHours(time.getHours() + 1)) {
      markers.push(new Date(time))
    }

    return markers
  }, [classStartTime, classEndTime])

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Check-in Time Windows</CardTitle>
        <p className="text-sm text-gray-600">Configure when students can check in and out of class</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Button onClick={() => applyPreset("early")} variant="outline" size="sm" className="text-xs">
            Early Entry
          </Button>
          <Button onClick={() => applyPreset("standard")} variant="outline" size="sm" className="text-xs">
            Standard
          </Button>
          <Button onClick={() => applyPreset("flexible")} variant="outline" size="sm" className="text-xs">
            Flexible
          </Button>
        </div>

        <div className="space-y-3">
          <div className="relative overflow-x-auto">
            <div className="min-w-[600px] flex-row px-5">
              <div className="relative h-12 mb-3">
                {/* Entry Handle */}
                <div
                  className={`absolute top-0 transform -translate-x-1/2 cursor-move z-30 ${
                    isDragging === "entry" ? "scale-105" : ""
                  } transition-transform`}
                  style={{ left: `${timeToPercentage(entryStartTime)}%`, touchAction: "none" }}
                  onMouseDown={handleMouseDown("entry")}
                  onTouchStart={handleTouchStart("entry")}
                >
                  <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium shadow-md min-w-[80px] text-center">
                    <div className="font-semibold">Entry</div>
                    <div className="text-[10px] opacity-90">
                      {formatTime(entryStartTime)} - {formatTime(getEntryEndTime())}
                    </div>
                  </div>
                  <div className="w-0.5 h-6 bg-green-600 mx-auto"></div>
                </div>

                {/* Exit Handle */}
                <div
                  className={`absolute top-0 transform -translate-x-1/2 cursor-move z-30 ${
                    isDragging === "exit" ? "scale-105" : ""
                  } transition-transform`}
                  style={{ left: `${timeToPercentage(exitStartTime)}%`, touchAction: "none" }}
                  onMouseDown={handleMouseDown("exit")}
                  onTouchStart={handleTouchStart("exit")}
                >
                  <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-md min-w-[80px] text-center">
                    <div className="font-semibold">Exit</div>
                    <div className="text-[10px] opacity-90">
                      {formatTime(exitStartTime)} - {formatTime(getExitEndTime())}
                    </div>
                  </div>
                  <div className="w-0.5 h-6 bg-blue-600 mx-auto"></div>
                </div>
              </div>

              <div ref={timelineRef} className="relative h-8 bg-gray-100 rounded-lg border border-gray-300 select-none">
                {/* Hour markers */}
                {generateTimeMarkers().map((markerTime, index) => (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-300"
                    style={{ left: `${timeToPercentage(markerTime)}%` }}
                  />
                ))}

                {/* Class start/end markers */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-blue-500 z-10 rounded-sm"
                  style={{ left: `${timeToPercentage(classStartTime)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-blue-500 z-10 rounded-sm"
                  style={{ left: `${timeToPercentage(classEndTime)}%` }}
                />

                {/* Window blocks */}
                <div
                  className="absolute top-1 bottom-1 bg-green-500 rounded-sm z-20 opacity-80"
                  style={{
                    left: `${timeToPercentage(entryStartTime)}%`,
                    width: `${((entryDuration * 60 * 1000) / totalDuration) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-1 bottom-1 bg-blue-500 rounded-sm z-20 opacity-80"
                  style={{
                    left: `${timeToPercentage(exitStartTime)}%`,
                    width: `${((exitDuration * 60 * 1000) / totalDuration) * 100}%`,
                  }}
                />
              </div>

              {/* Time labels */}
              <div className="relative h-4 mt-2">
                {generateTimeMarkers().map((markerTime, index) => (
                  <div
                    key={index}
                    className="absolute top-0 transform -translate-x-1/2"
                    style={{ left: `${timeToPercentage(markerTime)}%` }}
                  >
                    <div className="text-xs text-gray-600 whitespace-nowrap">{formatTime(markerTime)}</div>
                  </div>
                ))}
              </div>

              <div className="relative h-4 mt-1">
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600 whitespace-nowrap"
                  style={{ left: `${timeToPercentage(classStartTime)}%` }}
                >
                  Class Start
                </div>
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600 whitespace-nowrap"
                  style={{ left: `${timeToPercentage(classEndTime)}%` }}
                >
                  Class End
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <Label className="text-sm font-medium text-gray-900">Entry Window</Label>
              </div>
              <Select value={entryDuration.toString()} onValueChange={handleEntryDurationChange}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                      className="text-gray-900 hover:bg-gray-50"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-600">
                {formatTime(entryStartTime)} - {formatTime(getEntryEndTime())}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <Label className="text-sm font-medium text-gray-900">Exit Window</Label>
              </div>
              <Select value={exitDuration.toString()} onValueChange={handleExitDurationChange}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                      className="text-gray-900 hover:bg-gray-50"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-600">
                {formatTime(exitStartTime)} - {formatTime(getExitEndTime())}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
