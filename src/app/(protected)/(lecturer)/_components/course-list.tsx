import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseSessionResponse } from "@/types/course";
import { ArrowLeft } from "lucide-react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { QRGenScreens } from "../qr-generation/types";

interface Props {
  courses: CourseSessionResponse;
}

export function CoursesList({ courses }: Props) {
  const { setCurrentScreen, setSelectedCourse } = useQrGenContext();
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
  }

  return (
    <div className="bg-background min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-2 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentScreen(QRGenScreens.COURSE_SELECTION)}
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-foreground text-3xl font-bold">My Courses</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Manage and view your assigned courses
        </p>

        {/* Course Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {courses.map(course => (
            <Card
              key={course.code + course.id}
              onClick={() => handleCourseSelection(course)}
              className="flex cursor-pointer flex-col transition-shadow duration-200 hover:brightness-90 dark:hover:brightness-125"
            >
              <CardHeader className="flex-grow pb-3">
                <CardTitle className="mb-2 text-lg leading-tight">
                  {course.name}
                </CardTitle>
                <Badge variant="secondary" className="w-fit">
                  {course.code}
                </Badge>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <span>Course ID: {course.id}</span>
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
