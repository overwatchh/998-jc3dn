import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHHMM(date?: Date): string {
  return date ? format(date, "HH:mm") : "--:--";
}

/**
 * Calculates the Haversine distance in meters between two points.
 * Client-side version of the server utility function.
 */
export function haversineDistance(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6371e3; // Radius of the Earth in meters

  const radLatA = toRadians(latitudeA);
  const radLatB = toRadians(latitudeB);
  const deltaLat = toRadians(latitudeB - latitudeA);
  const deltaLon = toRadians(longitudeB - longitudeA);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLatA) *
      Math.cos(radLatB) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;


  return distance;
}
