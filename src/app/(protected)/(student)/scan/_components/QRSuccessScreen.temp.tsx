import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCw } from "lucide-react";
import { CourseInfo } from "./types";

interface QRSuccessScreenProps {
  courseInfo: CourseInfo;
  onRetry: () => void;
  onProceed: () => void;
}

export function QRSuccessScreen({
  courseInfo,
  onRetry,
  onProceed,
}: QRSuccessScreenProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">QR Code Detected!</h1>
        <div className="space-y-1 text-sm opacity-75">
          <p>Course: {courseInfo.name}</p>
          <p>Location: {courseInfo.location}</p>
          <p>Time: {courseInfo.time}</p>
          <p>Instructor: {courseInfo.instructor}</p>
        </div>
      </div>
      <div className="space-y-2">
        <Button onClick={onProceed} className="w-full">
          <ArrowRight className="mr-2" />
          Continue
        </Button>
        <Button onClick={onRetry} variant="outline" className="w-full">
          <RotateCw className="mr-2" />
          Scan Again
        </Button>
      </div>
    </div>
  );
}
