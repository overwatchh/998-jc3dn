"use client";

import { useGetCourses } from "@/app/(protected)/(lecturer)/qr-generation/queries";
import { LoadingScreen } from "@/components/loading-skeleton";
import { useSearchParams } from "next/navigation";
import { CoursesList } from "../_components/course-list";
import { NewQrGeneration } from "../_components/new-qr-generation";
import { QrGenProvider, useQrGenContext } from "./qr-gen-context";
import { QRGenScreens } from "./types";

export default function Page() {
  const { data, isLoading } = useGetCourses();
  const searchParams = useSearchParams();

  // Extract URL parameters for initial context
  const sessionId = searchParams.get("sessionId");
  const weekNumber = searchParams.get("weekNumber");

  const initialContext =
    sessionId && weekNumber
      ? {
          sessionId: Number(sessionId),
          weekNumber: Number(weekNumber),
        }
      : undefined;

  if (isLoading) {
    return <LoadingScreen />;
  }

  function ScreenRenderer() {
    const { currentScreen } = useQrGenContext();

    if (!data) {
      return null;
    }

    switch (currentScreen) {
      case QRGenScreens.COURSE_SELECTION:
        return <CoursesList courses={data} />;
      case QRGenScreens.QR_CODE_GENERATION:
        return <NewQrGeneration />;
      default:
        return <div>Error: Invalid screen</div>;
    }
  }

  return (
    <QrGenProvider initialContext={initialContext}>
      <ScreenRenderer />
    </QrGenProvider>
  );
}
