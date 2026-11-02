"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { List, X } from "@phosphor-icons/react";
import { ThemeToggle } from "./theme-toggle";

/** Buka/tutup panel MENU: Escape dan ketuk di luar menutup, fokus kembali ke tombol (DESIGN 8, 11). */
export function useMenu() {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return { open, setOpen, btn, panel, id };
}

export function MenuButton({
  open,
  controlsId,
  btnRef,
  onToggle,
  iconOnly = false,
  className = "",
}: {
  open: boolean;
  controlsId: string;
  btnRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
  iconOnly?: boolean;
  className?: string;
}) {
  const Icon = open ? X : List;
  return (
    <button
      ref={btnRef}
      type="button"
      className={`btn btn-telur ${iconOnly ? "btn-square" : ""} ${className}`}
      aria-expanded={open}
      aria-controls={controlsId}
      aria-label={iconOnly ? "Menu" : undefined}
      onClick={onToggle}
    >
      <Icon size={20} weight="bold" aria-hidden="true" />
      {!iconOnly && <span>Menu</span>}
    </button>
  );
}

/** Panel turun di bawah bilah atas: kartu putih berbayangan lembut, item 52px (DESIGN v2 bagian 8). */
export function MenuPanel({
  open,
  id,
  panelRef,
  onClose,
}: {
  open: boolean;
  id: string;
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  if (!open) return null;
  const item = "flex min-h-[52px] items-center px-3 text-[17px] font-semibold text-tinta no-underline";
  return (
    <div
      ref={panelRef}
      id={id}
      className="anim-menu panel-ink absolute inset-x-0 top-full z-40 mt-2 rounded-2xl bg-surface p-2 text-tinta lg:hidden"
    >
      <ul className="divide-y divide-garis">
        <li>
          <Link href="/favorit" onClick={onClose} className={item}>
            Favorit
          </Link>
        </li>
        <li>
          <Link href="/privasi" onClick={onClose} className={item}>
            Privasi
          </Link>
        </li>
        <li className="py-2">
          <ThemeToggle withLabel />
        </li>
      </ul>
    </div>
  );
}
