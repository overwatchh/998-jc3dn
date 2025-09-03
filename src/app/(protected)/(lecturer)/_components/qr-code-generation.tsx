"use client";

import { useQrGenContext } from "@/app/(protected)/(lecturer)/qr-generation/qr-gen-context";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AxiosError } from "axios";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Loader2,
  Plus,
  Share2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCountdown } from "../hooks/useCountdown";
import {
  useAddSecondValidity,
  useGenerateQr,
  useGetCourses,
  useGetQrCode,
  useGetQrCodes,
} from "../qr-generation/queries";
import { QRGenScreens } from "../qr-generation/types";

export function QrCodeGeneration() {
  const { setCurrentScreen, setSelectedCourse, selectedCourse } =
    useQrGenContext();

  const [geoValidation, setGeoValidation] = useState(false);
  const [geoRadius, setGeoRadius] = useState(100);
  const [hasGeneratedQrForCurrentWeek, setHasGeneratedQrForCurrentWeek] =
    useState(false);

  // Courses for subject selection
  const { data: courses, isLoading: isCoursesLoading } = useGetCourses();

  const {
    remainingTime,
    setRemainingTime,
    setIsExpired,
    isExpired,
    validityDuration,
  } = useCountdown();

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

  const { mutateAsync: generateQr, isPending: isGenerating } =
    useGenerateQr(sessionId);

  const { mutateAsync: addSecondValidity, isPending: isAddingValidity } =
    useAddSecondValidity(sessionId);

  // Use the hook to get existing QR codes for the selected week
  const {
    data: qrCodesData,
    isLoading: isQrCodesLoading,
    refetch: refetchQrCodes,
  } = useGetQrCodes(sessionId, selectedCourse?.weekNumber, {
    enabled: !!selectedCourse,
  });

  // Get the existing QR code if one exists
  const existingQrCodeId = qrCodesData?.data?.[0]?.qr_code_id;
  const { data: qrCode, isLoading: isQrCodeLoading } = useGetQrCode(
    sessionId,
    existingQrCodeId!,
    { enabled: !!selectedCourse && !!existingQrCodeId }
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
      setSelectedCourse({
        sessionId: courses[0].id,
        weekNumber: 1, // Initially set to week 1
      });
    }
  }, [courses, selectedCourse, setSelectedCourse, nextAvailableWeek]);

  // Handle timer setup when QR code changes
  useEffect(() => {
    if (qrCode?.valid_until) {
      const remaining = Math.max(
        0,
        Math.floor((new Date(qrCode.valid_until).getTime() - Date.now()) / 1000)
      );
      setRemainingTime(remaining);
      setIsExpired(remaining <= 0);
    }
  }, [qrCode, setRemainingTime, setIsExpired]);

  // Reset hasGeneratedQrForCurrentWeek when selectedCourse or weekNumber changes
  useEffect(() => {
    setHasGeneratedQrForCurrentWeek(false);
  }, [selectedCourse?.sessionId, selectedCourse?.weekNumber]);

  // Auto-generate QR if no existing one found and not currently generating
  useEffect(() => {
    if (
      !selectedCourse ||
      isGenerating ||
      isQrCodeLoading ||
      isQrCodesLoading ||
      hasGeneratedQrForCurrentWeek
    ) {
      return;
    }

    // If we have QR codes data and no existing QR, generate a new one
    if (qrCodesData && !existingQrCodeId) {
      generateQr({
        week_number: selectedCourse.weekNumber,
        duration: validityDuration,
        radius: geoValidation ? geoRadius : undefined,
      })
        .then(() => {
          setHasGeneratedQrForCurrentWeek(true);
        })
        .catch((e: unknown) => {
          // Only show error if it's not a 409 (already exists)
          if (!(e instanceof AxiosError && e.response?.status === 409)) {
            toast.error(
              e instanceof AxiosError && e.response?.data?.message
                ? e.response.data.message
                : "Failed to generate QR code."
            );
          }
        });
    }
  }, [
    selectedCourse,
    isGenerating,
    isQrCodeLoading,
    isQrCodesLoading,
    qrCodesData,
    existingQrCodeId,
    generateQr,
    validityDuration,
    geoValidation,
    geoRadius,
    hasGeneratedQrForCurrentWeek,
  ]);

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
            <div className="text-muted-foreground mt-6 text-sm">
              <p>
                Generate a QR code for initial attendance at the beginning of
                class.
              </p>
            </div>

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
                      <SelectItem key={c.id + c.code} value={String(c.id)}>
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
                  value={
                    selectedCourse ? String(selectedCourse.weekNumber) : ""
                  }
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
                      <div className="text-muted-foreground p-2 text-center text-sm">
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
                  value={
                    selectedCourse ? String(selectedCourse.weekNumber) : ""
                  }
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
                      <div className="text-muted-foreground p-2 text-center text-sm">
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
                      Study Session {selectedCourse?.sessionId} - Week{" "}
                      {selectedCourse?.weekNumber}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Live check-in tracking</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 pt-6">
                  <div className="relative mb-4 rounded-lg border bg-white p-2 shadow-sm">
                    {qrCode?.qr_url && !isGenerating && !isQrCodeLoading ? (
                      <Image
                        src={qrCode.qr_url}
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
                    disabled={isAddingValidity || !existingQrCodeId}
                    onClick={async () => {
                      if (isAddingValidity || !existingQrCodeId) return;
                      try {
                        await addSecondValidity({
                          qr_code_id: existingQrCodeId,
                        });
                        toast.success(
                          "Second validity window added successfully!"
                        );
                        // Refetch QR codes list to update cache
                        refetchQrCodes();
                      } catch (e: unknown) {
                        toast.error(
                          e instanceof AxiosError && e.response?.data?.message
                            ? e.response.data.message
                            : "Failed to add second validity window."
                        );
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Second Validity
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
                      <Label htmlFor="geo-validation">
                        Require valid location
                      </Label>
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
                      <span className="text-sm font-medium"></span>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      >
                        Live
                      </Badge>
                    </div>
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
                        <div className="space-y-2"></div>
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
