import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MapPin, Navigation, Wifi } from "lucide-react";
import { ScanScreenProps } from "./types";

export function LocationVerifyScreen({
  courseInfo,
  locationAccuracy = 0,
  locationStatus,
}: ScanScreenProps) {
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
              {courseInfo.name}
            </h4>
            <div className="flex items-center text-sm text-blue-800 dark:text-blue-200">
              <MapPin className="mr-1 h-4 w-4" />
              <span>{courseInfo.location}</span>
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

      {/* Location Status Alert */}
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
    </div>
  );
}
