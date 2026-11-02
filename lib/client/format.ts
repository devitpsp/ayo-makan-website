import { CATEGORY_TYPES } from "@/lib/places/categories";
import { formatPrice } from "@/lib/places/mapper";
import type { Category, Place } from "@/lib/places/types";

export const formatRating = (r: number) => r.toFixed(1).replace(".", ",");
export const formatCount = (n: number) => n.toLocaleString("id-ID");

export function radiusLabel(m: number): string {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

const LEVEL_LABEL: Record<string, string> = {
  PRICE_LEVEL_FREE: "Gratis",
  PRICE_LEVEL_INEXPENSIVE: "Murah",
  PRICE_LEVEL_MODERATE: "Harga sedang",
  PRICE_LEVEL_EXPENSIVE: "Agak mahal",
  PRICE_LEVEL_VERY_EXPENSIVE: "Mahal",
};

type Priced = Pick<Place, "priceRange" | "priceLevel">;

/*
 * Google kadang mengisi batas bawah rentang harga dengan 1 (artinya "tak terdefinisi", mis. Rp1 sampai Rp25rb).
 * Nilai di bawah Rp1.000 bukan harga warung, jadi dianggap tidak ada dan yang dipakai hanya batas atas.
 */
const MIN_REAL_PRICE = 1000;
const startOf = (p: Priced) => (p.priceRange?.start != null && p.priceRange.start >= MIN_REAL_PRICE ? p.priceRange.start : null);
const endOf = (p: Priced) => p.priceRange?.end ?? null;

/** Teks stiker harga di pojok foto. Null = stiker tidak tampil (PRD F-07). */
export function stickerText(p: Priced): string | null {
  const start = startOf(p);
  const end = endOf(p);
  if (start != null) return `mulai ${formatPrice(start)}`;
  if (end != null) return `sampai ${formatPrice(end)}`;
  if (p.priceLevel === "PRICE_LEVEL_INEXPENSIVE") return "Murah";
  return null;
}

/** Baris harga di kartu bila stiker tidak ada (tingkat harga selain murah, atau tanpa data). */
export function priceFallback(p: Priced): string {
  if (p.priceLevel && LEVEL_LABEL[p.priceLevel] && p.priceLevel !== "PRICE_LEVEL_INEXPENSIVE") {
    return LEVEL_LABEL[p.priceLevel];
  }
  return "Harga belum tercatat";
}

/** Detail: "Rp10rb sampai Rp25rb per orang" atau label tingkat harga. */
export function priceDetail(p: Priced): string {
  const start = startOf(p);
  const end = endOf(p);
  if (start != null && end != null) return `${formatPrice(start)} sampai ${formatPrice(end)} per orang`;
  if (start != null) return `Mulai ${formatPrice(start)} per orang`;
  if (end != null) return `Sampai ${formatPrice(end)} per orang`;
  if (p.priceLevel && LEVEL_LABEL[p.priceLevel]) return LEVEL_LABEL[p.priceLevel];
  return "Harga belum tercatat";
}

export function categoryOfType(primaryType: string | null): Category {
  if (primaryType) {
    for (const c of Object.keys(CATEGORY_TYPES) as Category[]) {
      if (CATEGORY_TYPES[c].includes(primaryType)) return c;
    }
  }
  return "makanan";
}

export const CATEGORY_NOUN: Record<Category, string> = {
  makanan: "tempat makan",
  minuman: "tempat minum",
  jajanan: "jajanan",
};
