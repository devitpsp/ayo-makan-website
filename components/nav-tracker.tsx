"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { markNavigatedInApp } from "@/lib/client/nav-history";

/** Menandai perpindahan halaman pertama setelah dimuat; render pertama (pemuatan langsung) tidak dihitung. */
export function NavTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    markNavigatedInApp();
  }, [pathname]);
  return null;
}
