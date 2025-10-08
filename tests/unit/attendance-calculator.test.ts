import { calculateLectureAttendance } from "@/lib/server/attendance-calculator";

describe("calculateLectureAttendance", () => {
  it("returns 90 for 2 check-ins", () => {
    expect(calculateLectureAttendance(2)).toBe(90);
  });

  it("returns 45 for 1 check-in", () => {
    expect(calculateLectureAttendance(1)).toBe(45);
  });

  it("returns 0 for 0 check-ins", () => {
    expect(calculateLectureAttendance(0)).toBe(0);
  });

  it("returns 0 for unexpected values", () => {
    expect(calculateLectureAttendance(-1)).toBe(0);
    expect(calculateLectureAttendance(3)).toBe(0);
  });
});


