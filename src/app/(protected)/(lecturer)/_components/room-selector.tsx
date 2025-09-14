"use client";

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
import { MapPin, Shield } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useQrGenContext } from "../qr-generation/qr-gen-context";
import { useGetLecturerRooms } from "../qr-generation/queries";

export function RoomSelector() {
  const {
    setSelectedRoom,
    selectedRoom,
    validateGeo,
    setValidateGeo,
    radius,
    setRadius,
  } = useQrGenContext();

  const { data: roomsData, isLoading } = useGetLecturerRooms();
  const rooms = useMemo(() => roomsData?.data ?? [], [roomsData]);

  function handleRoomSelect(roomId: string): void {
    if (!roomId) {
      setSelectedRoom(null);
      return;
    }
    const numericId = Number(roomId);
    const room = rooms.find(r => r.id === numericId) || null;
    setSelectedRoom(room);
  }

  function handleValidateGeoChange(checked: boolean): void {
    setValidateGeo(checked);
  }

  // Auto-select the first available room after rooms are fetched
  useEffect(() => {
    if (selectedRoom || rooms.length === 0) return;
    setSelectedRoom(rooms[0]);
    // We intentionally don't include setSelectedRoom to avoid unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, selectedRoom]);

  return (
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
                <div className="w-full">
                  <span className="text-foreground block truncate text-sm leading-tight font-semibold">
                    Building {selectedRoom.building_number} • Room{" "}
                    {selectedRoom.room_number}
                  </span>
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
            {rooms.map(room => (
              <SelectItem
                key={room.id}
                value={room.id.toString()}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <div className="flex max-w-[340px] flex-col py-1">
                  <span className="text-foreground truncate text-sm font-semibold">
                    Building {room.building_number} • Room {room.room_number}
                  </span>
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
            ))}
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

              <div className="space-y-1.5">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={radius}
                  onChange={e => setRadius(parseInt(e.target.value))}
                  className="bg-secondary h-2 w-full cursor-pointer appearance-none rounded-lg"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((radius - 50) / (500 - 50)) * 100}%, hsl(var(--muted)) ${((radius - 50) / (500 - 50)) * 100}%, hsl(var(--muted)) 100%)`,
                  }}
                />
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>50m</span>
                  <span>500m</span>
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
  );
}
