"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Camera, CameraOff, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function QRScanner() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes.length > 0) {
      setIsScanning(false);
      router.push(detectedCodes[0].rawValue);
    }
  };

  const handleError = (error: unknown) => {
    console.error("QR Scanner error:", error);
    setError("Camera access failed. Please check your camera permissions.");
    setHasPermission(false);
  };

  const retryCamera = () => {
    setError(null);
    setHasPermission(null);
    setIsScanning(true);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={retryCamera} className="w-full" variant="outline">
          <Camera className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera Status */}
      <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
        {hasPermission === null ? (
          <>
            <Camera className="h-4 w-4 animate-pulse" />
            <span>Requesting camera access...</span>
          </>
        ) : hasPermission ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Camera ready</span>
          </>
        ) : (
          <>
            <CameraOff className="h-4 w-4 text-red-500" />
            <span>Camera unavailable</span>
          </>
        )}
      </div>

      {/* Scanner Container */}
      <div className="relative">
        <div className="bg-muted border-muted-foreground/25 mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg border-2 border-dashed">
          {isScanning && (
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{
                facingMode: "environment", // Use back camera on mobile
              }}
              styles={{
                container: {
                  width: "100%",
                  height: "100%",
                },
                video: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                },
              }}
            />
          )}
        </div>

        {/* Scanning overlay */}
        {isScanning && hasPermission && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border-primary h-48 w-48 animate-pulse rounded-lg border-2 opacity-50" />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-muted-foreground text-center text-sm">
        {hasPermission === null
          ? "Initializing camera..."
          : hasPermission
            ? "Position QR code within the frame"
            : "Camera access required for scanning"}
      </div>
    </div>
  );
}
