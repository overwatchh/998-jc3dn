"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export function AttendanceMap() {
  const [radius, setRadius] = useState([100]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Geolocation Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Allowed Radius:</span> {radius[0]}m
          </div>
          <div className="w-1/3">
            <Slider
              defaultValue={[100]}
              max={500}
              step={10}
              onValueChange={setRadius}
            />
          </div>
        </div>
        <div className="relative h-[400px] w-full overflow-hidden rounded-lg border bg-muted/50">
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Map View</p>
              <p className="text-sm">Showing student check-in locations</p>
              <p className="text-xs">
                Valid check-ins: 4 | Invalid check-ins: 2
              </p>
            </div>
          </div>
          {/* Map would be rendered here with a mapping library like Leaflet or Google Maps */}
          <div className="absolute bottom-4 right-4 rounded-md bg-background p-2 shadow-md">
            <div className="flex items-center gap-2 text-xs">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span>Valid Location</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span>Invalid Location</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="h-3 w-3 rounded-full border border-dashed border-primary"></div>
              <span>Allowed Radius</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
