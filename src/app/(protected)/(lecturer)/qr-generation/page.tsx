"use client";

import { useGetCourses } from "@/app/(protected)/(lecturer)/qr-generation/queries";
import { LoadingScreen } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PopoverContentProps,
  TourProvider,
  type StepType,
} from "@reactour/tour";
import { X } from "lucide-react";
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

  const tourSteps: StepType[] = [
    {
      selector: ".first-step",
      content:
        "Step 1: This is one of your courses. Click it to continue the tour and configure QR generation.",
    },
    {
      selector: ".session-selector-step",
      content:
        "Step 2: This panel lets you adjust the course, week and day. You can generate one QR for each week!",
    },
    {
      selector: ".location-panel-step",
      content:
        "Step 3: Configure the Room & Validation settings. Choose a room to set the physical location.",
    },
  ];

  const TourPopover = (props: PopoverContentProps) => {
    const { steps, currentStep, setCurrentStep, setIsOpen } = props;
    const total = steps.length;
    // Reactour allows content to be ReactNode | (props) => ReactNode. We only
    // handle string/ReactNode variants here for simplicity.
    const stepEntry = steps[currentStep];
    const possibleContent = stepEntry?.content as unknown;
    const isRenderableFn = typeof possibleContent === "function";
    const rawContent = isRenderableFn
      ? null
      : (possibleContent as React.ReactNode);

    function handlePrev() {
      if (currentStep > 0) setCurrentStep(currentStep - 1);
    }
    function handleNext() {
      // Block manual next on first step; user must click highlighted course
      if (currentStep === 0) return;
      if (currentStep < total - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Finish tour then reset to first step for next time
        setIsOpen(false);
        setCurrentStep(0);
      }
    }

    function closeAndReset() {
      setIsOpen(false);
      setCurrentStep(0);
    }

    return (
      <Card className="border-border/60 w-[320px] shadow-lg md:w-[400px]">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-base">Quick Tour</CardTitle>
              <CardDescription className="text-xs" aria-live="polite">
                Step {currentStep + 1} of {total}
              </CardDescription>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close tour"
              className="h-6 w-6"
              onClick={closeAndReset}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm leading-relaxed">
          {typeof rawContent === "string" ? <p>{rawContent}</p> : rawContent}
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={closeAndReset}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={currentStep === 0}
              title={
                currentStep === 0
                  ? "Select the highlighted course to continue"
                  : undefined
              }
            >
              {currentStep === total - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <QrGenProvider initialContext={initialContext}>
      <TourProvider
        styles={{
          popover: base => ({
            ...base,
            padding: 0, // Card handles its own padding
            borderRadius: "16px",
            background: "transparent", // Let Card supply surface
            boxShadow: "none",
          }),
        }}
        showPrevNextButtons={false}
        showNavigation={false}
        showDots={false}
        showCloseButton={false}
        onClickMask={clickProps => {
          // Close and reset to first step when user clicks outside
          clickProps.setIsOpen(false);
          clickProps.setCurrentStep(0);
        }}
        keyboardHandler={(e, clickProps) => {
          if (e.key === "ArrowRight" && clickProps.currentStep === 0) {
            // Block advancing via keyboard on first step
            e.preventDefault();
            return;
          }
          if (e.key === "ArrowRight") {
            clickProps.setCurrentStep(s =>
              Math.min(s + 1, clickProps.steps.length - 1)
            );
          }
          if (e.key === "ArrowLeft") {
            clickProps.setCurrentStep(s => Math.max(s - 1, 0));
          }
        }}
        ContentComponent={TourPopover}
        steps={tourSteps}
      >
        <ScreenRenderer />
      </TourProvider>
    </QrGenProvider>
  );
}
