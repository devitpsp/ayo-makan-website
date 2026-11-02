import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { AppError } from "@/lib/places/errors";
import { getRedis } from "./redis";

/*
 * Batas per IP per 5 menit (PRD 8.6: "angka awal, disesuaikan setelah melihat pola pemakaian nyata").
 * Dinaikkan dari 20/30/120 setelah audit: seluruh Wi-Fi kampus berbagi satu IP, jadi 20 pencarian membuat demo
 * kelas langsung kena 429. Pengaman biaya sebenarnya adalah batas bulanan global per SKU (lib/quota.ts, 950),
 * bukan batas per IP; batas ini hanya menahan satu klien yang membanjiri.
 * Satu kunjungan Favorit penuh (30 detail) tidak lagi menghabiskan jatah detail.
 */
export const LIMITS = { search: 60, details: 60, photo: 240 } as const;
export type LimitScope = keyof typeof LIMITS;

const WINDOW_MS = 5 * 60 * 1000;
const limiters = new Map<LimitScope, Ratelimit>();
const memory = new Map<string, number[]>();

/**
 * IP klien. Header yang diisi platform (Vercel) didahulukan karena tidak bisa dipalsukan klien;
 * X-Forwarded-For paling kiri hanya cadangan (di luar Vercel klien bisa mengisinya sendiri).
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  const vercel = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function upstashLimiter(scope: LimitScope): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  let l = limiters.get(scope);
  if (!l) {
    l = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LIMITS[scope], "5 m"),
      prefix: `rl:${scope}`,
    });
    limiters.set(scope, l);
  }
  return l;
}

/** Cadangan memori per instance: cukup untuk dev dan sebagai lapis tambahan, bukan pengganti Redis. */
function memoryCheck(scope: LimitScope, ip: string, now = Date.now()): { ok: boolean; retryAfterSec: number } {
  const key = `${scope}:${ip}`;
  const hits = (memory.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= LIMITS[scope]) {
    memory.set(key, hits);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((hits[0] + WINDOW_MS - now) / 1000)) };
  }
  hits.push(now);
  memory.set(key, hits);
  return { ok: true, retryAfterSec: 0 };
}

export async function enforceRateLimit(req: Request, scope: LimitScope): Promise<void> {
  const ip = clientIp(req);
  const limiter = upstashLimiter(scope);
  if (limiter) {
    try {
      const r = await limiter.limit(ip);
      if (!r.success) {
        throw new AppError("RATE_LIMITED", undefined, Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)));
      }
      return;
    } catch (e) {
      if (e instanceof AppError) throw e;
      console.error("[ratelimit] redis error, pakai cadangan memori");
    }
  }
  const m = memoryCheck(scope, ip);
  if (!m.ok) throw new AppError("RATE_LIMITED", undefined, m.retryAfterSec);
}
