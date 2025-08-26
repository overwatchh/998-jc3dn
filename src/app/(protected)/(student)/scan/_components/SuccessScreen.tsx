import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, MapPin, Navigation, Zap } from "lucide-react";
import { ScanScreenProps } from "./types";

export function SuccessScreen({ courseInfo }: ScanScreenProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
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
              {courseInfo.name}
            </h4>
            <div className="flex items-center text-sm text-green-800 dark:text-green-200">
              <MapPin className="mr-1 h-4 w-4" />
              <span className="mr-3">{courseInfo.location}</span>
              <Clock className="mr-1 h-4 w-4" />
              <span>{courseInfo.time}</span>
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

      <p className="text-muted-foreground mt-4 text-sm">
        Redirecting to home...
      </p>
    </div>
  );
}
