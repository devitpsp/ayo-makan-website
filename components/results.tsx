"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, type InfiniteData, type UseInfiniteQueryResult } from "@tanstack/react-query";
import { CaretDown, ClockCounterClockwise, Info, MapPin, X } from "@phosphor-icons/react";
import { CATEGORY_LABEL } from "@/lib/places/categories";
import { sortPlaces } from "@/lib/places/score";
import type { Category, Place, SearchResponse, SortMode } from "@/lib/places/types";
import { ApiError, fetchSearch } from "@/lib/client/api";
import { ev } from "@/lib/client/analytics";
import { CATEGORY_NOUN, radiusLabel } from "@/lib/client/format";
import { useLocation } from "@/lib/client/location";
import { mapsSearchUrl } from "@/lib/client/directions";
import { useRecentSearches } from "@/lib/client/recent-searches";
import { setSearchSource, takeSearchSource } from "@/lib/client/scroll";
import { hasCustomFilters, useSearchState } from "@/lib/client/search-state";
import { SUGGESTIONS } from "@/config/suggestions";
import { BottomSheet } from "./bottom-sheet";
import { FilterChipsRow, FilterSidebar, MURAH_HELP, OptionGroup, RADIUS_OPTIONS, RATING_OPTIONS } from "./filters";
import { GoogleAttribution } from "./google-attribution";
import { LocationChooser } from "./location-chooser";
import { PlaceCard, PlaceCardSkeleton } from "./place-card";
import { GenericError, NetworkError, QuotaExhausted, RateLimited, StateMessage } from "./states";

const CATS: Category[] = ["makanan", "minuman", "jajanan"];
/** Jumlah kartu yang tampil per tahap (juga membatasi foto yang dimuat). */
const PAGE_SIZE = 6;
/** Jumlah kartu yang tampil per pencarian, diingat selama sesi supaya kembali dari detail tidak mulai dari 6 lagi. */
const shownMemo = new Map<string, number>();
const SORTS: { value: SortMode; label: string }[] = [
  { value: "cocok", label: "Paling cocok" },
  { value: "terdekat", label: "Terdekat" },
  { value: "teruji", label: "Rating teruji" },
];

