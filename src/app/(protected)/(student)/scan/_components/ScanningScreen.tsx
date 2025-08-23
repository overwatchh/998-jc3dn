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
      <div className="text-center space-y-4">
        <p>
          Scanning for attendance in: <strong>{courseInfo.name}</strong>
        </p>
        <div className="relative w-64 h-64 mx-auto bg-muted rounded-lg overflow-hidden">
          {cameraPermission === "pending" && (
            <>
              <div className="absolute inset-4 border-2 border-muted-foreground rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-primary animate-pulse" />
              </div>
            </>
          )}

          {cameraPermission === "granted" && (
            <div id="qr-reader" className="w-full h-full" />
          )}

          {cameraPermission === "denied" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <Camera className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center justify-center text-primary">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
