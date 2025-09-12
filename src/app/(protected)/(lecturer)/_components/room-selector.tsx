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
import { MapPin, Building, Hash, Shield } from "lucide-react";
import { useState } from "react";
import { useGetLecturerRooms } from "../qr-generation/queries";

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

interface RoomSelectorProps {
  onRoomSelect?: (roomId: number) => void;
  validateGeo: boolean;
  onValidateGeoChange: (enabled: boolean) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

export function RoomSelector({
  onRoomSelect,
  validateGeo,
  onValidateGeoChange,
  radius,
  onRadiusChange,
}: RoomSelectorProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { data: roomsData, isLoading } = useGetLecturerRooms();

  const rooms = roomsData?.data || [];

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.id === parseInt(roomId));
    setSelectedRoom(room || null);
    if (room && onRoomSelect) {
      onRoomSelect(room.id);
    }
  };

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <MapPin className="h-4 w-4" />
          Room & Location Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select onValueChange={handleRoomSelect} disabled={isLoading}>
          <SelectTrigger className="h-auto min-h-[64px] w-full min-w-[360px] border-gray-200 bg-white py-2.5 text-gray-900 data-[state=open]:ring-blue-500">
            {selectedRoom ? (
              <div className="flex w-full flex-col space-y-1 pr-10 text-left">
                <div className="w-full">
                  <span className="block truncate text-sm leading-tight font-semibold text-gray-900">
                    Building {selectedRoom.building_number} • Room{" "}
                    {selectedRoom.room_number}
                  </span>
                </div>
                {selectedRoom.description && (
                  <div className="truncate text-[11px] text-gray-700">
                    {selectedRoom.description}
                  </div>
                )}
                <div className="w-full truncate text-[11px] text-gray-500">
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
          <SelectContent className="max-w-[380px] border-gray-200 bg-white">
            {rooms.map(room => (
              <SelectItem
                key={room.id}
                value={room.id.toString()}
                className="text-gray-900 focus:bg-gray-100"
              >
                <div className="flex max-w-[340px] flex-col py-1">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    Building {room.building_number} • Room {room.room_number}
                  </span>
                  {room.description && (
                    <span className="truncate text-xs text-gray-600">
                      {room.description}
                    </span>
                  )}
                  <span className="truncate text-xs text-gray-400">
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
              <Shield className="h-4 w-4 text-gray-600" />
              <Label className="text-sm font-medium text-gray-700">
                Location Validation
              </Label>
            </div>
            <Switch
              checked={validateGeo}
              onCheckedChange={onValidateGeoChange}
            />
          </div>

          {validateGeo && (
            <div className="space-y-2.5 rounded-lg bg-gray-50 p-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-600">
                  Validation Radius
                </Label>
                <span className="text-sm font-medium text-gray-900">
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
                  onChange={e => onRadiusChange(parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((radius - 50) / (500 - 50)) * 100}%, #e5e7eb ${((radius - 50) / (500 - 50)) * 100}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>50m</span>
                  <span>500m</span>
                </div>
              </div>

              {selectedRoom &&
                selectedRoom.latitude &&
                selectedRoom.longitude && (
                  <div className="rounded border bg-white p-2 text-xs text-gray-600">
                    <div className="mb-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">Validation Center:</span>
                    </div>
                    <div className="font-mono text-xs">
                      {parseFloat(selectedRoom.latitude).toFixed(6)},{" "}
                      {parseFloat(selectedRoom.longitude).toFixed(6)}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
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
