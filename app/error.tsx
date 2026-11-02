"use client";

import Link from "next/link";
import { StateMessage } from "@/components/states";
import { TopBar } from "@/components/top-bar";

// Batas galat untuk halaman (galat render). Pesan teknis tidak ditampilkan ke pengguna.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 pt-4">
        <TopBar variant="box" />
      </div>
      <main id="konten" tabIndex={-1} className="mx-auto max-w-[1200px] px-4 py-12">
        <StateMessage
          role="alert"
          title="Ada yang salah di halaman ini."
          actions={
            <>
              <button type="button" className="btn btn-primary" onClick={() => reset()}>Coba lagi</button>
              <Link href="/" className="btn no-underline">Kembali ke beranda</Link>
            </>
          }
        >
          Ini bukan salah kamu. Coba lagi, atau mulai dari beranda.
        </StateMessage>
      </main>
    </>
  );
}
