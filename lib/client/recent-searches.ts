"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createLocalStore } from "./local-store";

const EMPTY: string[] = [];
const MAX = 5;

const store = createLocalStore<string[]>("am-recent", EMPTY, (x) =>
  Array.isArray(x) ? x.filter((s): s is string => typeof s === "string").slice(0, MAX) : EMPTY,
);

/** 5 kata kunci terakhir, disimpan di perangkat, bisa dihapus satu per satu (PRD F-02). */
export function useRecentSearches() {
  const list = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const add = useCallback((q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    const cur = store.getSnapshot();
    store.write([term, ...cur.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, MAX));
  }, []);

  const remove = useCallback((q: string) => {
    store.write(store.getSnapshot().filter((s) => s !== q));
  }, []);

  return { list, add, remove };
}
