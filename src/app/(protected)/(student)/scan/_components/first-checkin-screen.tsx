import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UseGeolocationReturn } from "@/hooks/useGeolocation";
import { haversineDistance } from "@/lib/utils";
import {
  CheckCircle,
  Loader2,
  MapPin,
  QrCode,
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

  const isWithinRadius =
    userDistance !== null && radiusMeters !== null && radiusMeters !== undefined
      ? userDistance <= radiusMeters
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

      {/* QR Code Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5" />
            QR Code Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">QR Code ID</span>
            <Badge variant="outline">{qrCodeId}</Badge>
          </div>
          {roomLabel && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Room</span>
              <Badge variant="secondary">{roomLabel}</Badge>
            </div>
          )}

          {/* Geo Validation Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Location validation</span>
            <Badge
              variant={validateGeo ? "default" : "secondary"}
              className={
                validateGeo
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : ""
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

          {typeof radiusMeters !== "undefined" && radiusMeters !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Allowed radius</span>
              <Badge variant="secondary">{Math.round(radiusMeters)} m</Badge>
            </div>
          )}

          {/* Distance Information */}
          {userDistance !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your distance</span>
              <Badge
                variant={isWithinRadius ? "secondary" : "destructive"}
                className={
                  isWithinRadius
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : ""
                }
              >
                {Math.round(userDistance)} m
                {isWithinRadius && <CheckCircle className="ml-1 h-3 w-3" />}
              </Badge>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              First checkin
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Location Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Location Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLocationError && (
            <Alert variant="destructive">
              <AlertDescription>
                Location error: {location.error}
              </AlertDescription>
            </Alert>
          )}

          {location.loading && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Getting your location...
            </div>
          )}

          {isLocationReady && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Location verified successfully
              </div>
              <div className="bg-muted rounded-md p-3 font-mono text-xs">
                Lat: {location.position?.latitude.toFixed(6)}
                <br />
                Lng: {location.position?.longitude.toFixed(6)}
              </div>

              {/* Location validation status */}
              {validateGeo &&
                userDistance !== null &&
                radiusMeters !== null && (
                  <div className="mt-3 rounded-md border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Distance check:</span>
                      <Badge
                        variant={isWithinRadius ? "secondary" : "destructive"}
                        className={
                          isWithinRadius
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : ""
                        }
                      >
                        {isWithinRadius ? "Within range" : "Too far"}
                      </Badge>
                    </div>
                    {!isWithinRadius && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        You need to be within {radiusMeters}m of the session
                        location.
                      </p>
                    )}
                  </div>
                )}
            </div>
          )}

          {!isLocationReady && !location.loading && !isLocationError && (
            <div className="text-muted-foreground text-sm">
              Waiting for location data...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in Button */}
      <Button
        onClick={() => handleCheckin()}
        disabled={!isLocationReady || isCheckingIn || !!disableAfterSuccess}
        className="h-12 w-full text-lg font-semibold"
        size="lg"
      >
        {location.loading ? (
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

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          {validateGeo
            ? "Make sure you're in the correct location before checking in. Location validation is required for this session."
            : "Your location data helps verify your attendance. You can check-in from anywhere for this session."}
        </AlertDescription>
      </Alert>
    </div>
  );
};
