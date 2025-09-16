"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, MapPin, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import {
  useGetLecturerRooms,
  useGetStudySessionRooms,
} from "../qr-generation/queries";

export function RoomSelector() {
  const {
    setSelectedRoom,
    selectedRoom,
    validateGeo,
    setValidateGeo,
    radius,
    setRadius,
    selectedCourse,
  } = useQrGenContext();

  // State for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);

  // Always show all available rooms for selection
  const sessionId = selectedCourse?.sessionId;
  const { data: sessionRoomsData } =
    useGetStudySessionRooms(sessionId, { enabled: Boolean(sessionId) });
  const { data: allRoomsData, isLoading: isLoadingAllRooms } =
    useGetLecturerRooms();
  const rooms = useMemo(() => {
    // Always use all rooms, but sort default rooms to the top
    const allRooms = allRoomsData?.data ?? [];
    const sessionRooms = sessionRoomsData?.data ?? [];
    const sessionRoomIds = new Set(sessionRooms.map(room => room.id));
    
    // Sort rooms: default rooms first, then others
    return allRooms.sort((a, b) => {
      const aIsDefault = sessionRoomIds.has(a.id);
      const bIsDefault = sessionRoomIds.has(b.id);
      
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      
      // If both are default or both are not default, sort by campus, then building, then room
      const campusCompare = a.campus_name.localeCompare(b.campus_name);
      if (campusCompare !== 0) return campusCompare;
      
      const buildingCompare = a.building_number.localeCompare(b.building_number);
      if (buildingCompare !== 0) return buildingCompare;
      
      return a.room_number.localeCompare(b.room_number);
    });
  }, [allRoomsData, sessionRoomsData]);
  
  // Get session room IDs for labeling
  const sessionRoomIds = useMemo(() => {
    return new Set((sessionRoomsData?.data ?? []).map(room => room.id));
  }, [sessionRoomsData]);
  const isLoading = isLoadingAllRooms;

  function handleRoomSelect(roomId: string): void {
    if (!roomId) {
      setSelectedRoom(null);
      return;
    }
    
    const numericId = Number(roomId);
    const room = rooms.find(r => r.id === numericId) || null;
    
    if (room && !sessionRoomIds.has(room.id)) {
      // Show confirmation dialog for non-default rooms
      setPendingRoomId(roomId);
      setShowConfirmDialog(true);
    } else {
      // Directly select default rooms
      setSelectedRoom(room);
    }
  }

  function handleConfirmRoomSelection(): void {
    if (pendingRoomId) {
      const numericId = Number(pendingRoomId);
      const room = rooms.find(r => r.id === numericId) || null;
      setSelectedRoom(room);
    }
    setShowConfirmDialog(false);
    setPendingRoomId(null);
  }

  function handleCancelRoomSelection(): void {
    setShowConfirmDialog(false);
    setPendingRoomId(null);
  }

  // Get pending room details for dialog
  const pendingRoom = useMemo(() => {
    if (!pendingRoomId) return null;
    return rooms.find(r => r.id === Number(pendingRoomId)) || null;
  }, [pendingRoomId, rooms]);

  function handleValidateGeoChange(checked: boolean): void {
    setValidateGeo(checked);
  }

  // Clear selected room if it's no longer in the available rooms list
  useEffect(() => {
    if (rooms.length === 0 || !selectedRoom) return;
    // Only clear selection if the current selection is not in the list
    if (!rooms.some(r => r.id === selectedRoom.id)) {
      setSelectedRoom(null);
    }
  }, [rooms, selectedRoom, setSelectedRoom]);

  return (
    <>
    <Card className="border-border bg-card">
      <CardHeader className="py-2">
        <CardTitle className="text-foreground flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4" />
          Room & Location Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select
          value={selectedRoom ? String(selectedRoom.id) : ""}
          onValueChange={handleRoomSelect}
          disabled={isLoading}
        >
          <SelectTrigger className="border-border bg-background text-foreground data-[state=open]:ring-ring h-auto min-h-[64px] w-full min-w-[360px] py-2.5">
            {selectedRoom ? (
              <div className="flex w-full flex-col space-y-1 pr-10 text-left">
                <div className="flex w-full items-center gap-2">
                  <span className="text-foreground truncate text-sm leading-tight font-semibold">
                    Building {selectedRoom.building_number} • Room{" "}
                    {selectedRoom.room_number}
                  </span>
                  {sessionRoomIds.has(selectedRoom.id) && (
                    <span className="bg-primary/10 text-primary border-primary/20 flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium border">
                      Default Room
                    </span>
                  )}
                </div>
                {selectedRoom.description && (
                  <div className="text-muted-foreground truncate text-[11px]">
                    {selectedRoom.description}
                  </div>
                )}
                <div className="text-muted-foreground w-full truncate text-[11px]">
                  {selectedRoom.campus_name}
                </div>
              </div>
            ) : (
              <SelectValue
                placeholder={
                  isLoading ? "Loading rooms..." : "Select a room..."
                }
              />
            )}
          </SelectTrigger>
          <SelectContent className="border-border bg-popover max-w-[380px]">
            {rooms.map(room => {
              const isSessionRoom = sessionRoomIds.has(room.id);
              return (
                <SelectItem
                  key={room.id}
                  value={room.id.toString()}
                  className="focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex max-w-[340px] flex-col py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground truncate text-sm font-semibold">
                        Building {room.building_number} • Room {room.room_number}
                      </span>
                      {isSessionRoom && (
                        <span className="bg-primary/10 text-primary border-primary/20 rounded px-1.5 py-0.5 text-xs font-medium border">
                          Default Room
                        </span>
                      )}
                    </div>
                    {room.description && (
                      <span className="text-muted-foreground truncate text-xs">
                        {room.description}
                      </span>
                    )}
                    <span className="text-muted-foreground truncate text-xs">
                      {room.campus_name}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Location Validation Settings */}
        <div className="border-t pt-3">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="text-muted-foreground h-4 w-4" />
              <Label className="text-foreground text-sm font-medium">
                Location Validation
              </Label>
            </div>
            <Switch
              checked={validateGeo}
              onCheckedChange={handleValidateGeoChange}
            />
          </div>

          {validateGeo && (
            <div className="bg-muted space-y-2.5 rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">
                  Validation Radius
                </Label>
                <span className="text-foreground text-sm font-medium">
                  {radius}m
                </span>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={radius}
                    onChange={e => setRadius(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full border-2 border-border bg-secondary/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:border-primary/60 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:shadow-xl [&::-webkit-slider-thumb]:active:scale-95 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((radius - 20) / (500 - 20)) * 100}%, hsl(var(--secondary)) ${((radius - 20) / (500 - 20)) * 100}%, hsl(var(--secondary)) 100%)`,
                    }}
                  />
                </div>
              </div>

              {selectedRoom &&
                selectedRoom.latitude &&
                selectedRoom.longitude && (
                  <div className="bg-card text-muted-foreground rounded border p-2 text-xs">
                    <div className="mb-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">Validation Center:</span>
                    </div>
                    <div className="text-foreground font-mono text-xs">
                      {parseFloat(selectedRoom.latitude).toFixed(6)},{" "}
                      {parseFloat(selectedRoom.longitude).toFixed(6)}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      Students must be within {radius}m of this location to
                      check in
                    </div>
                  </div>
                )}

              {validateGeo &&
                (!selectedRoom?.latitude || !selectedRoom?.longitude) && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-600">
                    ⚠️ Selected room has no coordinates. Location validation may
                    not work properly.
                  </div>
                )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Confirmation Dialog for Non-Default Room Selection */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Room Selection
          </AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;re selecting a room that is not the default room for this session.
          </AlertDialogDescription>
          {pendingRoom && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="font-medium text-foreground">
                Building {pendingRoom.building_number} • Room {pendingRoom.room_number}
              </div>
              {pendingRoom.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {pendingRoom.description}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {pendingRoom.campus_name}
              </div>
            </div>
          )}
          <div className="mt-3 text-sm text-muted-foreground">
            Are you sure you want to use this room for the QR code generation?
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelRoomSelection}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmRoomSelection}>
            Yes, Use This Room
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
