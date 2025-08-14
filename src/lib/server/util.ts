/**
 * Calculates the Haversine distance in meters between two points.
 */
export function haversineDistance(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadius = 6371e3 // Radius of the Earth in meters

  const radLatA = toRadians(latitudeA)
  const radLatB = toRadians(latitudeB)
  const deltaLat = toRadians(latitudeB - latitudeA)
  const deltaLon = toRadians(longitudeB - longitudeA)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLatA) *
      Math.cos(radLatB) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadius * c
}
