"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

/**
 * Bottom sheet di atas <dialog>: Escape menutup, fokus terkunci di dalam, dan browser
 * mengembalikan fokus ke pemicu saat ditutup (PRD 10.10).
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 rounded-full bg-[var(--garis-keras)] opacity-40" />
      <div className="flex items-center justify-between gap-3 border-b-2 border-garis px-4 py-3">
        <h2 className="display text-2xl uppercase">{title}</h2>
        <button type="button" className="btn btn-square" onClick={onClose} aria-label="Tutup">
          <X size={22} weight="bold" aria-hidden="true" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}
