export type ErrorCode =
  | "INVALID_PARAMS"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_QUOTA"
  | "UPSTREAM_ERROR";

const STATUS: Record<ErrorCode, number> = {
  INVALID_PARAMS: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  UPSTREAM_QUOTA: 503,
  UPSTREAM_ERROR: 502,
};

const DEFAULT_MESSAGE: Record<ErrorCode, string> = {
  INVALID_PARAMS: "Parameter pencarian tidak valid.",
  NOT_FOUND: "Tempat ini sudah tidak ada di Google Maps.",
  RATE_LIMITED: "Terlalu banyak pencarian. Coba lagi 1 menit lagi.",
  UPSTREAM_QUOTA: "Kuota pencarian Ayo Makan sedang habis. Coba lagi nanti.",
  UPSTREAM_ERROR: "Google Maps sedang tidak bisa dihubungi. Coba lagi sebentar lagi.",
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly retryAfterSec?: number;

  constructor(code: ErrorCode, message?: string, retryAfterSec?: number) {
    super(message ?? DEFAULT_MESSAGE[code]);
    this.code = code;
    this.status = STATUS[code];
    this.retryAfterSec = retryAfterSec;
  }
}

export const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Format error seragam PRD 8.3. Pesan internal tidak pernah membocorkan kunci atau koordinat. */
export function errorResponse(e: unknown): Response {
  const err = e instanceof AppError ? e : new AppError("UPSTREAM_ERROR");
  const headers: Record<string, string> = { ...NO_STORE };
  if (err.retryAfterSec) headers["Retry-After"] = String(err.retryAfterSec);
  return Response.json({ error: { code: err.code, message: err.message } }, { status: err.status, headers });
}

export function jsonOk(body: unknown): Response {
  return Response.json(body, { headers: NO_STORE });
}
