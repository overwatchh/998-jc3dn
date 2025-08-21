import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MapPin, Shield, Timer, Zap } from "lucide-react";
import { ScanScreenProps } from "./types";

interface ConfirmationScreenProps extends ScanScreenProps {
  timeRemaining?: number;
  onConfirm: () => void;
}

export function ConfirmationScreen({
  courseInfo,
  timeRemaining = 0,
  onConfirm,
}: ConfirmationScreenProps) {
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-center space-y-4">
      <div className="w-24 h-24 mx-auto mb-4 flex animate-pulse items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
        <Zap className="h-12 w-12 text-green-600 dark:text-green-400" />
      </div>

      {/* Course Information Header */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
        <CardContent className="p-3">
          <div className="text-left">
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
              {courseInfo.name}
            </h4>
            <div className="mt-1 flex items-center text-xs text-green-800 dark:text-green-200">
              <MapPin className="mr-1 h-3 w-3" />
              <span className="mr-2">{courseInfo.location}</span>
              <Shield className="mr-1 h-3 w-3" />
              <span>Ready to Confirm</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-200">
          Confirmation Window Open!
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Tap the button below to instantly confirm your presence in class
        </p>
      </div>

      {/* Timer Display */}
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/30">
        <div className="flex items-center justify-center space-x-2">
          <Timer className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="font-mono text-lg font-bold text-green-800 dark:text-green-200">
            {formatTime(timeRemaining)}
          </span>
        </div>
        <p className="mt-1 text-xs text-green-700 dark:text-green-300">
          Time remaining
        </p>
      </div>

      {/* One-Tap Confirmation Button */}
      <Button
        onClick={onConfirm}
        className="h-16 w-full animate-pulse bg-green-600 text-xl font-bold text-white hover:bg-green-700 dark:bg-green-500 dark:text-gray-900 dark:hover:bg-green-600"
      >
        <CheckCircle className="mr-3 h-6 w-6" />
        Confirm I&apos;m Here!
      </Button>

      <p className="text-xs text-muted-foreground">
        This will instantly verify your location and confirm attendance
      </p>
    </div>
  );
}
