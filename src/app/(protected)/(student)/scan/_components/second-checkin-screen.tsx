import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UseGeolocationReturn } from "@/hooks/useGeolocation";
import { haversineDistance } from "@/lib/utils";
import { CheckCircle, Clock, Info, MapPin } from "lucide-react";

interface Props {
  handleCheckin: (checkinType?: "In-person" | "Online") => void;
  isCheckingIn?: boolean;
  disabled?: boolean;
  alreadyCheckedIn?: boolean;
  checkinTime?: string | null;
  isRefreshing?: boolean;
  location?: UseGeolocationReturn;
  validateGeo?: boolean;
  radiusMeters?: number | null;
  roomLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

export const SecondCheckinScreen = ({
  handleCheckin,
  isCheckingIn,
  disabled,
  alreadyCheckedIn,
  checkinTime,
  isRefreshing: _isRefreshing,
  location,
  validateGeo = false,
  radiusMeters,
  roomLocation,
}: Props) => {
  const isLocationReady = location?.position && !location.loading;
  const isLocationError = !!location?.error;

  const userDistance =
    isLocationReady && roomLocation
      ? haversineDistance(
          location!.position!.latitude,
          location!.position!.longitude,
          roomLocation.latitude,
          roomLocation.longitude
        )
      : null;

  // Match first-screen logic: when optional and no radius → show a tiny default visual window
  const effectiveRadius = radiusMeters ?? (validateGeo ? null : 1);
  const isWithinRadius =
    userDistance !== null && effectiveRadius !== null
      ? userDistance <= effectiveRadius
      : false;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-foreground text-2xl font-bold">Second Check-in</h1>
        <p className="text-muted-foreground mt-2">
          Complete your attendance verification
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Check-in Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-foreground font-medium">
                First check-in completed
              </p>
              <p className="text-muted-foreground text-sm">
                Your initial attendance has been recorded successfully.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {alreadyCheckedIn ? (
                <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
              ) : (
                <Clock className="mt-0.5 h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-foreground font-medium">
                {alreadyCheckedIn
                  ? "Already checked in"
                  : "Ready for second check-in"}
              </p>
              <p className="text-muted-foreground text-sm">
                {alreadyCheckedIn
                  ? "Your attendance for this window has been recorded."
                  : "You can now complete your attendance verification."}
              </p>
            </div>
          </div>
          {/* Proximity (optional/required) */}
          {roomLocation && (
            <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Proximity to Room
                </span>
                <Badge
                  variant={isWithinRadius ? "secondary" : "destructive"}
                  className={
                    isWithinRadius
                      ? "bg-green-100 font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "font-medium"
                  }
                >
                  {isWithinRadius ? "Within range" : "Too far"}
                </Badge>
              </div>

              {/* Distance / Allowed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Distance: {userDistance !== null ? Math.round(userDistance) : "-"}m
                  </span>
                  <span>
                    Allowed: {effectiveRadius !== null ? Math.round(effectiveRadius) : "-"}m
                  </span>
                </div>

                {/* Proximity Bar */}
                {userDistance !== null && effectiveRadius !== null && (
                  <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isWithinRadius
                          ? "bg-green-500 dark:bg-green-400"
                          : "bg-red-500 dark:bg-red-400"
                      }`}
                      style={{
                        width: `${Math.min(100, ((effectiveRadius ?? 0) / (userDistance || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                )}

                {/* Status text */}
                {userDistance !== null && (
                  <p
                    className={`text-xs ${
                      isWithinRadius
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {isWithinRadius ? (
                      <>
                        <CheckCircle className="mr-1 inline h-3 w-3" />
                        You&apos;re in the allowed area
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-1 inline h-3 w-3" />
                        Move {Math.max(0, Math.round((userDistance || 0) - (effectiveRadius || 0)))}m closer to check in
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Already Checked In Alert */}
      {alreadyCheckedIn && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>You are already checked in for the second window!</strong>
            {checkinTime && (
              <div className="mt-1 text-sm">
                Check-in time: {new Date(checkinTime).toLocaleString()}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Check-in Button */}
      <Button
        onClick={() => {
          handleCheckin();
        }}
        className="h-12 w-full text-lg font-semibold"
        size="lg"
        disabled={!!disabled || !!isCheckingIn || alreadyCheckedIn}
      >
        <CheckCircle className="mr-2 h-5 w-5" />
        {alreadyCheckedIn
          ? "Already Checked In"
          : isCheckingIn
            ? "Checking in..."
            : "Confirm Second Check-in"}
      </Button>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The second check-in ensures complete attendance tracking. Make sure
          you&apos;re still in the designated area.
        </AlertDescription>
      </Alert>
    </div>
  );
};
