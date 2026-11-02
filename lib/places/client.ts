import "server-only";
import { AppError } from "./errors";

const BASE = "https://places.googleapis.com/v1";
const TIMEOUT_MS = 8000;

export interface GoogleRequest {
  path: string; // "places:searchText" atau "places/{id}"
  method: "GET" | "POST";
  fieldMask?: string;
  body?: unknown;
  query?: Record<string, string>;
}

function apiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    // Pesan generik ke pengguna; detail hanya di log server.
    console.error("[places] GOOGLE_MAPS_API_KEY belum diatur");
    throw new AppError("UPSTREAM_ERROR");
  }
  return key;
}

function mapStatus(status: number, googleStatus?: string): AppError {
  if (status === 404) return new AppError("NOT_FOUND");
  if (status === 429 || googleStatus === "RESOURCE_EXHAUSTED") return new AppError("UPSTREAM_QUOTA");
  // 403 karena kuota per hari yang diturunkan owner (PRD 9.1) atau kunci salah: tidak dibedakan ke pengguna.
  return new AppError("UPSTREAM_ERROR");
}

/**
 * Satu-satunya pintu keluar ke Google. Timeout 8 dtk, retry 1x hanya untuk respons 5xx.
 * Log hanya status dan path tanpa query, jadi koordinat pengguna tidak pernah masuk log (PRD 11).
 */
export async function googleFetch<T>(req: GoogleRequest): Promise<T> {
  const key = apiKey();
  const url = new URL(`${BASE}/${req.path}`);
  for (const [k, v] of Object.entries(req.query ?? {})) url.searchParams.set(k, v);

  const headers: Record<string, string> = { "X-Goog-Api-Key": key };
  if (req.fieldMask) headers["X-Goog-FieldMask"] = req.fieldMask;
  if (req.body !== undefined) headers["Content-Type"] = "application/json";

  let lastError: AppError = new AppError("UPSTREAM_ERROR");
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: req.method,
        headers,
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (e) {
      console.error("[places] network", e instanceof Error ? e.name : "unknown");
      // Timeout BUKAN alasan retry: Google bisa sudah memproses (dan menagih) permintaan pertama, dan retry
      // menagih lagi tanpa hitungan kuota internal (PRD 11: retry hanya untuk 5xx).
      throw new AppError("UPSTREAM_ERROR");
    }

    if (res.ok) return (await res.json()) as T;

    let googleStatus: string | undefined;
    try {
      googleStatus = ((await res.json()) as { error?: { status?: string } }).error?.status;
    } catch {
      /* badan bukan JSON */
    }
    console.error("[places] upstream", res.status, googleStatus ?? "-", req.path.split("/")[0]);
    const err = mapStatus(res.status, googleStatus);
    if (res.status >= 500 && attempt === 0) {
      lastError = err;
      continue;
    }
    throw err;
  }
  throw lastError;
}
