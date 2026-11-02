"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Copy, MapPin, NavigationArrow, ShareNetwork, Star } from "@phosphor-icons/react";
import { formatDistance, haversineM } from "@/lib/places/geo";
import type { PlaceDetail } from "@/lib/places/types";
import { ApiError, fetchDetail, photoSrc } from "@/lib/client/api";
import { ev } from "@/lib/client/analytics";
import { placeUrl, routeUrl } from "@/lib/client/directions";
import { categoryOfType, formatCount, formatRating, priceDetail } from "@/lib/client/format";
import { useLocation } from "@/lib/client/location";
import { hasInAppHistory } from "@/lib/client/nav-history";
import { BottomSheet } from "./bottom-sheet";
import { GoogleAttribution } from "./google-attribution";
import { FavoriteButton } from "./place-card";
import { ReviewCard } from "./review-card";
import { GenericError, NetworkError, QuotaExhausted, RateLimited, StateMessage } from "./states";
import { TopBar } from "./top-bar";
import { useToast } from "./toast";

export function PlaceDetailView({ id }: { id: string }) {
  const loc = useLocation();
  const sp = useSearchParams();
  const r = Number(sp.get("r"));
  const radius = r > 0 ? r : null;

  // Tanpa pusat di kunci: jarak dihitung di klien, jadi ganti lokasi tidak memicu panggilan Place Details lagi.
  const q = useQuery({
    queryKey: ["detail", id],
    queryFn: ({ signal }) => fetchDetail(id, null, false, signal),
  });

  useEffect(() => {
    if (q.data) document.title = `${q.data.name} | Ayo Makan`;
  }, [q.data]);

  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 pt-4">
        <TopBar variant="box" />
      </div>
      <main id="konten" tabIndex={-1} className="mx-auto max-w-[1200px] px-4 pb-32 pt-6 lg:pb-12">
        {!q.data && <BackLink />}
        {q.isPending && <DetailSkeleton />}
        {q.isError && <DetailError error={q.error} id={id} onRetry={() => q.refetch()} />}
        {q.data && <Detail place={q.data} center={loc.center} radius={radius} />}
      </main>
    </>
  );
}

function BackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn mb-4"
      onClick={() => (hasInAppHistory() ? router.back() : router.push("/"))}
    >
      <ArrowLeft size={20} weight="bold" aria-hidden="true" />
      Kembali
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div className="anim-skeleton grid gap-6 lg:grid-cols-2" aria-busy="true" aria-label="Memuat detail tempat">
      <div className="space-y-4">
        <div className="aspect-[16/10] rounded-xl bg-garis" />
        <div className="h-8 w-2/3 rounded bg-garis" />
        <div className="h-4 w-1/2 rounded bg-garis" />
      </div>
      <div className="h-64 rounded-xl bg-garis" />
    </div>
  );
}

function DetailError({ error, id, onRetry }: { error: Error; id: string; onRetry: () => void }) {
  const code = error instanceof ApiError ? error.code : "UPSTREAM_ERROR";
  if (code === "NOT_FOUND") {
    return (
      <StateMessage
        role="alert"
        title="Tempat ini sudah tidak ada di Google Maps."
        actions={<Link href="/" className="btn btn-primary no-underline">Kembali ke pencarian</Link>}
      />
    );
  }
  if (code === "NETWORK") return <NetworkError onRetry={onRetry} />;
  if (code === "RATE_LIMITED") return <RateLimited />;
  if (code === "UPSTREAM_QUOTA") return <QuotaExhausted mapsUrl={placeUrl(id)} />;
  return <GenericError onRetry={onRetry} />;
}

