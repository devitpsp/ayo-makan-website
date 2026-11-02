import "server-only";
import { googleFetch } from "./client";
import { AppError } from "./errors";
import { DETAIL_FULL_MASK, detailCardMask } from "./fieldmasks";
import { listPhotosOn } from "./flags";
import { mapDetail } from "./mapper";
import type { GooglePlace, LatLng, PlaceDetail } from "./types";
import { reserveQuota } from "@/lib/quota";

/**
 * card = varian ringkas untuk halaman Favorit (tanpa ulasan dan jam mingguan),
 * SKU Enterprise. Penuh = Enterprise + Atmosphere karena field reviews.
 */
export async function getPlaceDetail(id: string, center: LatLng | null, card: boolean): Promise<PlaceDetail> {
  await reserveQuota(card ? "details" : "details_atmosphere");
  const g = await googleFetch<GooglePlace>({
    method: "GET",
    path: `places/${id}`,
    fieldMask: card ? detailCardMask(listPhotosOn()) : DETAIL_FULL_MASK,
    query: { languageCode: "id", regionCode: "ID" },
  });
  const d = mapDetail(g, center);
  if (!d) throw new AppError("NOT_FOUND");
  return d;
}
