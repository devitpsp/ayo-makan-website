import "server-only";
import { googleFetch } from "./client";
import { matchesCategory, CATEGORY_TYPES } from "./categories";
import { refine } from "./filters";
import { mapPlace } from "./mapper";
import { nearbyMask, textSearchMask } from "./fieldmasks";
import { listPhotosOn } from "./flags";
import type { GooglePlace, Place, SearchResponse } from "./types";
import type { SearchParams } from "./schema";
import { reserveQuota } from "@/lib/quota";

interface SearchRaw {
  places?: GooglePlace[];
  nextPageToken?: string;
}

export async function searchPlaces(p: SearchParams): Promise<SearchResponse> {
  const center = { lat: p.lat, lng: p.lng };
  const circle = { center: { latitude: p.lat, longitude: p.lng }, radius: p.radius };
  const photos = listPhotosOn();
  const refineOpts = { radius: p.radius, minRating: p.minRating, openNow: p.openNow, murah: p.murah };

  let raw: SearchRaw;
  let mode: SearchResponse["mode"];

  if (p.q) {
    mode = "keyword";
    await reserveQuota("text_search");
    // Text Search hanya punya locationBias (R6): radius ditegakkan ulang di refine().
    raw = await googleFetch<SearchRaw>({
      method: "POST",
      path: "places:searchText",
      fieldMask: textSearchMask(photos),
      body: {
        textQuery: p.q,
        languageCode: "id",
        regionCode: "ID",
        pageSize: 20,
        locationBias: { circle },
        ...(p.minRating > 0 ? { minRating: p.minRating } : {}),
        ...(p.openNow ? { openNow: true } : {}),
        ...(p.murah ? { priceLevels: ["PRICE_LEVEL_INEXPENSIVE"] } : {}),
        ...(p.pageToken ? { pageToken: p.pageToken } : {}),
      },
    });
    raw.places = (raw.places ?? []).filter((g) => matchesCategory(g.types ?? [], p.cat));
  } else {
    mode = "explore";
    await reserveQuota("nearby_search");
    raw = await googleFetch<SearchRaw>({
      method: "POST",
      path: "places:searchNearby",
      fieldMask: nearbyMask(photos),
      body: {
        includedTypes: CATEGORY_TYPES[p.cat],
        maxResultCount: 20,
        languageCode: "id",
        regionCode: "ID",
        rankPreference: "POPULARITY",
        locationRestriction: { circle },
      },
    });
  }

  const mapped = (raw.places ?? [])
    .map((g) => mapPlace(g, center))
    .filter((x): x is Place => x !== null)
    .map((pl) => (photos ? pl : { ...pl, photo: null }));

  return {
    mode,
    places: refine(mapped, refineOpts),
    nextPageToken: mode === "keyword" ? (raw.nextPageToken ?? null) : null,
    truncated: mode === "explore" && (raw.places?.length ?? 0) >= 20,
  };
}
