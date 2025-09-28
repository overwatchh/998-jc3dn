"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineDistance } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FirstCheckinScreen } from "./_components/first-checkin-screen";
import { GeoValidationErrorDialog } from "./_components/geo-validation-error-dialog";
import { OnlineCheckinDialog } from "./_components/online-checkin-dialog";
import { SecondCheckinScreen } from "./_components/second-checkin-screen";
import { useStudentQRCheckin } from "./mutations";
import { QRStatusEnum, useGetCheckinStatus } from "./queries";

enum Screen {
  FIRST_CHECKIN = 1,
  SECOND_CHECKIN,
}

type CheckinType = "In-person" | "Online";

const CheckinPage = () => {
  const [screen, setScreen] = useState<Screen>(Screen.FIRST_CHECKIN);
  const [firstCheckedIn, setFirstCheckedIn] = useState(false);
  const [secondCheckedIn, setSecondCheckedIn] = useState(false);
  const [showOnlineDialog, setShowOnlineDialog] = useState(false);
  const [showGeoValidationError, setShowGeoValidationError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchParams = useSearchParams();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const qrCodeId = searchParams.get("qr_code_id");

  const {
    data: checkinStatus,
    isPending: isCheckinStatusPending,
    error: checkinStatusError,
    refetch: refetchCheckinStatus,
  } = useGetCheckinStatus(qrCodeId);
  const location = useGeolocation(locationEnabled);
  const { mutateAsync: checkin, isPending: isCheckinPending } =
    useStudentQRCheckin();

  // Helper function to check if student has already checked in for current validity window
  const isCurrentWindowCheckedIn = () => {
    if (!checkinStatus?.validities) return false;

    const currentWindow = checkinStatus.validities.find(
      v => v.count === checkinStatus.validity_count
    );

    return currentWindow?.is_checked_in ?? false;
  };

  // Get current window check-in time for display
  const getCurrentWindowCheckinTime = () => {
    if (!checkinStatus?.validities) return null;

    const currentWindow = checkinStatus.validities.find(
      v => v.count === checkinStatus.validity_count
    );

    return currentWindow?.checkin_time ?? null;
  };

  // Handle refresh to check for second check-in availability
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchCheckinStatus();
    } catch (error) {
      console.error("Failed to refresh check-in status:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Start QR scanning when camera is ready and in scanning state
  useEffect(() => {
    switch (checkinStatus?.validity_count) {
      case QRStatusEnum.FIRST_CHECKIN:
        setScreen(Screen.FIRST_CHECKIN);
        break;

      case QRStatusEnum.SECOND_CHECKIN:
        setScreen(Screen.SECOND_CHECKIN);
        // Auto-enable location for second check-in (but won't prompt user)
        if (!locationEnabled) {
          setLocationEnabled(true);
        }
        break;

      case QRStatusEnum.NOT_GENERATED:
        throw new Error(
          "Invalid QR code. This QR code has not been generated."
        );

      case QRStatusEnum.NO_ACTIVE_WINDOW:
        // QR code exists but no validity window is currently active
        // Show message that check-in window is not open yet
        break;

      default:
        break;
    }
  }, [checkinStatus, locationEnabled]);

  // Auto-enable location for second check-in if geo validation is enabled
  useEffect(() => {
    if (
      checkinStatus?.validity_count === QRStatusEnum.SECOND_CHECKIN &&
      checkinStatus?.validate_geo &&
      !locationEnabled
    ) {
      setLocationEnabled(true);
    }
  }, [
    checkinStatus?.validity_count,
    checkinStatus?.validate_geo,
    locationEnabled,
  ]);

  // Always enable location for better UX (show proximity visualization even when optional)
  useEffect(() => {
    if (
      (checkinStatus?.validity_count === QRStatusEnum.FIRST_CHECKIN ||
        checkinStatus?.validity_count === QRStatusEnum.SECOND_CHECKIN) &&
      !locationEnabled
    ) {
      // Auto-enable location silently to show proximity visualization
      setLocationEnabled(true);
    }
  }, [checkinStatus?.validity_count, locationEnabled]);

  if (!qrCodeId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-foreground text-2xl font-bold">Invalid Access</h1>
          <p className="text-muted-foreground">
            QR code ID is required. Please scan a valid QR code to access this
            page.
          </p>
        </div>
      </div>
    );
  }

  // Prompt for location permission before requesting it
  // Show location prompt for first check-in (required or optional)
  const needsLocationPrompt =
    checkinStatus?.validity_count === QRStatusEnum.FIRST_CHECKIN &&
    checkinStatus?.validate_geo === true; // Only show prompt when validation is required

  if (!isCheckinStatusPending && !locationEnabled && needsLocationPrompt) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold">
            Allow Location Access
          </h1>
          <p className="text-muted-foreground mt-2">
            We need your location to verify your attendance.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-muted-foreground text-sm">
              To continue, please grant permission to access your GPS location.
              You can change this later in your browser settings.
            </p>
            <Button
              className="h-12 w-full text-lg font-semibold"
              onClick={() => setLocationEnabled(true)}
            >
              Enable Location
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (location.error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold">Location Error</h1>
          <p className="text-muted-foreground mt-2">
            Unable to access your location for attendance verification.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Location Error:</strong> {location.error}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="text-muted-foreground text-center text-sm">
          Please enable location services and refresh the page.
        </div>
      </div>
    );
  }

  if (isCheckinStatusPending) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (checkinStatusError) {
    const errorMessage = checkinStatusError?.message;
    throw new Error(errorMessage);
  }

  // Handle case where check-in window is not currently active
  if (checkinStatus?.validity_count === QRStatusEnum.NO_ACTIVE_WINDOW) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold">
            Check-in Window Closed
          </h1>
          <p className="text-muted-foreground mt-2">
            The check-in window for this session is not currently open.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2 text-center">
              <p className="text-muted-foreground text-sm">
                Please wait for the lecturer to open the check-in window, or try
                again later.
              </p>
              {checkinStatus.validities &&
                checkinStatus.validities.length > 0 && (
                  <div className="text-muted-foreground text-xs">
                    <p>Available check-in windows:</p>
                    {checkinStatus.validities
                      .filter(validity => validity.count === 1) // Only show first window
                      .map(validity => (
                        <p key={validity.id}>
                          Window {validity.count}:{" "}
                          {new Date(validity.start_time).toLocaleString()} -{" "}
                          {new Date(validity.end_time).toLocaleString()}
                        </p>
                      ))}
                  </div>
                )}
            </div>
            <Button
              className="h-12 w-full text-lg font-semibold"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate if user is nearby the required location
  const isUserNearby = () => {
    if (!location.position || !checkinStatus?.location) {
      return false;
    }

    const distance = haversineDistance(
      location.position.latitude,
      location.position.longitude,
      checkinStatus.location.latitude,
      checkinStatus.location.longitude
    );

    // Use the actual radius if set, otherwise use default 1m when geo validation is optional
    const effectiveRadius =
      checkinStatus.radius ?? (checkinStatus.validate_geo ? 0 : 50);

    const isNearby = distance <= effectiveRadius;

    return isNearby;
  };

  // Implement the geo-validation logic from pseudo code
  const handleCheckin = async (checkinType?: CheckinType) => {
    // For second check-in, we're more lenient with location requirements
    if (!location.position && screen === Screen.FIRST_CHECKIN) {
      alert("Location data is not available yet. Please wait.");
      return;
    }

    // Use default coordinates for second check-in if location is not available
    const lat = location.position?.latitude ?? 0;
    const long = location.position?.longitude ?? 0;

    const geoValidationEnabled = checkinStatus?.validate_geo ?? false;
    const nearby = location.position ? isUserNearby() : false;

    // If no specific checkin type is provided, determine it based on geo logic
    let finalCheckinType: CheckinType = checkinType || "In-person";

    // For second check-in, use simpler logic - just default to In-person unless explicitly specified
    if (!checkinType && screen === Screen.SECOND_CHECKIN) {
      finalCheckinType = "In-person";
    } else if (!checkinType && screen === Screen.FIRST_CHECKIN) {
      // Only apply geo-validation logic for first check-in
      if (geoValidationEnabled) {
        // Geo validation enabled: if not nearby, not allowed to check in
        if (!nearby) {
          setShowGeoValidationError(true);
          return;
        }
        finalCheckinType = "In-person";
      } else {
        // Geo validation disabled
        if (nearby) {
          finalCheckinType = "In-person";
        } else {
          // Show confirmation popup for online check-in
          setShowOnlineDialog(true);
          return; // Exit here, let the dialog handle the confirmation
        }
      }
    }

    // Perform the actual check-in
    await checkin({
      lat: lat,
      long: long,
      qr_code_id: parseInt(qrCodeId!, 10),
      checkin_type: finalCheckinType,
    });

    // Update local state
    if (screen === Screen.FIRST_CHECKIN) {
      setFirstCheckedIn(true);
    } else if (screen === Screen.SECOND_CHECKIN) {
      setSecondCheckedIn(true);
    }

    // Refresh check-in status from server to get latest data
    setIsRefreshing(true);
    try {
      await refetchCheckinStatus();
    } catch (error) {
      console.error("Failed to refresh check-in status:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOnlineCheckinConfirm = () => {
    handleCheckin("Online");
  };

  switch (screen) {
    case Screen.FIRST_CHECKIN:
      return (
        <>
          <FirstCheckinScreen
            isCheckingIn={isCheckinPending}
            location={location}
            handleCheckin={handleCheckin}
            qrCodeId={qrCodeId}
            roomLabel={
              checkinStatus?.location?.building_number &&
              checkinStatus?.location?.room_number
                ? `Building ${checkinStatus.location.building_number}, Room ${checkinStatus.location.room_number}`
                : undefined
            }
            radiusMeters={checkinStatus?.radius ?? null}
            disableAfterSuccess={firstCheckedIn || isCurrentWindowCheckedIn()}
            validateGeo={checkinStatus?.validate_geo ?? false}
            roomLocation={
              checkinStatus?.location
                ? {
                    latitude: checkinStatus.location.latitude,
                    longitude: checkinStatus.location.longitude,
                  }
                : null
            }
            alreadyCheckedIn={isCurrentWindowCheckedIn()}
            checkinTime={getCurrentWindowCheckinTime()}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          {/* Online Check-in Confirmation Dialog */}
          <OnlineCheckinDialog
            open={showOnlineDialog}
            onOpenChange={setShowOnlineDialog}
            onConfirm={handleOnlineCheckinConfirm}
            distanceMeters={
              location.position && checkinStatus?.location
                ? haversineDistance(
                    location.position.latitude,
                    location.position.longitude,
                    checkinStatus.location.latitude,
                    checkinStatus.location.longitude
                  )
                : 0
            }
            allowedRadiusMeters={checkinStatus?.radius ?? 0}
            roomLabel={
              checkinStatus?.location?.building_number &&
              checkinStatus?.location?.room_number
                ? `Building ${checkinStatus.location.building_number}, Room ${checkinStatus.location.room_number}`
                : undefined
            }
          />

          {/* Geo Validation Error Dialog */}
          <GeoValidationErrorDialog
            open={showGeoValidationError}
            onOpenChange={setShowGeoValidationError}
            onRetry={() => {
              // Refresh location and try again
              setLocationEnabled(false);
              setTimeout(() => setLocationEnabled(true), 100);
            }}
            distanceMeters={
              location.position && checkinStatus?.location
                ? haversineDistance(
                    location.position.latitude,
                    location.position.longitude,
                    checkinStatus.location.latitude,
                    checkinStatus.location.longitude
                  )
                : 0
            }
            allowedRadiusMeters={checkinStatus?.radius ?? 0}
            roomLabel={
              checkinStatus?.location?.building_number &&
              checkinStatus?.location?.room_number
                ? `Building ${checkinStatus.location.building_number}, Room ${checkinStatus.location.room_number}`
                : undefined
            }
            roomCoordinates={
              checkinStatus?.location
                ? {
                    latitude: checkinStatus.location.latitude,
                    longitude: checkinStatus.location.longitude,
                  }
                : undefined
            }
          />
        </>
      );

    case Screen.SECOND_CHECKIN:
      return (
        <SecondCheckinScreen
          handleCheckin={handleCheckin}
          isCheckingIn={isCheckinPending}
          disabled={secondCheckedIn || isCurrentWindowCheckedIn()}
          alreadyCheckedIn={isCurrentWindowCheckedIn()}
          checkinTime={getCurrentWindowCheckinTime()}
          isRefreshing={isRefreshing}
        />
      );

    default:
      break;
  }
};

export default CheckinPage;
