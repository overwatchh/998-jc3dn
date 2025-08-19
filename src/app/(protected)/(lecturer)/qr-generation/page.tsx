"use client";
import { LoadingScreen } from "@/components/loading-skeleton";
import { useState } from "react";
import { CoursesList } from "../_components/course-list";
import { QrCodeGeneration } from "../_components/qr-code-generation";
import { useGetCourses } from "@/app/(protected)/(lecturer)/qr-generation/queries";

export enum QRGenScreens {
  COURSE_SELECTION = "course-selection",
  QR_CODE_GENERATION = "qr-code-generation",
}

export interface SelectedCourse {
  sessionId: number;
  weekNumber: number;
}

const Page = () => {
  const [currentScreen, setCurrentScreen] = useState<QRGenScreens>(
    QRGenScreens.COURSE_SELECTION
  );
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse>();

  const { data, isLoading, isError } = useGetCourses();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !data) {
    throw new Error("Error fetching courses");
  }

  switch (currentScreen) {
    case QRGenScreens.COURSE_SELECTION:
      return (
        <CoursesList
          setCurrentScreen={setCurrentScreen}
          setSelectedCourse={setSelectedCourse}
          courses={data}
        />
      );
    case QRGenScreens.QR_CODE_GENERATION:
      return (
        <QrCodeGeneration
          setCurrentScreen={setCurrentScreen}
          setSelectedCourse={setSelectedCourse}
          sessionId={selectedCourse?.sessionId || 0}
          weekNumber={selectedCourse?.weekNumber || 0}
        />
      );
    default:
      // Should never happen
      return <div>Error: Invalid screen</div>;
  }
};

export default Page;
