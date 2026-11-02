import type { LatLng, PlaceDetail, SearchResponse } from "@/lib/places/types";
import type { SearchState } from "./search-state";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal, cache: "no-store" });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError("NETWORK", "Koneksi putus. Cek internet kamu, lalu coba lagi.", 0);
  }
  if (!res.ok) {
    let code = "UPSTREAM_ERROR";
    let message = "Terjadi masalah. Coba lagi sebentar lagi.";
    try {
      const body = (await res.json()) as { error?: { code?: string; message?: string } };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      /* badan bukan JSON */
    }
    throw new ApiError(code, message, res.status);
  }
  return (await res.json()) as T;
}

export function fetchSearch(
  s: SearchState,
  center: LatLng,
  pageToken: string | null,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const p = new URLSearchParams({
    lat: String(center.lat),
    lng: String(center.lng),
    radius: String(s.radius),
    cat: s.cat,
    minRating: String(s.minRating),
  });
  if (s.q) p.set("q", s.q);
  if (s.openNow) p.set("openNow", "1");
  if (s.murah) p.set("murah", "1");
  if (pageToken) p.set("pageToken", pageToken);
  return getJson<SearchResponse>(`/api/places/search?${p}`, signal);
}

export function fetchDetail(
  id: string,
  center: LatLng | null,
  card: boolean,
  signal?: AbortSignal,
): Promise<PlaceDetail> {
  const p = new URLSearchParams();
  if (center) {
    p.set("lat", String(center.lat));
    p.set("lng", String(center.lng));
  }
  if (card) p.set("fields", "card");
  const qs = p.toString();
  return getJson<PlaceDetail>(`/api/places/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`, signal);
}

export const photoSrc = (name: string, w: 400 | 800 | 1200) =>
  `/api/photo?name=${encodeURIComponent(name)}&w=${w}`;
