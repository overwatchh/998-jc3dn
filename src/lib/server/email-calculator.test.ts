import { calculateSessionAttendance, calculateStudentAttendancePercentage, calculateSessionAttendanceRate, getSubjectAverageAttendance, getAtRiskStudents } from "@/lib/server/email-calculator";

jest.mock("@/lib/server/query", () => ({
  rawQuery: jest.fn(),
}));

const { rawQuery } = jest.requireMock("@/lib/server/query");

describe("email-calculator", () => {
  beforeEach(() => jest.clearAllMocks());

  test("calculateSessionAttendance mapping", () => {
    expect(calculateSessionAttendance(0)).toBe(0);
    expect(calculateSessionAttendance(1)).toBe(50);
    expect(calculateSessionAttendance(2)).toBe(100);
    expect(calculateSessionAttendance(5)).toBe(100);
  });

  test("calculateStudentAttendancePercentage aggregates across sessions", async () => {
    rawQuery.mockResolvedValueOnce([
      { qr_session_id: 1, checkin_count: 2 },
      { qr_session_id: 2, checkin_count: 1 },
      { qr_session_id: 3, checkin_count: 0 },
    ]);
    const pct = await calculateStudentAttendancePercentage("s1", 7);
    // Points: 100 + 50 + 0 = 150 / 300 = 50%
    expect(pct).toBe(50);
  });

  test("calculateSessionAttendanceRate uses enrolment or tutorial list", async () => {
    // First call returns qrSession
    rawQuery
      .mockResolvedValueOnce([{ study_session_id: 11 }])
      // enrolment-based
      .mockResolvedValueOnce([
        { student_id: "s1", checkin_count: 2 },
        { student_id: "s2", checkin_count: 0 },
      ]);

    const rate = await calculateSessionAttendanceRate(10, 7);
    // Points: 100 + 0 over 2 students = 50%
    expect(rate).toBe(50);

    // Tutorial-based
    rawQuery
      .mockResolvedValueOnce([{ study_session_id: 11 }])
      .mockResolvedValueOnce([
        { student_id: "s3", checkin_count: 1 },
      ]);

    const rateTutorial = await calculateSessionAttendanceRate(10, 7, "tutorial", 22);
    expect(rateTutorial).toBe(50);
  });

  test("getSubjectAverageAttendance averages session rates", async () => {
    rawQuery.mockResolvedValueOnce([
      { qr_session_id: 1, total_points: 100, max_points: 200, attendance_rate: 50 },
      { qr_session_id: 2, total_points: 300, max_points: 300, attendance_rate: 100 },
    ]);
    const avg = await getSubjectAverageAttendance(7);
    expect(avg).toBe(75);
  });

  test("getAtRiskStudents returns count from aggregated query", async () => {
    rawQuery.mockResolvedValueOnce([{ at_risk_count: 5 }]);
    const n = await getAtRiskStudents(7, 80);
    expect(n).toBe(5);
  });
});

