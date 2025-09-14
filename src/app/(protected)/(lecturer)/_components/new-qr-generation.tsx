"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { QRGenScreens } from "../qr-generation/types";
import { QRGenerator } from "./qr-generator";
import { RoomSelector } from "./room-selector";
import { SessionSelector } from "./session-header";

export function NewQrGeneration() {
  const { setCurrentScreen } = useQrGenContext();

  function backToCourseSelection(): void {
    setCurrentScreen(QRGenScreens.COURSE_SELECTION);
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground p-2"
            onClick={backToCourseSelection}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-border h-4 w-px" />
          <span className="text-muted-foreground text-sm">
            QR Code Generation
          </span>
        </div>

        <SessionSelector />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* SELECT ROOM SECTION */}
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
            <RoomSelector />
          </div>

          <QRGenerator />
        </div>
      </div>
    </div>
  );
}
