"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, CaretDoubleDown } from "@phosphor-icons/react";
import { HERO_SLIDES } from "@/config/hero-slides";
import { ev } from "@/lib/client/analytics";
import { useRecentSearches } from "@/lib/client/recent-searches";
import { scrollToResults, setSearchSource } from "@/lib/client/scroll";
import { useSearchState } from "@/lib/client/search-state";
import { SearchBar } from "./search-bar";
import { TopBar } from "./top-bar";

const SWIPE_PX = 40;
const COUNT = HERO_SLIDES.length;
const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Hero "Menu andalan" (PRD 10.6.1, DESIGN v2 7.2): carousel hidangan, tiap slide menjalankan pencarian.
 * Tanpa putar otomatis. Pindah lewat tombol panah, indikator, geser, atau panah keyboard.
 */
export function Hero() {
  const [i, setI] = useState(0);
  const { set } = useSearchState();
  const { add: addRecent } = useRecentSearches();
  const touch = useRef<number | null>(null);
  const slide = HERO_SLIDES[i];

  const goTo = (next: number, via: "tombol" | "geser") => {
    setI(next);
    ev("hero_slide", { slide: HERO_SLIDES[next].id, action: via });
  };
  const go = (dir: 1 | -1, via: "tombol" | "geser" = "tombol") => goTo((i + dir + COUNT) % COUNT, via);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // Panah hanya menggerakkan carousel bila fokus di carousel itu sendiri, bukan di kolom cari.
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  const onDown = (e: PointerEvent) => {
    touch.current = e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (touch.current == null) return;
    const dx = e.clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1, "geser");
  };

  const runSearch = () => {
    setSearchSource("hero");
    addRecent(slide.keyword);
    ev("hero_slide", { slide: slide.id, action: "klik_cari" });
    set({ q: slide.keyword, cat: slide.cat }, { push: true });
    scrollToResults();
  };

  const controls = (where: "stage" | "panel") => (
    <div className={`flex items-center gap-2 ${where === "stage" ? "lg:hidden" : "hidden lg:flex"}`}>
      <button type="button" className="btn btn-telur btn-square h-12 w-12 shrink-0 rounded-full" onClick={() => go(-1)} aria-label="Menu sebelumnya">
        <ArrowLeft size={22} weight="bold" aria-hidden="true" />
      </button>
      <div className="flex flex-1 items-center justify-center" role="group" aria-label="Pilih menu">
        {HERO_SLIDES.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Lihat menu ${idx + 1} dari ${COUNT}: ${title(s.badge)}`}
            aria-current={idx === i}
            onClick={() => goTo(idx, "tombol")}
            // Lebar ikut sisa ruang (maks 44 px) agar 6 titik muat di 360 px.
            className="grid h-11 max-w-11 flex-1 place-items-center"
          >
            <span
              className={`block h-[4px] rounded-full bg-[var(--on-hero)] transition-all duration-200 ${idx === i ? "w-7" : "w-[6px] opacity-40"}`}
            />
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-telur btn-square h-12 w-12 shrink-0 rounded-full" onClick={() => go(1)} aria-label="Menu berikutnya">
        <ArrowRight size={22} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <section id="hero" aria-label="Menu andalan" className="hero-panel flex min-h-svh flex-col px-4 pb-5 pt-1 lg:px-10 lg:pb-4">
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col">
        <TopBar variant="hero" />

        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="Menu andalan"
          tabIndex={0}
          onKeyDown={onKey}
          className="relative mt-1 outline-offset-4 [--stage-h:max(200px,calc(100svh-340px))] md:[--stage-h:max(380px,calc(100svh-420px))] lg:mt-0 lg:[--stage-h:max(460px,calc(100svh-152px))]"
        >
          {/* Panggung: nomor slide, kata raksasa (dekoratif), foto hidangan di tengah (DESIGN v2 7.2) */}
          <div
            className="relative h-[var(--stage-h)] touch-pan-y select-none"
            onPointerDown={onDown}
            onPointerUp={onUp}
            onPointerCancel={() => (touch.current = null)}
            // Drag gambar bawaan browser membatalkan pointer (pointercancel) dan menggagalkan geseran mouse.
            onDragStart={(e) => e.preventDefault()}
          >
            <p aria-hidden="true" className="tabnum absolute left-0 top-0 z-20 leading-none">
              <span className="text-[36px] font-normal lg:text-[72px]">{pad(i + 1)}</span>
              <span className="ml-1 align-top text-sm font-semibold opacity-70 lg:text-lg">/{pad(COUNT)}</span>
            </p>

            {HERO_SLIDES.map((s, idx) => {
              const active = idx === i;
              const words = s.badge.split(" ");
              const longest = Math.max(...words.map((w) => w.length));
              return (
                <div
                  key={s.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} dari ${COUNT}: ${title(s.badge)}`}
                  aria-hidden={!active}
                  className={`hero-slide absolute inset-0 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
                >
                  {/* Kata raksasa: dekoratif, nama menu sudah terbaca di label slide dan tombol */}
                  <p
                    aria-hidden="true"
                    className="giant-word absolute inset-x-0 top-1/2 -translate-y-1/2"
                    style={{ "--n": s.badge.length, "--m": longest } as CSSProperties}
                  >
                    {words.map((w, wi) => (
                      <span key={w} className="block lg:inline">
                        {w}
                        {wi < words.length - 1 && <span className="hidden lg:inline"> </span>}
                      </span>
                    ))}
                  </p>
                  <div className="absolute left-1/2 top-1/2 z-10 h-[94%] w-[78%] -translate-x-1/2 -translate-y-1/2 md:w-[60%] lg:w-[42%]">
                    {s.photo ? (
                      // Foto cutout milik Ayo Makan (bukan foto Google), boleh dioptimasi dan di-cache.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo}
                        alt={s.alt}
                        draggable={false}
                        className={`hero-photo h-full w-full object-contain [-webkit-user-drag:none] ${active ? "anim-badge" : ""}`}
                        loading={idx === 0 ? "eager" : "lazy"}
                        fetchPriority={idx === 0 ? "high" : "auto"}
                      />
                    ) : (
                      // Slot placeholder jujur sampai owner mengirim foto (PRD 10.11, Q7).
                      <div
                        role="img"
                        aria-label={s.alt}
                        className="mx-auto grid aspect-square h-full place-items-center rounded-full border-2 border-dashed border-[var(--on-hero)] p-2 text-center"
                      >
                        <span className="text-sm font-semibold lg:text-lg">[FOTO: {s.keyword}]</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* HP: panah di bawah panggung agar tetap terlihat di layar pertama */}
            <div className="absolute inset-x-0 bottom-0 z-20">{controls("stage")}</div>

          </div>

          {/*
            Satu headline dan satu kolom cari untuk semua lebar (id #cari-hero dipakai scripts/verify-ui.mjs).
            HP/tablet: mengalir di bawah panggung. Desktop: diposisikan absolut di kiri bawah dan kanan tengah panggung.
            Tinggi panggung = --stage-h (hero setinggi layar penuh); posisi desktop di bawah memakai variabel yang sama.
          */}
          <div className="mt-3 space-y-3 md:mx-auto md:max-w-xl lg:m-0 lg:max-w-none lg:space-y-0">
            <div className="space-y-2 lg:absolute lg:left-0 lg:top-[calc(var(--stage-h)-32px)] lg:z-20 lg:max-w-[300px] lg:-translate-y-full">
              <span aria-hidden="true" className="mb-4 hidden h-[2px] w-10 bg-[var(--on-hero)] lg:block" />
              <h1 key={slide.id} className="anim-fade text-[19px] font-semibold italic leading-snug lg:text-[24px]">
                {slide.headline}
              </h1>
              <p className="text-sm leading-snug">
                Rating dan ulasan langsung dari Google Maps.
                <span className="hidden lg:inline"> Jarak dihitung dari kampus atau posisi kamu.</span>
              </p>
            </div>
            <div className="space-y-3 lg:absolute lg:right-0 lg:top-[calc(var(--stage-h)/2)] lg:z-20 lg:w-[340px] lg:-translate-y-1/2">
              <SearchBar id="cari-hero" scrollOnSubmit prefill={slide.keyword} />
              <button type="button" className="btn btn-primary min-h-[48px] w-full" onClick={runSearch}>
                {slide.button}
              </button>
              {controls("panel")}
            </div>
          </div>

          <div className="sr-only" aria-live="polite">
            {`${i + 1} dari ${COUNT}: ${title(slide.badge)}`}
          </div>
        </div>

        <a href="#hasil" className="mx-auto mt-auto hidden min-h-[44px] w-fit items-center gap-1 font-semibold text-[var(--on-hero)] lg:flex">
          Lihat hasil
          <CaretDoubleDown size={20} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
