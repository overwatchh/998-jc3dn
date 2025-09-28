import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CourseSessionResponse } from "@/types/course";
import { useTour } from "@reactour/tour";
import { ArrowLeft, Clock, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { QRGenScreens } from "../qr-generation/types";

interface Props {
  courses: CourseSessionResponse;
}

export function CoursesList({ courses }: Props) {
  const { setCurrentScreen, setSelectedCourse } = useQrGenContext();
  const { setIsOpen, currentStep, setCurrentStep, isOpen } = useTour();
  const router = useRouter();

  function handleCourseSelection(course: {
    id: number;
    name: string;
    code: string;
  }) {
    setSelectedCourse({
      sessionId: course.id,
      weekNumber: 1,
    });
    setCurrentScreen(QRGenScreens.QR_CODE_GENERATION);
    // If tour is active on step 0 (first-step) and user clicked the highlighted course, move to step 1 (index 1)
    if (isOpen && currentStep === 0 && course.id === courses[0]?.id) {
      // slight timeout to allow screen transition to mount session selector
      setTimeout(() => setCurrentStep(1), 300);
    }
  }

  function getTypeBadgeClass(sessionType: string): string {
    const t = sessionType.toLowerCase();
    switch (t) {
      case "lecture":
        return "bg-blue-600 text-white";
      case "tutorial":
        return "bg-amber-600 text-white";
      case "lab":
        return "bg-emerald-600 text-white";
      default:
        return "bg-muted text-foreground";
    }
  }

  // setIsOpen already extracted above

  return (
    <div className="bg-background min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header + Actions */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              aria-label="Go back to dashboard"
              onClick={() => router.push("/")}
            >
              <ArrowLeft />
            </Button>
            <div className="space-y-1">
              <h1 className="text-foreground text-3xl font-bold">My Courses</h1>
              <p className="text-muted-foreground text-sm">
                Manage and view your assigned courses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground hidden text-xs sm:block">
              First time here?
            </p>
            <Button
              variant="outline"
              size="sm"
              aria-label="Start interactive tour"
              className="gap-1"
              onClick={() => setIsOpen(true)}
            >
              <HelpCircle className="h-4 w-4" /> Start Tour
            </Button>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {courses.map((course, index) => (
            <Card
              key={course.code + course.id}
              onClick={() => handleCourseSelection(course)}
              className={cn(
                "flex cursor-pointer flex-col transition-shadow duration-200 hover:brightness-90 dark:hover:brightness-125",
                index === 0 ? "first-step" : ""
              )}
            >
              <CardHeader className="flex-grow pb-3">
                <CardTitle className="mb-2 text-lg leading-tight">
                  {course.name}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="w-fit">
                    {course.code}
                  </Badge>
                  <Badge
                    variant="default"
                    className={`w-fit ${getTypeBadgeClass(course.sessionType)}`}
                  >
                    {course.sessionType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {course.dayOfWeek ? `${course.dayOfWeek}, ` : ""}
                      {course.startTime} – {course.endTime}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state for when no courses */}
        {courses.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-muted-foreground mb-2">
              No courses assigned
            </div>
            <p className="text-muted-foreground text-sm">
              Courses will appear here when they are assigned to you
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
