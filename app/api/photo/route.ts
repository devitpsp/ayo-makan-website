import type { NextRequest } from "next/server";
import { AppError, NO_STORE, errorResponse } from "@/lib/places/errors";
import { resolvePhotoUri } from "@/lib/places/photo";
import { photoParamsSchema } from "@/lib/places/schema";
import { enforceRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "photo");
    const parsed = photoParamsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) throw new AppError("INVALID_PARAMS", "Parameter foto tidak valid.");
    const uri = await resolvePhotoUri(parsed.data.name, parsed.data.w);
    // 302 tanpa cache: URL foto Google bersifat sementara dan kontennya tidak boleh disimpan (PRD 8.2).
    return new Response(null, { status: 302, headers: { ...NO_STORE, Location: uri } });
  } catch (e) {
    return errorResponse(e);
  }
}
