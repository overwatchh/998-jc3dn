import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "lucide-react";
import { ScanScreenProps } from "./types";

export function ExpiredScreen({ courseInfo, onRetry }: ScanScreenProps) {
  return (
    <div className="text-center space-y-4">
      <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
        <Timer className="h-12 w-12 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-amber-800 dark:text-amber-200">
        Confirmation Window Expired
      </h3>
      <p className="mb-4 text-muted-foreground">
        The 60-second confirmation window has closed. Please ask your lecturer
        to open a new confirmation window.
      </p>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30">
        <CardContent className="p-3">
          <div className="text-left">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {courseInfo.name}
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {courseInfo.location}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onRetry}
        className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
      >
        Wait for New Window
      </Button>
    </div>
  );
}
