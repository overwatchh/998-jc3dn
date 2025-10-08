import { haversineDistance as serverHaversine } from "@/lib/server/util";
import { haversineDistance as clientHaversine } from "@/lib/utils";

describe("haversineDistance", () => {
  it("returns 0 for identical coordinates", () => {
    const lat = 40.7128;
    const lon = -74.0060;
    expect(serverHaversine(lat, lon, lat, lon)).toBeCloseTo(0, 6);
    expect(clientHaversine(lat, lon, lat, lon)).toBeCloseTo(0, 6);
  });

  it("computes known distance (NYC to LA approx 3935746m)", () => {
    const nyc = { lat: 40.7128, lon: -74.0060 };
    const la = { lat: 34.0522, lon: -118.2437 };
    const d1 = serverHaversine(nyc.lat, nyc.lon, la.lat, la.lon);
    const d2 = clientHaversine(nyc.lat, nyc.lon, la.lat, la.lon);
    expect(d1).toBeGreaterThan(3_800_000);
    expect(d1).toBeLessThan(4_100_000);
    expect(d2).toBeGreaterThan(3_800_000);
    expect(d2).toBeLessThan(4_100_000);
  });
});


