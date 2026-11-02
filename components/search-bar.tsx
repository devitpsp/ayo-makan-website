"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useSearchState } from "@/lib/client/search-state";
import { useRecentSearches } from "@/lib/client/recent-searches";
import { scrollToResults, setSearchSource } from "@/lib/client/scroll";

// Tiap pencarian kata kunci adalah satu panggilan Text Search berbayar. Pencarian otomatis menunggu jeda 700 ms
// dan minimal 3 huruf; Enter tetap mencari langsung mulai 2 huruf (PRD F-02, disesuaikan atas keputusan owner).
const DEBOUNCE_MS = 700;
const AUTO_MIN = 3;

/**
 * Kolom cari (PRD F-02): debounce 700 ms dan minimal 3 huruf untuk otomatis, maksimal 60, Enter langsung mencari (2+ huruf),
 * tombol hapus kembali ke mode jelajah. Terikat ke ?q= di URL, jadi dua kolom (hero + header melekat) selalu sinkron.
 */
export function SearchBar({
  id,
  size = "lg",
  scrollOnSubmit = false,
  prefill,
}: {
  id: string;
  size?: "lg" | "sm";
  scrollOnSubmit?: boolean;
  /** Kata kunci slide hero aktif: kolom mengikutinya sebagai isian (tanpa mencari) saat slide berganti. */
  prefill?: string;
}) {
  const { state, set } = useSearchState();
  const { add: addRecent } = useRecentSearches();
  const [draft, setDraft] = useState(state.q);
  const [prevQ, setPrevQ] = useState(state.q);
  // true hanya bila pengguna sendiri yang mengetik. Isian dari slide atau URL tidak memicu pencarian otomatis.
  const [userTyped, setUserTyped] = useState(false);
  const [prevPrefill, setPrevPrefill] = useState(prefill);
  const input = useRef<HTMLInputElement>(null);

  // Sinkron dari URL (mis. tombol slide hero atau chip saran) tanpa effect.
  if (state.q !== prevQ) {
    setPrevQ(state.q);
    setDraft(state.q);
    setUserTyped(false);
  }

  // Slide hero berganti: kolom ikut kata kunci slide agar sama dengan tombol "Cari ... di sekitar".
  // Hanya sebagai isian: tidak mencari (berbayar) dan tidak menimpa ketikan pengguna yang belum dikirim.
  if (prefill !== prevPrefill) {
    setPrevPrefill(prefill);
    if (prefill !== undefined && !userTyped) setDraft(prefill);
  }

  useEffect(() => {
    if (!userTyped) return;
    const v = draft.trim();
    if (v === state.q) return;
    if (v.length > 0 && v.length < AUTO_MIN) return; // 1-2 huruf: tunggu Enter
    const t = setTimeout(() => {
      setSearchSource("ketik");
      // Riwayat hanya diisi oleh aksi eksplisit (Enter, saran, tombol hero), bukan jeda mengetik:
      // kalau tidak, "se", "seb", "sebl" ikut tersimpan dan mendesak pencarian sungguhan keluar dari 5 slot.
      set({ q: v });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft, userTyped, state.q, set]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = draft.trim();
    if (v.length === 1) return;
    setSearchSource("ketik");
    if (v.length >= 2) addRecent(v);
    set({ q: v }, { push: true });
    if (scrollOnSubmit) scrollToResults();
  }

  const h = size === "lg" ? "min-h-[52px]" : "min-h-[44px]";
  return (
    <form role="search" onSubmit={submit} className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Cari makanan atau minuman
      </label>
      <MagnifyingGlass
        size={22}
        weight="bold"
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-redup"
      />
      <input
        ref={input}
        id={id}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={60}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setUserTyped(true);
        }}
        onFocus={(e) => {
          // Isian dari slide: pilih semua supaya mengetik langsung menggantinya.
          if (!userTyped && prefill && draft === prefill) e.currentTarget.select();
        }}
        placeholder="Cari seblak, rames, mie ayam..."
        className={`field ${h} pl-11 pr-12`}
      />
      {draft && (
        <button
          type="button"
          aria-label="Hapus kata kunci"
          className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-[10px] text-tinta"
          onClick={() => {
            setDraft("");
            set({ q: "" });
            input.current?.focus();
          }}
        >
          <X size={20} weight="bold" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
