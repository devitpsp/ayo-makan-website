import { haversineM } from "./geo";
import type {
  GooglePlace,
  GoogleReview,
  LatLng,
  PhotoRef,
  Place,
  PlaceDetail,
  Review,
} from "./types";

function money(m?: { units?: string; nanos?: number }): number | null {
  if (!m || m.units == null) return null;
  const n = Number(m.units);
  return Number.isFinite(n) ? n : null;
}

type GooglePhoto = NonNullable<GooglePlace["photos"]>[number];

function mapPhoto(p?: GooglePhoto): PhotoRef | null {
  if (!p?.name) return null;
  const a = p.authorAttributions?.[0];
  return { name: p.name, author: a?.displayName ?? null, authorUri: a?.uri ?? null };
}

/** Respons Google -> JSON ringkas. Tanpa lokasi = tidak bisa dihitung jaraknya, dibuang. */
export function mapPlace(g: GooglePlace, center: LatLng | null): Place | null {
  if (!g.id || !g.location) return null;
  const lat = g.location.latitude;
  const lng = g.location.longitude;
  const start = money(g.priceRange?.startPrice);
  const end = money(g.priceRange?.endPrice);
  const level = g.priceLevel && g.priceLevel !== "PRICE_LEVEL_UNSPECIFIED" ? g.priceLevel : null;
  return {
    id: g.id,
    name: g.displayName?.text ?? "Tanpa nama",
    lat,
    lng,
    distanceM: center ? Math.round(haversineM(center, { lat, lng })) : null,
    rating: typeof g.rating === "number" ? g.rating : null,
    ratingCount: typeof g.userRatingCount === "number" ? g.userRatingCount : null,
    priceLevel: level,
    priceRange:
      start != null || end != null
        ? { start, end, currency: g.priceRange?.startPrice?.currencyCode ?? g.priceRange?.endPrice?.currencyCode ?? "IDR" }
        : null,
    openNow: typeof g.currentOpeningHours?.openNow === "boolean" ? g.currentOpeningHours.openNow : null,
    primaryType: g.primaryType ?? null,
    photo: mapPhoto(g.photos?.[0]),
  };
}

function mapReview(r: GoogleReview): Review | null {
  const text = r.text?.text ?? r.originalText?.text ?? "";
  if (!r.authorAttribution?.displayName || typeof r.rating !== "number") return null;
  const translated =
    !!r.text?.languageCode &&
    !!r.originalText?.languageCode &&
    r.text.languageCode !== r.originalText.languageCode;
  return {
    author: r.authorAttribution.displayName,
    authorUri: r.authorAttribution.uri ?? null,
    authorPhoto: r.authorAttribution.photoUri ?? null,
    rating: r.rating,
    relativeTime: r.relativePublishTimeDescription ?? "",
    text,
    originalText: translated ? (r.originalText?.text ?? null) : null,
    translated,
    googleMapsUri: r.googleMapsUri ?? null,
    flagUri: r.flagContentUri ?? null,
  };
}

export function mapDetail(g: GooglePlace, center: LatLng | null): PlaceDetail | null {
  const base = mapPlace(g, center);
  if (!base) return null;
  return {
    ...base,
    primaryTypeLabel: g.primaryTypeDisplayName?.text ?? null,
    address: g.shortFormattedAddress ?? null,
    photos: (g.photos ?? []).slice(0, 5).map(mapPhoto).filter((p): p is PhotoRef => p !== null),
    weekdayDescriptions: g.regularOpeningHours?.weekdayDescriptions ?? [],
    googleMapsUri: g.googleMapsUri ?? g.googleMapsLinks?.placeUri ?? null,
    directionsUri: g.googleMapsLinks?.directionsUri ?? null,
    writeReviewUri: g.googleMapsLinks?.writeAReviewUri ?? null,
    reviews: (g.reviews ?? []).map(mapReview).filter((r): r is Review => r !== null).slice(0, 5),
  };
}

function trimNumber(n: number, digits: number): string {
  return String(Number(n.toFixed(digits))).replace(".", ",");
}

/** Rp10rb, Rp1,5rb, Rp1,25jt (format Indonesia, PRD 10.9). */
export function formatPrice(n: number): string {
  if (n >= 1_000_000) return `Rp${trimNumber(n / 1_000_000, 2)}jt`;
  if (n >= 1000) return `Rp${trimNumber(n / 1000, 1)}rb`;
  return `Rp${Math.round(n)}`;
}
