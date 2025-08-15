export const attendanceRecords = [
  {
    date: "2024-01-15",
    course: "Computer Science 101",
    status: "present" as const,
    checkInTime: "9:15 AM",
  },
  {
    date: "2024-01-14",
    course: "Mathematics 201",
    status: "present" as const,
    checkInTime: "11:10 AM",
  },
  {
    date: "2024-01-14",
    course: "Physics 301",
    status: "absent" as const,
    checkInTime: "-",
  },
  {
    date: "2024-01-13",
    course: "Computer Science 101",
    status: "late" as const,
    checkInTime: "9:25 AM",
  },
  {
    date: "2024-01-12",
    course: "Mathematics 201",
    status: "partial" as const,
    checkInTime: "11:45 AM",
  },
]
