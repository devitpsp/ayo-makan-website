import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <main id="konten" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <p aria-hidden="true" className="state-word">Offline</p>
      <h1 className="text-xl font-semibold">Kamu sedang offline. Sambungkan internet untuk mencari tempat makan.</h1>
      <p className="text-redup">Tempat yang kamu simpan akan muncul lagi begitu internet nyala.</p>
    </main>
  );
}
