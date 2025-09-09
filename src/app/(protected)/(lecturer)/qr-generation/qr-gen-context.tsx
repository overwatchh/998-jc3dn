"use client";

import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { QRGenScreens, SelectedCourse } from "./types";

interface QrGenContextType {
  currentScreen: QRGenScreens;
  setCurrentScreen: Dispatch<SetStateAction<QRGenScreens>>;
  selectedCourse: SelectedCourse | undefined;
  setSelectedCourse: Dispatch<SetStateAction<SelectedCourse | undefined>>;
}

const QrGenContext = createContext<QrGenContextType | undefined>(undefined);

export function QrGenProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<QRGenScreens>(
    QRGenScreens.COURSE_SELECTION
  );
  const [selectedCourse, setSelectedCourse] = useState<
    SelectedCourse | undefined
  >();

  return (
    <QrGenContext.Provider
      value={{
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
