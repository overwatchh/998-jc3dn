"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Bell,
  Camera,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  RotateCcw,
  Shield,
  Timer,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"

type ScanState =
  | "scanning"
  | "qr-success"
  | "location-verify"
  | "waiting-for-window"
  | "confirmation-active"
  | "confirming-presence"
  | "final-success"
  | "window-expired"
  | "error"

interface QRScannerState {
  scanState: ScanState
  scannedCourse: {
    name: string
    location: string
    time: string
    instructor: string
  }
  locationAccuracy: number
  locationStatus: "checking" | "verified" | "failed"
  confirmationWindowEnd: number | null
  sessionToken: string
}

export default function QRScannerScreen() {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [showConfirmationBanner, setShowConfirmationBanner] = useState(false)

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
  }

  const [qrScannerState, setQRScannerState] =
    useState<QRScannerState>(defaultScannerState)
  const {
    scanState,
    scannedCourse,
    locationAccuracy,
    locationStatus,
    confirmationWindowEnd,
  } = qrScannerState

  // Timer for confirmation window
  useEffect(() => {
    if (confirmationWindowEnd && scanState === "confirmation-active") {
      const interval = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, confirmationWindowEnd - now)
        setTimeRemaining(Math.ceil(remaining / 1000))

        if (remaining <= 0) {
          setQRScannerState(prev => ({ ...prev, scanState: "window-expired" }))
          clearInterval(interval)
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [confirmationWindowEnd, scanState, setQRScannerState])

  // Simulate confirmation window opening (in real app, this would come from push notification or websocket)
  useEffect(() => {
    if (scanState === "waiting-for-window") {
      // Simulate lecturer opening confirmation window after 5-15 seconds
      const delay = Math.random() * 10000 + 5000 // 5-15 seconds
      const timer = setTimeout(() => {
        const windowEnd = Date.now() + 60000 // 60 second window
        setQRScannerState(prev => ({
          ...prev,
          scanState: "confirmation-active",
          confirmationWindowEnd: windowEnd,
        }))
        setShowConfirmationBanner(true)
        // Hide banner after 3 seconds
        setTimeout(() => setShowConfirmationBanner(false), 3000)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [scanState, setQRScannerState])

  useEffect(() => {
    if (scanState === "scanning") {
      // Simulate QR scanning process
      const timer = setTimeout(() => {
        setQRScannerState(prev => ({ ...prev, scanState: "qr-success" }))
        // Show course info for 2 seconds, then start location verification
        setTimeout(() => {
          setQRScannerState(prev => ({ ...prev, scanState: "location-verify" }))
          simulateLocationVerification()
        }, 2000)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [scanState, setQRScannerState])

  const simulateLocationVerification = () => {
    setQRScannerState(prev => ({
      ...prev,
      locationStatus: "checking",
      locationAccuracy: 0,
    }))

    // Simulate high-accuracy location verification
    const interval = setInterval(() => {
      setQRScannerState(prev => {
        const newAccuracy = prev.locationAccuracy + Math.random() * 20
        if (newAccuracy >= 95) {
          clearInterval(interval)
          setTimeout(() => {
            setQRScannerState(prevState => ({
              ...prevState,
              scanState: "waiting-for-window",
              sessionToken: `session_${Date.now()}`, // Generate session token
            }))
          }, 1000)
          return { ...prev, locationStatus: "verified", locationAccuracy: 98 }
        }
        return { ...prev, locationAccuracy: newAccuracy }
      })
    }, 200)
  }

  const handleOneTapConfirmation = () => {
    setQRScannerState(prev => ({ ...prev, scanState: "confirming-presence" }))

    // Simulate instant location check and confirmation
    setTimeout(() => {
      // In real app, this would send GPS location + sessionToken to backend
      setQRScannerState(prev => ({ ...prev, scanState: "final-success" }))
      // Auto navigate back after final success and reset state
      setTimeout(() => {
        setQRScannerState(defaultScannerState)
        redirect("/dashboard")
      }, 3000)
    }, 1500)
  }

  const handleRetry = () => {
    setQRScannerState(defaultScannerState)
  }

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
  }

  const getScannerContent = () => {
    switch (scanState) {
      case "scanning":
        return (
          <div className="text-center">
            <div className="relative w-64 h-64 mx-auto mb-6 bg-muted rounded-lg overflow-hidden">
              <div className="absolute inset-4 border-2 border-muted-foreground rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-primary animate-pulse"></div>
              </div>
            </div>
            <p className="text-muted-foreground mb-2">
              Point camera at the QR code displayed by your lecturer
            </p>
            <div className="flex items-center justify-center text-primary">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm">Scanning...</span>
            </div>
          </div>
        )

      case "qr-success":
        return (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-200">
              QR Code Detected!
            </h3>

            {/* Course Information Card */}
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
              <CardContent className="p-4">
                <div className="space-y-2 text-left">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    {scannedCourse.name}
                  </h4>
                  <div className="flex items-center text-sm text-green-800 dark:text-green-200">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span className="mr-3">{scannedCourse.location}</span>
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{scannedCourse.time}</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Instructor: {scannedCourse.instructor}
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Verifying location...
            </p>
          </div>
        )

      case "location-verify":
        return (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Navigation
                className={`h-12 w-12 text-blue-600 dark:text-blue-400 ${locationStatus === "checking" ? "animate-pulse" : ""}`}
              />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-primary">
              Verifying Location
            </h3>

            {/* Course Information Card */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
              <CardContent className="p-4">
                <div className="space-y-2 text-left">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    {scannedCourse.name}
                  </h4>
                  <div className="flex items-center text-sm text-blue-800 dark:text-blue-200">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{scannedCourse.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Accuracy Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Location Accuracy</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {Math.round(locationAccuracy)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${locationAccuracy}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Wifi className="mr-1 h-4 w-4" />
                <span>High-accuracy GPS enabled</span>
              </div>
            </div>

            {locationStatus === "verified" && (
              <div className="flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">Location verified!</span>
              </div>
            )}
          </div>
        )

      case "waiting-for-window":
        return (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto mb-4 flex animate-pulse items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Timer className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Course Information Header */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
              <CardContent className="p-3">
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {scannedCourse.name}
                  </h4>
                  <div className="mt-1 flex items-center text-xs text-blue-800 dark:text-blue-200">
                    <MapPin className="mr-1 h-3 w-3" />
                    <span className="mr-2">{scannedCourse.location}</span>
                    <Shield className="mr-1 h-3 w-3" />
                    <span>Location Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-primary">
                Waiting for Final Confirmation
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Your lecturer will open the confirmation window when ready.
                You&apos;ll receive a notification to tap and confirm your
                presence.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/30">
              <div className="mb-2 flex items-center justify-center text-amber-800 dark:text-amber-200">
                <Bell className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">
                  Stay in the app or keep notifications enabled
                </span>
              </div>
              <p className="text-center text-xs text-amber-700 dark:text-amber-300">
                You&apos;ll have 60 seconds to confirm once the window opens
              </p>
            </div>
          </div>
        )

      case "confirmation-active":
        return (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto mb-4 flex animate-pulse items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <Zap className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>

            {/* Course Information Header */}
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
              <CardContent className="p-3">
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                    {scannedCourse.name}
                  </h4>
                  <div className="mt-1 flex items-center text-xs text-green-800 dark:text-green-200">
                    <MapPin className="mr-1 h-3 w-3" />
                    <span className="mr-2">{scannedCourse.location}</span>
                    <Shield className="mr-1 h-3 w-3" />
                    <span>Ready to Confirm</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-200">
                Confirmation Window Open!
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Tap the button below to instantly confirm your presence in class
              </p>
            </div>

            {/* Timer Display */}
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/30">
              <div className="flex items-center justify-center space-x-2">
                <Timer className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-mono text-lg font-bold text-green-800 dark:text-green-200">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                Time remaining
              </p>
            </div>

            {/* One-Tap Confirmation Button */}
            <Button
              onClick={handleOneTapConfirmation}
              className="h-16 w-full animate-pulse bg-green-600 text-xl font-bold text-white hover:bg-green-700 dark:bg-green-500 dark:text-gray-900 dark:hover:bg-green-600"
            >
              <CheckCircle className="mr-3 h-6 w-6" />
              Confirm I&apos;m Here!
            </Button>

            <p className="text-xs text-muted-foreground">
              This will instantly verify your location and confirm attendance
            </p>
          </div>
        )

      case "confirming-presence":
        return (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
            </div>

            {/* Course Information */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
              <CardContent className="p-3">
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {scannedCourse.name}
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    {scannedCourse.location}
                  </p>
                </div>
              </CardContent>
            </Card>

            <h3 className="mb-2 text-lg font-semibold text-primary">
              Confirming Presence
            </h3>
            <p className="text-muted-foreground">
              Verifying your location and updating attendance...
            </p>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30">
              <div className="flex items-center justify-center text-sm text-blue-800 dark:text-blue-200">
                <Navigation className="mr-2 h-4 w-4" />
                <span>Instant GPS verification in progress</span>
              </div>
            </div>
          </div>
        )

      case "final-success":
        return (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-200">
              Attendance Confirmed!
            </h3>

            {/* Final Course Information */}
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
              <CardContent className="p-4">
                <div className="space-y-2 text-left">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    {scannedCourse.name}
                  </h4>
                  <div className="flex items-center text-sm text-green-800 dark:text-green-200">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span className="mr-3">{scannedCourse.location}</span>
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{scannedCourse.time}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
              <div className="flex items-center justify-center space-x-4 text-sm text-green-800 dark:text-green-200">
                <div className="flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  <span>QR Verified</span>
                </div>
                <div className="flex items-center">
                  <Navigation className="mr-1 h-4 w-4" />
                  <span>Location Confirmed</span>
                </div>
                <div className="flex items-center">
                  <Zap className="mr-1 h-4 w-4" />
                  <span>One-Tap Confirmed</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Redirecting to home...
            </p>
          </div>
        )

      case "window-expired":
        return (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Timer className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-amber-800 dark:text-amber-200">
              Confirmation Window Expired
            </h3>
            <p className="mb-4 text-muted-foreground">
              The 60-second confirmation window has closed. Please ask your
              lecturer to open a new confirmation window.
            </p>

            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30">
              <CardContent className="p-3">
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {scannedCourse.name}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {scannedCourse.location}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() =>
                setQRScannerState(prev => ({
                  ...prev,
                  scanState: "waiting-for-window",
                }))
              }
              className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              Wait for New Window
            </Button>
          </div>
        )

      case "error":
        return (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
              Verification Failed
            </h3>
            <p className="mb-4 text-muted-foreground">
              Unable to verify attendance. Please try again.
            </p>
            <Button
              onClick={handleRetry}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Try Again
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-4 space-y-6">
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
          <h1 className="text-xl font-semibold text-primary">
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
        <CardContent className="p-6">{getScannerContent()}</CardContent>
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
  )
}
