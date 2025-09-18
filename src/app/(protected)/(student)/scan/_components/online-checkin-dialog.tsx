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
import { MapPin, Wifi } from "lucide-react";

interface OnlineCheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  distanceMeters: number;
  allowedRadiusMeters: number;
  roomLabel?: string;
}

export const OnlineCheckinDialog = ({
  open,
  onOpenChange,
  onConfirm,
  distanceMeters,
  allowedRadiusMeters,
  roomLabel,
}: OnlineCheckinDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-500" />
            Check-in Online?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are not at the required location for this session. Would you
            like to check-in online instead?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Separate content section outside of AlertDialogDescription */}
        <div className="space-y-4 px-6 pb-2">
          <div className="bg-muted space-y-2 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Location Details:</span>
            </div>

            {roomLabel && (
              <div className="flex items-center justify-between text-sm">
                <span>Required room:</span>
                <Badge variant="outline">{roomLabel}</Badge>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span>Required distance:</span>
              <Badge variant="outline">≤ {allowedRadiusMeters}m</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Your distance:</span>
              <Badge variant="destructive">{Math.round(distanceMeters)}m</Badge>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Online check-ins will be marked differently from in-person
            attendance.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Check-in Online
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
