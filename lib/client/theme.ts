"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "am-theme";
const EVENT = "am-theme-change";

// Default terang dan TIDAK mengikuti sistem (DESIGN 2). Gelap hanya bila pengguna memilihnya.
function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);
  const toggle = useCallback(() => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* storage diblokir: tema tetap berlaku untuk sesi ini */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { theme, toggle };
}

// Dipasang di <head> agar tema terpasang sebelum paint pertama (tanpa kedip).
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
