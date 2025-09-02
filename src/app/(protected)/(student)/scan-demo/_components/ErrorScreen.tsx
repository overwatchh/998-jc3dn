import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { ScanScreenProps } from "./types";

export function ErrorScreen({ onRetry }: ScanScreenProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
        <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
        Verification Failed
      </h3>
      <p className="text-muted-foreground mb-4">
        Unable to verify attendance. Please try again.
      </p>
      <Button
        onClick={onRetry}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Try Again
      </Button>
    </div>
  );
}
