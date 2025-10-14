export interface INotification {
  id: number;
  type: "warning" | "info" | "system";
  title: string;
  description: string;
  /**
   * Human friendly relative time string (already formatted for UI)
   * In a real implementation we'd likely store created_at as a Date (or ISO string)
   * and derive this on the client. For now we keep a string but make the
   * contents look like they originated from DB rows (see mock source* comment).
   */
  timestamp: string;
  unread: boolean;
}

// Student-facing notifications (attendance performance, personal attendance records, system announcements)
export const mockStudentNotifications: INotification[] = [
  {
    id: 1,
    type: "warning" as const,
    title: "Attendance Threshold Warning (PHY301)",
    description:
      "Current attendance for PHY301 is 73% (threshold 75%). Attend next 2 sessions to recover.",
    timestamp: "2025-10-14T07:05:12Z • 2h ago",
    unread: true,
  },
  {
    id: 2,
    type: "info" as const,
    title: "Room Change Confirmed (MTH201)",
    description:
      "Lecture relocated from B-102 → B-106 for weeks 7–9 (capacity upgrade).",
    timestamp: "2025-10-13T09:10:44Z • 1d ago",
    unread: true,
  },
  {
    id: 3,
    type: "system" as const,
    title: "Check‑in Recorded (CSE101, Window 1)",
    description:
      "In‑person QR check‑in (geo validated: 12.6m from room centroid) at 09:02:11 UTC+11.",
    timestamp: "2025-10-12T22:02:15Z • 2d ago",
    unread: false,
  },
  {
    id: 4,
    type: "warning" as const,
    title: "Absent Marked (PHY301)",
    description:
      "No check‑in detected for PHY301 on 2025-10-11 (both validity windows missed).",
    timestamp: "2025-10-11T09:55:00Z • 3d ago",
    unread: false,
  },
  {
    id: 5,
    type: "info" as const,
    title: "Geo Validation Mode Updated",
    description:
      "High‑accuracy radius reduced from 50m → 25m for ENG210 (effective next session).",
    timestamp: "2025-10-07T12:30:00Z • 1w ago",
    unread: false,
  },
  {
    id: 6,
    type: "system" as const,
    title: "Manual Adjustment Applied (CSE101)",
    description:
      "Lecturer added a manual attendance record for Window 2 (reason: scanner malfunction).",
    timestamp: "2025-10-13T23:14:03Z • 16h ago",
    unread: true,
  },
  {
    id: 7,
    type: "info" as const,
    title: "New Announcement (ALL COURSES)",
    description:
      "System maintenance scheduled 2025-10-18 01:00–02:00 UTC. Check‑ins unaffected (read‑only ops).",
    timestamp: "2025-10-14T05:40:00Z • 3h ago",
    unread: true,
  },
];

// Lecturer-facing notifications (course level alerts, low attendance cohorts, system operations, manual adjustments)
export const mockLecturerNotifications: INotification[] = [
  {
    id: 101,
    type: "warning",
    title: "Low Participation Trend (CSE101)",
    description:
      "Average attendance last 3 sessions: 62% (−11% vs semester avg). Consider a reminder email.",
    timestamp: "2025-10-14T06:55:00Z • 2h ago",
    unread: true,
  },
  {
    id: 102,
    type: "info",
    title: "Manual Adjustment Request (ENG210)",
    description:
      "Student #S18422 submitted evidence for missed check‑in (Window 2). Pending your review.",
    timestamp: "2025-10-14T05:10:00Z • 4h ago",
    unread: true,
  },
  {
    id: 103,
    type: "system",
    title: "QR Code Auto-Expired (PHY301)",
    description:
      "Validity Window 2 closed at 10:15 UTC+11. 4 late scan attempts were rejected.",
    timestamp: "2025-10-14T00:15:12Z • 9h ago",
    unread: false,
  },
  {
    id: 104,
    type: "warning",
    title: "Attendance At-Risk Cohort (MTH201)",
    description:
      "11 enrolled students below 70% (threshold 75%). System will send warning emails after next session.",
    timestamp: "2025-10-13T22:40:00Z • 11h ago",
    unread: false,
  },
  {
    id: 105,
    type: "info",
    title: "Geo Validation Radius Updated",
    description:
      "You reduced ENG210 validation radius 50m → 25m. Monitoring false negative rate for next 2 sessions.",
    timestamp: "2025-10-13T18:30:00Z • 15h ago",
    unread: false,
  },
  {
    id: 106,
    type: "system",
    title: "Lecture End Summary Generated (CSE101)",
    description:
      "Window 1: 118/126 present (5 online, 3 manual). Window 2: 121/126 present (2 late rejects).",
    timestamp: "2025-10-12T22:20:45Z • 2d ago",
    unread: false,
  },
  {
    id: 107,
    type: "info",
    title: "System Maintenance Notice",
    description:
      "Planned downtime 2025-10-18 01:00–02:00 UTC (report generation queue paused; scanning unaffected).",
    timestamp: "2025-10-14T05:40:00Z • 3h ago",
    unread: true,
  },
];

// Backwards compatibility (legacy usage in hook before role-based split)
export const mockNotifications: INotification[] = [...mockStudentNotifications];
