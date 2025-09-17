import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UseGeolocationReturn } from "@/hooks/useGeolocation";
import { haversineDistance } from "@/lib/utils";
import {
  CheckCircle,
  Loader2,
  MapPin,
  QrCode,
  RefreshCw,
  Shield,
  ShieldOff,
} from "lucide-react";

interface Props {
  qrCodeId: string;
  location: UseGeolocationReturn;
  handleCheckin: (checkinType?: "In-person" | "Online") => void;
  isCheckingIn: boolean;
  roomLabel?: string;
  radiusMeters?: number | null;
  disableAfterSuccess?: boolean;
  validateGeo: boolean;
  roomLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  alreadyCheckedIn?: boolean;
  checkinTime?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const FirstCheckinScreen = ({
  location,
  isCheckingIn,
  handleCheckin,
  qrCodeId,
  roomLabel,
  radiusMeters,
  disableAfterSuccess,
  validateGeo,
  roomLocation,
  alreadyCheckedIn,
  checkinTime,
  onRefresh,
  isRefreshing,
}: Props) => {
  const isLocationReady = location.position && !location.loading;
  const isLocationError = location.error;

  // Calculate distance if both user location and room location are available
  const userDistance =
    isLocationReady && roomLocation
      ? haversineDistance(
          location.position!.latitude,
          location.position!.longitude,
          roomLocation.latitude,
          roomLocation.longitude
        )
      : null;

  // Use default 50m radius when geo validation is optional and no radius is set
  const effectiveRadius = radiusMeters ?? (validateGeo ? null : 50);

  const isWithinRadius =
    userDistance !== null && effectiveRadius !== null
      ? userDistance <= effectiveRadius
      : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-foreground text-2xl font-bold">First Check-in</h1>
        <p className="text-muted-foreground mt-2">
          Verify your location and confirm attendance
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="qr-details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr-details" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Details
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qr-details" className="mt-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                QR Code Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {/* Primary Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    QR Code ID
                  </span>
                  <Badge variant="outline" className="font-mono font-semibold">
                    {qrCodeId}
                  </Badge>
                </div>

                {roomLabel && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Room
                    </span>
                    <Badge variant="secondary" className="font-medium">
                      {roomLabel}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Status
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    First checkin
                  </Badge>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 dark:border-gray-800"></div>

              {/* Location Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Location Settings
                </h4>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Validation
                  </span>
                  <Badge
                    variant={validateGeo ? "default" : "secondary"}
                    className={
                      validateGeo
                        ? "bg-blue-100 font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "font-medium"
                    }
                  >
                    {validateGeo ? (
                      <>
                        <Shield className="mr-1 h-3 w-3" />
                        Required
                      </>
                    ) : (
                      <>
                        <ShieldOff className="mr-1 h-3 w-3" />
                        Optional
                      </>
                    )}
                  </Badge>
                </div>

                {/* Enhanced Distance Visualization - Show when we have user distance and room location */}
                {userDistance !== null && roomLocation && (
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Distance to Room
                    </h5>

                    {/* Distance Progress Indicator */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          Your position
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Room location
                        </span>
                      </div>

                      {/* Visual Distance Bar */}
                      <div className="relative h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                        {/* Calculate positions for visualization */}
                        {(() => {
                          const maxDisplayDistance =
                            Math.max(userDistance, effectiveRadius ?? 50) * 1.2; // Add padding
                          const allowedZoneWidth =
                            ((effectiveRadius ?? 50) / maxDisplayDistance) *
                            100;
                          const studentPosition =
                            (userDistance / maxDisplayDistance) * 100;

                          return (
                            <>
                              {/* Allowed zone indicator (green area from room) */}
                              <div
                                className="absolute right-0 h-full rounded-full bg-green-200 dark:bg-green-800"
                                style={{
                                  width: `${Math.min(100, allowedZoneWidth)}%`,
                                }}
                              />

                              {/* Student position indicator */}
                              <div
                                className={`absolute top-0 h-full w-1 rounded-full ${
                                  isWithinRadius
                                    ? "bg-green-600 dark:bg-green-400"
                                    : "bg-blue-500 dark:bg-blue-400"
                                }`}
                                style={{
                                  right: `${Math.min(95, studentPosition)}%`,
                                }}
                              />

                              {/* Room location indicator (always at the right) */}
                              <div className="absolute top-0 right-0 h-full w-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                            </>
                          );
                        })()}
                      </div>

                      {/* Distance Values and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1 text-xs font-medium ${
                              effectiveRadius && isWithinRadius
                                ? "text-green-700 dark:text-green-300"
                                : "text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            {effectiveRadius && isWithinRadius ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <MapPin className="h-3 w-3" />
                            )}
                            {Math.round(userDistance)}m from room
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {effectiveRadius
                            ? `Limit: ${Math.round(effectiveRadius)}m`
                            : "No limit set"}
                        </div>
                      </div>

                      {/* Status Message */}
                      <div
                        className={`rounded-md p-2 text-xs ${
                          effectiveRadius && isWithinRadius
                            ? "border border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200"
                            : effectiveRadius && !isWithinRadius && validateGeo
                              ? "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200"
                              : "border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200"
                        }`}
                      >
                        {effectiveRadius && isWithinRadius ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            You&apos;re within the allowed area
                          </span>
                        ) : effectiveRadius &&
                          !isWithinRadius &&
                          validateGeo ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            You need to be{" "}
                            {Math.round(userDistance - effectiveRadius)}m closer
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Distance to room: {Math.round(userDistance)}m{" "}
                            {validateGeo
                              ? "(no distance limit set)"
                              : "(optional location)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show location enabler when radius is available but no distance calculated */}
                {effectiveRadius !== null && userDistance === null && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Allowed radius
                      </span>
                      <Badge variant="secondary" className="font-medium">
                        {Math.round(effectiveRadius)} m
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="mt-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Location Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {isLocationError && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
                >
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    <strong>Location error:</strong> {location.error}
                  </AlertDescription>
                </Alert>
              )}

              {location.loading && (
                <div className="flex items-center gap-3 rounded-md bg-blue-50 p-3 dark:bg-blue-950/20">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Getting your location...
                  </span>
                </div>
              )}

              {isLocationReady && (
                <div className="space-y-4">
                  {/* Success Status */}
                  <div className="flex items-center gap-3 rounded-md bg-green-50 p-3 dark:bg-green-950/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Location verified successfully
                    </span>
                  </div>

                  {/* Coordinates */}
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                      Your Coordinates
                    </h4>
                    <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                      <div>Lat: {location.position?.latitude.toFixed(6)}</div>
                      <div>Lng: {location.position?.longitude.toFixed(6)}</div>
                    </div>
                  </div>

                  {/* Enhanced Proximity Display */}
                  {validateGeo &&
                    userDistance !== null &&
                    radiusMeters !== null && (
                      <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/30">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              Proximity to Room
                            </span>
                            <Badge
                              variant={
                                isWithinRadius ? "secondary" : "destructive"
                              }
                              className={
                                isWithinRadius
                                  ? "bg-green-100 font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "font-medium"
                              }
                            >
                              {isWithinRadius ? "Within range" : "Too far"}
                            </Badge>
                          </div>

                          {/* Compact Distance Indicator */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Distance: {Math.round(userDistance)}m</span>
                              <span>
                                Allowed: {Math.round(radiusMeters ?? 0)}m
                              </span>
                            </div>

                            {/* Proximity Bar */}
                            <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                              {/* Progress fill based on proximity */}
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isWithinRadius
                                    ? "bg-green-500 dark:bg-green-400"
                                    : "bg-red-500 dark:bg-red-400"
                                }`}
                                style={{
                                  width: `${Math.min(100, ((radiusMeters ?? 0) / userDistance) * 100)}%`,
                                }}
                              />
                            </div>

                            {/* Status text */}
                            <p
                              className={`text-xs ${
                                isWithinRadius
                                  ? "text-green-700 dark:text-green-300"
                                  : "text-red-700 dark:text-red-300"
                              }`}
                            >
                              {isWithinRadius
                                ? "✓ You are in the allowed area"
                                : `Move ${Math.round(userDistance - (radiusMeters ?? 0))}m closer to check in`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {!isLocationReady && !location.loading && !isLocationError && (
                <div className="flex items-center gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-800/50">
                  <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Waiting for location data...
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Already Checked In Alert */}
      {alreadyCheckedIn && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>You are already checked in!</strong>
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
        onClick={() => handleCheckin()}
        disabled={
          !isLocationReady ||
          isCheckingIn ||
          !!disableAfterSuccess ||
          alreadyCheckedIn
        }
        className="h-12 w-full text-lg font-semibold"
        size="lg"
      >
        {alreadyCheckedIn ? (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Already Checked In
          </>
        ) : location.loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Preparing Check-in...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            {isCheckingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Checking in...
              </>
            ) : (
              "Confirm First Check-in"
            )}
          </>
        )}
      </Button>

      {/* Refresh Button - Show when checked in to check for second check-in */}
      {alreadyCheckedIn && onRefresh && (
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="h-12 w-full text-lg font-semibold"
          size="lg"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Checking for updates...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" />
              Check for Second Check-in
            </>
          )}
        </Button>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          {alreadyCheckedIn
            ? "First check-in completed! Click 'Check for Second Check-in' to see if the second check-in window is available."
            : validateGeo
              ? "Make sure you're in the correct location before checking in. Location validation is required for this session."
              : "Your location data helps verify your attendance. You can check-in from anywhere for this session."}
        </AlertDescription>
      </Alert>
    </div>
  );
};
