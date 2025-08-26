"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Html5Qrcode } from "html5-qrcode";
import { Bell, Navigation, RotateCcw, Shield } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ConfirmationScreen,
  ConfirmingScreen,
  ErrorScreen,
  ExpiredScreen,
  LocationVerifyScreen,
  QRSuccessScreen,
  ScanningScreen,
  SuccessScreen,
  WaitingScreen,
  type CourseInfo,
  type ScanState,
} from "./_components";

interface QRScannerState {
  scanState: ScanState;
  scannedCourse: CourseInfo;
  locationAccuracy: number;
  locationStatus: "checking" | "verified" | "failed";
  confirmationWindowEnd: number | null;
  sessionToken: string;
  cameraPermission: "pending" | "granted" | "denied";
  qrScanner: Html5Qrcode | null;
}

export default function QRScannerScreen() {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showConfirmationBanner, setShowConfirmationBanner] = useState(false);

  const defaultScannerState: QRScannerState = {
    scanState: "scanning",
    scannedCourse: {
      name: "Computer Science 101",
      location: "Room A-204",
      time: "9:00 AM - 10:30 AM",
      instructor: "Dr. Sarah Johnson",
    },
    locationAccuracy: 0,
    locationStatus: "checking",
    confirmationWindowEnd: null,
    sessionToken: "",
    cameraPermission: "pending",
    qrScanner: null,
  };

  const [qrScannerState, setQRScannerState] =
    useState<QRScannerState>(defaultScannerState);
  const {
    scanState,
    scannedCourse,
    locationAccuracy,
    locationStatus,
    confirmationWindowEnd,
    cameraPermission,
    qrScanner,
  } = qrScannerState;

  // Request camera permission and initialize QR scanner
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        // Check if camera is available
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === "videoinput");

        if (!hasCamera) {
          setQRScannerState(prev => ({ ...prev, cameraPermission: "denied" }));
          return;
        }

        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Use back camera on mobile
        });

        // Stop the stream as we don't need it directly
        stream.getTracks().forEach(track => track.stop());

        // Initialize QR scanner
        const scanner = new Html5Qrcode("qr-reader");

        setQRScannerState(prev => ({
          ...prev,
          cameraPermission: "granted",
          qrScanner: scanner,
        }));
      } catch (error) {
        console.error("Camera permission denied or error:", error);
        setQRScannerState(prev => ({ ...prev, cameraPermission: "denied" }));
      }
    };

    if (cameraPermission === "pending") {
      requestCameraPermission();
    }
  }, [cameraPermission]);

  // Timer for confirmation window
  useEffect(() => {
    if (confirmationWindowEnd && scanState === "confirmation-active") {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, confirmationWindowEnd - now);
        setTimeRemaining(Math.ceil(remaining / 1000));

        if (remaining <= 0) {
          setQRScannerState(prev => ({ ...prev, scanState: "window-expired" }));
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [confirmationWindowEnd, scanState, setQRScannerState]);

  // Simulate confirmation window opening
  useEffect(() => {
    if (scanState === "waiting-for-window") {
      // Simulate lecturer opening confirmation window after 5-15 seconds
      const delay = Math.random() * 10000 + 5000; // 5-15 seconds
      const timer = setTimeout(() => {
        const windowEnd = Date.now() + 60000; // 60 second window
        setQRScannerState(prev => ({
          ...prev,
          scanState: "confirmation-active",
          confirmationWindowEnd: windowEnd,
        }));
        setShowConfirmationBanner(true);
        // Hide banner after 3 seconds
        setTimeout(() => setShowConfirmationBanner(false), 3000);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [scanState, setQRScannerState]);

  // Start QR scanning when camera is ready and in scanning state
  useEffect(() => {
    if (
      scanState === "scanning" &&
      cameraPermission === "granted" &&
      qrScanner
    ) {
      const startScanning = async () => {
        try {
          await qrScanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText: string) => {
              // QR code detected
              console.log("QR Code detected:", decodedText);

              // Stop scanning
              qrScanner.stop().catch(console.error);

              // Update state to show QR success
              setQRScannerState(prev => ({ ...prev, scanState: "qr-success" }));

              // Show course info for 2 seconds, then start location verification
              setTimeout(() => {
                setQRScannerState(prev => ({
                  ...prev,
                  scanState: "location-verify",
                }));
                simulateLocationVerification();
              }, 2000);
            },
            (errorMessage: string) => {
              // Handle scanning errors (usually just no QR code found)
              console.log("QR scan error:", errorMessage);
            }
          );
        } catch (error) {
          console.error("Failed to start QR scanning:", error);
          setQRScannerState(prev => ({ ...prev, scanState: "error" }));
        }
      };

      startScanning();
    }

    // Cleanup function to stop scanning when component unmounts or state changes
    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, [scanState, cameraPermission, qrScanner]);

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScanner) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, [qrScanner]);

  const simulateLocationVerification = () => {
    setQRScannerState(prev => ({
      ...prev,
      locationStatus: "checking",
      locationAccuracy: 0,
    }));

    // Simulate high-accuracy location verification
    const interval = setInterval(() => {
      setQRScannerState(prev => {
        const newAccuracy = prev.locationAccuracy + Math.random() * 20;
        if (newAccuracy >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            setQRScannerState(prevState => ({
              ...prevState,
              scanState: "waiting-for-window",
              sessionToken: `session_${Date.now()}`, // Generate session token
            }));
          }, 1000);
          return { ...prev, locationStatus: "verified", locationAccuracy: 98 };
        }
        return { ...prev, locationAccuracy: newAccuracy };
      });
    }, 200);
  };

  const handleOneTapConfirmation = () => {
    setQRScannerState(prev => ({ ...prev, scanState: "confirming-presence" }));

    // Simulate instant location check and confirmation
    setTimeout(() => {
      // In real app, this would send GPS location + sessionToken to backend
      setQRScannerState(prev => ({ ...prev, scanState: "final-success" }));
      // Auto navigate back after final success and reset state
      setTimeout(() => {
        setQRScannerState(defaultScannerState);
        redirect("/dashboard");
      }, 3000);
    }, 1500);
  };

  const handleRetry = () => {
    if (cameraPermission === "denied") {
      // Reset camera permission to pending to trigger permission request again
      setQRScannerState(_prev => ({
        ...defaultScannerState,
        cameraPermission: "pending",
      }));
    } else {
      setQRScannerState(defaultScannerState);
    }
  };

  const handleWaitForNewWindow = () => {
    setQRScannerState(prev => ({
      ...prev,
      scanState: "waiting-for-window",
    }));
  };

  const renderScreen = () => {
    switch (scanState) {
      case "scanning":
        return (
          <ScanningScreen
            courseInfo={scannedCourse}
            onRetry={handleRetry}
            cameraPermission={cameraPermission}
          />
        );
      case "qr-success":
        return (
          <QRSuccessScreen
            courseInfo={scannedCourse}
            onRetry={handleRetry}
            onProceed={() =>
              setQRScannerState(prev => ({
                ...prev,
                scanState: "location-verify",
              }))
            }
          />
        );
      case "location-verify":
        return (
          <LocationVerifyScreen
            courseInfo={scannedCourse}
            locationAccuracy={locationAccuracy}
            locationStatus={locationStatus}
          />
        );
      case "waiting-for-window":
        return <WaitingScreen courseInfo={scannedCourse} />;
      case "confirmation-active":
        return (
          <ConfirmationScreen
            courseInfo={scannedCourse}
            timeRemaining={timeRemaining}
            onConfirm={handleOneTapConfirmation}
          />
        );
      case "confirming-presence":
        return <ConfirmingScreen courseInfo={scannedCourse} />;
      case "final-success":
        return <SuccessScreen courseInfo={scannedCourse} />;
      case "window-expired":
        return (
          <ExpiredScreen
            courseInfo={scannedCourse}
            onRetry={handleWaitForNewWindow}
          />
        );
      case "error":
        return <ErrorScreen courseInfo={scannedCourse} onRetry={handleRetry} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Confirmation Banner */}
      {showConfirmationBanner && (
        <Alert className="animate-in slide-in-from-top-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
          <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="font-medium text-green-800 dark:text-green-200">
            🎉 Final confirmation is now open! Tap the button below to confirm
            your presence.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-primary text-xl font-semibold">
            Scan Attendance QR
          </h1>
        </div>
        {/* State Indicator */}
        {scanState !== "scanning" && (
          <Badge variant="outline" className="text-xs">
            {scanState === "qr-success" && "QR Detected"}
            {scanState === "location-verify" && "Verifying Location"}
            {scanState === "waiting-for-window" && "Waiting"}
            {scanState === "confirmation-active" && "Ready to Confirm"}
            {scanState === "confirming-presence" && "Confirming"}
            {scanState === "final-success" && "Success"}
            {scanState === "window-expired" && "Window Expired"}
            {scanState === "error" && "Error"}
          </Badge>
        )}
      </div>

      {/* State Persistence Notice */}
      {scanState !== "scanning" && scanState !== "final-success" && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Your progress is saved. You can navigate to other screens and return
            to continue where you left off.
          </AlertDescription>
        </Alert>
      )}

      {/* Scanner Interface */}
      <Card>
        <CardContent className="p-6">{renderScreen()}</CardContent>
      </Card>

      {/* Location Status Alert */}
      {scanState === "location-verify" && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
          <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="flex items-center justify-between">
              <span>High-accuracy location verification in progress...</span>
              <Badge
                variant="outline"
                className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
              >
                GPS Active
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Privacy Note */}
      {(scanState === "scanning" || scanState === "qr-success") && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your location is only used to verify your presence in class and is
            not stored permanently. The new one-tap system makes confirmation
            faster while maintaining security.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Manual Check-in Option */}
        {scanState === "scanning" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              /* Handle manual check-in */
            }}
          >
            Manual Check-in
          </Button>
        )}

        {/* Reset Scanner Button */}
        {(scanState === "error" || scanState === "window-expired") && (
          <Button variant="outline" className="w-full" onClick={handleRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        )}
      </div>
    </div>
  );
}
