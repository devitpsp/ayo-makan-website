"use client";

import Link from "next/link";
import { BookmarkSimple, MapPin, Star } from "@phosphor-icons/react";
import { formatDistance } from "@/lib/places/geo";
import type { Category, Place } from "@/lib/places/types";
import { photoSrc } from "@/lib/client/api";
import { ev } from "@/lib/client/analytics";
import { useFavorites } from "@/lib/client/favorites";
import { formatCount, formatRating, priceFallback, stickerText } from "@/lib/client/format";
import { LazyPhoto } from "./lazy-photo";
import { useToast } from "./toast";

/** Baris rating, jarak, status (DESIGN 8 RatingLine). Warna status hanya titik; informasi tetap tertulis. */
export function RatingLine({ place, className = "" }: { place: Place; className?: string }) {
  return (
    <p className={`tabnum flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm leading-[1.4] ${className}`}>
      {place.rating != null && (
        <span className="inline-flex items-center gap-1">
          <Star
            size={16}
            weight="fill"
            aria-hidden="true"
            style={{ color: "var(--bintang)" }}
          />
          <span aria-hidden="true">
            <span className="font-semibold">{formatRating(place.rating)}</span>
            {place.ratingCount != null && <span className="text-redup"> ({formatCount(place.ratingCount)})</span>}
          </span>
          <span className="sr-only">
            Rating {formatRating(place.rating)} dari 5{place.ratingCount != null && `, ${formatCount(place.ratingCount)} ulasan`}
          </span>
        </span>
      )}
      {place.distanceM != null && (
        <span className="inline-flex items-center gap-1 text-redup">
          <MapPin size={16} weight="bold" aria-hidden="true" />
          <span title="Jarak garis lurus">{formatDistance(place.distanceM)}</span>
          <span className="sr-only">garis lurus</span>
        </span>
      )}
      {place.openNow === true && (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: "var(--buka)" }} />
          Buka
        </span>
      )}
      {place.openNow === false && <span className="text-redup">Tutup</span>}
    </p>
  );
}

export function PlaceCard({
  place,
  cat,
  radius,
  rank,
  from,
}: {
  place: Place;
  cat: Category;
  radius?: number;
  rank: number;
  from: "hasil" | "favorit";
}) {
  const sticker = stickerText(place);
  const href = `/tempat/${encodeURIComponent(place.id)}${radius ? `?r=${radius}` : ""}`;

  return (
    <article className="card-ink card-link relative flex h-full flex-col">
      <div className={`relative aspect-[16/10] w-full ${place.photo ? "bg-garis" : `tint-${cat}`}`}>
        {place.photo ? (
          <LazyPhoto src={photoSrc(place.photo.name, 400)} alt={`Foto ${place.name}`} />
        ) : (
          <span aria-hidden="true" className="display absolute inset-0 grid place-items-center text-[56px]">
            {place.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        {sticker && <span className="sticker-price absolute bottom-2 right-2 tabnum">{sticker}</span>}
      </div>

      {/* Tinggi isi dikunci supaya semua kartu sama besar: nama 2 baris + rating + baris harga. */}
      <div className="flex min-h-[124px] flex-1 items-start gap-1 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 h-[2.92rem] text-[17px] font-semibold leading-snug lg:h-[3.1rem] lg:text-lg">
            {/* Tautan meregang menutupi seluruh kartu; tombol simpan berada di atasnya (z-10). */}
            <Link
              href={href}
              className="text-tinta no-underline after:absolute after:inset-0 after:content-['']"
              onClick={() => ev("place_open", { rank, from })}
            >
              {place.name}
            </Link>
          </h3>
          <RatingLine place={place} />
          {!sticker && <p className="text-sm text-redup">{priceFallback(place)}</p>}
        </div>
        <FavoriteButton placeId={place.id} name={place.name} variant="bare" className="relative z-10 -mr-1 -mt-1" />
      </div>
    </article>
  );
}

export function FavoriteButton({
  placeId,
  name,
  className = "",
  withLabel = false,
  variant = "box",
}: {
  placeId: string;
  name: string;
  className?: string;
  withLabel?: boolean;
  variant?: "box" | "bare";
}) {
  const { has, toggle } = useFavorites();
  const toast = useToast();
  const saved = has(placeId);
  const base = variant === "bare" ? "btn-bare" : withLabel ? "btn" : "btn btn-square";

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Hapus ${name} dari Favorit` : `Simpan ${name} ke Favorit`}
      className={`${base} ${className}`}
      onClick={() => {
        const r = toggle(placeId);
        if (r === "added") {
          ev("favorite_add");
          toast("Disimpan ke Favorit");
        } else if (r === "removed") {
          ev("favorite_remove");
          toast("Dihapus dari Favorit");
        } else if (r === "full") toast("Favorit penuh, maksimal 30 tempat");
        else toast("Favorit tidak bisa disimpan di mode ini");
      }}
    >
      <BookmarkSimple size={24} weight={saved ? "fill" : "bold"} aria-hidden="true" />
      {withLabel && variant === "box" && <span>{saved ? "Tersimpan" : "Simpan"}</span>}
    </button>
  );
}

/** Kerangka kartu: foto + 2 baris teks, tanpa garis tinta supaya jelas belum siap (DESIGN 8). */
export function PlaceCardSkeleton() {
  return (
    <div className="skeleton-card anim-skeleton" aria-hidden="true">
      <div className="skeleton-bar aspect-[16/10] w-full" />
      <div className="min-h-[124px] space-y-2 p-3">
        <div className="skeleton-bar h-4 w-3/4 rounded" />
        <div className="skeleton-bar h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