export function ResultsSection() {
  const { state, set, reset } = useSearchState();
  const loc = useLocation();
  const recent = useRecentSearches();
  const [sheet, setSheet] = useState<"radius" | "rating" | "lokasi" | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
  const tipId = useId();

  // q 1 huruf (suntingan manual URL) diperlakukan sebagai mode jelajah.
  const effective = useMemo(() => ({ ...state, q: state.q.length >= 2 ? state.q : "" }), [state]);
  const center = loc.center;
  // Satu kunci untuk reset hitungan kartu dan untuk mengingatnya selama sesi.
  const contentKey = `${effective.q}|${effective.cat}|${effective.radius}|${effective.minRating}|${effective.openNow}|${effective.murah}|${state.sort}|${center?.lat}|${center?.lng}`;

  const query = useInfiniteQuery({
    queryKey: [
      "search",
      effective.q,
      effective.cat,
      effective.radius,
      effective.minRating,
      effective.openNow,
      effective.murah,
      center?.lat,
      center?.lng,
    ],
    queryFn: ({ pageParam, signal }) => fetchSearch(effective, center!, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextPageToken ?? undefined,
    enabled: !!center,
    // Kembali dari halaman detail tidak boleh mengambil ulang semua halaman Text Search yang sudah dimuat
    // (tiap halaman = satu panggilan berbayar). Data hidup selama cache sesi (gcTime), lalu ambil segar.
    refetchOnMount: false,
  });

  // Urutan dihitung per halaman lalu digabung: kartu yang sudah tampil tidak berpindah atau lenyap saat halaman
  // berikutnya dimuat (mengurutkan semua sekaligus menyisipkan hasil baru di antara kartu lama).
  const places = useMemo(() => {
    const seen = new Set<string>();
    const out: Place[] = [];
    for (const page of query.data?.pages ?? []) {
      const fresh = page.places.filter((p) => !seen.has(p.id));
      for (const p of fresh) seen.add(p.id);
      out.push(...sortPlaces(fresh, state.sort));
    }
    return out;
  }, [query.data, state.sort]);
  const firstPage = query.data?.pages[0];
  const truncated = !!firstPage?.truncated;

  // Event analytics tanpa data lokasi (PRD 13.1). Satu event per hasil halaman pertama.
  const reported = useRef<unknown>(null);
  useEffect(() => {
    if (!firstPage || reported.current === firstPage) return;
    reported.current = firstPage;
    const filtersOn = Number(hasCustomFilters(effective));
    ev("search", {
      mode: firstPage.mode === "keyword" ? "keyword" : "jelajah",
      source: effective.q ? takeSearchSource() : "ketik",
      cat: effective.cat,
      radius: effective.radius,
      filters_on: filtersOn,
      result_count: firstPage.places.length,
      ...(effective.q ? { q: effective.q } : {}),
    });
    if (firstPage.places.length === 0) {
      ev("empty_result", { cat: effective.cat, radius: effective.radius, filters_on: filtersOn });
    }
  }, [firstPage, effective]);

  useEffect(() => {
    if (query.error instanceof ApiError) ev("error", { code: query.error.code });
  }, [query.error]);

  // Tab: panah kiri/kanan, Home, End berpindah kategori dan memindahkan fokus (pola WAI-ARIA tabs).
  const onTabKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = CATS.indexOf(state.cat);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % CATS.length;
    else if (e.key === "ArrowLeft") n = (i + CATS.length - 1) % CATS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = CATS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    set({ cat: CATS[n] });
    document.getElementById(`tab-${CATS[n]}`)?.focus();
  };

  const onSuggest = (q: string) => {
    setSearchSource("saran");
    recent.add(q);
    set({ q }, { push: true });
  };

  return (
    <section id="hasil" aria-labelledby="hasil-judul" className="mx-auto max-w-[1200px] scroll-mt-24 px-4 py-8 lg:py-12">
      <h2 id="hasil-judul" className="sr-only">Hasil pencarian</h2>

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        <aside className="hidden lg:block" aria-label="Filter">
          <div className="sticky top-24">
            <FilterSidebar
              state={state}
              onChange={(p) => set(p)}
              onReset={reset}
              locationLabel={loc.hydrated ? loc.label : "Lokasi"}
              onOpenLocation={() => setSheet("lokasi")}
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <button type="button" className="chip lg:hidden" onClick={() => setSheet("lokasi")} aria-haspopup="dialog">
            <MapPin size={18} weight="bold" aria-hidden="true" />
            {loc.hydrated ? loc.label : "Lokasi"}
            <CaretDown size={14} weight="bold" aria-hidden="true" />
          </button>

          <div role="tablist" aria-label="Jenis tempat" className="segments" onKeyDown={onTabKey}>
            {CATS.map((c) => (
              <button
                key={c}
                id={`tab-${c}`}
                role="tab"
                type="button"
                className="segment"
                aria-selected={state.cat === c}
                aria-controls="panel-hasil"
                tabIndex={state.cat === c ? 0 : -1}
                onClick={() => set({ cat: c })}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>

          <div className="lg:hidden">
            <FilterChipsRow state={state} onChange={(p) => set(p)} onReset={reset} onOpen={setSheet} />
            {state.murah && <p className="mt-2 text-sm text-redup">{MURAH_HELP}</p>}
          </div>

          <SuggestionRow recent={recent.list} onPick={onSuggest} onRemove={recent.remove} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="tabnum text-sm text-redup" aria-live="polite">
              {query.isSuccess && `${places.length} tempat ditemukan${state.q ? ` untuk "${state.q}"` : ""}`}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="urut" className="field-label">Urut</label>
              <select
                id="urut"
                className="field !min-h-[44px] !w-auto !shadow-none"
                value={state.sort}
                onChange={(e) => set({ sort: e.target.value as SortMode })}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-square !shadow-none"
                aria-label="Apa itu Rating teruji?"
                aria-expanded={tipOpen}
                aria-controls={tipId}
                onClick={() => setTipOpen((o) => !o)}
              >
                <Info size={20} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>
          {tipOpen && (
            <p id={tipId} className="rounded-[10px] border-2 border-garis p-3 text-sm">
              Rating teruji menimbang rating dengan jumlah ulasan, jadi bintang 5,0 dari 3 ulasan tidak mengalahkan 4,7 dari 400 ulasan.
            </p>
          )}

          <div id="panel-hasil" role="tabpanel" aria-labelledby={`tab-${state.cat}`}>
          <Content
            key={contentKey}
            memoKey={contentKey}
            ready={loc.hydrated}
            locationStatus={loc.status}
            hasCenter={!!center}
            query={query}
            places={places}
            truncated={truncated}
            state={state}
            onOpenLocation={() => setSheet("lokasi")}
            onWiden={() => {
              const next = RADIUS_OPTIONS.find((o) => o.value > state.radius);
              if (next) set({ radius: next.value });
            }}
            onClearMurah={() => set({ murah: false })}
          />
          </div>

          <GoogleAttribution />
        </div>
      </div>

      <BottomSheet open={sheet === "radius"} onClose={() => setSheet(null)} title="Radius">
        <OptionGroup label="Radius" options={RADIUS_OPTIONS} value={state.radius} onChange={(radius) => { set({ radius }); setSheet(null); }} />
      </BottomSheet>
      <BottomSheet open={sheet === "rating"} onClose={() => setSheet(null)} title="Rating minimal">
        <OptionGroup label="Rating minimal" options={RATING_OPTIONS} value={state.minRating} onChange={(minRating) => { set({ minRating }); setSheet(null); }} />
      </BottomSheet>
      <BottomSheet open={sheet === "lokasi"} onClose={() => setSheet(null)} title="Cari dari mana?">
        <LocationChooser onDone={() => setSheet(null)} />
      </BottomSheet>
    </section>
  );
}

function SuggestionRow({
  recent,
  onPick,
  onRemove,
}: {
  recent: string[];
  onPick: (q: string) => void;
  onRemove: (q: string) => void;
}) {
  const fresh = SUGGESTIONS.filter((s) => !recent.some((r) => r.toLowerCase() === s));
  const row = "-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:overflow-visible lg:px-0";
  const list = "flex w-max items-center gap-2 lg:w-auto lg:flex-wrap";
  return (
    <div className="space-y-3">
      {recent.length > 0 && (
        <div role="group" aria-labelledby="lbl-terakhir" className="space-y-1.5">
          <p id="lbl-terakhir" className="text-sm font-semibold text-redup">Terakhir dicari</p>
          <div className={row}>
            <div className={list}>
              {recent.map((r) => (
                <span key={r} className="hint">
                  <button type="button" className="hint-btn" onClick={() => onPick(r)}>
                    <ClockCounterClockwise size={16} weight="bold" aria-hidden="true" />
                    {r}
                  </button>
                  <button type="button" className="hint-btn hint-x" aria-label={`Hapus pencarian ${r}`} onClick={() => onRemove(r)}>
                    <X size={14} weight="bold" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div role="group" aria-labelledby="lbl-saran" className="space-y-1.5">
        <p id="lbl-saran" className="text-sm font-semibold text-redup">Coba cari</p>
        <div className={row}>
          <div className={list}>
            {fresh.map((s) => (
              <span key={s} className="hint">
                <button type="button" className="hint-btn" onClick={() => onPick(s)}>{s}</button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type SearchQuery = UseInfiniteQueryResult<InfiniteData<SearchResponse>, Error>;

function Content({
  memoKey,
  ready,
  locationStatus,
  hasCenter,
  query,
  places,
  truncated,
  state,
  onOpenLocation,
  onWiden,
  onClearMurah,
}: {
  memoKey: string;
  ready: boolean;
  locationStatus: string;
  hasCenter: boolean;
  query: SearchQuery;
  places: Place[];
  truncated: boolean;
  state: ReturnType<typeof useSearchState>["state"];
  onOpenLocation: () => void;
  onWiden: () => void;
  onClearMurah: () => void;
}) {
  const [shown, setShown] = useState(() => shownMemo.get(memoKey) ?? PAGE_SIZE);
  const skeletons = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Memuat hasil">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={i >= 3 ? "hidden sm:block" : ""}>
          <PlaceCardSkeleton />
        </div>
      ))}
    </div>
  );

  if (!ready || locationStatus === "locating") return skeletons;

  if (!hasCenter) {
    return (
      <StateMessage
        title="Biar jaraknya akurat, izinkan lokasi. Atau pilih kampus."
        actions={<button type="button" className="btn btn-primary" onClick={onOpenLocation}>Pilih lokasi</button>}
      >
        {locationStatus === "denied" && "Izin lokasi ditolak. Pilih kampus, atau aktifkan izin di pengaturan browser."}
        {locationStatus === "outside" && "Posisimu di luar area Salatiga. Pilih kampus sebagai titik cari."}
      </StateMessage>
    );
  }

  if (query.isPending) return skeletons;

  // Galat halaman PERTAMA = layar galat. Galat saat memuat lanjutan (data sudah ada) hanya pesan di bawah daftar.
  if (query.isError && !query.data) {
    const err = query.error;
    const code = err instanceof ApiError ? err.code : "UPSTREAM_ERROR";
    if (code === "NETWORK") return <NetworkError onRetry={() => query.refetch()} />;
    if (code === "RATE_LIMITED") return <RateLimited />;
    if (code === "UPSTREAM_QUOTA") return <QuotaExhausted mapsUrl={mapsSearchUrl(state.q || CATEGORY_NOUN[state.cat])} />;
    return <GenericError onRetry={() => query.refetch()} />;
  }

  if (places.length === 0) {
    const what = state.q || CATEGORY_NOUN[state.cat];
    const canWiden = state.radius < 3000;
    const nextRadius = RADIUS_OPTIONS.find((o) => o.value > state.radius);
    return (
      <StateMessage
        burst="Belum ketemu"
        title={`Belum ketemu ${what} di radius ${radiusLabel(state.radius)}.`}
        actions={
          <>
            {canWiden && nextRadius && (
              <button type="button" className="btn btn-primary" onClick={onWiden}>
                Perlebar ke {nextRadius.label}
              </button>
            )}
            {query.hasNextPage && (
              // Text Search hanya bias lokasi: halaman 1 bisa habis tersaring radius/kategori padahal halaman berikutnya masih ada.
              <button type="button" className="btn" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                {query.isFetchingNextPage ? "Memuat..." : "Cari di hasil berikutnya"}
              </button>
            )}
            {state.murah && (
              <button type="button" className="btn" onClick={onClearMurah}>Matikan filter Murah</button>
            )}
          </>
        }
      >
        {state.murah && "Coba matikan filter Murah, banyak warung belum punya data harga di Google."}
      </StateMessage>
    );
  }

  const visible = places.slice(0, shown);
  const hasMore = places.length > shown || !!query.hasNextPage;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Daftar tempat">
        {visible.map((p, i) => (
          <li key={p.id}>
            <PlaceCard place={p} cat={state.cat} radius={state.radius} rank={i + 1} from="hasil" />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="btn"
            disabled={query.isFetchingNextPage}
            onClick={() => {
              const next = shown + PAGE_SIZE;
              setShown(next);
              shownMemo.set(memoKey, next);
              // Stok lokal hampir habis: ambil halaman Google berikutnya (mode kata kunci).
              if (shown + PAGE_SIZE > places.length && query.hasNextPage) query.fetchNextPage();
            }}
          >
            {query.isFetchingNextPage ? "Memuat..." : "Muat lebih banyak"}
          </button>
        </div>
      )}
      {query.isFetchNextPageError && (
        <p role="alert" className="text-center text-sm text-redup">
          {query.error instanceof ApiError && query.error.code === "RATE_LIMITED"
            ? "Pelan-pelan dulu, kamu sudah banyak mencari. Coba lagi dalam 1 menit."
            : query.error instanceof ApiError && query.error.code === "UPSTREAM_QUOTA"
              ? "Kuota pencarian Ayo Makan sedang habis. Coba lagi nanti."
              : "Gagal memuat lanjutan. Ketuk Muat lebih banyak untuk mencoba lagi."}
        </p>
      )}
      {!state.q && truncated && (
        <p className="text-center text-sm text-redup">Ketik nama makanan untuk hasil lebih spesifik.</p>
      )}
    </>
  );
}
