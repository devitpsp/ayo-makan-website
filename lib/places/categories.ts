import type { Category } from "./types";

// Pemetaan ke Table A Places API (New). Semua tipe sudah dicek ada di Table A (2 Nov 2026).
export const CATEGORY_TYPES: Record<Category, readonly string[]> = {
  makanan: [
    "restaurant",
    "indonesian_restaurant",
    "fast_food_restaurant",
    "chicken_restaurant",
    "noodle_shop",
    "soup_restaurant",
    "meal_takeaway",
    "food_court",
    "family_restaurant",
  ],
  minuman: ["cafe", "coffee_shop", "coffee_stand", "juice_shop", "tea_house"],
  jajanan: [
    "bakery",
    "dessert_shop",
    "snack_bar",
    "ice_cream_shop",
    "donut_shop",
    "cake_shop",
    "pastry_shop",
  ],
};

export const CATEGORY_LABEL: Record<Category, string> = {
  makanan: "Makanan",
  minuman: "Minuman",
  jajanan: "Jajanan",
};

const GENERIC_TYPES = new Set(["food", "point_of_interest", "establishment"]);

/**
 * Mode kata kunci: Text Search tanpa includedType, lalu disaring di sini.
 * Warung yang tipenya hanya food / point_of_interest tetap lolos di Makanan agar tidak hilang.
 */
export function matchesCategory(types: readonly string[], cat: Category): boolean {
  if (types.length === 0) return false;
  if (types.some((t) => CATEGORY_TYPES[cat].includes(t))) return true;
  if (cat !== "makanan") return false;
  const onlyGeneric = types.every((t) => GENERIC_TYPES.has(t));
  return onlyGeneric && (types.includes("food") || types.includes("point_of_interest"));
}
