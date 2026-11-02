// Field menentukan tarif SKU (PRD 8.3, 9). Dibuat sekecil mungkin.
// Catatan: nextPageToken hanya valid di Text Search, tidak ada di mask Nearby Search.

const LIST_BASE = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.primaryType",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.priceRange",
  "places.currentOpeningHours.openNow",
];

export function textSearchMask(withPhotos: boolean): string {
  const f = [...LIST_BASE, "places.types", "nextPageToken"];
  if (withPhotos) f.push("places.photos");
  return f.join(",");
}

export function nearbyMask(withPhotos: boolean): string {
  const f = [...LIST_BASE];
  if (withPhotos) f.push("places.photos");
  return f.join(",");
}

const DETAIL_CARD_BASE = [
  "id",
  "displayName",
  "location",
  "primaryType",
  "rating",
  "userRatingCount",
  "priceLevel",
  "priceRange",
  "currentOpeningHours.openNow",
];

export const DETAIL_FULL_MASK = [
  ...DETAIL_CARD_BASE,
  "photos",
  "primaryTypeDisplayName",
  "shortFormattedAddress",
  "regularOpeningHours.weekdayDescriptions",
  "googleMapsUri",
  "googleMapsLinks",
  "reviews",
].join(",");

/** Kartu Favorit: foto hanya diminta bila LIST_PHOTOS=on, sama seperti daftar hasil (PRD 9 tuas no.1). */
export function detailCardMask(withPhotos: boolean): string {
  return (withPhotos ? [...DETAIL_CARD_BASE, "photos"] : DETAIL_CARD_BASE).join(",");
}
