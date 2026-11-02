export type Category = "makanan" | "minuman" | "jajanan";
export type SortMode = "cocok" | "terdekat" | "teruji";
export type Radius = 500 | 1000 | 2000 | 3000;
export type MinRating = 0 | 4 | 4.5;

export interface LatLng {
  lat: number;
  lng: number;
}

/* ---------- Bentuk respons Google Places API (New), hanya field yang kita minta ---------- */

interface GoogleMoney {
  currencyCode?: string;
  units?: string;
  nanos?: number;
}

export interface GoogleReview {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string; languageCode?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  publishTime?: string;
  flagContentUri?: string;
  googleMapsUri?: string;
}

export interface GooglePlace {
  id: string;
  displayName?: { text?: string };
  location?: { latitude: number; longitude: number };
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  types?: string[];
  shortFormattedAddress?: string;
  photos?: {
    name: string;
    authorAttributions?: { displayName?: string; uri?: string }[];
  }[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  priceRange?: { startPrice?: GoogleMoney; endPrice?: GoogleMoney };
  currentOpeningHours?: { openNow?: boolean };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  googleMapsUri?: string;
  googleMapsLinks?: {
    directionsUri?: string;
    placeUri?: string;
    writeAReviewUri?: string;
    reviewsUri?: string;
    photosUri?: string;
  };
  reviews?: GoogleReview[];
}

/* ---------- Bentuk JSON ringkas yang dikirim ke browser (PRD 8.3) ---------- */

export interface PhotoRef {
  name: string;
  author: string | null;
  authorUri: string | null;
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceM: number | null;
  rating: number | null;
  ratingCount: number | null;
  priceLevel: string | null;
  priceRange: { start: number | null; end: number | null; currency: string } | null;
  openNow: boolean | null;
  primaryType: string | null;
  photo: PhotoRef | null;
}

export interface Review {
  author: string;
  authorUri: string | null;
  authorPhoto: string | null;
  rating: number;
  relativeTime: string;
  text: string;
  originalText: string | null;
  translated: boolean;
  googleMapsUri: string | null;
  flagUri: string | null;
}

export interface PlaceDetail extends Place {
  primaryTypeLabel: string | null;
  address: string | null;
  photos: PhotoRef[];
  weekdayDescriptions: string[];
  googleMapsUri: string | null;
  directionsUri: string | null;
  writeReviewUri: string | null;
  reviews: Review[];
}

export interface SearchResponse {
  mode: "keyword" | "explore";
  places: Place[];
  nextPageToken: string | null;
  /** Nearby Search penuh (20 dari Google) sebelum disaring: ada kemungkinan hasil lain, sarankan kata kunci. */
  truncated: boolean;
}