function Detail({ place, center, radius }: { place: PlaceDetail; center: { lat: number; lng: number } | null; radius: number | null }) {
  const distance = center ? Math.round(haversineM(center, { lat: place.lat, lng: place.lng })) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[7fr_5fr] lg:items-start">
      <div className="space-y-5">
        <Gallery place={place} />

        <div className="space-y-2">
          <h1 className="display text-[26px] uppercase lg:text-[32px]" style={{ fontWeight: 800 }}>{place.name}</h1>
          {place.primaryTypeLabel && <p className="text-redup">{place.primaryTypeLabel}</p>}
          <p className="tabnum flex flex-wrap items-center gap-x-3 gap-y-1">
            {place.rating != null && (
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star size={18} weight="fill" aria-hidden="true" style={{ color: "var(--bintang)" }} />
                <span aria-hidden="true">
                  {formatRating(place.rating)}
                  {place.ratingCount != null && ` (${formatCount(place.ratingCount)})`}
                </span>
                <span className="sr-only">
                  Rating {formatRating(place.rating)} dari 5{place.ratingCount != null && `, ${formatCount(place.ratingCount)} ulasan`}
                </span>
              </span>
            )}
            <span>{priceDetail(place)}</span>
          </p>
          <p className="tabnum flex flex-wrap items-center gap-x-3 gap-y-1 text-redup">
            {distance != null && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={18} weight="bold" aria-hidden="true" />
                <span title="Jarak garis lurus">{formatDistance(distance)}</span>
                <span className="sr-only">garis lurus</span>
              </span>
            )}
            {place.openNow != null && <span className="font-semibold text-tinta">{place.openNow ? "Buka sekarang" : "Tutup sekarang"}</span>}
          </p>
        </div>

        {place.weekdayDescriptions.length > 0 && (
          <details className="card-ink">
            <summary className="flex min-h-[48px] cursor-pointer items-center gap-2 px-4 font-semibold">
              <Clock size={20} weight="bold" aria-hidden="true" />
              Jam buka
            </summary>
            <ul className="space-y-1 border-t-2 border-garis px-4 py-3 text-sm">
              {place.weekdayDescriptions.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </details>
        )}

        {place.address && <AddressRow address={place.address} />}

        {place.googleMapsUri && (
          <a className="inline-flex min-h-[44px] items-center font-semibold" href={place.googleMapsUri} target="_blank" rel="noopener">
            Buka di Google Maps
          </a>
        )}

        {/* Kolom aksi desktop; di HP diganti bilah melekat di bawah */}
        <div className="hidden lg:block">
          <Actions place={place} radius={radius} />
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Reviews place={place} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-[var(--garis-keras)] bg-surface p-3 lg:hidden">
        <div className="mx-auto max-w-xl">
          <Actions place={place} radius={radius} compact />
        </div>
      </div>
    </div>
  );
}

function Actions({ place, radius, compact = false }: { place: PlaceDetail; radius: number | null; compact?: boolean }) {
  const toast = useToast();

  async function share() {
    const url = `${window.location.origin}/tempat/${encodeURIComponent(place.id)}`;
    const data = { title: place.name, text: `${place.name} di Ayo Makan`, url };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        ev("share", { method: "native" });
      } catch {
        /* dibatalkan pengguna */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      ev("share", { method: "salin" });
      toast("Tautan disalin");
    } catch {
      toast("Tidak bisa menyalin tautan");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <a
        className="btn btn-primary flex-1 no-underline"
        href={routeUrl(place, radius)}
        target="_blank"
        rel="noopener"
        onClick={() => ev("route_click", { radius })}
      >
        <NavigationArrow size={22} weight="bold" aria-hidden="true" />
        Rute ke sini
      </a>
      <FavoriteButton placeId={place.id} name={place.name} withLabel={!compact} />
      <button type="button" className={compact ? "btn btn-square" : "btn"} onClick={share} aria-label={`Bagikan ${place.name}`}>
        <ShareNetwork size={22} weight="bold" aria-hidden="true" />
        {!compact && <span>Bagikan</span>}
      </button>
    </div>
  );
}

