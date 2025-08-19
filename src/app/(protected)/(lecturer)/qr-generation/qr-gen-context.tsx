"use client";

import { createContext, useContext, Dispatch, SetStateAction } from "react";
import { QRGenScreens, SelectedCourse } from "./page";

interface QrGenContextType {
  setCurrentScreen: Dispatch<SetStateAction<QRGenScreens>>;
  setSelectedCourse: Dispatch<SetStateAction<SelectedCourse | undefined>>;
}

const QrGenContext = createContext<QrGenContextType | undefined>(undefined);

export function QrGenProvider({
  children,
  setCurrentScreen,
  setSelectedCourse,
}: {
  children: React.ReactNode;
  setCurrentScreen: Dispatch<SetStateAction<QRGenScreens>>;
  setSelectedCourse: Dispatch<SetStateAction<SelectedCourse | undefined>>;
}) {
  return (
    <QrGenContext.Provider value={{ setCurrentScreen, setSelectedCourse }}>
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
