import type { Metadata } from "next";
import Link from "next/link";
import { StateMessage } from "@/components/states";
import { TopBar } from "@/components/top-bar";

export const metadata: Metadata = { title: "Halaman tidak ketemu | Ayo Makan", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 pt-4">
        <TopBar variant="box" />
      </div>
      <main id="konten" tabIndex={-1} className="mx-auto max-w-[1200px] px-4 py-12">
        <StateMessage
          burst="Belum ketemu"
          title="Halaman ini tidak ketemu."
          actions={<Link href="/" className="btn btn-primary no-underline">Kembali ke beranda</Link>}
        >
          Tautannya mungkin salah atau sudah tidak dipakai.
        </StateMessage>
      </main>
    </>
  );
}
