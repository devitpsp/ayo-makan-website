"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import type { Review } from "@/lib/places/types";

const LONG = 240;

export function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const text = showOriginal && review.originalText ? review.originalText : review.text;
  const long = text.length > LONG || text.split("\n").length > 5;

  return (
    <article className="card-ink space-y-3 p-4">
      <header className="flex items-center gap-3">
        {review.authorPhoto ? (
          // Foto profil penulis ulasan dari Google, dimuat langsung dari hostnya.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.authorPhoto}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-10 w-10 shrink-0 rounded-full border-2 border-garis-kartu bg-garis object-cover"
          />
        ) : (
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-telur font-bold text-tinta">
            {review.author.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          {review.authorUri ? (
            <a href={review.authorUri} target="_blank" rel="noopener" className="block truncate font-semibold">
              {review.author}
            </a>
          ) : (
            <span className="block truncate font-semibold">{review.author}</span>
          )}
          <p className="flex items-center gap-2 text-sm text-redup">
            <span className="inline-flex" role="img" aria-label={`Bintang ${review.rating} dari 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} weight={i < review.rating ? "fill" : "regular"} aria-hidden="true" className="text-[var(--bintang)]" />
              ))}
            </span>
            {review.relativeTime && <span>{review.relativeTime}</span>}
          </p>
        </div>
      </header>

      {review.translated && (
        <p className="text-sm text-redup">
          {showOriginal ? "Teks asli. " : "Diterjemahkan oleh Google. "}
          <button type="button" className="font-semibold underline" onClick={() => setShowOriginal((v) => !v)}>
            {showOriginal ? "Lihat terjemahan" : "Lihat teks asli"}
          </button>
        </p>
      )}

      {text ? (
        <p className={`whitespace-pre-line break-words ${expanded ? "" : "line-clamp-5"}`}>{text}</p>
      ) : (
        <p className="text-redup">Ulasan ini hanya berisi bintang.</p>
      )}
      {long && (
        <button type="button" className="min-h-[44px] font-semibold underline" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Tutup" : "Baca selengkapnya"}
        </button>
      )}

      <footer className="flex flex-wrap gap-x-4 text-sm">
        {review.googleMapsUri && (
          <a className="inline-flex min-h-[44px] items-center" href={review.googleMapsUri} target="_blank" rel="noopener">
            Lihat di Google Maps
          </a>
        )}
        {review.flagUri && (
          <a className="inline-flex min-h-[44px] items-center text-redup" href={review.flagUri} target="_blank" rel="noopener">
            Laporkan
          </a>
        )}
      </footer>
    </article>
  );
}
