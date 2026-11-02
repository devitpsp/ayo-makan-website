"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { MenuButton, MenuPanel, useMenu } from "./menu";
import { ThemeToggle } from "./theme-toggle";

/**
 * Bilah atas (DESIGN v2 7.2): logo kiri, navigasi tengah (desktop), saklar tema kanan. HP: logo + MENU.
 * variant "hero": di atas latar oranye hero (tombol MENU putih tanpa garis).
 * variant "box": halaman selain beranda, di atas latar krem (tombol MENU bergaris).
 */
export function TopBar({ variant }: { variant: "hero" | "box" }) {
  const { open, setOpen, btn, panel, id } = useMenu();
  const hero = variant === "hero";
  const link =
    "inline-flex min-h-[44px] items-center px-3 font-semibold text-[var(--on-hero)] no-underline underline-offset-4 hover:underline";
  const linkBox = "inline-flex min-h-[44px] items-center px-3 font-semibold text-tinta no-underline underline-offset-4 hover:underline";
  const l = hero ? link : linkBox;

  return (
    <div className="relative">
      <div className="flex min-h-[64px] items-center justify-between gap-3 lg:min-h-[88px]">
        <Logo variant="full" className="h-14 shrink-0 lg:h-[72px]" />
        <nav aria-label="Menu utama" className="hidden flex-1 items-center justify-center gap-2 lg:flex">
          <Link href="/#hasil" className={l}>Cari</Link>
          <Link href="/favorit" className={l}>Favorit</Link>
          <Link href="/privasi" className={l}>Privasi</Link>
        </nav>
        <div className="hidden w-[132px] justify-end lg:flex">
          <ThemeToggle />
        </div>
        <MenuButton
          open={open}
          controlsId={id}
          btnRef={btn}
          onToggle={() => setOpen((o) => !o)}
          className={`lg:hidden ${hero ? "" : "!border-[var(--garis-keras)]"}`}
        />
      </div>
      <MenuPanel open={open} id={id} panelRef={panel} onClose={() => setOpen(false)} />
    </div>
  );
}
