import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { useGetCheckedInStudents } from "../qr-generation/queries";

export const LiveAttendance = () => {
  const { selectedCourse, qrGenerated } = useQrGenContext();
  // Get live check-ins data
  const { data: checkedInData } = useGetCheckedInStudents(
    selectedCourse?.sessionId || 0,
    selectedCourse?.weekNumber,
    {
      enabled: !!selectedCourse && qrGenerated,
      refetchInterval: 5000,
    }
  );

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-900">
            <Users className="h-4 w-4" />
            Live Attendance
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700">Live</span>
              <span className="text-xs text-gray-500">
                Last updated: {format(new Date(), "hh:mm:ss a")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Users className="mr-1 h-4 w-4" />
              View All Attendance
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {qrGenerated && checkedInData && checkedInData.count > 0 ? (
          <div className="space-y-3">
            {checkedInData.data.slice(0, 5).map(student => (
              <div
                key={`${student.student_id}-${student.checkin_time}`}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {student.student_name}
                  </p>
                  <p className="text-sm text-gray-500">{student.student_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(student.checkin_time).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Window {student.validity_count}/2
                  </p>
                </div>
              </div>
            ))}
            {checkedInData.count > 5 && (
              <p className="text-center text-sm text-gray-500">
                +{checkedInData.count - 5} more students checked in
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-6 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="mb-1 text-sm text-gray-600">
              {qrGenerated
                ? "No check-ins yet"
                : "QR code has not been generated"}
            </p>
            <p className="text-xs text-gray-500">
              {qrGenerated
                ? "Students will appear here once they start scanning"
                : "Check-ins will appear here once students start scanning"}
            </p>
          </div>
        )}
      </CardContent>

      <div className="border-t border-gray-200 px-6 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {checkedInData?.count || 0}
            </div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">--</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {checkedInData?.count ? "100%" : "0%"}
            </div>
            <div className="text-sm text-gray-600">Rate</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
