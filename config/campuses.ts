import type { LatLng } from "@/lib/places/types";

export type CampusId = "kampus-3" | "kampus-1" | "kampus-2";

export interface Campus {
  id: CampusId;
  name: string;
  address: string;
  center: LatLng;
  /** place_id Google kampus (boleh disimpan tanpa batas). */
  placeId: string;
}

/*
 * Koordinat dan place_id dari Google Places (scripts/resolve-campuses.mjs, 2 Nov 2026), sebagai titik pusat
 * tempat di Google Maps. PRD F-01 menyebut titik gerbang utama: owner boleh menggantinya dengan koordinat
 * gerbang dari Google Maps. Penamaan Kampus 1/2/3 menunggu konfirmasi owner (Q2).
 */
export const CAMPUSES: readonly Campus[] = [
  {
    id: "kampus-3",
    name: "Kampus Terpadu (Pulutan)",
    address: "Jl. Lingkar Salatiga Km. 2, Pulutan, Sidorejo, Kota Salatiga 50716",
    center: { lat: -7.309952, lng: 110.477699 },
    placeId: "ChIJv-tTPWN4ei4RfWcUaDvDpBg",
  },
  {
    id: "kampus-1",
    name: "Kampus 1",
    address: "Jl. Tentara Pelajar No. 2, Kota Salatiga",
    center: { lat: -7.328148, lng: 110.499215 },
    placeId: "ChIJR7ww8Td4ei4RSaS6G4RJ5qI",
  },
  {
    id: "kampus-2",
    name: "Kampus 2",
    address: "Jl. Nakula Sadewa V No. 9, Kembangarum, Dukuh, Kota Salatiga 50722",
    center: { lat: -7.336997, lng: 110.491722 },
    placeId: "ChIJidXM8ct5ei4RSkNyVkuH9HU",
  },
];

export const DEFAULT_CAMPUS_ID: CampusId = "kampus-3";

export function getCampus(id: string | null | undefined): Campus {
  return CAMPUSES.find((c) => c.id === id) ?? CAMPUSES[0];
}
