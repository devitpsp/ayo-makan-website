import { describe, expect, it } from "vitest";
import { priceDetail, priceFallback, stickerText } from "./format";

const range = (start: number | null, end: number | null) => ({
  priceLevel: null,
  priceRange: { start, end, currency: "IDR" },
});

describe("harga dari Google", () => {
  it("rentang normal: stiker 'mulai', detail 'sampai'", () => {
    expect(stickerText(range(10000, 25000))).toBe("mulai Rp10rb");
    expect(priceDetail(range(10000, 25000))).toBe("Rp10rb sampai Rp25rb per orang");
  });
  it("start=1 (data nyata Google, artinya batas bawah tak terdefinisi) tidak boleh tampil 'mulai Rp1'", () => {
    expect(stickerText(range(1, 25000))).toBe("sampai Rp25rb");
    expect(priceDetail(range(1, 25000))).toBe("Sampai Rp25rb per orang");
  });
  it("hanya end: stiker sampai", () => {
    expect(stickerText(range(null, 25000))).toBe("sampai Rp25rb");
  });
  it("tanpa data harga: tidak ada stiker, baris info jujur", () => {
    expect(stickerText({ priceLevel: null, priceRange: null })).toBeNull();
    expect(priceFallback({ priceLevel: null, priceRange: null })).toBe("Harga belum tercatat");
  });
  it("level murah tanpa rentang: stiker Murah", () => {
    expect(stickerText({ priceLevel: "PRICE_LEVEL_INEXPENSIVE", priceRange: null })).toBe("Murah");
  });
});
