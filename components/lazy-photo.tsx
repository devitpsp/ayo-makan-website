"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Foto Google dimuat HANYA saat kartu hampir masuk layar (PRD 9: tuas biaya no.2, kuota foto 1.000/bulan).
 * `loading="lazy"` bawaan browser terlalu dini: di desktop ia memuat belasan foto sekaligus.
 * Foto tidak melewati next/image karena optimasi Vercel menyimpan salinan gambar (PRD 8.2).
 */
export function LazyPhoto({ src, alt }: { src: string; alt: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px 120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  // absolute: mengisi kotak beraspek 16:10 di induknya. h-full akan runtuh karena tinggi induk berasal dari rasio,
  // dan foto potret lalu memakai tinggi aslinya.
  return (
    <div ref={box} className="absolute inset-0">
      {near && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} decoding="async" className="h-full w-full object-cover" />
      )}
    </div>
  );
}
