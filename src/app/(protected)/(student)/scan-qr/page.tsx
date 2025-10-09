import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, QrCode } from "lucide-react";
import { QRScanner } from "./_components/qr-scanner";

const Page = () => {
  return (
    <div className="bg-background text-foreground space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <QrCode className="text-primary h-8 w-8" />
          <h1 className="text-2xl font-bold">Scan QR Code</h1>
        </div>
        <p className="text-muted-foreground">
          Point your camera at a QR code to check in to your class
        </p>
      </div>

      {/* QR Scanner Card */}
      <Card className="bg-card text-card-foreground">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5" />
            Camera Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QRScanner />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">How to scan:</p>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>Allow camera access when prompted</li>
              <li>Position the QR code within the camera frame</li>
              <li>Ensure good lighting for better detection</li>
              <li>Hold steady until the code is recognized</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Page;
