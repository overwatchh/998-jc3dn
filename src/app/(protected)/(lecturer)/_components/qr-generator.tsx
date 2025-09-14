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

  // When lecturer switches session/week, reset local QR state first;
  // we'll repopulate if an existing QR for that week is fetched above.
  useEffect(() => {
    setQrUrl("");
    setQrGenerated(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse?.sessionId, selectedCourse?.weekNumber]);

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
                          Please review the details below before updating the QR
                          code.
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
      </div>
    </div>
  );
};
