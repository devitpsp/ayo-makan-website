"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CAMPUSES, DEFAULT_CAMPUS_ID, getCampus, type CampusId } from "@/config/campuses";
import { isInBounds } from "@/lib/places/geo";
import type { LatLng } from "@/lib/places/types";
import { createLocalStore } from "./local-store";
import { useMounted } from "./use-mounted";

type Status = "unset" | "locating" | "ready" | "denied" | "outside";
type Source = "gps" | "campus";

interface LocationCtx {
  /** false sampai penyimpanan dibaca di browser; mencegah kilatan kartu "belum ada lokasi". */
  hydrated: boolean;
  status: Status;
  source: Source | null;
  campusId: CampusId;
  center: LatLng | null;
  label: string;
  /** Kegagalan GPS terakhir, terlepas dari sumber aktif: dipakai pemilih lokasi untuk memberi umpan balik. */
  gpsFailure: "denied" | "outside" | null;
  /** onResult(true) bila posisi dipakai, false bila gagal (ditolak, di luar Salatiga). */
  requestGps: (onResult?: (ok: boolean) => void) => void;
  chooseCampus: (id: CampusId) => void;
}

interface Pref {
  source: Source | null;
  campusId: CampusId;
}

const EMPTY_PREF: Pref = { source: null, campusId: DEFAULT_CAMPUS_ID };

/*
 * Lokasi pengguna tidak disimpan di server dan tidak dikirim ke analytics (PRD F-01).
 * Di perangkat hanya pilihan sumber (gps / kampus) yang disimpan, bukan koordinat GPS.
 */
const prefStore = createLocalStore<Pref>("am-loc", EMPTY_PREF, (x) => {
  const o = (x ?? {}) as Partial<Pref>;
  return {
    source: o.source === "gps" || o.source === "campus" ? o.source : null,
    campusId: getCampus(o.campusId).id,
  };
});

const Ctx = createContext<LocationCtx | null>(null);

function getPosition(onOk: (c: LatLng) => void, onFail: () => void) {
  if (!("geolocation" in navigator)) {
    onFail();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => onOk({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    onFail,
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
  );
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const hydrated = useMounted();
  const pref = useSyncExternalStore(prefStore.subscribe, prefStore.getSnapshot, prefStore.getServerSnapshot);
  const [gps, setGps] = useState<LatLng | null>(null);
  const [failure, setFailure] = useState<"denied" | "outside" | null>(null);
  const [pending, setPending] = useState(false);
  const autoStarted = useRef(false);

  // Nomor permintaan GPS terakhir. Hasil permintaan lama (telat) diabaikan bila pengguna sudah memilih
  // kampus atau meminta ulang, supaya GPS yang lambat tidak menimpa pilihan belakangan.
  const reqRef = useRef(0);

  const handleFix = useCallback((c: LatLng): boolean => {
    setPending(false);
    if (!isInBounds(c.lat, c.lng)) {
      // Di luar Salatiga: Google akan menolak, jadi minta pilih kampus.
      setGps(null);
      setFailure("outside");
      return false;
    }
    setFailure(null);
    setGps(c);
    prefStore.write({ source: "gps", campusId: prefStore.getSnapshot().campusId });
    return true;
  }, []);

  const handleFail = useCallback(() => {
    setPending(false);
    setGps(null);
    setFailure("denied");
  }, []);

  const startGps = useCallback(
    (onResult?: (ok: boolean) => void) => {
      const id = ++reqRef.current;
      getPosition(
        (c) => {
          if (id !== reqRef.current) return;
          onResult?.(handleFix(c));
        },
        () => {
          if (id !== reqRef.current) return;
          handleFail();
          onResult?.(false);
        },
      );
    },
    [handleFix, handleFail],
  );

  // Pilihan GPS tersimpan: ambil posisi lagi saat dibuka (izin yang sudah diberikan tidak bertanya ulang).
  useEffect(() => {
    if (!hydrated || autoStarted.current || pref.source !== "gps") return;
    autoStarted.current = true;
    startGps();
  }, [hydrated, pref.source, startGps]);

  const requestGps = useCallback(
    (onResult?: (ok: boolean) => void) => {
      // Permintaan manual sudah mengambil posisi: jangan biarkan pengambilan otomatis menyusul (panggilan ganda).
      autoStarted.current = true;
      setFailure(null);
      setPending(true);
      startGps(onResult);
    },
    [startGps],
  );

  const chooseCampus = useCallback((id: CampusId) => {
    reqRef.current++; // batalkan GPS yang masih berjalan
    setPending(false);
    setGps(null);
    setFailure(null);
    prefStore.write({ source: "campus", campusId: id });
  }, []);

  const value = useMemo<LocationCtx>(() => {
    const campus = getCampus(pref.campusId);
    let status: Status = "unset";
    let center: LatLng | null = null;
    let source: Source | null = hydrated ? pref.source : null;

    if (hydrated) {
      if (pref.source === "campus") {
        status = "ready";
        center = campus.center;
      } else if (pref.source === "gps" && gps) {
        status = "ready";
        center = gps;
      } else if (failure) {
        status = failure;
        source = null;
      } else if (pref.source === "gps" || pending) {
        status = "locating";
      }
    }

    const label =
      status === "ready" && source === "gps"
        ? "Dari posisi kamu"
        : status === "ready" && source === "campus"
          ? `Dari ${campus.name}`
          : "Pilih lokasi";

    return { hydrated, status, source, campusId: pref.campusId, center, label, gpsFailure: failure, requestGps, chooseCampus };
  }, [hydrated, pref, gps, failure, pending, requestGps, chooseCampus]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocation(): LocationCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocation harus di dalam LocationProvider");
  return v;
}

export { CAMPUSES };
