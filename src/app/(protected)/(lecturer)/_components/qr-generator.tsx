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
import { Download, QrCode, Share2 } from "lucide-react";
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
  } = useQrGenContext();
  const { mutateAsync: generateQr, isPending: isGenerating } = useGenerateQr(
    selectedCourse?.sessionId || 0
  );
  const { mutateAsync: updateQr, isPending: isUpdating } = useUpdateQr(
    selectedCourse?.sessionId || 0
  );

  // Fetch existing QR for this session/week
  const { data: existingQrList } = useGetQrCodes(
    selectedCourse?.sessionId || 0,
    selectedCourse?.weekNumber,
    { enabled: !!selectedCourse }
  );
  const existingQrId = existingQrList?.data?.[0]?.qr_code_id;
  const { data: existingQrData, refetch: refetchExistingQr } = useGetQrCode(
    selectedCourse?.sessionId || 0,
    existingQrId || 0,
    { enabled: !!existingQrId }
  );
  const [qrUrl, setQrUrl] = useState<string>("");
  const qrGenerated = useMemo(() => Boolean(qrUrl), [qrUrl]);

  const selectedRoomId = 1; // Example state

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

  const handleWindowChange = () => {
    // Example state
  };

  function handleDownload(): void {
    throw new Error("Function not implemented.");
  }

  function handleShare(): void {
    throw new Error("Function not implemented.");
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
  // If an existing QR is present for the selected week, show it by default
  useEffect(() => {
    if (!qrGenerated && existingQrData?.qr_url) {
      setQrUrl(existingQrData.qr_url);
    }
  }, [existingQrData?.qr_url, qrGenerated]);

  return (
    <div className="order-1 space-y-6 lg:order-2 lg:col-span-3">
      {qrGenerated ? (
        <>
          {/* QR Code First when available */}
          <div className="relative">
            <div className="absolute -top-3 left-4 z-10 bg-transparent">
              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
                QR Code
              </span>
            </div>
            <Card className="border-gray-200 bg-white">
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  QR Code
                </CardTitle>
                <p className="mt-2 text-sm text-gray-600">
                  Show or update the attendance QR code
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  {qrUrl ? (
                    <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 bg-white shadow-lg">
                      <Image
                        src={qrUrl}
                        alt="QR Code"
                        width={180}
                        height={180}
                        className="rounded"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="mx-auto max-w-md space-y-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="h-10 w-full bg-black text-sm font-medium text-white hover:bg-gray-800"
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
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Course week</span>
                          <span className="font-medium">
                            {selectedCourse?.weekNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Room</span>
                          <span className="font-medium">
                            {selectedRoom
                              ? `${selectedRoom.building_number} ${selectedRoom.room_number}`
                              : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Geo validation</span>
                          <span className="font-medium">
                            {validateGeo ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Radius</span>
                          <span className="font-medium">{radius} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Entry window</span>
                          <span className="font-medium">
                            {formatHHMM(windows?.entryWindow.start)} -{" "}
                            {formatHHMM(windows?.entryWindow.end)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Exit window</span>
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
                      className="flex-1 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50"
                      onClick={handleDownload}
                      disabled={!qrUrl}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50"
                      onClick={handleShare}
                      disabled={!qrUrl}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Windows Second when QR exists */}
          <div className="relative">
            <div className="absolute -top-3 left-4 bg-white px-2">
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                Time Windows
              </span>
            </div>
            <TimeWindowSelector
              classStartTime={classStartTime}
              classEndTime={classEndTime}
              onChange={handleWindowChange}
            />
          </div>
        </>
      ) : (
        <>
          {/* Step 1: Time Windows Configuration */}
          <div className="relative">
            <div className="absolute -top-3 left-4 bg-white px-2">
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                Step 1: Configure Time Windows
              </span>
            </div>
            <TimeWindowSelector
              classStartTime={classStartTime}
              classEndTime={classEndTime}
              onChange={handleWindowChange}
            />
          </div>

          {/* Step 2: QR Code Generation */}
          <div className="relative">
            <div className="absolute -top-3 left-4 z-10 bg-white px-2">
              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
                Step 2: Generate QR Code
              </span>
            </div>
            <Card className="border-gray-200 bg-white">
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  QR Code Generation
                </CardTitle>
                <p className="mt-2 text-sm text-gray-600">
                  Generate attendance QR code for your session
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed bg-gray-100">
                    <div className="text-center text-gray-400">
                      <QrCode className="mx-auto mb-3 h-16 w-16" />
                      <p className="text-sm font-medium">
                        QR code has not been generated
                      </p>
                      <p className="text-xs">
                        Complete configuration above and click Generate
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Status */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-900">
                    Configuration Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedRoomId ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                          <span className="text-xs text-green-600">✓</span>
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                          <span className="text-xs text-gray-400">○</span>
                        </div>
                      )}
                      <span
                        className={`text-sm ${selectedRoomId ? "text-green-600" : "text-gray-500"}`}
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
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                          <span className="text-xs text-gray-400">○</span>
                        </div>
                      )}
                      <span
                        className={`text-sm ${windows ? "text-green-600" : "text-gray-500"}`}
                      >
                        Time windows configured
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mx-auto max-w-md">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="h-12 w-full bg-black text-base font-medium text-white hover:bg-gray-800"
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
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Course week</span>
                          <span className="font-medium">
                            {selectedCourse?.weekNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Room</span>
                          <span className="font-medium">
                            {selectedRoom
                              ? `${selectedRoom.building_number} ${selectedRoom.room_number}`
                              : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Geo validation</span>
                          <span className="font-medium">
                            {validateGeo ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Radius</span>
                          <span className="font-medium">{radius} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Entry window</span>
                          <span className="font-medium">
                            {formatHHMM(windows?.entryWindow.start)} -{" "}
                            {formatHHMM(windows?.entryWindow.end)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Exit window</span>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
