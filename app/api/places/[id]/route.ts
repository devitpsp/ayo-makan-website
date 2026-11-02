import type { NextRequest } from "next/server";
import { AppError, errorResponse, jsonOk } from "@/lib/places/errors";
import { getPlaceDetail } from "@/lib/places/details";
import { detailParamsSchema } from "@/lib/places/schema";
import { enforceRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/places/[id]">) {
  try {
    await enforceRateLimit(request, "details");
    const { id } = await ctx.params;
    const parsed = detailParamsSchema.safeParse({
      id,
      ...Object.fromEntries(request.nextUrl.searchParams),
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join(".") || "parameter";
      throw new AppError("INVALID_PARAMS", `Parameter tidak valid: ${field}.`);
    }
    const { lat, lng, fields } = parsed.data;
    const center = lat != null && lng != null ? { lat, lng } : null;
    return jsonOk(await getPlaceDetail(parsed.data.id, center, fields === "card"));
  } catch (e) {
    return errorResponse(e);
  }
}
