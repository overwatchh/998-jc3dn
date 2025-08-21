"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Shield } from "lucide-react";
import { CourseInfo } from "./types";

interface Props {
  courseInfo: CourseInfo;
  onRetry: () => void;
}

export function ScanningScreen({ courseInfo, onRetry }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <p>
          Scanning for attendance in: <strong>{courseInfo.name}</strong>
        </p>
        <div className="relative w-64 h-64 mx-auto bg-muted rounded-lg overflow-hidden">
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
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Point camera at the QR code displayed by your lecturer
          </p>
          <div className="flex items-center justify-center text-primary">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span className="text-sm">Scanning...</span>
          </div>
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
        Having trouble? Try manual check-in
      </Button>
    </div>
  );
}
