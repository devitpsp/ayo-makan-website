"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { flushSync } from "react-dom";
import { ArrowLeft, ArrowRight, CaretDoubleDown, Pause, Play } from "@phosphor-icons/react";
import { HERO_SLIDES } from "@/config/hero-slides";
import { ev } from "@/lib/client/analytics";
import { SearchBar } from "./search-bar";
import { TopBar } from "./top-bar";

const SWIPE_PX = 40;
// Auto slide (permintaan owner 3 Nov 2026). WCAG 2.2.2: ada tombol jeda, berhenti saat disentuh/difokus, mati bila "kurangi gerakan".
const AUTO_MS = 2000;
const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const m = window.matchMedia(REDUCED);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const COUNT = HERO_SLIDES.length;
const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/**
 * Hero "Menu andalan" (PRD 10.6.1, DESIGN v2 7.2): carousel hidangan sebagai etalase.
 * Foto di tengah di depan nama menu raksasa. Kolom cari umum, tidak mengikuti slide.
 * Auto slide tiap 2 detik: jeda lewat tombol, saat kursor/fokus di hero, saat hero di luar layar atau tab tersembunyi.
 * Gerak (DESIGN v2 bagian 8, MOTION 3): pembuka halaman, ganti slide sinematik, parallax kursor dan scroll.
 * Semua gerak mati bila pengguna memilih "kurangi gerakan".
 */
