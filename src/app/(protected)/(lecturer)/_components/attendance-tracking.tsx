"use client";

import {
  useGetAllQrCodes,
  useGetCourses,
} from "@/app/(protected)/(lecturer)/qr-generation/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarIcon,
  ClockIcon,
  QrCodeIcon,
  RefreshCwIcon as RefreshIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

type SessionWithCourse = {
  study_session_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  subject_code: string;
  session_type: string;
  qr_codes: Array<{
    qr_code_id: number;
    valid_radius: number | null;
    createdAt: string;
    week_number: number;
    validities: Array<{
      validity_id: number;
      count: number;
      start_time: string;
      end_time: string;
    }>;
  }>;
  course: {
    id: number;
    name: string;
    code: string;
    sessionType: string;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
  };
};

export function AttendanceTrackingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"recent" | "live">("recent");
  const [userHasSwitchedTabs, setUserHasSwitchedTabs] = useState(false);
  const { data: allQrCodes, isLoading, refetch } = useGetAllQrCodes();
  const { data: courses } = useGetCourses();

  // Process sessions data to include course information
  const sessionsWithCourses = useMemo((): SessionWithCourse[] => {
    if (!allQrCodes?.data || !courses) return [];

    return allQrCodes.data
      .map(sessionData => {
        const course = courses.find(c => c.id === sessionData.study_session_id);
        if (!course) return null;
        return {
          ...sessionData,
          course,
        };
      })
      .filter((session): session is SessionWithCourse => session !== null);
  }, [allQrCodes, courses]);

  // Find current live session (one with active QR codes)
  const currentLiveSession = useMemo(():
    | (SessionWithCourse & {
        activeQrCode: SessionWithCourse["qr_codes"][0];
        activeValidity: SessionWithCourse["qr_codes"][0]["validities"][0];
      })
    | null => {
    if (!sessionsWithCourses) return null;

    const now = new Date();

    for (const session of sessionsWithCourses) {
      for (const qrCode of session.qr_codes) {
        for (const validity of qrCode.validities) {
          const startTime = new Date(validity.start_time);
          const endTime = new Date(validity.end_time);

          if (now >= startTime && now <= endTime) {
            return {
              ...session,
              activeQrCode: qrCode,
              activeValidity: validity,
            } as const;
          }
        }
      }
    }

    return null;
  }, [sessionsWithCourses]);

  const handleSessionClick = (sessionId: number, weekNumber?: number) => {
    if (weekNumber) {
      router.push(`/real-time-tracking/${sessionId}?week_number=${weekNumber}`);
    } else {
      router.push(`/real-time-tracking/${sessionId}`);
    }
  };

  // Auto-switch to live tab if there's a live session (only if user hasn't manually switched)
  const hasLiveSession = Boolean(currentLiveSession);
  useEffect(() => {
    if (hasLiveSession && !userHasSwitchedTabs) {
      setActiveTab("live");
    }
  }, [hasLiveSession, userHasSwitchedTabs]);

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <main className="flex-1 space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              QR Code Sessions
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshIcon
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={value => {
              setActiveTab(value as "recent" | "live");
              setUserHasSwitchedTabs(true);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Recent Sessions</TabsTrigger>
              <TabsTrigger value="live">Live Sessions</TabsTrigger>
            </TabsList>

            {/* Recent Sessions Tab */}
            <TabsContent value="recent" className="space-y-4">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                        <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2 h-3 w-full rounded bg-gray-200"></div>
                        <div className="h-3 w-2/3 rounded bg-gray-200"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sessionsWithCourses.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <QrCodeIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground">
                      No QR code sessions found. Generate your first QR code to
                      get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sessionsWithCourses
                    .sort((a, b) => {
                      // Sort live session first
                      const aIsLive =
                        currentLiveSession?.study_session_id ===
                        a.study_session_id;
                      const bIsLive =
                        currentLiveSession?.study_session_id ===
                        b.study_session_id;

                      if (aIsLive && !bIsLive) return -1;
                      if (!aIsLive && bIsLive) return 1;

                      // For non-live sessions, sort by most recent QR code creation date
                      const aLatestQr = a.qr_codes[a.qr_codes.length - 1];
                      const bLatestQr = b.qr_codes[b.qr_codes.length - 1];

                      if (aLatestQr && bLatestQr) {
                        return (
                          new Date(bLatestQr.createdAt).getTime() -
                          new Date(aLatestQr.createdAt).getTime()
                        );
                      }

                      return 0;
                    })
                    .map(session => (
                      <SessionCard
                        key={session.study_session_id}
                        session={session}
                        isLive={
                          currentLiveSession?.study_session_id ===
                          session.study_session_id
                        }
                        onClick={() => {
                          const latestQrCode =
                            session.qr_codes[session.qr_codes.length - 1];
                          handleSessionClick(
                            session.study_session_id,
                            latestQrCode?.week_number
                          );
                        }}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            {/* Live Sessions Tab */}
            <TabsContent value="live" className="space-y-4">
              {currentLiveSession ? (
                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-green-800 dark:text-green-200">
                          {currentLiveSession.subject_name} -{" "}
                          {currentLiveSession.subject_code}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {currentLiveSession.session_type}
                        </Badge>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-100 text-green-800"
                      >
                        Active Now
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{currentLiveSession.day_of_week}</span>
                        <ClockIcon className="ml-2 h-4 w-4" />
                        <span>
                          {currentLiveSession.start_time} -{" "}
                          {currentLiveSession.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <QrCodeIcon className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">
                          QR Code Active (Week{" "}
                          {currentLiveSession.activeQrCode.week_number})
                        </span>
                      </div>
                      <div className="text-xs text-green-600">
                        Valid until{" "}
                        {new Date(
                          currentLiveSession.activeValidity.end_time
                        ).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        handleSessionClick(
                          currentLiveSession.study_session_id,
                          currentLiveSession.activeQrCode.week_number
                        )
                      }
                    >
                      View Real-time Tracking
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <QrCodeIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground">
                      No live sessions currently active. QR codes will appear
                      here when they are within their validity window.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Session Card Component
type SessionCardProps = {
  session: SessionWithCourse;
  isLive: boolean;
  onClick: () => void;
};

function SessionCard({ session, isLive, onClick }: SessionCardProps) {
  const latestQrCode = session.qr_codes[session.qr_codes.length - 1];

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isLive
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
          : "hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{session.subject_code}</CardTitle>
            <Badge variant="secondary" className="text-xs capitalize">
              {session.session_type}
            </Badge>
          </div>
          {isLive && (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-100 text-xs text-green-800"
            >
              Live
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm">
          {session.subject_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4" />
          <span>{session.day_of_week}</span>
          <ClockIcon className="ml-2 h-4 w-4" />
          <span>
            {session.start_time} - {session.end_time}
          </span>
        </div>

        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <QrCodeIcon className="h-4 w-4" />
          <span>
            {session.qr_codes.length} QR code
            {session.qr_codes.length !== 1 ? "s" : ""} generated
          </span>
        </div>

        {latestQrCode && (
          <div className="text-muted-foreground text-xs">
            Latest: Week {latestQrCode.week_number}
            {latestQrCode.validities.length > 0 && (
              <span className="ml-1">
                ({latestQrCode.validities.length} validit
                {latestQrCode.validities.length !== 1 ? "ies" : "y"})
              </span>
            )}
          </div>
        )}

        {latestQrCode && (
          <div className="text-muted-foreground text-xs">
            Created:{" "}
            {new Date(latestQrCode.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={onClick}
        >
          View Tracking
        </Button>
      </CardContent>
    </Card>
  );
}
