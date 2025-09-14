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
}
const QrGenContext = createContext<QrGenContextType | undefined>(undefined);

export function QrGenProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<QRGenScreens>(
    QRGenScreens.COURSE_SELECTION
  );
  const [selectedCourse, setSelectedCourse] = useState<
    SelectedCourse | undefined
  >();

  const { data: courses } = useGetCourses();
  const currentCourse = courses?.find(c => c.id === selectedCourse?.sessionId);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [validateGeo, setValidateGeo] = useState<boolean>(false);
  const [radius, setRadius] = useState(100);

  return (
    <QrGenContext.Provider
      value={{
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
