import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UseGeolocationReturn } from "@/hooks/useGeolocation";
import { CheckCircle, Loader2, MapPin, QrCode } from "lucide-react";

interface Props {
  qrCodeId: string;
  location: UseGeolocationReturn;
  handleCheckin: () => void;
  isCheckingIn: boolean;
}

export const FirstCheckinScreen = ({
  location,
  isCheckingIn,
  handleCheckin,
  qrCodeId,
}: Props) => {
  const isLocationReady = location.position && !location.loading;
  const isLocationError = location.error;

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
        onClick={handleCheckin}
        disabled={!isLocationReady}
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
          Make sure you&apos;re in the correct location before checking in. Your
          location data helps verify your attendance.
        </AlertDescription>
      </Alert>
    </div>
  );
};
