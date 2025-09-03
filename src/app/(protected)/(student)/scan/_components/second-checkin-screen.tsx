import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Info } from "lucide-react";

interface Props {
  handleCheckin: () => void;
  isCheckingIn?: boolean;
  disabled?: boolean;
}

export const SecondCheckinScreen = ({ handleCheckin, isCheckingIn, disabled }: Props) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-foreground text-2xl font-bold">Second Check-in</h1>
        <p className="text-muted-foreground mt-2">
          Complete your attendance verification
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Check-in Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-foreground font-medium">
                First check-in completed
              </p>
              <p className="text-muted-foreground text-sm">
                Your initial attendance has been recorded successfully.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Clock className="mt-0.5 h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-foreground font-medium">
                Ready for second check-in
              </p>
              <p className="text-muted-foreground text-sm">
                You can now complete your attendance verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Button */}
      <Button
        onClick={handleCheckin}
        className="h-12 w-full text-lg font-semibold"
        size="lg"
        disabled={!!disabled || !!isCheckingIn}
      >
        <CheckCircle className="mr-2 h-5 w-5" />
        {isCheckingIn ? "Checking in..." : "Confirm Second Check-in"}
      </Button>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The second check-in ensures complete attendance tracking. Make sure
          you&apos;re still in the designated area.
        </AlertDescription>
      </Alert>
    </div>
  );
};
