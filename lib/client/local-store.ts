"use client";

/**
 * Penyimpan localStorage yang aman untuk useSyncExternalStore.
 * Semua akses dibungkus try/catch: mode privat atau storage yang diblokir tidak boleh merusak halaman.
 */
export interface LocalStore<T> {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  write: (next: T) => boolean;
}

export function createLocalStore<T>(key: string, empty: T, validate: (x: unknown) => T): LocalStore<T> {
  const listeners = new Set<() => void>();
  let raw: string | null | undefined;
  let value: T = empty;

  function getSnapshot(): T {
    try {
      const r = window.localStorage.getItem(key);
      if (r === raw) return value;
      raw = r;
      value = r ? validate(JSON.parse(r)) : empty;
    } catch {
      raw = null;
      value = empty;
    }
    return value;
  }

  const notify = () => listeners.forEach((l) => l());

  return {
    subscribe(cb) {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) cb();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot,
    getServerSnapshot: () => empty,
    write(next) {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
        raw = undefined;
        notify();
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const r = window.localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function storageAvailable(): boolean {
  try {
    const k = "__am_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
