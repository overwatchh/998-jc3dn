"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import useGeolocation from "@/hooks/useGeolocation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FirstCheckinScreen } from "./_components/first-checkin-screen";
import { SecondCheckinScreen } from "./_components/second-checkin-screen";
import { useStudentQRCheckin } from "./mutations";
import { QRStatusEnum, useGetCheckinStatus } from "./queries";

enum Screen {
  FIRST_CHECKIN = 1,
  SECOND_CHECKIN,
}

const CheckinPage = () => {
  const [screen, setScreen] = useState<Screen>(Screen.FIRST_CHECKIN);
  const searchParams = useSearchParams();
  const qrCodeId = searchParams.get("qr_code_id");

  const {
    data: checkinStatus,
    isPending: isCheckinStatusPending,
    error: checkinStatusError,
  } = useGetCheckinStatus(qrCodeId);
  const location = useGeolocation();
  const { mutateAsync: checkin, isPending: isCheckinPending } =
    useStudentQRCheckin();

  useEffect(() => {
    switch (checkinStatus?.validity_count) {
      case QRStatusEnum.FIRST_CHECKIN:
        setScreen(Screen.FIRST_CHECKIN);
        break;

      case QRStatusEnum.SECOND_CHECKIN:
        setScreen(Screen.SECOND_CHECKIN);
        break;

      case QRStatusEnum.NOT_GENERATED:
        throw new Error(
          "Invalid QR code. This QR code has not been generated."
        );

      default:
        break;
    }
  }, [checkinStatus]);

  if (!qrCodeId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-foreground text-2xl font-bold">Invalid Access</h1>
          <p className="text-muted-foreground">
            QR code ID is required. Please scan a valid QR code to access this
            page.
          </p>
        </div>
      </div>
    );
  }

  if (location.error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold">Location Error</h1>
          <p className="text-muted-foreground mt-2">
            Unable to access your location for attendance verification.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Location Error:</strong> {location.error}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="text-muted-foreground text-center text-sm">
          Please enable location services and refresh the page.
        </div>
      </div>
    );
  }

  if (isCheckinStatusPending) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <p className="text-muted-foreground">Getting check-in status...</p>
      </div>
    );
  }

  if (checkinStatusError) {
    const errorMessage = checkinStatusError?.message;
    throw new Error(errorMessage);
  }

  const handleCheckin = async () => {
    if (!location.position) {
      alert("Location data is not available yet. Please wait.");
      return;
    }
    await checkin({
      lat: location.position.latitude,
      long: location.position.longitude,
      qr_code_id: parseInt(qrCodeId, 10),
    });
  };

  switch (screen) {
    case Screen.FIRST_CHECKIN:
      return (
        <FirstCheckinScreen
          isCheckingIn={isCheckinPending}
          location={location}
          handleCheckin={handleCheckin}
          qrCodeId={qrCodeId}
        />
      );

    case Screen.SECOND_CHECKIN:
      return <SecondCheckinScreen handleCheckin={handleCheckin} />;

    default:
      break;
  }
};

export default CheckinPage;
