"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Shield } from "lucide-react";
import { CourseInfo } from "./types";

interface Props {
  courseInfo: CourseInfo;
  onRetry: () => void;
  cameraPermission: "pending" | "granted" | "denied";
}

export function ScanningScreen({
  courseInfo,
  onRetry,
  cameraPermission,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <p>
          Scanning for attendance in: <strong>{courseInfo.name}</strong>
        </p>
        <div className="bg-muted relative mx-auto h-64 w-64 overflow-hidden rounded-lg">
          {cameraPermission === "pending" && (
            <>
              <div className="border-muted-foreground absolute inset-4 rounded-lg border-2">
                <div className="border-primary absolute top-0 left-0 h-6 w-6 rounded-tl-lg border-t-4 border-l-4" />
                <div className="border-primary absolute top-0 right-0 h-6 w-6 rounded-tr-lg border-t-4 border-r-4" />
                <div className="border-primary absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4" />
                <div className="border-primary absolute right-0 bottom-0 h-6 w-6 rounded-br-lg border-r-4 border-b-4" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="text-muted-foreground h-12 w-12 opacity-50" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-primary h-0.5 w-full animate-pulse" />
              </div>
            </>
          )}

          {cameraPermission === "granted" && (
            <div id="qr-reader" className="h-full w-full" />
          )}

          {cameraPermission === "denied" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <Camera className="text-muted-foreground mb-2 h-12 w-12" />
              <p className="text-muted-foreground text-sm">
                Camera access is required to scan QR codes
              </p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">
            {cameraPermission === "pending" &&
              "Requesting camera permission..."}
            {cameraPermission === "granted" &&
              "Point camera at the QR code displayed by your lecturer"}
            {cameraPermission === "denied" &&
              "Camera access denied. Please allow camera access to scan QR codes."}
          </p>
          {cameraPermission === "granted" && (
            <div className="text-primary flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm">Scanning...</span>
            </div>
          )}
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your location is only used to verify your presence in class and is not
          stored permanently. The new one-tap system makes confirmation faster
          while maintaining security.
        </AlertDescription>
      </Alert>

      <Button onClick={onRetry} variant="outline" className="w-full">
        {cameraPermission === "denied"
          ? "Grant Camera Permission"
          : "Having trouble? Try manual check-in"}
      </Button>
    </div>
  );
}