function AddressRow({ address }: { address: string }) {
  const toast = useToast();
  return (
    <div className="flex items-start gap-3">
      <p className="flex-1 pt-2">{address}</p>
      <button
        type="button"
        className="btn btn-square shrink-0"
        aria-label="Salin alamat"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            toast("Alamat disalin");
          } catch {
            toast("Tidak bisa menyalin alamat");
          }
        }}
      >
        <Copy size={20} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}

function Reviews({ place }: { place: PlaceDetail }) {
  return (
    <section aria-labelledby="ulasan" className="space-y-4">
      <h2 id="ulasan" className="display text-xl uppercase lg:text-2xl" style={{ fontWeight: 800 }}>Ulasan dari Google</h2>
      {place.reviews.length > 0 ? (
        <>
          <p className="text-sm text-redup">
            Maksimal 5 ulasan, dipilih dan diurutkan Google berdasarkan relevansi. Lihat semua ulasan di Google Maps.
          </p>
          <div className="space-y-4">
            {place.reviews.map((r, i) => (
              <ReviewCard key={`${r.author}-${i}`} review={r} />
            ))}
          </div>
        </>
      ) : (
        <div className="card-ink space-y-3 p-4">
          <p>Belum ada ulasan untuk tempat ini di Google Maps.</p>
          {place.writeReviewUri && (
            <a className="btn" href={place.writeReviewUri} target="_blank" rel="noopener">
              Tulis ulasan di Google Maps
            </a>
          )}
        </div>
      )}
      <GoogleAttribution className="!px-0" />
    </section>
  );
}

function FloatingBack() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-square absolute left-2 top-2 z-10"
      aria-label="Kembali"
      onClick={() => (hasInAppHistory() ? router.back() : router.push("/"))}
    >
      <ArrowLeft size={24} weight="bold" aria-hidden="true" />
    </button>
  );
}

function Gallery({ place }: { place: PlaceDetail }) {
  const photos = place.photos;
  const [idx, setIdx] = useState(0);
  const [big, setBig] = useState(false);
  const cat = categoryOfType(place.primaryType);

  if (photos.length === 0) {
    return (
      <div className={`relative aspect-[4/3] rounded-xl border-2 border-[var(--garis-kartu)] tint-${cat}`}>
        <FloatingBack />
        <div aria-hidden="true" className="display grid h-full place-items-center text-[56px]">
          {place.name.trim().charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  const current = photos[idx];
  return (
    <div className="space-y-2">
      <div className="relative">
      <FloatingBack />
      <button type="button" className="card-ink block w-full !p-0" onClick={() => setBig(true)} aria-label={`Perbesar foto ${place.name}`}>
        {/* Foto Google tidak lewat next/image (PRD 8.2). Satu foto 800 px dimuat; sisanya hanya saat diketuk. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(current.name, 800)} alt={`Foto ${place.name}`} className="aspect-[4/3] w-full object-cover" fetchPriority="high" />
      </button>
      </div>
      {current.author && (
        <p className="text-xs text-redup">
          Foto: {current.authorUri ? <a href={current.authorUri} target="_blank" rel="noopener">{current.author}</a> : current.author}
        </p>
      )}
      {photos.length > 1 && (
        <div role="group" aria-label="Pilih foto" className="flex gap-2">
          {photos.map((p, i) => (
            <button
              key={p.name}
              type="button"
              aria-label={`Lihat foto ${i + 1} dari ${photos.length}`}
              aria-pressed={i === idx}
              onClick={() => setIdx(i)}
              className="tab !min-h-[44px] !min-w-[44px] !px-0"
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <BottomSheet open={big} onClose={() => setBig(false)} title="Foto">
        {big && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc(current.name, 1200)} alt={`Foto ${place.name}`} className="max-h-[70vh] w-full rounded-lg object-contain" />
            {current.author && (
              <p className="text-sm text-redup">
                Foto oleh {current.authorUri ? <a href={current.authorUri} target="_blank" rel="noopener">{current.author}</a> : current.author}, lewat Google Maps
              </p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
