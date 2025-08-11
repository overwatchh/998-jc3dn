"use client";

import { useState, useEffect } from "react";

interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

export default function GeolocationDisplay() {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: "Geolocation is not supported by your browser" });
      setLoading(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLoading(false);
    };

    const handleError = (error: GeolocationPositionError) => {
      setError({ code: error.code, message: error.message });
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

    // Optional: Watch position (updates location as the user moves)
    // const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError);
    // return () => navigator.geolocation.clearWatch(watchId); // Cleanup watcher on unmount

  }, []);

  return (
    <div className="mt-4 p-4 border rounded">
      <h3 className="font-bold mb-2">Current Location:</h3>
      {loading && <p>Loading location...</p>}
      {error && (
        <div className="text-red-600">
          <p>Error fetching location:</p>
          <p className="text-sm">{`Code: ${error.code}, Message: ${error.message}`}</p>
        </div>
      )}
      {location && !loading && !error && (
        <div className="text-blue-800 bg-blue-100 p-2 rounded">
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
        </div>
      )}
      {!location && !loading && !error && (
         <p>Could not retrieve location.</p>
      )}
    </div>
  );
} 