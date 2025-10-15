import { calculateLectureAttendance, getLectureAttendanceData, calculateStudentOverallAttendance } from "@/lib/server/attendance-calculator";

jest.mock("@/lib/server/query", () => ({
  rawQuery: jest.fn(),
}));

const { rawQuery } = jest.requireMock("@/lib/server/query");

describe("attendance-calculator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calculateLectureAttendance basic mapping", () => {
    expect(calculateLectureAttendance(0)).toBe(0);
    expect(calculateLectureAttendance(1)).toBe(45);
    expect(calculateLectureAttendance(2)).toBe(90);
    expect(calculateLectureAttendance(3)).toBe(0);
  });

  test("getLectureAttendanceData builds student records", async () => {
    rawQuery
      // qrSessionInfo
      .mockResolvedValueOnce([
        { qr_code_study_session_id: 10, subject_id: 7, subject_code: "CS101", subject_name: "Intro CS" },
      ])
      // enrolledStudents
      .mockResolvedValueOnce([
        { student_id: "s1", student_name: "Alice", student_email: "a@x.com" },
        { student_id: "s2", student_name: "Bob", student_email: "b@x.com" },
      ])
      // checkinData
      .mockResolvedValueOnce([
        { student_id: "s1", checkin_count: 2 },
      ]);

    const res = await getLectureAttendanceData(99, 3);
    expect(res.studySessionId).toBe(99);
    expect(res.weekNumber).toBe(3);
    expect(res.subjectCode).toBe("CS101");
    expect(res.students).toHaveLength(2);

    const alice = res.students.find(s => s.studentId === "s1")!;
    const bob = res.students.find(s => s.studentId === "s2")!;
    expect(alice.attendancePercentage).toBe(90);
    expect(bob.attendancePercentage).toBe(0);
  });

  test("calculateStudentOverallAttendance aggregates correctly", async () => {
    rawQuery
      // subjectInfo
      .mockResolvedValueOnce([{ subject_code: "CS101", subject_name: "Intro CS", required_lectures: 12, required_attendance_thresh: 0.8 }])
      // studentInfo
      .mockResolvedValueOnce([{ student_name: "Alice", student_email: "a@x.com" }])
      // lectureAttendance
      .mockResolvedValueOnce([
        { week_number: 1, checkin_count: 2 },
        { week_number: 2, checkin_count: 1 },
      ]);

    const res = await calculateStudentOverallAttendance("s1", 7);
    expect(res.totalLectures).toBe(2);
    expect(res.attendedLectures).toBe(2);
    expect(res.totalAttendancePercentage).toBeCloseTo(75, 5);
    expect(res.requiredAttendanceThresh).toBe(80);
    expect(res.isLowAttendance).toBe(true);
    expect(res.classesCanMiss).toBe(1); // derived from formula
  });
});

