"use client";

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
import { AxiosError } from "axios";
import { format } from "date-fns";
import { ArrowLeft, Download, QrCode, Share2, Users } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import {
  useGenerateQr,
  useGetCheckedInStudents,
  useGetCourses,
  useGetLecturerRooms,
  useGetQrCode,
  useGetQrCodes,
  useUpdateQr,
} from "../qr-generation/queries";
import { QRGenScreens } from "../qr-generation/types";
import { RoomSelector } from "./room-selector";
import { SessionHeader } from "./session-header";
import { TimeWindowSelector } from "./time-window-selector";

export function NewQrGeneration() {
  const { setCurrentScreen, selectedCourse } = useQrGenContext();
  const { data: courses } = useGetCourses();

  // Get current course info
  const currentCourse = courses?.find(c => c.id === selectedCourse?.sessionId);

  // Set default class times based on course schedule
  const classStartTime = new Date();
  const classEndTime = new Date();

  if (currentCourse) {
    const [startHour, startMin] = currentCourse.startTime
      .split(":")
      .map(Number);
    const [endHour, endMin] = currentCourse.endTime.split(":").map(Number);

    classStartTime.setHours(startHour, startMin, 0, 0);
    classEndTime.setHours(endHour, endMin, 0, 0);
  } else {
    classStartTime.setHours(9, 0, 0, 0);
    classEndTime.setHours(11, 0, 0, 0);
  }

  const [windows, setWindows] = useState<{
    entryWindow: { start: Date; end: Date };
    exitWindow: { start: Date; end: Date };
  } | null>(null);

  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [validateGeo, setValidateGeo] = useState(true);
  const [radius, setRadius] = useState(100);

  const { mutateAsync: generateQr, isPending: isGenerating } = useGenerateQr(
    selectedCourse?.sessionId || 0
  );
  const { mutateAsync: updateQr, isPending: isUpdating } = useUpdateQr(
    selectedCourse?.sessionId || 0
  );
  const { data: roomsData } = useGetLecturerRooms();

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

  // Get live check-ins data
  const { data: checkedInData } = useGetCheckedInStudents(
    selectedCourse?.sessionId || 0,
    selectedCourse?.weekNumber,
    {
      enabled: !!selectedCourse && qrGenerated,
      refetchInterval: 5000,
    }
  );

  const handleWindowChange = useCallback(
    (newWindows: {
      entryWindow: { start: Date; end: Date };
      exitWindow: { start: Date; end: Date };
    }) => {
      setWindows(newWindows);
    },
    []
  );

  const handleRoomSelect = useCallback((roomId: number) => {
    setSelectedRoomId(roomId);
  }, []);

  // If an existing QR is present for the selected week, show it by default
  useEffect(() => {
    if (!qrGenerated && existingQrData?.qr_url) {
      setQrUrl(existingQrData.qr_url);
      setQrGenerated(true);
    }
  }, [existingQrData?.qr_url, qrGenerated]);

  const generateQRCode = async () => {
    if (!selectedCourse || !windows || !selectedRoomId) {
      toast.error("Please select a room and configure time windows first");
      return;
    }

    try {
      // Format time windows for API
      const formatTime = (date: Date) => {
        return date.toTimeString().slice(0, 5); // HH:MM format
      };

      const validities = [
        {
          start_time: formatTime(windows.entryWindow.start),
          end_time: formatTime(windows.entryWindow.end),
        },
        {
          start_time: formatTime(windows.exitWindow.start),
          end_time: formatTime(windows.exitWindow.end),
        },
      ];

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
      const formatTime = (date: Date) => {
        return date.toTimeString().slice(0, 5);
      };

      const validities = [
        {
          start_time: formatTime(windows.entryWindow.start),
          end_time: formatTime(windows.entryWindow.end),
        },
        {
          start_time: formatTime(windows.exitWindow.start),
          end_time: formatTime(windows.exitWindow.end),
        },
      ];

      await updateQr({
        qr_code_id: existingQrId,
        radius,
        valid_room_id: selectedRoomId,
        validate_geo: validateGeo,
        validities,
      });

      await refetchExistingQr();
      if (existingQrData?.qr_url) {
        setQrUrl(existingQrData.qr_url);
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

  const selectedRoom = selectedRoomId
    ? roomsData?.data.find(r => r.id === selectedRoomId)
    : undefined;

  const formatTimeHHMM = (date?: Date) =>
    date ? date.toTimeString().slice(0, 5) : "--:--";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setCurrentScreen(QRGenScreens.COURSE_SELECTION)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <span className="text-sm text-gray-500">QR Code Generation</span>
        </div>

        <SessionHeader />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
            <RoomSelector
              onRoomSelect={handleRoomSelect}
              validateGeo={validateGeo}
              onValidateGeoChange={setValidateGeo}
              radius={radius}
              onRadiusChange={setRadius}
            />
          </div>

          <div className="order-1 space-y-6 lg:order-2 lg:col-span-3">
            {qrGenerated ? (
              <>
                {/* QR Code First when available */}
                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 bg-white px-2">
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
                              {isUpdating
                                ? "Updating QR Code..."
                                : "Update QR Code"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirm Update
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Please review the details below before updating
                                the QR code.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2 text-sm text-gray-700">
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Course week
                                </span>
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
                                <span className="text-gray-500">
                                  Geo validation
                                </span>
                                <span className="font-medium">
                                  {validateGeo ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Radius</span>
                                <span className="font-medium">{radius} m</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Entry window
                                </span>
                                <span className="font-medium">
                                  {formatTimeHHMM(windows?.entryWindow.start)} -{" "}
                                  {formatTimeHHMM(windows?.entryWindow.end)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Exit window
                                </span>
                                <span className="font-medium">
                                  {formatTimeHHMM(windows?.exitWindow.start)} -{" "}
                                  {formatTimeHHMM(windows?.exitWindow.end)}
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
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50"
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
                                <span className="text-xs text-green-600">
                                  ✓
                                </span>
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
                                <span className="text-xs text-green-600">
                                  ✓
                                </span>
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
                              disabled={
                                isGenerating || !selectedRoomId || !windows
                              }
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
                                Please review the details below before
                                generating the QR code.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2 text-sm text-gray-700">
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Course week
                                </span>
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
                                <span className="text-gray-500">
                                  Geo validation
                                </span>
                                <span className="font-medium">
                                  {validateGeo ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Radius</span>
                                <span className="font-medium">{radius} m</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Entry window
                                </span>
                                <span className="font-medium">
                                  {formatTimeHHMM(windows?.entryWindow.start)} -{" "}
                                  {formatTimeHHMM(windows?.entryWindow.end)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Exit window
                                </span>
                                <span className="font-medium">
                                  {formatTimeHHMM(windows?.exitWindow.start)} -{" "}
                                  {formatTimeHHMM(windows?.exitWindow.end)}
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
        </div>

        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-900">
                <Users className="h-4 w-4" />
                Live Attendance
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">Live</span>
                  <span className="text-xs text-gray-500">
                    Last updated: {format(new Date(), "hh:mm:ss a")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Users className="mr-1 h-4 w-4" />
                  View All Attendance
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            {qrGenerated && checkedInData && checkedInData.count > 0 ? (
              <div className="space-y-3">
                {checkedInData.data.slice(0, 5).map(student => (
                  <div
                    key={`${student.student_id}-${student.checkin_time}`}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.student_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {student.student_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(student.checkin_time).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Window {student.validity_count}/2
                      </p>
                    </div>
                  </div>
                ))}
                {checkedInData.count > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{checkedInData.count - 5} more students checked in
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="mb-1 text-sm text-gray-600">
                  {qrGenerated
                    ? "No check-ins yet"
                    : "QR code has not been generated"}
                </p>
                <p className="text-xs text-gray-500">
                  {qrGenerated
                    ? "Students will appear here once they start scanning"
                    : "Check-ins will appear here once students start scanning"}
                </p>
              </div>
            )}
          </CardContent>

          <div className="border-t border-gray-200 px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {checkedInData?.count || 0}
                </div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">--</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {checkedInData?.count ? "100%" : "0%"}
                </div>
                <div className="text-sm text-gray-600">Rate</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
