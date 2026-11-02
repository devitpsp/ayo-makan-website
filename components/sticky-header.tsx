"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { MenuButton, MenuPanel, useMenu } from "./menu";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";

/** Header ringkas melekat: muncul setelah hero keluar layar (DESIGN 7.3). */
export function StickyHeader() {
  const [show, setShow] = useState(false);
  const { open, setOpen, btn, panel, id } = useMenu();

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (!show) return null;
  return (
    <div className="anim-header fixed inset-x-0 top-0 z-20 p-2">
      <div className="relative mx-auto max-w-[1200px]">
        <div className="panel-ink flex min-h-[56px] items-center gap-3 rounded-2xl bg-surface px-3 py-2 lg:min-h-[64px]">
          <Logo variant="mark" className="shrink-0" />
          <div className="min-w-0 flex-1 lg:mx-auto lg:max-w-[520px]">
            <SearchBar id="cari-melekat" size="sm" />
          </div>
          <nav aria-label="Menu cepat" className="hidden shrink-0 items-center gap-1 lg:flex">
            <Link href="/favorit" className="inline-flex min-h-[44px] items-center px-2 font-semibold text-tinta no-underline hover:underline">
              Favorit
            </Link>
            <ThemeToggle />
          </nav>
          <MenuButton open={open} controlsId={id} btnRef={btn} onToggle={() => setOpen((o) => !o)} iconOnly className="shrink-0 lg:hidden" />
        </div>
        <MenuPanel open={open} id={id} panelRef={panel} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
