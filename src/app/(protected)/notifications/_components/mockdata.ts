export interface INotification {
  id: number
  type: "warning" | "info" | "system"
  title: string
  description: string
  timestamp: string
  unread: boolean
}

export const mockNotifications: INotification[] = [
  {
    id: 1,
    type: "warning" as const,
    title: "Attendance Alert",
    description: "Your Physics 301 attendance has dropped below 75%",
    timestamp: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    type: "info" as const,
    title: "Class Schedule Update",
    description: "Mathematics 201 has been moved to Room B-106",
    timestamp: "1 day ago",
    unread: true,
  },
  {
    id: 3,
    type: "system" as const,
    title: "Attendance Confirmed",
    description:
      "Successfully completed high-accuracy verification for Computer Science 101",
    timestamp: "2 days ago",
    unread: false,
  },
  {
    id: 4,
    type: "warning" as const,
    title: "Missing Attendance",
    description: "You missed Physics 301 class on January 14",
    timestamp: "3 days ago",
    unread: false,
  },
  {
    id: 5,
    type: "info" as const,
    title: "Enhanced Security Update",
    description:
      "High-accuracy location verification now active for all classes",
    timestamp: "1 week ago",
    unread: false,
  },
]
