import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Navigation } from "lucide-react";
import { ScanScreenProps } from "./types";

export function ConfirmingScreen({ courseInfo }: ScanScreenProps) {
  return (
    <div className="text-center space-y-4">
      <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
      </div>

      {/* Course Information */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
        <CardContent className="p-3">
          <div className="text-left">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {courseInfo.name}
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              {courseInfo.location}
            </p>
          </div>
        </CardContent>
      </Card>

      <h3 className="mb-2 text-lg font-semibold text-primary">
        Confirming Presence
      </h3>
      <p className="text-muted-foreground">
        Verifying your location and updating attendance...
      </p>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30">
        <div className="flex items-center justify-center text-sm text-blue-800 dark:text-blue-200">
          <Navigation className="mr-2 h-4 w-4" />
          <span>Instant GPS verification in progress</span>
        </div>
      </div>
    </div>
  );
}
