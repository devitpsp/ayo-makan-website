"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, MinRating, Radius, SortMode } from "@/lib/places/types";

export interface SearchState {
  q: string;
  cat: Category;
  radius: Radius;
  minRating: MinRating;
  openNow: boolean;
  murah: boolean;
  sort: SortMode;
}

export const DEFAULT_STATE: SearchState = {
  q: "",
  cat: "makanan",
  radius: 1000,
  minRating: 4,
  openNow: false,
  murah: false,
  sort: "cocok",
};

const RADII: Radius[] = [500, 1000, 2000, 3000];
const RATINGS: MinRating[] = [0, 4, 4.5];
const CATS: Category[] = ["makanan", "minuman", "jajanan"];
const SORTS: SortMode[] = ["cocok", "terdekat", "teruji"];

export function parseState(sp: URLSearchParams): SearchState {
  const r = Number(sp.get("r"));
  const rt = Number(sp.get("rt"));
  const cat = sp.get("cat") as Category;
  const sort = sp.get("urut") as SortMode;
  return {
    // Dipangkas supaya sama dengan validasi server (q di-trim sebelum min 2): "%20a" tidak boleh lolos sebagai 2 huruf.
    q: (sp.get("q") ?? "").trim().slice(0, 60),
    cat: CATS.includes(cat) ? cat : DEFAULT_STATE.cat,
    radius: RADII.includes(r as Radius) ? (r as Radius) : DEFAULT_STATE.radius,
    minRating: sp.has("rt") && RATINGS.includes(rt as MinRating) ? (rt as MinRating) : DEFAULT_STATE.minRating,
    openNow: sp.get("buka") === "1",
    murah: sp.get("murah") === "1",
    sort: SORTS.includes(sort) ? sort : DEFAULT_STATE.sort,
  };
}

/** Hanya nilai non-default yang masuk URL, jadi tautan tetap pendek. */
export function serializeState(s: SearchState): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.cat !== DEFAULT_STATE.cat) p.set("cat", s.cat);
  if (s.radius !== DEFAULT_STATE.radius) p.set("r", String(s.radius));
  if (s.minRating !== DEFAULT_STATE.minRating) p.set("rt", String(s.minRating));
  if (s.openNow) p.set("buka", "1");
  if (s.murah) p.set("murah", "1");
  if (s.sort !== DEFAULT_STATE.sort) p.set("urut", s.sort);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

/** Apakah ada filter di luar default (menampilkan chip Reset). Kata kunci dan urutan tidak dihitung. */
export function hasCustomFilters(s: SearchState): boolean {
  return (
    s.radius !== DEFAULT_STATE.radius ||
    s.minRating !== DEFAULT_STATE.minRating ||
    s.openNow ||
    s.murah
  );
}

export function useSearchState() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const state = useMemo(() => parseState(new URLSearchParams(sp.toString())), [sp]);

  // State terbaru termasuk perubahan yang URL-nya belum selesai dikomit. router.replace itu asinkron, jadi
  // dua ketukan beruntun (Buka sekarang lalu Murah) tanpa ini sama-sama menggabung ke state lama dan yang pertama hilang.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  const set = useCallback(
    (patch: Partial<SearchState>, opts?: { push?: boolean; hash?: string }) => {
      const next = { ...latest.current, ...patch };
      latest.current = next;
      const url = `${pathname}${serializeState(next)}${opts?.hash ?? ""}`;
      if (opts?.push) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  const reset = useCallback(() => {
    set({ radius: DEFAULT_STATE.radius, minRating: DEFAULT_STATE.minRating, openNow: false, murah: false });
  }, [set]);

  return { state, set, reset };
}
