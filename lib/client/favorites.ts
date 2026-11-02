"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createLocalStore, storageAvailable } from "./local-store";

export const MAX_FAVORITES = 30;

export interface Fav {
  id: string;
  t: number;
}

const EMPTY: Fav[] = [];

// Hanya place_id + waktu simpan. Nama, rating, dan konten Google lain tidak disimpan (aturan cache Google).
const store = createLocalStore<Fav[]>("am-fav", EMPTY, (x) =>
  Array.isArray(x)
    ? x
        .filter((f): f is Fav => !!f && typeof f.id === "string" && typeof f.t === "number")
        .slice(0, MAX_FAVORITES)
    : EMPTY,
);

export function useFavorites() {
  const list = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const ids = useMemo(() => new Set(list.map((f) => f.id)), [list]);

  /** "added" | "removed" | "full" | "blocked" */
  const toggle = useCallback((id: string): "added" | "removed" | "full" | "blocked" => {
    if (!storageAvailable()) return "blocked";
    const current = store.getSnapshot();
    if (current.some((f) => f.id === id)) {
      return store.write(current.filter((f) => f.id !== id)) ? "removed" : "blocked";
    }
    if (current.length >= MAX_FAVORITES) return "full";
    return store.write([{ id, t: Date.now() }, ...current]) ? "added" : "blocked";
  }, []);

  return { list, ids, has: (id: string) => ids.has(id), toggle };
}
