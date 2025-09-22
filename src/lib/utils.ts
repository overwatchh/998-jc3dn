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

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short", // "long" gives full name like "September"
    day: "numeric",
  });
}

const DOW_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};
export function parseTimeToDate(baseDate: Date, hhmm: string) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return d;
}

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export type DayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export function computeQrDateForWeek(
  day_of_week: DayOfWeek,
  week_number: number,
  anchor_qr: {
    week_number: number;
    date: string;
  } | null
): Date {
  const anchor_date = anchor_qr ? new Date(anchor_qr.date) : new Date();
  const anchor_week_number = anchor_qr ? anchor_qr.week_number : week_number;
  // 1) Normalise DOW key
  const key = day_of_week.toLowerCase();
  if (!(key in DOW_INDEX)) {
    throw new Error("Invalid day_of_week. Use Monday–Sunday.");
  }
  const targetDow = DOW_INDEX[key];

  // 2) How many weeks from the source week to the target week?
  const weeksDiff = Number(week_number) - Number(anchor_week_number);

  // 3) Move from anchor_date to the SAME weekday inside the target week.
  //    First, jump whole weeks from the anchor_date…
  const targetWeekAnyDate = addDays(anchor_date, weeksDiff * 7);

  // 4) Get the start of that week (Sunday-based, matching getDay() and DOW_INDEX)
  const targetWeekStart = addDays(
    targetWeekAnyDate,
    -targetWeekAnyDate.getDay()
  );

  // 5) Add the target day offset within that week
  const result = addDays(targetWeekStart, targetDow);

  return result; // Date for (week_number, day_of_week) relative to the source week/date
}

export function getQrDateForWeek(
  day_of_week: DayOfWeek,
  week_number: number,
  anchor_qr: {
    week_number: number;
    date: string;
  } | null
): string {
  const d = computeQrDateForWeek(day_of_week, week_number, anchor_qr);
  return formatDate(d);
}
