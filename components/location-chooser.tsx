"use client";

import { Crosshair, MapPin } from "@phosphor-icons/react";
import { CAMPUSES } from "@/config/campuses";
import { useLocation } from "@/lib/client/location";

/** Pilih pusat pencarian: posisi GPS atau salah satu kampus (PRD F-01, US-04). */
export function LocationChooser({ onDone }: { onDone?: () => void }) {
  const loc = useLocation();

  return (
    <div className="space-y-4">
      {loc.gpsFailure === "denied" && (
        <p role="alert" className="rounded-[10px] border-2 border-garis p-3 text-sm">
          Lokasi tidak bisa dipakai. Kalau tadi kamu menolak, aktifkan izin lokasi lewat pengaturan situs di browser,
          atau pilih kampus di bawah.
        </p>
      )}
      {loc.gpsFailure === "outside" && (
        <p role="alert" className="rounded-[10px] border-2 border-garis p-3 text-sm">
          Posisimu di luar area Salatiga. Pilih kampus sebagai titik cari.
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={loc.status === "locating"}
        onClick={() => {
          // Sheet baru ditutup bila posisi dipakai; bila gagal, pesan tampil di sini (tidak diam saja).
          loc.requestGps((ok) => {
            if (ok) onDone?.();
          });
        }}
      >
        <Crosshair size={22} weight="bold" aria-hidden="true" />
        {loc.status === "locating" ? "Mencari lokasimu..." : "Pakai lokasi saya"}
      </button>

      <div role="group" aria-label="Pilih kampus" className="space-y-2">
        <p className="field-label">Atau pilih kampus</p>
        {CAMPUSES.map((c) => (
          <button
            key={c.id}
            type="button"
            className="tab w-full justify-start gap-2 text-left"
            aria-pressed={loc.source === "campus" && loc.campusId === c.id}
            onClick={() => {
              loc.chooseCampus(c.id);
              onDone?.();
            }}
          >
            <MapPin size={20} weight="bold" aria-hidden="true" />
            <span>
              <span className="block">{c.name}</span>
              <span className="block text-xs font-normal opacity-80">{c.address}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
