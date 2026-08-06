/* haversine, straight line distance between two coordinates in km.

   40 providers is small enough to load once and measure on the client, which
   is why there is no geohash indexing here. at a few thousand records this
   would move server side. */

const R = 6371 // earth radius, km
const rad = (deg) => (deg * Math.PI) / 180

export function distanceKm(fromLat, fromLng, toLat, toLng) {
  const dLat = rad(toLat - fromLat)
  const dLng = rad(toLng - fromLng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(fromLat)) * Math.cos(rad(toLat)) * Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// until the user shares a location on day 6, measure from the CBD
export const MELBOURNE_CBD = { lat: -37.8136, lng: 144.9631 }
