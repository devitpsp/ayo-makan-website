import { describe, expect, it } from "vitest";
import { formatDistance, haversineM, isInBounds } from "./geo";
import { meanRating, ratingScore, sortPlaces } from "./score";
import { CATEGORY_TYPES, matchesCategory } from "./categories";
import { PHOTO_NAME_RE, PLACE_ID_RE, searchParamsSchema } from "./schema";
import { refine, type RefineOptions } from "./filters";
import { DETAIL_FULL_MASK, detailCardMask } from "./fieldmasks";
import { mapPlace, formatPrice } from "./mapper";
import type { Place } from "./types";

const KAMPUS = { lat: -7.3305, lng: 110.4905 };

function place(over: Partial<Place>): Place {
  return {
    id: "ChIJxxxxxxxxxx",
    name: "Warung",
    lat: KAMPUS.lat,
    lng: KAMPUS.lng,
    distanceM: 300,
    rating: 4.5,
    ratingCount: 100,
    priceLevel: null,
    priceRange: null,
    openNow: null,
    primaryType: null,
    photo: null,
    ...over,
  };
}

describe("geo", () => {
  it("jarak titik yang sama = 0", () => {
    expect(haversineM(KAMPUS, KAMPUS)).toBe(0);
  });
  it("0,01 derajat lintang kira-kira 1.112 m", () => {
    const d = haversineM(KAMPUS, { lat: KAMPUS.lat + 0.01, lng: KAMPUS.lng });
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1125);
  });
  it("format jarak: meter dibulatkan 10, km pakai koma", () => {
    expect(formatDistance(447)).toBe("450 m");
    expect(formatDistance(999)).toBe("1 km");
    expect(formatDistance(1234)).toBe("1,2 km");
    expect(formatDistance(2000)).toBe("2 km");
  });
  it("kotak batas Salatiga", () => {
    expect(isInBounds(KAMPUS.lat, KAMPUS.lng)).toBe(true);
    expect(isInBounds(-6.2, 106.8)).toBe(false); // Jakarta
  });
});

