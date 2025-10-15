import { haversineDistance } from "@/lib/server/util";

describe("server util haversineDistance", () => {
  test("computes ~ known distance", () => {
    const dist = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(340_000);
    expect(dist).toBeLessThan(350_000);
  });
});

