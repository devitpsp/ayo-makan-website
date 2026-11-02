import type { PlaceDetail } from "@/lib/places/types";

/**
 * Tautan rute (PRD F-10): directionsUri dari Google lebih dulu, fallback Maps URLs resmi.
 * Mode jalan kaki bila radius pencarian ≤ 1 km, selain itu motor/mobil.
 */
export function routeUrl(
  p: Pick<PlaceDetail, "id" | "lat" | "lng" | "directionsUri">,
  radius: number | null,
): string {
  if (p.directionsUri) return p.directionsUri;
  const mode = radius != null && radius > 1000 ? "driving" : "walking";
  const u = new URL("https://www.google.com/maps/dir/");
  u.searchParams.set("api", "1");
  u.searchParams.set("destination", `${p.lat},${p.lng}`);
  u.searchParams.set("destination_place_id", p.id);
  u.searchParams.set("travelmode", mode);
  return u.toString();
}

/** Cari langsung di Google Maps, dipakai saat kuota Ayo Makan habis (PRD 10.7). */
export function mapsSearchUrl(q: string): string {
  const u = new URL("https://www.google.com/maps/search/");
  u.searchParams.set("api", "1");
  u.searchParams.set("query", q || "makanan");
  return u.toString();
}

/** Buka tempat di Google Maps lewat place_id (dipakai saat kuota habis atau tempat tanpa googleMapsUri). */
export function placeUrl(id: string): string {
  const u = new URL("https://www.google.com/maps/search/");
  u.searchParams.set("api", "1");
  u.searchParams.set("query", "tempat");
  u.searchParams.set("query_place_id", id);
  return u.toString();
}
