"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatHHMM } from "@/lib/utils";
import { useTour } from "@reactour/tour";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  MapPin,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { QRGenScreens } from "../qr-generation/types";
import { QRGenerator } from "./qr-generator";
import { RoomSelector } from "./room-selector";
import { SessionSelector } from "./session-header";
import { TimeWindowSelector } from "./time-window-selector";

export function NewQrGeneration() {
  const {
    setCurrentScreen,
    currentCourse,
    selectedCourse,
    setWindows,
    selectedRoom,
    windows,
    windowsConfigured,
    validateGeo,
    radius,
  } = useQrGenContext();
  const { isOpen: tourOpen, currentStep, setCurrentStep } = useTour();

  // Track active tab and reset to location when week changes
  const [activeTab, setActiveTab] = useState("location");

  // Track collapsible sections state
  const [locationOpen, setLocationOpen] = useState(true);
  const [timeWindowOpen, setTimeWindowOpen] = useState(true);
  // Design toggle: show either tabbed layout or collapsible sections
  const [designMode, setDesignMode] = useState<"tabs" | "sections">("tabs");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("qrGenDesignMode");
      if (saved === "tabs" || saved === "sections") {
        setDesignMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("qrGenDesignMode", designMode);
    } catch {
      // ignore
    }
  }, [designMode]);

  function backToCourseSelection(): void {
    setCurrentScreen(QRGenScreens.COURSE_SELECTION);
  }

  // Reset tab to location when week changes
  useEffect(() => {
    setActiveTab("location");
  }, [selectedCourse?.weekNumber]);

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
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant={designMode === "tabs" ? "default" : "secondary"}
              className="gap-1"
              onClick={() => setDesignMode("tabs")}
            >
              <LayoutGrid className="h-4 w-4" />
              Tabs
            </Button>
            <Button
              size="sm"
              variant={designMode === "sections" ? "default" : "secondary"}
              className="gap-1"
              onClick={() => setDesignMode("sections")}
            >
              <List className="h-4 w-4" />
              Sections
            </Button>
          </div>
        </div>

        <SessionSelector />

        {/* Setup progress indicator removed for a cleaner layout */}

        {designMode === "tabs" ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-6 lg:grid-cols-12 lg:gap-6">
            {/* Left: Tabbed Settings column (scrolls within viewport) */}
            <div className="order-2 lg:order-1 lg:col-span-7 lg:max-h-[calc(100vh-11rem)] lg:overflow-auto xl:col-span-8">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-3 grid w-full grid-cols-2">
                  <TabsTrigger
                    value="location"
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Location
                  </TabsTrigger>
                  <TabsTrigger
                    value="time"
                    className="time-tab-step flex items-center gap-2"
                    onClick={() => {
                      if (tourOpen && currentStep === 4) {
                        // allow tab switch then move to next step (panel highlight) after slight delay
                        setTimeout(() => setCurrentStep(5), 250);
                      }
                    }}
                  >
                    <Clock className="h-4 w-4" />
                    Time Windows
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="location"
                  className="location-panel-step mt-0"
                >
                  <RoomSelector onNext={() => setActiveTab("time")} />
                </TabsContent>

                <TabsContent
                  value="time"
                  className="time-window-panel-step mt-0"
                >
                  <TimeWindowSelector
                    classStartTime={classStartTime}
                    classEndTime={classEndTime}
                    onChange={setWindows}
                    onBack={() => setActiveTab("location")}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Sticky QR panel */}
            <div className="qr-generator-panel-step order-1 lg:order-2 lg:col-span-5 xl:col-span-4">
              <div className="lg:sticky lg:top-16">
                <QRGenerator />
              </div>
            </div>
          </div>
        ) : (
          <div className="border-border mt-6 border-t pt-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
              {/* Left: Collapsible Settings column */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="space-y-3">
                  {/* Location Settings Section */}
                  <Collapsible
                    open={locationOpen}
                    onOpenChange={setLocationOpen}
                  >
                    <Card className="border-border bg-card location-panel-step">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="hover:bg-accent/30 cursor-pointer py-2.5 transition-colors">
                          <CardTitle className="flex items-center justify-between text-[15px] font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="bg-accent/20 ring-accent/30 rounded-md p-1 ring-1">
                                  <MapPin className="text-accent-foreground h-4 w-4" />
                                </div>
                                {/* Status indicator */}
                                <div
                                  className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                                    selectedRoom
                                      ? "bg-green-500"
                                      : "bg-gray-300"
                                  }`}
                                ></div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-foreground">
                                  Location & Validation
                                </span>
                                {!locationOpen && (
                                  <div className="space-y-0.5">
                                    {selectedRoom && (
                                      <div className="text-muted-foreground text-xs font-normal">
                                        Building {selectedRoom.building_number},
                                        Room {selectedRoom.room_number}
                                      </div>
                                    )}
                                    <div className="text-muted-foreground text-xs font-normal">
                                      Geo:{" "}
                                      {validateGeo ? "Enabled" : "Disabled"}
                                      {validateGeo && ` (${radius}m)`}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {locationOpen ? (
                              <ChevronDown className="text-muted-foreground h-4 w-4" />
                            ) : (
                              <ChevronRight className="text-muted-foreground h-4 w-4" />
                            )}
                          </CardTitle>
                          <p className="text-muted-foreground mt-1 text-left text-xs">
                            Configure room selection and geolocation validation
                            settings
                          </p>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <RoomSelector />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Time Window Settings Section */}
                  <Collapsible
                    open={timeWindowOpen}
                    onOpenChange={setTimeWindowOpen}
                  >
                    <Card className="border-border bg-card">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="hover:bg-accent/30 cursor-pointer py-2.5 transition-colors">
                          <CardTitle className="flex items-center justify-between text-[15px] font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="rounded-md bg-green-100 p-1.5 dark:bg-green-900/20">
                                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                {/* Status indicator */}
                                <div
                                  className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                                    windowsConfigured
                                      ? "bg-green-500"
                                      : "bg-gray-300"
                                  }`}
                                ></div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-foreground">
                                  Time Windows
                                </span>
                                {windows && (
                                  <span className="text-muted-foreground font-mono text-xs font-normal">
                                    {formatHHMM(windows.entryWindow.start)}-
                                    {formatHHMM(windows.entryWindow.end)} •{" "}
                                    {formatHHMM(windows.exitWindow.start)}-
                                    {formatHHMM(windows.exitWindow.end)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {timeWindowOpen ? (
                              <ChevronDown className="text-muted-foreground h-4 w-4" />
                            ) : (
                              <ChevronRight className="text-muted-foreground h-4 w-4" />
                            )}
                          </CardTitle>
                          <p className="text-muted-foreground mt-1 text-left text-xs">
                            Set up check-in and check-out time windows for
                            attendance
                          </p>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <TimeWindowSelector
                            classStartTime={classStartTime}
                            classEndTime={classEndTime}
                            onChange={setWindows}
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>
              </div>

              {/* Right: QR panel (duplicate for comparison) */}
              <div className="qr-generator-panel-step lg:col-span-5 xl:col-span-4">
                <div className="lg:sticky lg:top-16">
                  <QRGenerator />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
