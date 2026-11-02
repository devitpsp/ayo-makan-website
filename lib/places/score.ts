import type { Place, SortMode } from "./types";

/** Bobot ulasan: tempat dengan ulasan sedikit ditarik ke rata-rata hasil (PRD F-06). */
export const SCORE_PRIOR_REVIEWS = 20;

/** skor = v/(v+m) * R + m/(v+m) * C */
export function ratingScore(rating: number, count: number, mean: number, m = SCORE_PRIOR_REVIEWS): number {
  const v = Math.max(0, count);
  return (v / (v + m)) * rating + (m / (v + m)) * mean;
}

export function meanRating(places: Place[]): number {
  const rated = places.filter((p) => p.rating != null);
  if (rated.length === 0) return 0;
  return rated.reduce((sum, p) => sum + (p.rating as number), 0) / rated.length;
}

/** Mengurutkan salinan daftar. "cocok" = urutan asli dari Google. */
export function sortPlaces(places: Place[], mode: SortMode): Place[] {
  const copy = [...places];
  if (mode === "terdekat") {
    return copy.sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));
  }
  if (mode === "teruji") {
    const c = meanRating(places);
    const score = (p: Place) => (p.rating == null ? -1 : ratingScore(p.rating, p.ratingCount ?? 0, c));
    return copy.sort((a, b) => score(b) - score(a));
  }
  return copy;
}
