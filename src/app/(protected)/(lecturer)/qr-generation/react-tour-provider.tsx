import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PopoverContentProps, StepType, TourProvider } from "@reactour/tour";
import { X } from "lucide-react";
import { ReactNode } from "react";

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
  {
    selector: ".geo-validation-toggle-step",
    content:
      "Step 4: Location Validation. When enabled, students must be within the selected radius (in meters) of the room's coordinates to successfully check in. Disable it if physical proximity isn't required for this session.",
  },
  {
    selector: ".time-tab-step",
    content:
      "Step 5: Click the Time Windows tab to continue. You'll configure entry and exit scan windows next.",
  },
  {
    selector: ".time-window-panel-step",
    content:
      "Step 6: Time Windows control when students can check in (entry) and check out (exit). Set these to align with your class schedule and prevent early or late scans.",
  },
  {
    selector: ".qr-generator-panel-step",
    content:
      "Step 7: Generate QR & Share. This panel shows the live QR code, lets you copy and share links, email it to students, and monitor scan status. Students can only scan successfully inside the configured time & location rules.",
  },
  {
    selector: ".real-time-tracking-button-step",
    content:
      "Step 8: Real-time Attendance Tracking. Open this to watch live check-ins and check-outs as they occur, see who is present or still missing, and react in class. Great for monitoring engagement in the moment.",
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
  const rawContent = isRenderableFn ? null : (possibleContent as ReactNode);

  function handlePrev(): void {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }
  function handleNext(): void {
    // Block manual next on some steps that require user action
    if (currentStep === 0 || currentStep === 4) return;
    if (currentStep < total - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  }

  function finishTour(): void {
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
            onClick={finishTour}
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
          onClick={finishTour}
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
            disabled={currentStep === 0 || currentStep === 4}
            title={
              currentStep === 0
                ? "Select the highlighted course to continue"
                : currentStep === 4
                  ? "Click the Time Windows tab to continue"
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

export const ReactTourProvider = ({ children }: { children: ReactNode }) => (
  <TourProvider
    padding={{ mask: [9, 0, 9, 22] }}
    styles={{
      popover: base => ({
        ...base,
        padding: 0,
        borderRadius: "16px",
        background: "transparent",
        boxShadow: "none",
      }),
      maskArea: base => {
        return {
          ...base,
          rx: 16,
          ry: 16,
        };
      },
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
      if (
        e.key === "ArrowRight" &&
        (clickProps.currentStep === 0 || clickProps.currentStep === 4)
      ) {
        // Block advancing via keyboard on first and gated steps (course + time tab)
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
    {children}
  </TourProvider>
);
