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
import { Card, CardContent } from "@/components/ui/card";
import apiClient from "@/lib/api/apiClient";
import { DayOfWeek, formatHHMM, getQrDateForWeek } from "@/lib/utils";
import { AxiosError } from "axios";
import {
  CheckSquare,
  Calendar,
  Clock,
  Download,
  Loader2,
  MapPin,
  QrCode,
  RadioIcon,
  Share2,
  Shield,
  Square,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQrGenContext, Windows } from "../qr-generation/qr-gen-context";
import {
  useGenerateQr,
  useGetQrCode,
  useGetQrCodes,
  useUpdateQr,
} from "../qr-generation/queries";

// TimeWindowSelector moved to the left settings column in NewQrGeneration

export const QRGenerator = () => {
  const {
    windows,
    selectedCourse,
    selectedRoom,
    validateGeo,
    radius,
    windowsConfigured,
    setWindows,
    setQrGenerated,
    setSelectedRoom,
    setValidateGeo,
    setRadius,
    setWindowsConfigured,
    currentCourse,
    selectedDayOfWeek,
  } = useQrGenContext();

  const router = useRouter();
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
  // Anchor for computing calendar date for selected week/day
  const anchorQr = useMemo(() => {
    const list = existingQrList?.data;
    if (!list || list.length === 0) return null;
    const earliest = [...list].sort((a, b) => a.week_number - b.week_number)[0];
    const date = (earliest.validities?.[0]?.start_time as string | undefined) || (earliest.createdAt as string);
    return { week_number: earliest.week_number, date } as { week_number: number; date: string };
  }, [existingQrList?.data]);

  const dateLabel = useMemo(() => {
    if (!selectedCourse) return null;
    try {
      const date = getQrDateForWeek(
        selectedDayOfWeek as DayOfWeek,
        selectedCourse.weekNumber,
        anchorQr
      );
      return `${selectedDayOfWeek}, ${date}`;
    } catch {
      return null;
    }
  }, [selectedCourse, selectedDayOfWeek, anchorQr]);
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
    dayOfWeek?: string | null;
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

  // Time windows are now configured via the left column component

  // Helper: format ISO datetime (string) into HH:mm
  const isoToHHMM = (iso?: string | null) =>
    iso ? formatHHMM(new Date(iso)) : "--:--";

  // Check if settings have changed from the existing QR
  const hasChanges = useMemo(() => {
    if (!prevInfo || !qrGenerated) return false;

    // Check room changes
    const currentRoomLabel = selectedRoom
      ? `Building ${selectedRoom.building_number}, Room ${selectedRoom.room_number}`
      : null;
    if (currentRoomLabel !== prevInfo.roomLabel) return true;

    // Check geo validation changes
    if (validateGeo !== prevInfo.validateGeo) return true;

    // Check radius changes
    if (radius !== prevInfo.radius) return true;

    // Check time window changes
    if (windows) {
      const currentEntryStart = formatHHMM(windows.entryWindow.start);
      const currentEntryEnd = formatHHMM(windows.entryWindow.end);
      const currentExitStart = formatHHMM(windows.exitWindow.start);
      const currentExitEnd = formatHHMM(windows.exitWindow.end);

      if (
        prevInfo.entryWindow &&
        (currentEntryStart !== prevInfo.entryWindow.start ||
          currentEntryEnd !== prevInfo.entryWindow.end)
      ) {
        return true;
      }

      if (
        prevInfo.exitWindow &&
        (currentExitStart !== prevInfo.exitWindow.start ||
          currentExitEnd !== prevInfo.exitWindow.end)
      ) {
        return true;
      }
    }

    // Check day-of-week change
    if (prevInfo?.dayOfWeek && selectedDayOfWeek !== prevInfo.dayOfWeek) {
      return true;
    }

    return false;
  }, [
    prevInfo,
    selectedRoom,
    validateGeo,
    radius,
    windows,
    qrGenerated,
    selectedDayOfWeek,
  ]);

  function handleDownload(): void {
    if (!qrUrl) return;
    try {
      const link = document.createElement("a");
      link.href = qrUrl;
      // Build filename: subjectCode-week[number].png
      const subject = (currentCourse?.code || "attendance").trim();
      const safeSubject = subject.replace(/[^a-zA-Z0-9_-]+/g, "-");
      const weekSuffix =
        selectedCourse?.weekNumber != null
          ? `-week${selectedCourse.weekNumber}`
          : "";
      link.download = `${safeSubject}${weekSuffix}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Unable to download QR image");
    }
  }

  async function handleShare(): Promise<void> {
    if (!qrUrl) return;
    // 1) Try native Web Share (mobile-friendly)
    try {
      const shareData = {
        title: "Attendance QR",
        text: selectedCourse
          ? `Week ${selectedCourse.weekNumber} attendance QR`
          : "Attendance QR",
        url: qrUrl,
      };
      const navShare = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        canShare?: (data?: ShareData) => boolean;
      };
      if (navShare?.canShare?.(shareData) || navShare?.share) {
        await navShare.share?.(shareData);
        return; // done if user shared
      }
    } catch {
      // user cancelled or share failed; continue to email fallback
    }

    // 2) Email fallback (opens default mail client with prefilled content)
    try {
      const subject = `Attendance QR${selectedCourse ? ` - Week ${selectedCourse.weekNumber}` : ""}`;
      const isHttp = /^https?:\/\//i.test(qrUrl);
      const isData = qrUrl.startsWith("data:");
      const bodyLines: string[] = ["Hello,", ""];
      if (isHttp) {
        bodyLines.push(
          "Here is the attendance QR code link:",
          qrUrl,
          "",
          "If the QR image doesn't load automatically, open the link above in a browser."
        );
      } else if (isData) {
        // Don't include the giant data URL in the email body; instead prompt user to attach the PNG
        // Proactively download so it's easy to attach
        handleDownload();
        bodyLines.push(
          "The attendance QR code image has been downloaded as 'attendance-qr.png'.",
          "Please attach it to this email before sending."
        );
      } else {
        bodyLines.push("Attendance QR code");
      }
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
      // Use location.href so it works on mobile and desktop
      window.location.href = mailto;
      toast.success("Opening your email client…");
      return;
    } catch {
      // ignore and try one last fallback
    }

    // 3) Clipboard as last resort
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(qrUrl);
        toast.success("QR link copied to clipboard");
      } else {
        toast.message("QR URL", { description: qrUrl });
      }
    } catch {
      // swallow
    }
  }

  const buildValidities = (w: Windows) => {
    const validities = [
      {
        start_time: formatHHMM(w.entryWindow.start),
        end_time: formatHHMM(w.entryWindow.end),
      },
      {
        start_time: formatHHMM(w.exitWindow.start),
        end_time: formatHHMM(w.exitWindow.end),
      },
    ];

    return validities;
  };

  const generateQRCode = async () => {
    if (!selectedCourse || !windows || !selectedRoomId || !windowsConfigured) {
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
        day_of_week: selectedDayOfWeek,
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
    if (
      !selectedCourse ||
      !windows ||
      !selectedRoomId ||
      !existingQrId ||
      !windowsConfigured
    ) {
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
        day_of_week: selectedDayOfWeek,
        validities,
      });

      const refreshed = await refetchExistingQr();
      if (refreshed.data?.qr_url) {
        setQrUrl(refreshed.data.qr_url);
      }
      // Update prevInfo snapshot so further updates require actual new changes
      setPrevInfo(info => {
        if (!info) return info;
        return {
          ...info,
          roomLabel: selectedRoom
            ? `Building ${selectedRoom.building_number}, Room ${selectedRoom.room_number}`
            : null,
          validateGeo,
          // radius and windows reflect current state
          radius,
          entryWindow: windows
            ? {
                start: formatHHMM(windows.entryWindow.start),
                end: formatHHMM(windows.entryWindow.end),
              }
            : info.entryWindow,
          exitWindow: windows
            ? {
                start: formatHHMM(windows.exitWindow.start),
                end: formatHHMM(windows.exitWindow.end),
              }
            : info.exitWindow,
          dayOfWeek: selectedDayOfWeek,
        };
      });
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

  function handleNavigateToTracking(): void {
    if (!selectedCourse?.sessionId) {
      toast.error("No session selected");
      return;
    }

    // Navigate to the real-time attendance tracking page with week_number
    const url = `/real-time-tracking/${selectedCourse.sessionId}?week_number=${selectedCourse.weekNumber}`;
    router.push(url);
  }

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

  // Fetch previous configuration for comparison in update dialog AND populate context state
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
          day_of_week?: string;
        }>(`/qr/${existingQrId}`);

        const first = data.validities.find(v => v.count === 1);
        const second = data.validities.find(v => v.count === 2);
        const roomLabel = data.location
          ? `Building ${data.location.building_number ?? ""}, Room ${data.location.room_number ?? ""}`.trim() ||
            null
          : null;

        if (!cancelled) {
          // Set previous info for comparison
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
            dayOfWeek: data.day_of_week || currentCourse?.dayOfWeek || null,
          });

          // Populate context state from existing QR data
          if (data.validate_geo != null) {
            setValidateGeo(data.validate_geo);
          }
          if (data.radius != null) {
            setRadius(data.radius);
          }

          // Set time windows if both entry and exit windows exist
          if (first && second) {
            // Parse the times from API and adjust to current date context
            const entryStartApi = new Date(first.start_time);
            const entryEndApi = new Date(first.end_time);
            const exitStartApi = new Date(second.start_time);
            const exitEndApi = new Date(second.end_time);

            // Create new Date objects with today's date but the saved times
            const today = new Date();
            const entryStart = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              entryStartApi.getHours(),
              entryStartApi.getMinutes(),
              entryStartApi.getSeconds()
            );
            const entryEnd = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              entryEndApi.getHours(),
              entryEndApi.getMinutes(),
              entryEndApi.getSeconds()
            );
            const exitStart = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              exitStartApi.getHours(),
              exitStartApi.getMinutes(),
              exitStartApi.getSeconds()
            );
            const exitEnd = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              exitEndApi.getHours(),
              exitEndApi.getMinutes(),
              exitEndApi.getSeconds()
            );

            setWindows({
              entryWindow: { start: entryStart, end: entryEnd },
              exitWindow: { start: exitStart, end: exitEnd },
            });
            // Mark as configured since we loaded from existing QR data
            setWindowsConfigured(true);
          }

          // Set room if location data is available and room_id exists
          if (data.location?.room_id) {
            // NOTE (bugfix): Previously we only looked up the room in the *session* rooms endpoint.
            // If the lecturer updated the QR to use a non-default room (not tied to the study session),
            // it wouldn't appear there, so the dropdown reset to empty on reload. We now:
            // 1. Try session rooms (fast, smaller set) for defaults.
            // 2. Fallback to all lecturer rooms if not found.
            try {
              // First: session rooms
              const sessionRoomsResp = await apiClient.get<{
                message: string;
                count: number;
                data: {
                  id: number;
                  building_number: string;
                  room_number: string;
                  description: string | null;
                  latitude: string | null;
                  longitude: string | null;
                  campus_id: number;
                  campus_name: string;
                }[];
              }>(`/lecturer/study-session/${selectedCourse?.sessionId}/rooms`);

              let roomData = sessionRoomsResp.data.data.find(
                room => room.id === data.location?.room_id
              );

              // Fallback: all lecturer rooms if not found among session defaults
              if (!roomData) {
                try {
                  const allRoomsResp = await apiClient.get<{
                    message: string;
                    count: number;
                    data: {
                      id: number;
                      building_number: string;
                      room_number: string;
                      description: string | null;
                      latitude: string | null;
                      longitude: string | null;
                      campus_id: number;
                      campus_name: string;
                    }[];
                  }>(`/lecturer/rooms`);
                  roomData = allRoomsResp.data.data.find(
                    room => room.id === data.location?.room_id
                  );
                } catch (allRoomsErr) {
                  console.error(
                    "Failed to fetch all lecturer rooms for fallback:",
                    allRoomsErr
                  );
                }
              }

              if (roomData) {
                setSelectedRoom(roomData);
              }
            } catch (roomErr) {
              console.error(
                "Failed to fetch room data (session rooms):",
                roomErr
              );
            }
          }
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
            dayOfWeek: currentCourse?.dayOfWeek || null,
          });

          // Try to populate context state from fallback data
          if (existingQrList?.data?.[0]) {
            const qrData = existingQrList.data[0];
            if (qrData.valid_radius != null) {
              setRadius(qrData.valid_radius);
            }

            // Set time windows from fallback data
            if (first && second) {
              // Parse the times from API and adjust to current date context
              const entryStartApi = new Date(first.start_time);
              const entryEndApi = new Date(first.end_time);
              const exitStartApi = new Date(second.start_time);
              const exitEndApi = new Date(second.end_time);

              // Create new Date objects with today's date but the saved times
              const today = new Date();
              const entryStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                entryStartApi.getHours(),
                entryStartApi.getMinutes(),
                entryStartApi.getSeconds()
              );
              const entryEnd = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                entryEndApi.getHours(),
                entryEndApi.getMinutes(),
                entryEndApi.getSeconds()
              );
              const exitStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                exitStartApi.getHours(),
                exitStartApi.getMinutes(),
                exitStartApi.getSeconds()
              );
              const exitEnd = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                exitEndApi.getHours(),
                exitEndApi.getMinutes(),
                exitEndApi.getSeconds()
              );

              setWindows({
                entryWindow: { start: entryStart, end: entryEnd },
                exitWindow: { start: exitStart, end: exitEnd },
              });
              // Mark as configured since we loaded from existing QR data
              setWindowsConfigured(true);
            }
          }
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    existingQrId,
    existingQrList?.data,
    selectedCourse?.sessionId,
    currentCourse?.dayOfWeek,
    setValidateGeo,
    setRadius,
    setWindows,
    setSelectedRoom,
    setWindowsConfigured,
  ]);

  // When lecturer switches session/week, reset local QR state first;
  // we'll repopulate if an existing QR for that week is fetched above.
  useEffect(() => {
    setQrUrl("");
    setQrGenerated(false);
    // Clear windows and other settings to avoid stale values from previous subject
    // These will be repopulated from existing QR data if available
    setWindows(null);
    setWindowsConfigured(false);
    setSelectedRoom(null);
    setValidateGeo(false);
    setRadius(100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse?.sessionId, selectedCourse?.weekNumber]);

  // Auto-dismiss the success animation after a short delay
  useEffect(() => {
    if (!successType) return;
    const t = setTimeout(() => setSuccessType(null), 1400);
    return () => clearTimeout(t);
  }, [successType]);

  return (
    <div className="w-full">
      {/* QR panel (used in a sticky container by parent) */}
      <div className="relative">
        <div className="absolute -top-3 left-4 z-10 bg-transparent px-2">
          <span className="bg-accent text-accent-foreground rounded-full px-2 py-1 text-xs font-medium">
            {qrGenerated ? "QR Code" : "Generate QR Code"}
          </span>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="space-y-3">
            <div className="text-center">
              {selectedCourse && (
                <div className="mb-1 flex items-center justify-center gap-2">
                  <span className="bg-accent text-accent-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {currentCourse?.code}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Week {selectedCourse.weekNumber}
                  </span>
                </div>
              )}
              <div className="relative mx-auto w-[clamp(250px,40vh,400px)]">
                {isChecking ? (
                  <div
                    className="bg-card flex w-full items-center justify-center rounded-lg border shadow"
                    style={{ aspectRatio: "1.15/1" }}
                  >
                    <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                  </div>
                ) : qrGenerated && qrUrl ? (
                  <div
                    className="bg-card flex w-full items-center justify-center rounded-lg border p-3 shadow"
                    style={{ aspectRatio: "1.15/1" }}
                  >
                    <Image
                      src={qrUrl}
                      alt="QR Code"
                      width={512}
                      height={512}
                      className="h-full w-full rounded object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="bg-muted flex w-full items-center justify-center rounded-lg border border-dashed"
                    style={{ aspectRatio: "1.15/1" }}
                  >
                    <div className="text-muted-foreground text-center">
                      <QrCode className="mx-auto mb-3 h-12 w-12" />
                      <p className="text-xs font-medium">
                        QR code has not been generated
                      </p>
                      <p className="text-[11px]">
                        Complete configuration above and click Generate
                      </p>
                    </div>
                  </div>
                )}

                {/* Inline configuration mini-status (only when not fully ready) */}
                {!qrGenerated && (
                  <div className="absolute inset-x-2 bottom-2">
                    <div className="bg-card/85 border-border flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-[11px] backdrop-blur-sm">
                      <span className="text-muted-foreground font-medium">
                        Configuration Status
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {selectedRoomId ? (
                            <CheckSquare className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Square className="text-muted-foreground h-3.5 w-3.5" />
                          )}
                          <span
                            className={`${selectedRoomId ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                          >
                            Room
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {windowsConfigured ? (
                            <CheckSquare className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Square className="text-muted-foreground h-3.5 w-3.5" />
                          )}
                          <span
                            className={`${windowsConfigured ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                          >
                            Time Windows
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration Overview */}
            <div className="space-y-3">
              {/* Detailed Configuration Overview (compact) */}
              {(selectedRoomId || windowsConfigured || qrGenerated) && (
                <div className="bg-muted/50 border-border rounded-lg border p-2">
                  <h4 className="text-foreground mb-2 flex items-center gap-2 text-xs font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    Current Configuration
                  </h4>
                  <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 text-[12px]">
                    <span className="text-muted-foreground">WEEK</span>
                    <span className="text-foreground font-medium">
                      {selectedCourse?.weekNumber || "—"}
                    </span>

                    <span className="text-muted-foreground">ROOM</span>
                    <span className="text-foreground font-medium">
                      {selectedRoom ? (
                        <>
                          {`Building ${selectedRoom.building_number}, Room ${selectedRoom.room_number}`}
                          {selectedRoom.campus_name && (
                            <span className="text-muted-foreground ml-2 text-[11px]">
                              — {selectedRoom.campus_name}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Not selected
                        </span>
                      )}
                    </span>

                    <span className="text-muted-foreground">
                      GEO VALIDATION
                    </span>
                    <span className="text-foreground flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${validateGeo ? "bg-primary" : "bg-muted-foreground"}`}
                      ></span>
                      <span className="text-[12px]">
                        {validateGeo ? "Enabled" : "Disabled"}
                      </span>
                      {validateGeo && (
                        <span className="text-muted-foreground ml-2 text-[11px]">
                          • {radius}m
                        </span>
                      )}
                    </span>

                    {windows && (
                      <>
                        <span className="text-muted-foreground">WINDOWS</span>
                        <span className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[11px] text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              Entry
                            </span>
                            <span className="text-foreground font-mono text-[12px]">
                              {formatHHMM(windows.entryWindow.start)}-
                              {formatHHMM(windows.entryWindow.end)}
                            </span>
                          </span>
                          <span className="bg-border h-3 w-px"></span>
                          <span className="inline-flex items-center gap-1">
                            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[11px] text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              Exit
                            </span>
                            <span className="text-foreground font-mono text-[12px]">
                              {formatHHMM(windows.exitWindow.start)}-
                              {formatHHMM(windows.exitWindow.end)}
                            </span>
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action area */}
            <div className="mx-auto max-w-sm space-y-2.5">
              {qrGenerated ? (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="h-9 w-full text-sm font-medium"
                        disabled={
                          isUpdating ||
                          !selectedRoomId ||
                          !windowsConfigured ||
                          !existingQrId ||
                          !hasChanges
                        }
                      >
                        {isUpdating
                          ? "Updating QR Code..."
                          : hasChanges
                            ? "Update QR Code"
                            : "No Changes to Update"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-accent max-w-lg border-t-2">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <div className="bg-accent/20 text-accent-foreground ring-accent/30 flex h-8 w-8 items-center justify-center rounded-lg ring-1">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </div>
                          Update QR Code
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          <span className="mb-1 inline-flex flex-wrap items-center gap-2">
                            <span className="bg-accent text-accent-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                              {currentCourse?.code}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              Week {selectedCourse?.weekNumber}
                            </span>
                          {dateLabel && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              <Calendar className="mr-1 h-3.5 w-3.5" />
                              {dateLabel}
                            </span>
                          )}
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="space-y-2.5">
                        {(() => {
                          const currentRoomLabel = selectedRoom
                            ? `Building ${selectedRoom.building_number}, Room ${selectedRoom.room_number}`
                            : null;
                          const hasRoomChange =
                            currentRoomLabel !== prevInfo?.roomLabel;
                          const hasGeoChange =
                            validateGeo !== prevInfo?.validateGeo;
                          const hasRadiusChange = radius !== prevInfo?.radius;
                          const currentEntryStart = formatHHMM(
                            windows?.entryWindow.start
                          );
                          const currentEntryEnd = formatHHMM(
                            windows?.entryWindow.end
                          );
                          const hasEntryChange = Boolean(
                            windows &&
                              prevInfo?.entryWindow &&
                              (currentEntryStart !==
                                prevInfo.entryWindow.start ||
                                currentEntryEnd !== prevInfo.entryWindow.end)
                          );
                          const currentExitStart = formatHHMM(
                            windows?.exitWindow.start
                          );
                          const currentExitEnd = formatHHMM(
                            windows?.exitWindow.end
                          );
                          const hasExitChange = Boolean(
                            windows &&
                              prevInfo?.exitWindow &&
                              (currentExitStart !== prevInfo.exitWindow.start ||
                                currentExitEnd !== prevInfo.exitWindow.end)
                          );

                          const rows: React.ReactNode[] = [];
                          const hasDayChange = Boolean(
                            prevInfo?.dayOfWeek &&
                              selectedDayOfWeek !== prevInfo.dayOfWeek
                          );
                          if (hasDayChange) {
                            rows.push(
                              <div
                                key="day"
                                className="grid grid-cols-[160px_1fr_1fr] items-center gap-3 px-3 py-2"
                              >
                                <div className="text-foreground flex items-center gap-2 text-sm font-medium">
                                  <Clock className="text-primary h-4 w-4" />
                                  <span>Day of Week</span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {prevInfo?.dayOfWeek}
                                </div>
                                <div className="text-primary text-xs font-medium">
                                  {selectedDayOfWeek}
                                </div>
                              </div>
                            );
                          }
                          if (hasRoomChange) {
                            rows.push(
                              <div
                                key="room"
                                className="grid grid-cols-[160px_1fr_1fr] items-center gap-3 px-3 py-2"
                              >
                                <div className="text-foreground flex items-center gap-2 text-sm font-medium">
                                  <MapPin className="text-primary h-4 w-4" />
                                  <span>Room Location</span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {prevInfo?.roomLabel || "None"}
                                </div>
                                <div className="text-primary text-xs font-medium">
                                  {currentRoomLabel || "None"}
                                </div>
                              </div>
                            );
                          }
                          if (hasGeoChange) {
                            rows.push(
                              <div
                                key="geo"
                                className="grid grid-cols-[160px_1fr_1fr] items-center gap-3 px-3 py-2"
                              >
                                <div className="text-foreground flex items-center gap-2 text-sm font-medium">
                                  <Shield className="text-primary h-4 w-4" />
                                  <span>Geo Validation</span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {prevInfo?.validateGeo == null
                                    ? "Unknown"
                                    : prevInfo?.validateGeo
                                      ? "Enabled"
                                      : "Disabled"}
                                </div>
                                <div className="text-primary text-xs font-medium">
                                  {validateGeo ? "Enabled" : "Disabled"}
                                </div>
                              </div>
                            );
                          }
                          if (hasRadiusChange) {
                            rows.push(
                              <div
                                key="radius"
                                className="grid grid-cols-[160px_1fr_1fr] items-center gap-3 px-3 py-2"
                              >
                                <div className="text-foreground flex items-center gap-2 text-sm font-medium">
                                  <Shield className="text-primary h-4 w-4" />
                                  <span>Validation Radius</span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {prevInfo?.radius != null
                                    ? `${prevInfo.radius}m`
                                    : "Not set"}
                                </div>
                                <div className="text-primary text-xs font-medium">
                                  {radius}m
                                </div>
                              </div>
                            );
                          }
                          if (hasEntryChange) {
                            rows.push(
                              <div
                                key="entry"
                                className="grid grid-cols-[160px_1fr_1fr] items-center gap-3 px-3 py-2"
                              >
                                <div className="text-foreground flex items-center gap-2 text-sm font-medium">
                                  <Clock className="text-primary h-4 w-4" />
                                  <span>Check-in Window</span>
                                </div>
                                <div className="text-muted-foreground font-mono text-xs">
                                  {prevInfo?.entryWindow
                                    ? `${prevInfo.entryWindow.start}-${prevInfo.entryWindow.end}`
                                    : "Not set"}
                                </div>
                                <div className="text-primary font-mono text-xs font-medium">
                                  {currentEntryStart}-{currentEntryEnd}
                                </div>
                              </div>
                            );
                          }
                          if (hasExitChange) {
                            rows.push(
                              <div
                                key="exit"
                                className="grid grid-cols-[160px_1fr_1fr] items-center gap-3 px-3 py-2"
                              >
                                <div className="text-foreground flex items-center gap-2 text-sm font-medium">
                                  <Clock className="text-primary h-4 w-4" />
                                  <span>Check-out Window</span>
                                </div>
                                <div className="text-muted-foreground font-mono text-xs">
                                  {prevInfo?.exitWindow
                                    ? `${prevInfo.exitWindow.start}-${prevInfo.exitWindow.end}`
                                    : "Not set"}
                                </div>
                                <div className="text-primary font-mono text-xs font-medium">
                                  {currentExitStart}-{currentExitEnd}
                                </div>
                              </div>
                            );
                          }

                          if (rows.length === 0) {
                            return (
                              <div className="text-muted-foreground py-6 text-center text-xs">
                                No changes detected
                              </div>
                            );
                          }

                          return (
                            <div className="border-border overflow-hidden rounded-lg border">
                              <div className="bg-muted/50 text-muted-foreground grid grid-cols-[160px_1fr_1fr] gap-3 px-3 py-2 text-[11px] font-medium">
                                <div>Setting</div>
                                <div>From</div>
                                <div>To</div>
                              </div>
                              <div className="divide-border divide-y">
                                {rows}
                              </div>
                            </div>
                          );
                        })()}
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-9 flex-1 bg-transparent"
                      onClick={handleDownload}
                      disabled={!qrUrl}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 flex-1 bg-transparent"
                      onClick={handleShare}
                      disabled={!qrUrl}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>

                  {/* Real-time Attendance Tracking Button */}
                  <Button
                    variant="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-9 w-full"
                    onClick={handleNavigateToTracking}
                    disabled={!qrGenerated || !selectedCourse?.sessionId}
                  >
                    <RadioIcon className="mr-2 h-4 w-4" />
                    Real-time Attendance Tracking
                  </Button>
                </>
              ) : (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="h-10 w-full text-sm font-medium"
                        disabled={
                          isGenerating || !selectedRoomId || !windowsConfigured
                        }
                      >
                        <QrCode className="mr-2 h-5 w-5" />
                        {isGenerating
                          ? "Generating QR Code..."
                          : "Generate QR Code"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-accent max-w-lg border-t-2">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-800/50">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4"
                              />
                            </svg>
                          </div>
                          Generate QR Code
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          <span className="mb-1 inline-flex flex-wrap items-center gap-2">
                            <span className="bg-accent text-accent-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                              {currentCourse?.code}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              Week {selectedCourse?.weekNumber}
                            </span>
                          {dateLabel && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              <Calendar className="mr-1 h-3.5 w-3.5" />
                              {dateLabel}
                            </span>
                          )}
                          </span>
                          <span className="text-muted-foreground mt-1 block">
                            Review configuration before generating
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="space-y-3">
                        {/* Room Configuration */}
                        <div className="bg-muted/40 border-border before:bg-accent relative flex items-center justify-between rounded-lg border p-3 pl-4 before:absolute before:top-0 before:left-0 before:h-full before:w-1 before:rounded-l">
                          <div>
                            <p className="text-foreground text-sm font-medium">
                              Room Location
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Physical location for validation
                            </p>
                          </div>
                          <span className="text-primary text-sm font-semibold">
                            {selectedRoom
                              ? `Building ${selectedRoom.building_number}, Room ${selectedRoom.room_number}`
                              : "No room selected"}
                          </span>
                        </div>

                        {/* Geo Validation */}
                        <div className="bg-muted/40 border-border before:bg-accent relative flex items-center justify-between rounded-lg border p-3 pl-4 before:absolute before:top-0 before:left-0 before:h-full before:w-1 before:rounded-l">
                          <div>
                            <p className="text-foreground text-sm font-medium">
                              Geo Validation
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {validateGeo
                                ? `${radius}m radius validation`
                                : "Location validation disabled"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${validateGeo ? "bg-primary" : "bg-muted-foreground"}`}
                            ></div>
                            <span className="text-primary text-sm font-semibold">
                              {validateGeo ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </div>

                        {/* Time Windows */}
                        <div className="bg-muted/50 border-border rounded-lg border p-3">
                          <p className="text-foreground mb-2 text-sm font-medium">
                            Attendance Windows
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground mb-1 flex items-center gap-1.5 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                Check-in
                              </p>
                              <p className="rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 font-mono text-green-700 shadow-sm dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                                {formatHHMM(windows?.entryWindow.start)} -{" "}
                                {formatHHMM(windows?.entryWindow.end)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 flex items-center gap-1.5 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                                Check-out
                              </p>
                              <p className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-mono text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                                {formatHHMM(windows?.exitWindow.start)} -{" "}
                                {formatHHMM(windows?.exitWindow.end)}
                              </p>
                            </div>
                          </div>
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
                  {(!selectedRoomId || !windowsConfigured) && (
                    <p className="mt-2 text-center text-[11px] text-red-500">
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