export function Hero() {
  const [i, setI] = useState(0);
  // Foto slide lain baru dimuat setelah foto pertama selesai, agar tidak berebut bandwidth dengan elemen LCP.
  const [warm, setWarm] = useState(false);
  // Slide yang sedang keluar dan arah gerak (1 = ke kanan/berikutnya, -1 = sebelumnya), untuk transisi sinematik.
  const [leaving, setLeaving] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  // Pembuka halaman: huruf naik satu per satu dan piring turun berputar, sekali saja.
  const [intro, setIntro] = useState(true);
  const touch = useRef<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slide = HERO_SLIDES[i];

  // Auto slide: berjalan hanya bila tidak dijeda pengguna, tidak sedang disentuh/difokus, hero terlihat, tab aktif.
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
  const section = useRef<HTMLElement>(null);
  const running = !paused && !hold && onScreen && tabVisible && !reduced;

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.intersectionRatio > 0.4), { threshold: [0, 0.4, 1] });
    io.observe(el);
    const vis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const onFocusIn = () => setHold(true);
  const onFocusOut = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false);
  };

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1800);
    return () => {
      clearTimeout(t);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const goTo = (next: number, via: "tombol" | "geser" | "otomatis", d?: 1 | -1) => {
    if (next === i) return;
    const direction = d ?? (next > i ? 1 : -1);
    // Arah dipasang dan dihitung browser dulu (slide yang menunggu melompat ke sisi masuk tanpa transisi),
    // baru slide berganti. Sinkron dalam satu klik, jadi headline langsung berganti.
    if (direction !== dir) {
      flushSync(() => setDir(direction));
      void stage.current?.offsetWidth; // paksa hitung ulang gaya sebelum slide aktif berubah
    }
    setIntro(false);
    setLeaving(i);
    setI(next);
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setLeaving(null), 750);
    if (via !== "otomatis") ev("hero_slide", { slide: HERO_SLIDES[next].id, action: via });
  };
  const go = (d: 1 | -1, via: "tombol" | "geser" | "otomatis" = "tombol") => goTo((i + d + COUNT) % COUNT, via, d);

  const tick = useEffectEvent(() => go(1, "otomatis"));
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(tick, AUTO_MS); // diulang dari awal setiap slide berganti (termasuk ganti manual)
    return () => clearTimeout(t);
  }, [running, i]);

  // Parallax kursor (desktop, mouse saja): posisi kursor relatif ke panggung, -1 sampai 1.
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 2 - 1;
    const py = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      stage.current?.style.setProperty("--px", px.toFixed(3));
      stage.current?.style.setProperty("--py", py.toFixed(3));
    });
  };

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
            className="grid h-11 max-w-11 flex-1 place-items-center"
          >
            <span
              className={`block h-[4px] rounded-full bg-[var(--on-hero)] transition-all duration-200 ${idx === i ? "w-7" : "w-[6px] opacity-40"}`}
            />
          </button>
        ))}
      </div>
      {!reduced && (
        <button
          type="button"
          className="btn btn-telur btn-square h-11 w-11 shrink-0 rounded-full"
          onClick={() => setPaused((v) => !v)}
          aria-label={paused ? "Putar slide otomatis" : "Jeda slide otomatis"}
          aria-pressed={paused}
        >
          {paused ? <Play size={18} weight="fill" aria-hidden="true" /> : <Pause size={18} weight="fill" aria-hidden="true" />}
        </button>
      )}
      <button type="button" className="btn btn-telur btn-square h-12 w-12 shrink-0 rounded-full" onClick={() => go(1)} aria-label="Menu berikutnya">
        <ArrowRight size={22} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <section
      ref={section}
      id="hero"
      aria-label="Menu andalan"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
      onFocus={onFocusIn}
      onBlur={onFocusOut} className="hero-panel flex min-h-svh flex-col px-4 pb-5 pt-1 lg:px-10 lg:pb-4">
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
          {/*
            Panggung (DESIGN v2 7.2, susunan awal dipulihkan atas permintaan owner 3 Nov 2026):
            nama menu raksasa rata tengah, foto di tengah di depannya (tanpa nomor slide, permintaan owner).
          */}
          <div
            ref={stage}
            data-dir={dir}
            className={`hero-stage relative h-[var(--stage-h)] touch-pan-y select-none ${intro ? "is-intro" : ""}`}
            onPointerMove={onMove}
            onPointerLeave={() => {
              stage.current?.style.setProperty("--px", "0");
              stage.current?.style.setProperty("--py", "0");
            }}
            onPointerDown={onDown}
            onPointerUp={onUp}
            onPointerCancel={() => (touch.current = null)}
            // Drag gambar bawaan browser membatalkan pointer (pointercancel) dan menggagalkan geseran mouse.
            onDragStart={(e) => e.preventDefault()}
          >

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
                  data-state={active ? "active" : idx === leaving ? "leaving" : "idle"}
                  className="hero-slide absolute inset-0"
                >
                  {/* Lapis nama menu: parallax (kursor + scroll) di pembungkus, transisi slide di <p>, pembuka di tiap huruf */}
                  <div className="px-word absolute inset-0">
                    <p
                      aria-hidden="true"
                      className="giant-word absolute inset-x-0 top-1/2 -translate-y-1/2"
                      style={{ "--n": s.badge.length, "--m": longest } as CSSProperties}
                    >
                      {words.map((w, wi) => {
                        const offset = words.slice(0, wi).join("").length;
                        return (
                          <span key={w} className="block lg:inline">
                            {[...w].map((ch, k) => (
                              <span key={k} className="glyph" style={{ "--i": offset + k } as CSSProperties}>
                                {ch}
                              </span>
                            ))}
                            {wi < words.length - 1 && <span className="hidden lg:inline"> </span>}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                  {/* Lapis foto: parallax di pembungkus, ayunan pelan di kotak foto, transisi slide dan pembuka di <img> */}
                  <div className="px-photo absolute inset-0 z-10">
                    <div className="plate-sway absolute left-1/2 top-1/2 h-[94%] w-[78%] -translate-x-1/2 -translate-y-1/2 md:w-[60%] lg:w-[42%]">
                      {s.photo && !(active || warm) ? null : s.photo ? (
                        // Foto cutout milik Ayo Makan (bukan foto Google), boleh dioptimasi dan di-cache.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.photo}
                          alt={s.alt}
                          draggable={false}
                          className="hero-photo h-full w-full object-contain [-webkit-user-drag:none]"
                          loading={idx === 0 ? "eager" : "lazy"}
                          fetchPriority={idx === 0 ? "high" : "auto"}
                          onLoad={idx === 0 ? () => setWarm(true) : undefined}
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
                </div>
              );
            })}

            {/* HP: panah di bawah panggung agar tetap terlihat di layar pertama */}
            <div className="absolute inset-x-0 bottom-0 z-20">{controls("stage")}</div>
          </div>

          {/*
            Satu headline dan satu kolom cari untuk semua lebar (id #cari-hero dipakai scripts/verify-ui.mjs).
            HP/tablet: mengalir di bawah panggung. Desktop: tagline kiri bawah, kolom cari kanan tengah panggung.
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
              <SearchBar id="cari-hero" scrollOnSubmit placeholder="Mau makan apa hari ini?" submitLabel="Cari di sekitar" />
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
