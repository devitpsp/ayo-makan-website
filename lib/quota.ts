import "server-only";
import { AppError } from "@/lib/places/errors";
import { getRedis } from "./redis";

/** SKU Google yang kuota gratisnya dijaga (PRD 9). */
export type Sku = "text_search" | "nearby_search" | "details" | "details_atmosphere" | "photo";

const DEFAULT_CAP = 950;
const memory = new Map<string, number>();

export function monthlyCap(): number {
  const n = Number(process.env.MONTHLY_SKU_CAP);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_CAP;
}

export function quotaKey(sku: Sku, now = new Date()): string {
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `quota:${sku}:${ym}`;
}

/**
 * Lapis 1 pengaman biaya (PRD 9.1): hitung dulu, panggil Google kemudian.
 * Gagal tertutup: tanpa Redis di production atau Redis error = tolak, supaya target Rp0 tidak bocor.
 * Hitungan tetap terpakai walau panggilan Google gagal (konservatif).
 */
export async function reserveQuota(sku: Sku): Promise<void> {
  const key = quotaKey(sku);
  const cap = monthlyCap();
  const redis = getRedis();

  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      console.error("[quota] Upstash belum diatur di production, permintaan ditolak");
      throw new AppError("UPSTREAM_QUOTA");
    }
    const n = (memory.get(key) ?? 0) + 1;
    memory.set(key, n);
    if (n > cap) throw new AppError("UPSTREAM_QUOTA");
    return;
  }

  try {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, 60 * 60 * 24 * 40);
    if (n > cap) throw new AppError("UPSTREAM_QUOTA");
  } catch (e) {
    if (e instanceof AppError) throw e;
    console.error("[quota] redis error", e instanceof Error ? e.name : "unknown");
    throw new AppError("UPSTREAM_QUOTA");
  }
}
