import type { NextRequest } from "next/server";
import { AppError, errorResponse, jsonOk } from "@/lib/places/errors";
import { searchParamsSchema } from "@/lib/places/schema";
import { searchPlaces } from "@/lib/places/search";
import { enforceRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "search");
    const parsed = searchParamsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join(".") || "parameter";
      throw new AppError("INVALID_PARAMS", `Parameter tidak valid: ${field}.`);
    }
    return jsonOk(await searchPlaces(parsed.data));
  } catch (e) {
    return errorResponse(e);
  }
}
