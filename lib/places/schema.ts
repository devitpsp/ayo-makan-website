import { z } from "zod";
import { isInBounds } from "./geo";

export const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,300}$/;
export const PHOTO_NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

const toNumber = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v);
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const flag = z.preprocess((v) => v === "1", z.boolean());

export const searchParamsSchema = z
  .object({
    lat: z.preprocess(toNumber, z.number().finite()),
    lng: z.preprocess(toNumber, z.number().finite()),
    radius: z.preprocess(
      toNumber,
      z.union([z.literal(500), z.literal(1000), z.literal(2000), z.literal(3000)]),
    ),
    cat: z.enum(["makanan", "minuman", "jajanan"]),
    q: z.preprocess(emptyToUndefined, z.string().trim().min(2).max(60).optional()),
    minRating: z.preprocess(
      toNumber,
      z.union([z.literal(0), z.literal(4), z.literal(4.5)]).default(4),
    ),
    openNow: flag,
    murah: flag,
    pageToken: z.preprocess(emptyToUndefined, z.string().max(4000).optional()),
  })
  .superRefine((v, ctx) => {
    if (!isInBounds(v.lat, v.lng)) {
      ctx.addIssue({ code: "custom", path: ["lat"], message: "Koordinat di luar area Salatiga." });
    }
    if (v.pageToken && !v.q) {
      ctx.addIssue({ code: "custom", path: ["pageToken"], message: "pageToken hanya untuk mode kata kunci." });
    }
  });

export type SearchParams = z.infer<typeof searchParamsSchema>;

export const detailParamsSchema = z
  .object({
    id: z.string().regex(PLACE_ID_RE),
    lat: z.preprocess(emptyToUndefined, z.preprocess(toNumber, z.number().finite()).optional()),
    lng: z.preprocess(emptyToUndefined, z.preprocess(toNumber, z.number().finite()).optional()),
    fields: z.preprocess(emptyToUndefined, z.literal("card").optional()),
  })
  .superRefine((v, ctx) => {
    if ((v.lat == null) !== (v.lng == null)) {
      ctx.addIssue({ code: "custom", path: ["lat"], message: "lat dan lng harus berpasangan." });
    } else if (v.lat != null && v.lng != null && !isInBounds(v.lat, v.lng)) {
      ctx.addIssue({ code: "custom", path: ["lat"], message: "Koordinat di luar area Salatiga." });
    }
  });

export type DetailParams = z.infer<typeof detailParamsSchema>;

export const photoParamsSchema = z.object({
  name: z.string().regex(PHOTO_NAME_RE),
  w: z.preprocess(toNumber, z.union([z.literal(400), z.literal(800), z.literal(1200)])),
});
