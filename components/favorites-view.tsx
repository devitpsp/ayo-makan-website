"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { haversineM } from "@/lib/places/geo";
import type { Place } from "@/lib/places/types";
import { ApiError, fetchDetail } from "@/lib/client/api";
import { categoryOfType } from "@/lib/client/format";
import { useFavorites } from "@/lib/client/favorites";
import { useLocation } from "@/lib/client/location";
import { useMounted, useStorageAvailable } from "@/lib/client/use-mounted";
import { GoogleAttribution } from "./google-attribution";
import { PlaceCard, PlaceCardSkeleton } from "./place-card";
import { StateMessage } from "./states";
import { TopBar } from "./top-bar";

/** Favorit dimuat bertahap: tiap kartu = satu panggilan Place Details (berbayar) dan satu foto. */
const PAGE_SIZE = 6;

export function FavoritesView() {
  const mounted = useMounted();
  const { list, toggle } = useFavorites();
  const loc = useLocation();
  const blocked = !useStorageAvailable();
  const [shown, setShown] = useState(PAGE_SIZE);
  const visible = list.slice(0, shown);

  // Data terbaru dari Google setiap halaman dibuka (varian ringkas). Konten tidak disimpan.
  const results = useQueries({
    queries: visible.map((f) => ({
      queryKey: ["detail-card", f.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchDetail(f.id, null, true, signal),
    })),
  });

  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 pt-4">
        <TopBar variant="box" />
      </div>
      <main id="konten" tabIndex={-1} className="mx-auto max-w-[1200px] space-y-6 px-4 py-8">
        <h1 className="display text-4xl uppercase">Favorit</h1>

        {blocked && (
          <p role="alert" className="card-ink p-4">Favorit tidak bisa disimpan di mode ini.</p>
        )}

        {!mounted ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            <PlaceCardSkeleton />
          </div>
        ) : list.length === 0 ? (
          <StateMessage
            title="Belum ada tempat tersimpan. Ketuk ikon simpan di kartu untuk menyimpan."
            actions={<Link href="/#hasil" className="btn btn-primary no-underline">Cari tempat makan</Link>}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Tempat tersimpan">
            {visible.map((f, i) => {
              const r = results[i];
              if (!r || r.isPending) return <li key={f.id}><PlaceCardSkeleton /></li>;
              if (r.isError) {
                const code = r.error instanceof ApiError ? r.error.code : "UPSTREAM_ERROR";
                const gone = code === "NOT_FOUND";
                // Hanya tempat yang benar-benar sudah hilang yang boleh ditawari hapus. Galat sementara
                // (batas laju, jaringan, Google) cukup dicoba lagi, supaya favorit tidak terhapus karena gangguan.
                const msg = gone
                  ? "Tempat ini sudah tidak ada di Google Maps."
                  : code === "RATE_LIMITED"
                    ? "Terlalu banyak permintaan. Coba lagi dalam 1 menit."
                    : code === "NETWORK"
                      ? "Koneksi putus. Cek internet kamu, lalu coba lagi."
                      : "Tempat ini belum bisa dimuat sekarang.";
                return (
                  <li key={f.id} className="card-ink space-y-3 p-4">
                    <p role="alert">{msg}</p>
                    {gone ? (
                      <button type="button" className="btn" onClick={() => toggle(f.id)}>Hapus dari Favorit</button>
                    ) : (
                      <button type="button" className="btn" onClick={() => r.refetch()} disabled={r.isFetching}>
                        {r.isFetching ? "Memuat..." : "Coba lagi"}
                      </button>
                    )}
                  </li>
                );
              }
              const d = r.data;
              const place: Place = {
                ...d,
                distanceM: loc.center ? Math.round(haversineM(loc.center, { lat: d.lat, lng: d.lng })) : null,
              };
              return (
                <li key={f.id} className="reveal">
                  <PlaceCard place={place} cat={categoryOfType(d.primaryType)} rank={i + 1} from="favorit" />
                </li>
              );
            })}
          </ul>
        )}
        {mounted && list.length > shown && (
          <div className="flex justify-center">
            <button type="button" className="btn" onClick={() => setShown((n) => n + PAGE_SIZE)}>
              Muat lebih banyak
            </button>
          </div>
        )}
        <GoogleAttribution className="!px-0" />
      </main>
    </>
  );
}