describe("skor rating teruji", () => {
  it("bintang 5,0 dengan 3 ulasan kalah dari 4,7 dengan 400 ulasan", () => {
    const C = 4.3;
    expect(ratingScore(5, 3, C)).toBeLessThan(ratingScore(4.7, 400, C));
  });
  it("tanpa ulasan jatuh ke rata-rata", () => {
    expect(ratingScore(5, 0, 4.2)).toBeCloseTo(4.2);
  });
  it("meanRating mengabaikan tempat tanpa rating", () => {
    const m = meanRating([place({ rating: 4 }), place({ rating: 5 }), place({ rating: null })]);
    expect(m).toBeCloseTo(4.5);
  });
  it("sortPlaces: terdekat naik, teruji turun, cocok = urutan asli", () => {
    const a = place({ id: "A", distanceM: 900, rating: 5, ratingCount: 3 });
    const b = place({ id: "B", distanceM: 100, rating: 4.7, ratingCount: 400 });
    const c = place({ id: "C", distanceM: 500, rating: 4.0, ratingCount: 50 });
    expect(sortPlaces([a, b, c], "cocok").map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(sortPlaces([a, b, c], "terdekat").map((p) => p.id)).toEqual(["B", "C", "A"]);
    expect(sortPlaces([a, b, c], "teruji")[0].id).toBe("B");
  });
});

describe("kategori", () => {
  it("tiap kategori punya tipe", () => {
    for (const k of Object.keys(CATEGORY_TYPES) as (keyof typeof CATEGORY_TYPES)[]) {
      expect(CATEGORY_TYPES[k].length).toBeGreaterThan(0);
    }
  });
  it("irisan tipe lolos", () => {
    expect(matchesCategory(["cafe", "food"], "minuman")).toBe(true);
    expect(matchesCategory(["cafe", "food"], "makanan")).toBe(false);
  });
  it("warung bertipe generik lolos hanya di Makanan", () => {
    expect(matchesCategory(["food", "point_of_interest", "establishment"], "makanan")).toBe(true);
    expect(matchesCategory(["food", "point_of_interest", "establishment"], "minuman")).toBe(false);
  });
  it("tipe non-makanan tidak lolos", () => {
    expect(matchesCategory(["store", "point_of_interest"], "makanan")).toBe(false);
    expect(matchesCategory([], "makanan")).toBe(false);
  });
});

describe("filter server", () => {
  const base: RefineOptions = { radius: 1000, minRating: 4, openNow: false, murah: false };
  it("membuang di luar radius", () => {
    const r = refine([place({ id: "in", distanceM: 900 }), place({ id: "out", distanceM: 1100 })], base);
    expect(r.map((p) => p.id)).toEqual(["in"]);
  });
  it("minRating membuang rating rendah dan tanpa rating", () => {
    const r = refine(
      [place({ id: "ok", rating: 4.2 }), place({ id: "low", rating: 3.9 }), place({ id: "none", rating: null })],
      base,
    );
    expect(r.map((p) => p.id)).toEqual(["ok"]);
  });
  it("minRating 0 meloloskan tanpa rating", () => {
    expect(refine([place({ rating: null })], { ...base, minRating: 0 })).toHaveLength(1);
  });
  it("openNow hanya yang buka", () => {
    const r = refine([place({ id: "a", openNow: true }), place({ id: "b", openNow: false }), place({ id: "c", openNow: null })], {
      ...base,
      openNow: true,
    });
    expect(r.map((p) => p.id)).toEqual(["a"]);
  });
  it("murah hanya INEXPENSIVE; tanpa data ikut keluar", () => {
    const r = refine(
      [
        place({ id: "m", priceLevel: "PRICE_LEVEL_INEXPENSIVE" }),
        place({ id: "s", priceLevel: "PRICE_LEVEL_MODERATE" }),
        place({ id: "n", priceLevel: null }),
      ],
      { ...base, murah: true },
    );
    expect(r.map((p) => p.id)).toEqual(["m"]);
  });
});

describe("mapper", () => {
  it("memetakan respons Google ke JSON ringkas", () => {
    const p = mapPlace(
      {
        id: "ChIJabc1234567",
        displayName: { text: "Seblak Mantap" },
        location: { latitude: KAMPUS.lat + 0.004, longitude: KAMPUS.lng },
        primaryType: "indonesian_restaurant",
        rating: 4.7,
        userRatingCount: 312,
        priceLevel: "PRICE_LEVEL_INEXPENSIVE",
        priceRange: { startPrice: { currencyCode: "IDR", units: "10000" }, endPrice: { currencyCode: "IDR", units: "25000" } },
        currentOpeningHours: { openNow: true },
        photos: [{ name: "places/ChIJabc1234567/photos/AXabc", authorAttributions: [{ displayName: "Budi", uri: "https://maps.google.com/x" }] }],
      },
      KAMPUS,
    );
    expect(p).toMatchObject({
      id: "ChIJabc1234567",
      name: "Seblak Mantap",
      rating: 4.7,
      ratingCount: 312,
      openNow: true,
      priceRange: { start: 10000, end: 25000, currency: "IDR" },
      photo: { name: "places/ChIJabc1234567/photos/AXabc", author: "Budi" },
    });
    expect(p!.distanceM).toBeGreaterThan(430);
    expect(p!.distanceM).toBeLessThan(460);
  });
  it("tanpa lokasi = dibuang", () => {
    expect(mapPlace({ id: "x" }, KAMPUS)).toBeNull();
  });
  it("format harga Indonesia", () => {
    expect(formatPrice(10000)).toBe("Rp10rb");
    expect(formatPrice(1500)).toBe("Rp1,5rb");
    expect(formatPrice(1250000)).toBe("Rp1,25jt");
  });
});

describe("schema", () => {
  const ok = { lat: "-7.33", lng: "110.49", radius: "1000", cat: "makanan" };
  it("param minimal valid + default", () => {
    const r = searchParamsSchema.safeParse(ok);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.minRating).toBe(4);
      expect(r.data.openNow).toBe(false);
      expect(r.data.q).toBeUndefined();
    }
  });
  it("radius di luar pilihan ditolak", () => {
    expect(searchParamsSchema.safeParse({ ...ok, radius: "1500" }).success).toBe(false);
  });
  it("koordinat di luar Salatiga ditolak", () => {
    expect(searchParamsSchema.safeParse({ ...ok, lat: "-6.2", lng: "106.8" }).success).toBe(false);
  });
  it("q 1 huruf ditolak, q kosong = jelajah, q > 60 ditolak", () => {
    expect(searchParamsSchema.safeParse({ ...ok, q: "a" }).success).toBe(false);
    const empty = searchParamsSchema.safeParse({ ...ok, q: "" });
    expect(empty.success && empty.data.q).toBeUndefined();
    expect(searchParamsSchema.safeParse({ ...ok, q: "x".repeat(61) }).success).toBe(false);
  });
  it("pageToken tanpa q ditolak", () => {
    expect(searchParamsSchema.safeParse({ ...ok, pageToken: "abc" }).success).toBe(false);
    expect(searchParamsSchema.safeParse({ ...ok, q: "seblak", pageToken: "abc" }).success).toBe(true);
  });
  it("flag 1 jadi boolean", () => {
    const r = searchParamsSchema.parse({ ...ok, openNow: "1", murah: "1", minRating: "4.5" });
    expect(r.openNow).toBe(true);
    expect(r.murah).toBe(true);
    expect(r.minRating).toBe(4.5);
  });
  it("regex place id dan nama foto menolak path liar", () => {
    expect(PLACE_ID_RE.test("ChIJN1t_tDeuEmsRUsoyG83frY4")).toBe(true);
    expect(PLACE_ID_RE.test("../../etc")).toBe(false);
    expect(PHOTO_NAME_RE.test("places/ChIJabc/photos/AXabc_-1")).toBe(true);
    expect(PHOTO_NAME_RE.test("places/ChIJabc/photos/AX/../x")).toBe(false);
    expect(PHOTO_NAME_RE.test("https://evil.com/places/a/photos/b")).toBe(false);
  });
});

describe("mask kartu Favorit mengikuti LIST_PHOTOS", () => {
  it("foto mati: mask kartu tidak meminta photos (tidak ada foto yang bisa dimuat)", () => {
    expect(detailCardMask(false).split(",")).not.toContain("photos");
  });
  it("foto menyala: mask kartu meminta photos", () => {
    expect(detailCardMask(true).split(",")).toContain("photos");
  });
  it("mask kartu tidak pernah meminta reviews atau jam mingguan (SKU lebih murah)", () => {
    for (const on of [true, false]) {
      const f = detailCardMask(on);
      expect(f).not.toMatch(/reviews|regularOpeningHours/);
    }
    expect(DETAIL_FULL_MASK).toMatch(/reviews/);
  });
});
