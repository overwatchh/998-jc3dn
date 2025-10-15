import { renderHook, act, waitFor } from "@testing-library/react";
import { useGeolocation } from "@/hooks/useGeolocation";

describe("useGeolocation", () => {
  let watchMock: jest.Mock;
  let clearMock: jest.Mock;
  let capturedSucc: any;
  let capturedErr: any;

  beforeEach(() => {
    watchMock = jest.fn();
    clearMock = jest.fn();
    capturedSucc = undefined;
    capturedErr = undefined;
    Object.defineProperty(global, "navigator", {
      value: {
        geolocation: {
          watchPosition: watchMock,
          clearWatch: clearMock,
        },
      },
      configurable: true,
    });
  });

  test("success path sets position and clears loading", async () => {
    watchMock.mockImplementation((succ: any, err: any) => {
      capturedSucc = succ;
      capturedErr = err;
      return 999;
    });

    const { result, unmount } = renderHook(() => useGeolocation(true));

    await act(async () => {
      capturedSucc({ coords: { latitude: 1, longitude: 2, accuracy: 3 } });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.position).toEqual({ latitude: 1, longitude: 2, accuracy: 3 });

    unmount();
    expect(clearMock).toHaveBeenCalledWith(999);
  });

  test("error path sets some error and clears loading", async () => {
    watchMock.mockImplementation((succ: any, err: any) => {
      capturedSucc = succ;
      capturedErr = err;
      return 1234;
    });

    const { result, unmount } = renderHook(() => useGeolocation(true));

    await act(async () => {
      capturedErr({ message: "denied" });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.position).toBe(null);

    unmount();
  });

  test("disabled state does not request geolocation and sets loading false", () => {
    const { result } = renderHook(() => useGeolocation(false));
    expect(watchMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
