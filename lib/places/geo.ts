import type { LatLng } from "./types";

const EARTH_RADIUS_M = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Jarak garis lurus antara dua koordinat, dalam meter. */
export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "450 m", "1,2 km", "2 km" (format Indonesia, PRD 10.9). */
export function formatDistance(m: number): string {
  if (m < 995) return `${Math.round(m / 10) * 10} m`;
  const km = Math.round(m / 100) / 10;
  return `${String(km).replace(".", ",")} km`;
}

// Kotak batas Kota Salatiga dan sekitarnya. Dipakai membuang koordinat liar sebelum memanggil Google.
export const SALATIGA_BOUNDS = { minLat: -7.5, maxLat: -7.15, minLng: 110.3, maxLng: 110.7 } as const;

export function isInBounds(lat: number, lng: number): boolean {
  return (
    lat >= SALATIGA_BOUNDS.minLat &&
    lat <= SALATIGA_BOUNDS.maxLat &&
    lng >= SALATIGA_BOUNDS.minLng &&
    lng <= SALATIGA_BOUNDS.maxLng
  );
}
