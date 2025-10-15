import { cn, formatHHMM, haversineDistance, formatDate, parseTimeToDate, computeQrDateForWeek, getQrDateForWeek } from "@/lib/utils";

describe("utils", () => {
  test("cn merges classNames and objects", () => {
    const result = cn("btn", undefined as any, { active: true, hidden: false }, "btn-primary");
    expect(result).toContain("btn");
    expect(result).toContain("btn-primary");
    expect(result).toContain("active");
    expect(result).not.toContain("hidden");
  });

  test("formatHHMM returns formatted time or placeholder", () => {
    const d = new Date(2023, 0, 1, 9, 5, 0, 0);
    expect(formatHHMM(d)).toBe("09:05");
    expect(formatHHMM(undefined)).toBe("--:--");
  });

  test("haversineDistance computes ~ known distance", () => {
    // London(51.5074, -0.1278) to Paris(48.8566, 2.3522) ~ 343km
    const dist = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(340_000);
    expect(dist).toBeLessThan(350_000);
  });

  test("formatDate mirrors locale formatting", () => {
    const d = new Date(2023, 0, 1);
    const expected = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    expect(formatDate(d)).toBe(expected);
  });

  test("parseTimeToDate sets hours and minutes on base date", () => {
    const base = new Date(2023, 0, 1, 0, 0, 0, 0);
    const result = parseTimeToDate(base, "14:30");
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });

  test("computeQrDateForWeek aligns to target weekday within given week diff", () => {
    const anchor = { week_number: 1, date: new Date(2023, 0, 2).toISOString() }; // Mon Jan 2, 2023
    const monday = computeQrDateForWeek("Monday", 1, anchor);
    const sunday = computeQrDateForWeek("Sunday", 1, anchor);
    expect(monday.toDateString()).toBe(new Date(2023, 0, 2).toDateString());
    expect(sunday.toDateString()).toBe(new Date(2023, 0, 1).toDateString());

    // One week ahead, Monday should be Jan 9, 2023
    const mondayNext = computeQrDateForWeek("Monday", 2, anchor);
    expect(mondayNext.toDateString()).toBe(new Date(2023, 0, 9).toDateString());
  });

  test("getQrDateForWeek returns formatted string", () => {
    const anchor = { week_number: 1, date: new Date(2023, 0, 2).toISOString() };
    const str = getQrDateForWeek("Monday", 1, anchor);
    const expected = formatDate(new Date(2023, 0, 2));
    expect(str).toBe(expected);
  });
});

