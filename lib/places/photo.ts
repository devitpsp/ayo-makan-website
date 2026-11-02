import "server-only";
import { googleFetch } from "./client";
import { AppError } from "./errors";
import { reserveQuota } from "@/lib/quota";

// Selaras dengan img-src di CSP (next.config.ts). Mencegah endpoint jadi open redirect.
const ALLOWED_HOST = /(^|\.)(googleusercontent\.com|ggpht\.com)$/;

/** Minta URL foto sementara dari Google. Hasilnya dipakai untuk redirect 302, tidak disimpan. */
export async function resolvePhotoUri(name: string, widthPx: number): Promise<string> {
  await reserveQuota("photo");
  const r = await googleFetch<{ photoUri?: string }>({
    method: "GET",
    path: `${name}/media`,
    query: { maxWidthPx: String(widthPx), skipHttpRedirect: "true" },
  });
  if (!r.photoUri) throw new AppError("NOT_FOUND");
  let u: URL;
  try {
    u = new URL(r.photoUri);
  } catch {
    throw new AppError("UPSTREAM_ERROR");
  }
  if (u.protocol !== "https:" || !ALLOWED_HOST.test(u.hostname)) {
    console.error("[places] photoUri host tidak dikenal");
    throw new AppError("UPSTREAM_ERROR");
  }
  return u.toString();
}
