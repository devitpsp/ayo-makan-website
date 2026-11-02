"use client";

import type { ReactNode } from "react";

/** Kerangka state UI (PRD 10.7). role "alert" untuk error agar diumumkan pembaca layar. */
export function StateMessage({
  title,
  children,
  actions,
  burst,
  role = "status",
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  burst?: string;
  role?: "status" | "alert";
}) {
  return (
    <div role={role} className="card-ink mx-auto flex max-w-[420px] flex-col items-center gap-4 p-6 text-center">
      {burst && (
        // Kata besar samar, gaya yang sama dengan kata raksasa hero (DESIGN v2 6.1). Dekoratif.
        <p aria-hidden="true" className="state-word">{burst}</p>
      )}
      <h3 className="display text-[20px] normal-case leading-snug" style={{ fontWeight: 800 }}>{title}</h3>
      {children && <div className="text-redup">{children}</div>}
      {actions && <div className="flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}

export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <StateMessage
      role="alert"
      title="Koneksi putus. Cek internet kamu, lalu coba lagi."
      actions={<button type="button" className="btn btn-primary" onClick={onRetry}>Coba lagi</button>}
    />
  );
}

export function RateLimited() {
  return (
    <StateMessage role="alert" title="Pelan-pelan dulu, kamu sudah banyak mencari. Coba lagi dalam 1 menit." />
  );
}

export function QuotaExhausted({ mapsUrl }: { mapsUrl: string }) {
  return (
    <StateMessage
      role="alert"
      title="Kuota pencarian Ayo Makan sedang habis. Coba lagi nanti, atau cari langsung di Google Maps."
      actions={
        <a className="btn btn-primary" href={mapsUrl} target="_blank" rel="noopener">
          Cari di Google Maps
        </a>
      }
    />
  );
}

export function GenericError({ onRetry }: { onRetry: () => void }) {
  return (
    <StateMessage
      role="alert"
      title="Google Maps sedang tidak bisa dihubungi."
      actions={<button type="button" className="btn btn-primary" onClick={onRetry}>Coba lagi</button>}
    >
      Ini bukan salah kamu. Coba lagi sebentar lagi.
    </StateMessage>
  );
}
