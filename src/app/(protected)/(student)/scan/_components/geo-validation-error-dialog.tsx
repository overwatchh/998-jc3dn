"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, AlertTriangle } from "lucide-react";

interface GeoValidationErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  distanceMeters: number;
  allowedRadiusMeters: number;
  roomLabel?: string;
  roomCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const GeoValidationErrorDialog = ({
  open,
  onOpenChange,
  onRetry,
  distanceMeters,
  allowedRadiusMeters,
  roomLabel,
  roomCoordinates,
}: GeoValidationErrorDialogProps) => {
  const handleRetry = () => {
    onRetry();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Location Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            You must be physically present at the specified location to check in.
            Your current location is outside the allowed radius.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Location Details */}
        <div className="space-y-4 px-6 pb-2">
          <div className="bg-muted space-y-3 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>Location Details:</span>
            </div>

            {roomLabel && (
              <div className="flex items-center justify-between text-sm">
                <span>Required room:</span>
                <Badge variant="outline">{roomLabel}</Badge>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span>Allowed distance:</span>
              <Badge variant="outline">≤ {allowedRadiusMeters}m</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Your distance:</span>
              <Badge variant="destructive">{Math.round(distanceMeters)}m</Badge>
            </div>

            {roomCoordinates && (
              <div className="text-xs text-muted-foreground">
                Room coordinates: {roomCoordinates.latitude.toFixed(6)}, {roomCoordinates.longitude.toFixed(6)}
              </div>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 space-y-2 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
              <Navigation className="h-4 w-4" />
              <span>What to do:</span>
            </div>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Move closer to the required room</li>
              <li>• Ensure location services are enabled</li>
              <li>• Try refreshing your location</li>
              <li>• Contact your lecturer if you&apos;re in the correct room</li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Close
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRetry}>
            Try Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
