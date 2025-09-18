"use client";

import { Course } from "@/types/course";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
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

interface QrGenContextType {
  currentScreen: QRGenScreens;
  setCurrentScreen: Dispatch<SetStateAction<QRGenScreens>>;
  selectedCourse: SelectedCourse | undefined;
  setSelectedCourse: Dispatch<SetStateAction<SelectedCourse | undefined>>;
  currentCourse?: Course;
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
