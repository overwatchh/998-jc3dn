"use client";

import { Course } from "@/types/course";
import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { useGetCourses } from "./queries";
import { QRGenScreens, SelectedCourse } from "./types";

interface Room {
  id: number;
  building_number: string;
  room_number: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  campus_id: number;
  campus_name: string;
}

export type TimeWindow = { start: Date; end: Date };
export type Windows = { entryWindow: TimeWindow; exitWindow: TimeWindow };

type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

interface QrGenContextType {
  currentScreen: QRGenScreens;
  setCurrentScreen: Dispatch<SetStateAction<QRGenScreens>>;
  selectedCourse: SelectedCourse | undefined;
  setSelectedCourse: Dispatch<SetStateAction<SelectedCourse | undefined>>;
  currentCourse?: Course;
  selectedDayOfWeek: DayOfWeek; // UI-selected day for QR generation
  setSelectedDayOfWeek: Dispatch<SetStateAction<DayOfWeek>>;
  // Per-week override controls: allow a different day for specific week without changing course default
  setWeekDayOverride: (day: DayOfWeek) => void;
  // Load override from existing QR data (used when fetching saved QR code)
  loadExistingDayOverride: (
    sessionId: number,
    weekNumber: number,
    day: DayOfWeek
  ) => void;
  selectedRoom: Room | null;
  setSelectedRoom: Dispatch<SetStateAction<Room | null>>;
  validateGeo: boolean;
  setValidateGeo: Dispatch<SetStateAction<boolean>>;
  radius: number;
  setRadius: Dispatch<SetStateAction<number>>;
  windows: Windows | null;
  setWindows: Dispatch<SetStateAction<Windows | null>>;
  windowsConfigured: boolean;
  setWindowsConfigured: Dispatch<SetStateAction<boolean>>;
  qrGenerated: boolean;
  setQrGenerated: Dispatch<SetStateAction<boolean>>;
}
const QrGenContext = createContext<QrGenContextType | undefined>(undefined);

interface QrGenProviderProps {
  children: React.ReactNode;
  initialContext?: {
    sessionId: number;
    weekNumber: number;
  };
}

export function QrGenProvider({
  children,
  initialContext,
}: QrGenProviderProps) {
  const [currentScreen, setCurrentScreen] = useState<QRGenScreens>(
    initialContext
      ? QRGenScreens.QR_CODE_GENERATION
      : QRGenScreens.COURSE_SELECTION
  );
  const [selectedCourse, setSelectedCourse] = useState<
    SelectedCourse | undefined
  >(
    initialContext
      ? {
          sessionId: initialContext.sessionId,
          weekNumber: initialContext.weekNumber,
        }
      : undefined
  );

  const [qrGenerated, setQrGenerated] = useState<boolean>(false);
  const { data: courses } = useGetCourses();
  const currentCourse = courses?.find(c => c.id === selectedCourse?.sessionId);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [validateGeo, setValidateGeo] = useState<boolean>(false);
  const [radius, setRadius] = useState(100);
  const [windows, setWindows] = useState<Windows | null>(null);
  const [windowsConfigured, setWindowsConfigured] = useState<boolean>(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] =
    useState<DayOfWeek>("Monday");
  // Track per-week overrides keyed by "sessionId-weekNumber"
  // Initialize from localStorage to persist across page navigation
  const [dayOverrides, setDayOverrides] = useState<Record<string, DayOfWeek>>(
    () => {
      try {
        const stored = localStorage.getItem("qr_day_overrides");
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
  );

  // Helper to compute key for overrides
  const getWeekKey = (c: SelectedCourse | undefined) =>
    c ? `${c.sessionId}-${c.weekNumber}` : "";

  // Public API: set an override for the CURRENT selected week
  const setWeekDayOverride = (day: DayOfWeek) => {
    if (!selectedCourse) return;
    const key = getWeekKey(selectedCourse);
    const courseDefault =
      (currentCourse?.dayOfWeek as DayOfWeek | undefined) ?? "Monday";
    setDayOverrides(prev => {
      const next = { ...prev };
      // If choosing the default, clear any stored override to keep semantics clean
      if (day === courseDefault) {
        delete next[key];
      } else {
        next[key] = day;
      }
      return next;
    });
    setSelectedDayOfWeek(day);
  };

  // Load day override from existing QR data (for when we fetch a saved QR)
  const loadExistingDayOverride = (
    sessionId: number,
    weekNumber: number,
    day: DayOfWeek
  ) => {
    const key = `${sessionId}-${weekNumber}`;
    const courseDefault =
      (currentCourse?.dayOfWeek as DayOfWeek | undefined) ?? "Monday";
    setDayOverrides(prev => {
      const next = { ...prev };
      // Only store if different from course default
      if (day !== courseDefault) {
        next[key] = day;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  // Persist overrides to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("qr_day_overrides", JSON.stringify(dayOverrides));
    } catch {
      // Ignore storage errors
    }
  }, [dayOverrides]);

  // Whenever subject/week changes, recompute selected day as:
  // 1) Per-week override if present, else 2) course default, else 3) Monday
  useEffect(() => {
    const key = getWeekKey(selectedCourse);
    const courseDefault =
      (currentCourse?.dayOfWeek as DayOfWeek | undefined) ?? "Monday";
    const next = (key && dayOverrides[key]) || courseDefault || "Monday";
    setSelectedDayOfWeek(prev => (prev !== next ? next : prev));
  }, [
    selectedCourse,
    selectedCourse?.sessionId,
    selectedCourse?.weekNumber,
    currentCourse?.dayOfWeek,
    dayOverrides,
  ]);

  return (
    <QrGenContext.Provider
      value={{
        qrGenerated,
        setQrGenerated,
        windows,
        setWindows,
        windowsConfigured,
        setWindowsConfigured,
        selectedRoom,
        setSelectedRoom,
        validateGeo,
        setValidateGeo,
        radius,
        setRadius,
        currentCourse,
        currentScreen,
        setCurrentScreen,
        selectedCourse,
        setSelectedCourse,
        selectedDayOfWeek,
        setSelectedDayOfWeek,
        setWeekDayOverride,
        loadExistingDayOverride,
      }}
    >
      {children}
    </QrGenContext.Provider>
  );
}

export function useQrGenContext() {
  const context = useContext(QrGenContext);
  if (context === undefined) {
    throw new Error("useQrGenContext must be used within a QrGenProvider");
  }
  return context;
}
