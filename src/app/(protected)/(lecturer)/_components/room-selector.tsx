"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Building, Hash, Shield } from "lucide-react";
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
  onRadiusChange 
}: RoomSelectorProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { data: roomsData, isLoading } = useGetLecturerRooms();

  const rooms = roomsData?.data || [];

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find((r) => r.id === parseInt(roomId));
    setSelectedRoom(room || null);
    if (room && onRoomSelect) {
      onRoomSelect(room.id);
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-2 text-gray-900 text-sm font-medium">
          <MapPin className="h-4 w-4" />
          Room & Location Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select onValueChange={handleRoomSelect} disabled={isLoading}>
          <SelectTrigger className="bg-white border-gray-200 text-gray-900 h-auto min-h-[64px] py-2.5 data-[state=open]:ring-blue-500 w-full min-w-[360px]">
            {selectedRoom ? (
              <div className="flex flex-col w-full text-left space-y-1 pr-10">
                <div className="w-full">
                  <span className="text-sm font-semibold leading-tight block truncate text-gray-900">
                    Building {selectedRoom.building_number} • Room {selectedRoom.room_number}
                  </span>
                </div>
                {selectedRoom.description && (
                  <div className="text-[11px] text-gray-700 truncate">
                    {selectedRoom.description}
                  </div>
                )}
                <div className="text-[11px] text-gray-500 w-full truncate">
                  {selectedRoom.campus_name}
                </div>
              </div>
            ) : (
              <SelectValue placeholder={isLoading ? "Loading rooms..." : "Select a room..."} />
            )}
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 max-w-[380px]">
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id.toString()} className="text-gray-900 focus:bg-gray-100">
                <div className="flex flex-col py-1 max-w-[340px]">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    Building {room.building_number} • Room {room.room_number}
                  </span>
                  {room.description && (
                    <span className="text-xs text-gray-600 truncate">{room.description}</span>
                  )}
                  <span className="text-xs text-gray-400 truncate">{room.campus_name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location Validation Settings */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <Label className="text-gray-700 text-sm font-medium">Location Validation</Label>
            </div>
            <Switch 
              checked={validateGeo} 
              onCheckedChange={onValidateGeoChange}
            />
          </div>
          
          {validateGeo && (
            <div className="bg-gray-50 rounded-lg p-2.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-gray-600 text-sm">Validation Radius</Label>
                <span className="text-sm font-medium text-gray-900">{radius}m</span>
              </div>
              
              <div className="space-y-1.5">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={radius}
                  onChange={(e) => onRadiusChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((radius - 50) / (500 - 50)) * 100}%, #e5e7eb ${((radius - 50) / (500 - 50)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>50m</span>
                  <span>500m</span>
                </div>
              </div>
              
              {selectedRoom && selectedRoom.latitude && selectedRoom.longitude && (
                <div className="text-xs text-gray-600 bg-white rounded p-2 border">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">Validation Center:</span>
                  </div>
                  <div className="font-mono text-xs">
                    {parseFloat(selectedRoom.latitude).toFixed(6)}, {parseFloat(selectedRoom.longitude).toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Students must be within {radius}m of this location to check in
                  </div>
                </div>
              )}
              
              {validateGeo && (!selectedRoom?.latitude || !selectedRoom?.longitude) && (
                <div className="text-xs text-amber-600 bg-amber-50 rounded p-2 border border-amber-200">
                  ⚠️ Selected room has no coordinates. Location validation may not work properly.
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
