import { Suspense } from "react";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { ResultsSection } from "@/components/results";
import { StickyHeader } from "@/components/sticky-header";

export default function HomePage() {
  return (
    <>
      <main id="konten" tabIndex={-1}>
        <Suspense fallback={<div className="min-h-[80svh] bg-[var(--bg-hero)]" aria-hidden="true" />}>
          <Hero />
          <StickyHeader />
          <ResultsSection />
        </Suspense>
      </main>
      <footer className="border-t-2 border-garis px-4 py-6 text-center text-sm text-redup">
        <Link href="/privasi" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-3">Privasi</Link>
      </footer>
    </>
  );
}
