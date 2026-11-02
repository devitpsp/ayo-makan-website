import "server-only";
import { Redis } from "@upstash/redis";

let cached: Redis | null | undefined;

/**
 * Kredensial Redis. UPSTASH_REDIS_REST_* didahulukan; KV_REST_API_* adalah nama yang disuntikkan Vercel
 * saat Upstash Redis dipasang dari Marketplace, supaya integrasi itu langsung bekerja tanpa menyalin variabel.
 */
export function redisCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

/** Redis Upstash bila kredensial lengkap, selain itu null (dev memakai penghitung memori). */
export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  const c = redisCredentials();
  cached = c ? new Redis(c) : null;
  return cached;
}
