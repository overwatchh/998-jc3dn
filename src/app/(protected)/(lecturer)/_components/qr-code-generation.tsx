"use client";

import { useQrGenContext } from "@/app/(protected)/(lecturer)/qr-generation/qr-gen-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GenerateQrResponse } from "@/types/qr-code";
import apiClient from "@/lib/api/apiClient";
import { AxiosError } from "axios";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Share2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useGenerateQr,
  useGetCheckedInStudents,
  useGetStudentList,
  useGetCourses,
  useGetQrCodes,
} from "../qr-generation/queries";
import { QRGenScreens } from "../qr-generation/types";

export function QrCodeGeneration() {
  const { setCurrentScreen, setSelectedCourse, selectedCourse } =
    useQrGenContext();
  const [qrType, setQrType] = useState("check-in");
  const [validityDuration, _setValidityDuration] = useState(15);
  const [geoValidation, setGeoValidation] = useState(false);
  const [geoRadius, setGeoRadius] = useState(100);

  // Courses for subject selection
  const { data: courses, isLoading: isCoursesLoading } = useGetCourses();

  // Calculate remaining time for the validity timer
  const [remainingTime, setRemainingTime] = useState(validityDuration * 60); // Start with full duration
  const [isExpired, setIsExpired] = useState(false);

  // Real countdown timer effect
  useEffect(() => {
    if (remainingTime <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingTime]);

  // Reset timer when validity duration changes
  useEffect(() => {
    setRemainingTime(validityDuration * 60);
    setIsExpired(false);
  }, [validityDuration]);

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (isExpired) return "text-red-500";
    const percentage = (remainingTime / (validityDuration * 60)) * 100;
    if (percentage > 50) return "text-green-500";
    if (percentage > 20) return "text-amber-500";
    return "text-red-500";
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Real-time data
  const sessionId = selectedCourse?.sessionId || 0;
  const { data: studentList } = useGetStudentList(sessionId, {
    enabled: !!selectedCourse,
    refetchInterval: 30000,
  });
  const { data: checkedInList } = useGetCheckedInStudents(sessionId, {
    enabled: !!selectedCourse,
    refetchInterval: 5000,
  });
  const totalStudents = studentList?.length ?? 0;
  const presentStudents = checkedInList?.length ?? 0;
  const presentPercent = totalStudents
    ? Math.round((presentStudents / totalStudents) * 100)
    : 0;

  const [qrCode, setQrCode] = useState<GenerateQrResponse>();
  const { mutateAsync: generateQr } = useGenerateQr(sessionId);
  
  // Use the hook to get existing QR codes for the selected week
  const { data: qrCodesData, refetch: refetchQrCodes } = useGetQrCodes(
    sessionId,
    selectedCourse?.weekNumber,
    { enabled: !!selectedCourse }
  );
  
  // Get all existing QR codes for this session to determine used weeks
  const { data: allQrCodesData } = useGetQrCodes(
    sessionId,
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
      setSelectedCourse({ sessionId: courses[0].id, weekNumber: nextAvailableWeek });
    }
  }, [courses, selectedCourse, setSelectedCourse, nextAvailableWeek]);
  
  // Auto-update to next available week when session changes
  useEffect(() => {
    if (selectedCourse && usedWeeks.size > 0) {
      const currentWeek = selectedCourse.weekNumber;
      if (usedWeeks.has(currentWeek) && nextAvailableWeek !== currentWeek) {
        setSelectedCourse({
          ...selectedCourse,
          weekNumber: nextAvailableWeek
        });
      }
    }
  }, [selectedCourse, usedWeeks, nextAvailableWeek, setSelectedCourse]);
  
  // Handle QR code fetching and generation
  useEffect(() => {
    if (!selectedCourse) return;

    let cancelled = false;

    async function fetchExistingOrGenerate() {
      try {
        // Check if a QR already exists for this session and week
        const existing = qrCodesData?.data?.[0];
        if (existing) {
          // Fetch QR base64 for the existing QR id
          const existingQr = await apiClient.get<GenerateQrResponse>(
            `/lecturer/study-session/${sessionId}/qr/${existing.qr_code_id}`
          );
          if (cancelled) return;
          setQrCode(existingQr.data);
          // Set timer based on valid_until
          const remaining = Math.max(
            0,
            Math.floor(
              (new Date(existingQr.data.valid_until).getTime() - Date.now()) /
                1000
            )
          );
          setRemainingTime(remaining);
          setIsExpired(remaining <= 0);
          return;
        }
        
        // No existing QR found, generate a new one
        const data = await generateQr({
          week_number: selectedCourse?.weekNumber || 1,
          duration: validityDuration,
          radius: geoValidation ? geoRadius : undefined,
        });
        if (cancelled) return;
        setQrCode(data);
        const remaining = Math.max(
          0,
          Math.floor((new Date(data.valid_until).getTime() - Date.now()) / 1000)
        );
        setRemainingTime(remaining);
        setIsExpired(remaining <= 0);
        
        // Refetch QR codes list to update cache
        refetchQrCodes();
      } catch (e: unknown) {
        // Handle race condition: if QR was created by another request
        if (e instanceof AxiosError && e.response?.status === 409) {
          // Refetch the QR codes and try to get the existing one
          const { data: updatedQrCodes } = await refetchQrCodes();
          const existing = updatedQrCodes?.data?.[0];
          if (existing && !cancelled) {
            try {
              const existingQr = await apiClient.get<GenerateQrResponse>(
                `/lecturer/study-session/${sessionId}/qr/${existing.qr_code_id}`
              );
              setQrCode(existingQr.data);
              const remaining = Math.max(
                0,
                Math.floor(
                  (new Date(existingQr.data.valid_until).getTime() -
                    Date.now()) /
                    1000
                )
              );
              setRemainingTime(remaining);
              setIsExpired(remaining <= 0);
              return;
            } catch (_e) {
              // fallthrough to error message
            }
          }
        }
        if (e instanceof AxiosError && e.response?.data?.message) {
          toast.error(e.response.data.message);
        } else {
          toast.error("An unknown error occurred.");
        }
      }
    }

    fetchExistingOrGenerate();

    return () => {
      cancelled = true;
    };
  }, [selectedCourse, sessionId, generateQr, validityDuration, geoValidation, geoRadius, qrCodesData, refetchQrCodes]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setCurrentScreen(QRGenScreens.COURSE_SELECTION);
                  setSelectedCourse(undefined);
                }}
                variant="ghost"
                className="h-fit"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">
                QR Code Generation
              </h1>
            </div>

            {/* QR Code Type Selector */}
            <Tabs value={qrType} onValueChange={setQrType} className="mt-6">
              {/* <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="check-in">Check-in QR</TabsTrigger>
                <TabsTrigger value="throughout">Throughout QR</TabsTrigger>
              </TabsList> */}
              <div className="text-muted-foreground mt-2 text-sm">
                {qrType === "check-in" ? (
                  <p>
                    Generate a QR code for initial attendance at the beginning
                    of class.
                  </p>
                ) : (
                  <p>
                    Generate QR codes for ongoing attendance checks throughout
                    the class session.
                  </p>
                )}
              </div>
            </Tabs>

            {/* Subject and Week Selection */}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block">Subject</Label>
                <Select
                  value={selectedCourse ? String(selectedCourse.sessionId) : ""}
                  onValueChange={value =>
                    setSelectedCourse({
                      sessionId: Number(value),
                      weekNumber: selectedCourse?.weekNumber ?? 1,
                    })
                  }
                  disabled={isCoursesLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses ?? []).map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">
                  Week 
                  <span className="text-muted-foreground text-xs font-normal">
                    ({usedWeeks.size}/13 created)
                  </span>
                </Label>
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select week" />
                  </SelectTrigger>
                  <SelectContent>
                    {usedWeeks.size >= 13 ? (
                      <div className="p-2 text-center text-muted-foreground text-sm">
                        All weeks have been created
                      </div>
                    ) : (
                      Array.from({ length: 13 }, (_, i) => i + 1).map(week => {
                        const isUsed = usedWeeks.has(week);
                        const isNextAvailable = week === nextAvailableWeek;
                        return (
                          <SelectItem 
                            key={week} 
                            value={String(week)}
                            disabled={isUsed}
                          >
                            Week {week}
                            {isUsed && " (Created)"}
                            {isNextAvailable && !isUsed && " (Recommended)"}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* QR Code Display Card */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary/5 border-b pb-0">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm font-medium">
                      Study Session {selectedCourse?.sessionId} - Week {selectedCourse?.weekNumber}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Live check-in tracking</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 pt-6">
                  <div className="relative mb-4 rounded-lg border bg-white p-2 shadow-sm">
                    {qrCode?.qr_url ? (
                      <Image
                        // src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Rickrolling_QR_code.png"
                        src={qrCode?.qr_url}
                        width={256}
                        height={256}
                        alt="QR Code"
                        className={`h-64 w-64 ${isExpired ? "opacity-30 grayscale" : ""}`}
                      />
                    ) : (
                      <div className="text-primary grid h-64 w-64 place-items-center">
                        <Loader2 className="dark:text-primary-foreground animate-spin" />
                      </div>
                    )}
                    {isExpired && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                        <div className="rounded bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                          EXPIRED
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex items-center gap-2 text-lg font-semibold ${getTimerColor()}`}
                  >
                    <span>
                      {isExpired
                        ? "QR Code Expired"
                        : `Valid for: ${formatTime(remainingTime)} remaining`}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap justify-center gap-2 p-6 pt-0">
                  <Button
                    className="gap-1"
                    onClick={async () => {
                      setRemainingTime(validityDuration * 60);
                      setIsExpired(false);
                      try {
                        const data = await generateQr({
                          week_number: selectedCourse?.weekNumber || 1,
                          duration: validityDuration,
                          radius: geoValidation ? geoRadius : undefined,
                        });
                        setQrCode(data);
                        const remaining = Math.max(
                          0,
                          Math.floor(
                            (new Date(data.valid_until).getTime() - Date.now()) /
                              1000
                          )
                        );
                        setRemainingTime(remaining);
                        setIsExpired(remaining <= 0);
                        
                        // Refetch QR codes list to update cache
                        refetchQrCodes();
                      } catch (e: unknown) {
                        // Handle race condition: if QR was created by another request
                        if (e instanceof AxiosError && e.response?.status === 409) {
                          const { data: updatedQrCodes } = await refetchQrCodes();
                          const existing = updatedQrCodes?.data?.[0];
                          if (existing) {
                            try {
                              const existingQr = await apiClient.get<GenerateQrResponse>(
                                `/lecturer/study-session/${sessionId}/qr/${existing.qr_code_id}`
                              );
                              setQrCode(existingQr.data);
                              const remaining = Math.max(
                                0,
                                Math.floor(
                                  (new Date(existingQr.data.valid_until).getTime() -
                                    Date.now()) /
                                    1000
                                )
                              );
                              setRemainingTime(remaining);
                              setIsExpired(remaining <= 0);
                              return;
                            } catch {
                              // ignore; will fall back to toast below
                            }
                          }
                        }
                        // show generic error
                        toast.error(
                          e instanceof AxiosError && e.response?.data?.message
                            ? e.response.data.message
                            : "An unknown error occurred."
                        );
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isExpired ? "Generate New QR" : "Regenerate QR"}
                  </Button>
                  <Button variant="outline" className="gap-1">
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                  <Button variant="outline" className="gap-1">
                    <Share2 className="h-4 w-4" />
                    Share QR
                  </Button>
                </CardFooter>
              </Card>

              {/* Right column: Geolocation + Status */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Geolocation Validation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="geo-validation">Require valid location</Label>
                      <Switch
                        id="geo-validation"
                        checked={geoValidation}
                        onCheckedChange={setGeoValidation}
                      />
                    </div>
                    {geoValidation && (
                      <div className="flex items-center gap-2">
                        <Input
                          id="geo-radius"
                          type="number"
                          value={geoRadius}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setGeoRadius(Number.parseInt(e.target.value))
                          }
                          className="w-24"
                        />
                        <Label htmlFor="geo-radius">meters radius</Label>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Real-time Check-in Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Real-time Check-in Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {presentStudents}/{totalStudents} students checked in ({presentPercent}%)
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      >
                        Live
                      </Badge>
                    </div>
                    <Progress value={presentPercent} className="bg-muted h-2" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Recent Check-ins</Label>
                        <span
                          suppressHydrationWarning
                          className="text-muted-foreground text-xs"
                        >
                          Last updated: {format(new Date(), "hh:mm:ss a")}
                        </span>
                      </div>
                      <ScrollArea className="bg-card h-[140px] rounded-md border p-2">
                        <div className="space-y-2">
                          {(checkedInList ?? []).map(s => (
                            <div
                              key={s.student_id + s.checkin_time}
                              className="hover:bg-muted flex items-center justify-between rounded-md p-2"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={"/placeholder.svg"} alt={s.name} />
                                  <AvatarFallback>
                                    {s.name
                                      .split(" ")
                                      .map(n => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {s.name}
                                </span>
                              </div>
                              <span className="text-muted-foreground text-xs">
                                {format(new Date(s.checkin_time), "hh:mm a")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button
                        variant="outline"
                        className="w-full gap-1 text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        View All Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
