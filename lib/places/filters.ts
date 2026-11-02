import type { MinRating, Place, Radius } from "./types";

export interface RefineOptions {
  radius: Radius;
  minRating: MinRating;
  openNow: boolean;
  murah: boolean;
}

/**
 * Filter server satu pintu. Dipakai untuk Nearby (Google tidak punya filter ini)
 * dan sebagai lapis kedua untuk Text Search (radius hanya bias di Google, R6).
 */
export function refine(places: Place[], o: RefineOptions): Place[] {
  return places.filter((p) => {
    if (p.distanceM != null && p.distanceM > o.radius) return false;
    if (o.minRating > 0 && (p.rating == null || p.rating < o.minRating)) return false;
    if (o.openNow && p.openNow !== true) return false;
    if (o.murah && p.priceLevel !== "PRICE_LEVEL_INEXPENSIVE") return false;
    return true;
  });
}
