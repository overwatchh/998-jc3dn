"use client";

import { useGetCourses } from "@/app/(protected)/(lecturer)/qr-generation/queries";
import { LoadingScreen } from "@/components/loading-skeleton";
import { CoursesList } from "../_components/course-list";
import { QrCodeGeneration } from "../_components/qr-code-generation";
import { QrGenProvider, useQrGenContext } from "./qr-gen-context";
import { QRGenScreens } from "./types";

export default function Page() {
  const { data, isLoading, isError } = useGetCourses();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !data) {
    throw new Error("Error fetching courses");
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
        return <QrCodeGeneration />;
      default:
        return <div>Error: Invalid screen</div>;
    }
  }

  return (
    <QrGenProvider>
      <ScreenRenderer />
    </QrGenProvider>
  );
}
