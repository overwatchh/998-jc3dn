import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseSessionResponse } from "@/types/course";
import { ArrowLeft } from "lucide-react";
import { QRGenScreens } from "../qr-generation/page";
import { useQrGenContext } from "../qr-generation/qr-gen-context";

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
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex gap-4 items-center mb-2">
          <Button
            variant="ghost"
            onClick={() => setCurrentScreen(QRGenScreens.COURSE_SELECTION)}
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
        </div>
        <p className="mb-8 text-muted-foreground">
          Manage and view your assigned courses
        </p>

        {/* Course Grid */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <Card
              key={course.id}
              onClick={() => handleCourseSelection(course)}
              className="hover:brightness-90 dark:hover:brightness-125 cursor-pointer transition-shadow duration-200 flex flex-col"
            >
              <CardHeader className="pb-3 flex-grow">
                <CardTitle className="text-lg leading-tight mb-2">
                  {course.name}
                </CardTitle>
                <Badge variant="secondary" className="w-fit">
                  {course.code}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 mt-auto">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Course ID: {course.id}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state for when no courses */}
        {courses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">
              No courses assigned
            </div>
            <p className="text-sm text-muted-foreground">
              Courses will appear here when they are assigned to you
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
