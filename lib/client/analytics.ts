"use client";

import { track } from "@vercel/analytics";

type Props = Record<string, string | number | boolean | null>;

/**
 * Event tanpa data pribadi (PRD 13.1). Koordinat dan lokasi tidak pernah masuk props.
 * Kata kunci boleh dikirim; lokasi tidak.
 */
export function ev(name: string, props?: Props) {
  try {
    track(name, props);
  } catch {
    /* analytics tidak boleh mengganggu fitur */
  }
}
