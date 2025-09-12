import { GeolocationCoords } from "@/types";
import { useEffect, useState } from "react";

export interface UseGeolocationReturn {
  position: GeolocationCoords | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = (
  enabled: boolean = true
): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeolocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);

  useEffect(() => {
    if (!enabled) {
      // Do not request permission when disabled
      setLoading(false);
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const successHandler = (pos: GeolocationPosition) => {
      setPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setLoading(false);
      setError(null);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      setError(error.message);
      setLoading(false);
      setPosition(null);
    };

    const watchId = navigator.geolocation.watchPosition(
      successHandler as PositionCallback,
      errorHandler,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled]);

  return { position, error, loading };
};

export default useGeolocation;
