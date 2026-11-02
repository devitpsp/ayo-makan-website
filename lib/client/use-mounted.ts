"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false saat render server dan hidrasi, true sesudahnya. Mencegah kilatan data yang hanya ada di browser. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

import { storageAvailable } from "./local-store";

let storageOk: boolean | undefined;

/** Apakah localStorage bisa dipakai (mode privat tertentu memblokirnya). Dihitung sekali. */
export function useStorageAvailable(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (storageOk ??= storageAvailable()),
    () => true,
  );
}
