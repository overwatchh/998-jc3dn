import { getLectureAttendanceData, calculateStudentOverallAttendance } from "@/lib/server/attendance-calculator";
import * as queryModule from "@/lib/server/query";

jest.mock("@/lib/server/query", () => ({ rawQuery: jest.fn() }));

const rawQuery = queryModule.rawQuery as jest.Mock;

describe("attendance-calculator with DB mocks", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("getLectureAttendanceData builds records for enrolled students", async () => {
    // 1) qr session info
    rawQuery.mockResolvedValueOnce([
      {
        qr_code_study_session_id: 999,
        subject_id: 42,
        subject_code: "CS101",
        subject_name: "Intro CS",
      },
    ]);
    // 2) enrolled students
    rawQuery.mockResolvedValueOnce([
      { student_id: "s1", student_name: "Alice", student_email: "a@u" },
      { student_id: "s2", student_name: "Bob", student_email: "b@u" },
    ]);
    // 3) checkins
    rawQuery.mockResolvedValueOnce([
      { student_id: "s1", checkin_count: 2 },
      { student_id: "s2", checkin_count: 1 },
    ]);

    const result = await getLectureAttendanceData(123, 5);

    expect(result.studySessionId).toBe(123);
    expect(result.weekNumber).toBe(5);
    expect(result.subjectId).toBe(42);
    expect(result.subjectCode).toBe("CS101");
    expect(result.subjectName).toBe("Intro CS");
    expect(result.students).toHaveLength(2);

    const alice = result.students.find(s => s.studentId === "s1")!;
    const bob = result.students.find(s => s.studentId === "s2")!;

    expect(alice.attendancePercentage).toBe(90);
    expect(bob.attendancePercentage).toBe(45);
  });

  it("calculateStudentOverallAttendance aggregates totals and flags low attendance", async () => {
    // 1) subject info
    rawQuery.mockResolvedValueOnce([
      {
        subject_code: "CS101",
        subject_name: "Intro CS",
        required_lectures: 12,
        required_attendance_thresh: 0.8, // 80%
      },
    ]);
    // 2) student info
    rawQuery.mockResolvedValueOnce([
      {
        student_name: "Alice",
        student_email: "a@u",
      },
    ]);
    // 3) lecture attendance rows
    rawQuery.mockResolvedValueOnce([
      { week_number: 1, checkin_count: 2 },
      { week_number: 2, checkin_count: 1 },
      { week_number: 3, checkin_count: 0 },
    ]);

    const res = await calculateStudentOverallAttendance("s1", 42);

    expect(res.subjectCode).toBe("CS101");
    expect(res.studentName).toBe("Alice");
    expect(res.totalLectures).toBe(3);
    expect(res.attendedLectures).toBe(2);
    // total points 90 + 45 + 0 = 135, possible 3 * 90 = 270 => 50%
    expect(res.totalAttendancePercentage).toBeCloseTo(50);
    expect(res.isLowAttendance).toBe(true);
    expect(res.classesCanMiss).toBe(0); // cannot miss any to reach 80% by end (with our setup)
  });

  it("calculateStudentOverallAttendance throws when subject missing", async () => {
    rawQuery.mockResolvedValueOnce([]); // subjectInfo missing
    await expect(
      calculateStudentOverallAttendance("s1", 42)
    ).rejects.toThrow(/Subject not found/);
  });
});


