import { renderHook, act } from "@testing-library/react";
import { useGeolocation } from "@/hooks/useGeolocation";

describe("useGeolocation", () => {
  const originalGeolocation = navigator.geolocation;

  const geoMock = {
    watchPosition: jest.fn((success: PositionCallback) => {
      setTimeout(() => {
        success({
          coords: { latitude: 1, longitude: 2, accuracy: 3 } as any,
        } as any);
      }, 0);
      return 1;
    }),
    clearWatch: jest.fn(),
  } as any;

  beforeAll(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: geoMock,
      configurable: true,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("returns position after success", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useGeolocation(true));

    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.position).toEqual({ latitude: 1, longitude: 2, accuracy: 3 });
  });

  it("disables when enabled=false", () => {
    const { result } = renderHook(() => useGeolocation(false));
    expect(result.current.loading).toBe(false);
    expect(result.current.position).toBeNull();
  });
});
