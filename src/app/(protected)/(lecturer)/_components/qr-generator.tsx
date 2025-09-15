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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/lib/api/apiClient";
import { formatHHMM } from "@/lib/utils";
import { AxiosError } from "axios";
import { Download, Loader2, QrCode, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQrGenContext, Windows } from "../qr-generation/qr-gen-context";
import {
  useGenerateQr,
  useGetQrCode,
  useGetQrCodes,
  useUpdateQr,
} from "../qr-generation/queries";
import { TimeWindowSelector } from "./time-window-selector";

export const QRGenerator = () => {
  const {
    windows,
    currentCourse,
    selectedCourse,
    selectedRoom,
    validateGeo,
    radius,
    setWindows,
    setQrGenerated,
  } = useQrGenContext();
  const { mutateAsync: generateQr, isPending: isGenerating } = useGenerateQr(
    selectedCourse?.sessionId || 0
  );
  const { mutateAsync: updateQr, isPending: isUpdating } = useUpdateQr(
    selectedCourse?.sessionId || 0
  );

  // Fetch existing QR for this session/week
  const {
    data: existingQrList,
    isFetching: isFetchingQrList,
    isLoading: isLoadingQrList,
  } = useGetQrCodes(
    selectedCourse?.sessionId || 0,
    selectedCourse?.weekNumber,
    { enabled: !!selectedCourse }
  );
  const existingQrId = existingQrList?.data?.[0]?.qr_code_id;
  const {
    data: existingQrData,
    refetch: refetchExistingQr,
    isFetching: isFetchingQr,
    isLoading: isLoadingQr,
  } = useGetQrCode(selectedCourse?.sessionId || 0, existingQrId || 0, {
    enabled: !!existingQrId,
  });
  const [qrUrl, setQrUrl] = useState<string>("");
  // Success animation state: shows a brief overlay when create/update succeeds
  const [successType, setSuccessType] = useState<null | "create" | "update">(
    null
  );
  const [prevInfo, setPrevInfo] = useState<{
    roomLabel: string | null;
    validateGeo: boolean | null;
    radius: number | null;
    entryWindow: { start: string; end: string } | null;
    exitWindow: { start: string; end: string } | null;
  } | null>(null);
  // QR is considered generated for the CURRENTLY selected week only if we have a URL
  const qrGenerated = useMemo(() => Boolean(qrUrl), [qrUrl]);
  const isChecking =
    !!selectedCourse &&
    !qrUrl &&
    (isFetchingQrList ||
      isLoadingQrList ||
      (existingQrId ? isFetchingQr || isLoadingQr : false));

  // Respect lecturer's selected room from context
  const selectedRoomId = selectedRoom?.id ?? 0;

  const { classStartTime, classEndTime } = useMemo(() => {
    // Set default class times based on course schedule
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

  const handleWindowChange = (w: Windows) => {
    // Keep windows in shared context so other components can react
    setWindows(w);
  };

  // Helper: format ISO datetime (string) into HH:mm
  const isoToHHMM = (iso?: string | null) =>
    iso ? formatHHMM(new Date(iso)) : "--:--";

  function handleDownload(): void {
    if (!qrUrl) return;
    try {
      const link = document.createElement("a");
      link.href = qrUrl;
      link.download = "attendance-qr.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Unable to download QR image");
    }
  }

  async function handleShare(): Promise<void> {
    if (!qrUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Attendance QR", url: qrUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(qrUrl);
        toast.success("QR link copied to clipboard");
      } else {
        toast.message("QR URL", { description: qrUrl });
      }
    } catch {
      // user cancelled or share failed
    }
  }

  const buildValidities = (w: Windows) => [
    {
      start_time: formatHHMM(w.entryWindow.start),
      end_time: formatHHMM(w.entryWindow.end),
    },
    {
      start_time: formatHHMM(w.exitWindow.start),
      end_time: formatHHMM(w.exitWindow.end),
    },
  ];

  const generateQRCode = async () => {
    if (!selectedCourse || !windows || !selectedRoomId) {
      toast.error("Please select a room and configure time windows first");
      return;
    }

    try {
      // Build API payload
      const validities = buildValidities(windows);
      const response = await generateQr({
        week_number: selectedCourse.weekNumber,
        radius,
        valid_room_id: selectedRoomId,
        validate_geo: validateGeo,
        validities,
      });

      setQrUrl(response.qr_url);
      setQrGenerated(true);
      setSuccessType("create");
      toast.success("QR code generated successfully!");
    } catch (error) {
      console.error("Error generating QR:", error);
      toast.error(
        error instanceof AxiosError && error.response?.data?.message
          ? error.response.data.message
          : "Failed to generate QR code"
      );
    }
  };

  const updateQRCode = async () => {
    if (!selectedCourse || !windows || !selectedRoomId || !existingQrId) {
      toast.error(
        "Please select a room, configure time windows, and ensure an existing QR"
      );
      return;
    }

    try {
      const validities = buildValidities(windows);
      await updateQr({
        qr_code_id: existingQrId,
        radius,
        valid_room_id: selectedRoomId,
        validate_geo: validateGeo,
        validities,
      });

      const refreshed = await refetchExistingQr();
      if (refreshed.data?.qr_url) {
        setQrUrl(refreshed.data.qr_url);
      }
      setQrGenerated(true);
      setSuccessType("update");
      toast.success("QR code updated successfully!");
    } catch (error) {
      console.error("Error updating QR:", error);
      toast.error(
        error instanceof AxiosError && error.response?.data?.message
          ? error.response.data.message
          : "Failed to update QR code"
      );
    }
  };
  // If an existing QR is present for the selected week, show it by default.
  // Use the refetch result directly to avoid reading stale data from closures.
  useEffect(() => {
    let cancelled = false;
    const fetchAndSet = async () => {
      if (!existingQrId) return;
      const res = await refetchExistingQr();
      const url = res.data?.qr_url || existingQrData?.qr_url;
      if (!cancelled && url) {
        setQrUrl(url);
        setQrGenerated(true);
      }
    };
    fetchAndSet();
    return () => {
      cancelled = true;
    };
  }, [existingQrId, refetchExistingQr, existingQrData?.qr_url, setQrGenerated]);

  // Fetch previous configuration for comparison in update dialog
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!existingQrId) {
        setPrevInfo(null);
        return;
      }
      try {
        // Prefer the common QR info endpoint for room/geo/radius + windows
        const { data } = await apiClient.get<{
          validate_geo: boolean;
          validities: {
            id: number;
            count: number;
            start_time: string;
            end_time: string;
          }[];
          radius: number | null;
          location: {
            building_number: string | null;
            room_number: string | null;
            room_id: number | null;
          } | null;
        }>(`/qr/${existingQrId}`);

        const first = data.validities.find(v => v.count === 1);
        const second = data.validities.find(v => v.count === 2);
        const roomLabel = data.location
          ? `${data.location.building_number ?? ""} ${data.location.room_number ?? ""}`.trim() ||
            null
          : null;
        if (!cancelled) {
          setPrevInfo({
            roomLabel,
            validateGeo: data.validate_geo ?? null,
            radius: data.radius ?? null,
            entryWindow: first
              ? {
                  start: isoToHHMM(first.start_time),
                  end: isoToHHMM(first.end_time),
                }
              : null,
            exitWindow: second
              ? {
                  start: isoToHHMM(second.start_time),
                  end: isoToHHMM(second.end_time),
                }
              : null,
          });
        }
      } catch (err) {
        console.error(err);
        // Fallback: derive times from existing list if available
        const v = existingQrList?.data?.[0]?.validities ?? [];
        const first = v.find(x => x.count === 1);
        const second = v.find(x => x.count === 2);
        if (!cancelled) {
          setPrevInfo({
            roomLabel: null,
            validateGeo: null,
            radius: existingQrList?.data?.[0]?.valid_radius ?? null,
            entryWindow: first
              ? {
                  start: isoToHHMM(first.start_time),
                  end: isoToHHMM(first.end_time),
                }
              : null,
            exitWindow: second
              ? {
                  start: isoToHHMM(second.start_time),
                  end: isoToHHMM(second.end_time),
                }
              : null,
          });
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [existingQrId, existingQrList?.data]);

  // When lecturer switches session/week, reset local QR state first;
  // we'll repopulate if an existing QR for that week is fetched above.
  useEffect(() => {
    setQrUrl("");
    setQrGenerated(false);
    // Clear windows to avoid stale values from previous subject until selector recalculates
    setWindows(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse?.sessionId, selectedCourse?.weekNumber]);

  // Auto-dismiss the success animation after a short delay
  useEffect(() => {
    if (!successType) return;
    const t = setTimeout(() => setSuccessType(null), 1400);
    return () => clearTimeout(t);
  }, [successType]);

  return (
    <div className="order-1 space-y-6 lg:order-2 lg:col-span-3">
      {/* Section 1: Time Windows - always first to avoid layout shifts */}
      <div className="relative">
        <div className="absolute -top-3 left-4 bg-transparent px-2">
          <span className="bg-accent text-accent-foreground rounded-full px-2 py-1 text-xs font-medium">
            Configure Time Windows
          </span>
        </div>
        <TimeWindowSelector
          key={`${selectedCourse?.sessionId ?? "-"}-${selectedCourse?.weekNumber ?? "-"}`}
          classStartTime={classStartTime}
          classEndTime={classEndTime}
          onChange={handleWindowChange}
        />
      </div>

      {/* Section 2: QR - always second, content switches based on qrGenerated */}
      <div className="relative">
        <div className="absolute -top-3 left-4 z-10 bg-transparent px-2">
          <span className="bg-accent text-accent-foreground rounded-full px-2 py-1 text-xs font-medium">
            {qrGenerated ? "QR Code" : "Generate QR Code"}
          </span>
        </div>
        <Card className="border-border bg-card">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-foreground text-xl font-semibold">
              {qrGenerated ? "QR Code" : "QR Code Generation"}
            </CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">
              {qrGenerated
                ? "Show or update the attendance QR code"
                : "Generate attendance QR code for your session"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              {isChecking ? (
                <div className="bg-card mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 shadow-lg">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : qrGenerated && qrUrl ? (
                <div className="bg-card mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 shadow-lg">
                  <Image
                    src={qrUrl}
                    alt="QR Code"
                    width={180}
                    height={180}
                    className="rounded"
                  />
                </div>
              ) : (
                <div className="bg-muted mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed">
                  <div className="text-muted-foreground text-center">
                    <QrCode className="mx-auto mb-3 h-16 w-16" />
                    <p className="text-sm font-medium">
                      QR code has not been generated
                    </p>
                    <p className="text-xs">
                      Complete configuration above and click Generate
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Configuration Status */}
            {!qrGenerated && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-foreground mb-3 text-sm font-medium">
                  Configuration Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedRoomId ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                        <span className="text-xs text-green-600">✓</span>
                      </div>
                    ) : (
                      <div className="bg-secondary flex h-5 w-5 items-center justify-center rounded-full">
                        <span className="text-muted-foreground text-xs">○</span>
                      </div>
                    )}
                    <span
                      className={`text-sm ${selectedRoomId ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      Room selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {windows ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                        <span className="text-xs text-green-600">✓</span>
                      </div>
                    ) : (
                      <div className="bg-secondary flex h-5 w-5 items-center justify-center rounded-full">
                        <span className="text-muted-foreground text-xs">○</span>
                      </div>
                    )}
                    <span
                      className={`text-sm ${windows ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      Time windows configured
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action area */}
            <div className="mx-auto max-w-md space-y-3">
              {qrGenerated ? (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="h-10 w-full text-sm font-medium"
                        disabled={
                          isUpdating ||
                          !selectedRoomId ||
                          !windows ||
                          !existingQrId
                        }
                      >
                        {isUpdating ? "Updating QR Code..." : "Update QR Code"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Update</AlertDialogTitle>
                        <AlertDialogDescription>
                          Review the changes below. We’ll apply the new settings
                          to the existing QR for this week.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="text-foreground space-y-3 text-sm">
                        {/* Week (info only) */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Week</span>
                          <span className="font-medium">
                            {selectedCourse?.weekNumber}
                          </span>
                        </div>
                        {/* Comparison rows */}
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground mb-2 text-xs font-medium">
                            Comparison
                          </div>
                          <div className="space-y-2">
                            {/* Room */}
                            <div className="grid grid-cols-3 items-center gap-2">
                              <div className="text-muted-foreground">Room</div>
                              <div className="text-muted-foreground truncate text-right">
                                {prevInfo?.roomLabel ?? "—"}
                              </div>
                              <div className="truncate text-right font-medium">
                                {selectedRoom
                                  ? `${selectedRoom.building_number} ${selectedRoom.room_number}`
                                  : "-"}
                              </div>
                            </div>
                            {/* Geo validation */}
                            <div className="grid grid-cols-3 items-center gap-2">
                              <div className="text-muted-foreground">Geo</div>
                              <div className="text-muted-foreground text-right">
                                {prevInfo?.validateGeo == null
                                  ? "—"
                                  : prevInfo?.validateGeo
                                    ? "Enabled"
                                    : "Disabled"}
                              </div>
                              <div className="text-right font-medium">
                                {validateGeo ? "Enabled" : "Disabled"}
                              </div>
                            </div>
                            {/* Radius */}
                            <div className="grid grid-cols-3 items-center gap-2">
                              <div className="text-muted-foreground">
                                Radius
                              </div>
                              <div className="text-muted-foreground text-right">
                                {prevInfo?.radius != null
                                  ? `${prevInfo.radius} m`
                                  : "—"}
                              </div>
                              <div className="text-right font-medium">
                                {radius} m
                              </div>
                            </div>
                            {/* Entry window */}
                            <div className="grid grid-cols-3 items-center gap-2">
                              <div className="text-muted-foreground">Entry</div>
                              <div className="text-muted-foreground text-right">
                                {prevInfo?.entryWindow
                                  ? `${prevInfo.entryWindow.start} - ${prevInfo.entryWindow.end}`
                                  : "—"}
                              </div>
                              <div className="text-right font-medium">
                                {formatHHMM(windows?.entryWindow.start)} -{" "}
                                {formatHHMM(windows?.entryWindow.end)}
                              </div>
                            </div>
                            {/* Exit window */}
                            <div className="grid grid-cols-3 items-center gap-2">
                              <div className="text-muted-foreground">Exit</div>
                              <div className="text-muted-foreground text-right">
                                {prevInfo?.exitWindow
                                  ? `${prevInfo.exitWindow.start} - ${prevInfo.exitWindow.end}`
                                  : "—"}
                              </div>
                              <div className="text-right font-medium">
                                {formatHHMM(windows?.exitWindow.start)} -{" "}
                                {formatHHMM(windows?.exitWindow.end)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={updateQRCode}
                          disabled={isUpdating}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={handleDownload}
                      disabled={!qrUrl}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={handleShare}
                      disabled={!qrUrl}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="h-12 w-full text-base font-medium"
                        disabled={isGenerating || !selectedRoomId || !windows}
                      >
                        <QrCode className="mr-2 h-5 w-5" />
                        {isGenerating
                          ? "Generating QR Code..."
                          : "Generate QR Code"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirm QR Generation
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Please review the details below before generating the
                          QR code.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="text-foreground space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Course week
                          </span>
                          <span className="font-medium">
                            {selectedCourse?.weekNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Room</span>
                          <span className="font-medium">
                            {selectedRoom
                              ? `${selectedRoom.building_number} ${selectedRoom.room_number}`
                              : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Geo validation
                          </span>
                          <span className="font-medium">
                            {validateGeo ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Radius</span>
                          <span className="font-medium">{radius} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Entry window
                          </span>
                          <span className="font-medium">
                            {formatHHMM(windows?.entryWindow.start)} -{" "}
                            {formatHHMM(windows?.entryWindow.end)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Exit window
                          </span>
                          <span className="font-medium">
                            {formatHHMM(windows?.exitWindow.start)} -{" "}
                            {formatHHMM(windows?.exitWindow.end)}
                          </span>
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={generateQRCode}
                          disabled={isGenerating}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {(!selectedRoomId || !windows) && (
                    <p className="mt-2 text-center text-xs text-red-500">
                      Please complete all configuration steps above
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Success overlay animation */}
        {successType && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            aria-live="polite"
            role="status"
          >
            <div className="flex flex-col items-center">
              <div className="success-pop rounded-full bg-white/95 p-4 shadow-2xl ring-1 ring-black/5">
                <svg
                  className="success-svg"
                  width="96"
                  height="96"
                  viewBox="0 0 96 96"
                  aria-hidden
                >
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    opacity="0.2"
                  />
                  <circle
                    className="success-ring"
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    className="success-check"
                    d="M32 50 L44 62 L66 38"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center">
                <div className="text-base font-semibold tracking-tight text-white">
                  {successType === "create" ? "QR generated" : "QR updated"}
                </div>
                <div className="text-xs text-white/80">
                  {successType === "create"
                    ? "Share or display it to students"
                    : "New settings applied successfully"}
                </div>
              </div>
            </div>
            <style jsx>{`
              .success-pop {
                animation: pop-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
              }
              .success-svg {
                filter: drop-shadow(0 6px 18px rgba(22, 163, 74, 0.35));
              }
              .success-ring {
                stroke-dasharray: 260;
                stroke-dashoffset: 260;
                animation: draw 700ms ease-out forwards 120ms;
              }
              .success-check {
                stroke-dasharray: 120;
                stroke-dashoffset: 120;
                animation: draw 520ms ease-out forwards 360ms;
              }
              @keyframes pop-in {
                0% {
                  transform: scale(0.85);
                  opacity: 0;
                }
                60% {
                  transform: scale(1.04);
                  opacity: 1;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
              @keyframes draw {
                to {
                  stroke-dashoffset: 0;
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};
