import { calculateSessionAttendance } from "@/lib/server/email-calculator";

describe("calculateSessionAttendance (email method)", () => {
  it("returns 100 for 2 or more check-ins", () => {
    expect(calculateSessionAttendance(2)).toBe(100);
    expect(calculateSessionAttendance(5)).toBe(100);
  });

  it("returns 50 for 1 check-in", () => {
    expect(calculateSessionAttendance(1)).toBe(50);
  });

  it("returns 0 for 0 check-ins", () => {
    expect(calculateSessionAttendance(0)).toBe(0);
  });
});


