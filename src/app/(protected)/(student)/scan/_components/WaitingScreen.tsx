import { Card, CardContent } from "@/components/ui/card";
import { Bell, MapPin, Shield, Timer } from "lucide-react";
import { ScanScreenProps } from "./types";

export function WaitingScreen({ courseInfo }: ScanScreenProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto mb-4 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
        <Timer className="h-12 w-12 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Course Information Header */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
        <CardContent className="p-3">
          <div className="text-left">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {courseInfo.name}
            </h4>
            <div className="mt-1 flex items-center text-xs text-blue-800 dark:text-blue-200">
              <MapPin className="mr-1 h-3 w-3" />
              <span className="mr-2">{courseInfo.location}</span>
              <Shield className="mr-1 h-3 w-3" />
              <span>Location Verified</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-primary mb-2 text-lg font-semibold">
          Waiting for Final Confirmation
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Your lecturer will open the confirmation window when ready.
          You&apos;ll receive a notification to tap and confirm your presence.
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
  );
}
