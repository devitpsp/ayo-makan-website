"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { DeviceMobile, ShareNetwork, X } from "@phosphor-icons/react";
import { ev } from "@/lib/client/analytics";
import { readJson, writeJson } from "@/lib/client/local-store";
import { BottomSheet } from "./bottom-sheet";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISITS_KEY = "am-visits";
const DISMISS_KEY = "am-install-dismissed";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const CHANGE = "am-install-change";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function iosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

// Syarat tampil: kunjungan kedua atau lebih, belum ditutup dalam 14 hari, belum terpasang (PRD US-13).
function eligibleNow(): boolean {
  const visits = readJson<number>(VISITS_KEY, 0);
  const dismissedAt = readJson<number>(DISMISS_KEY, 0);
  const snoozed = dismissedAt > 0 && Date.now() - dismissedAt < SNOOZE_MS;
  return visits >= 2 && !snoozed && !isStandalone();
}

const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGE, cb);
  return () => window.removeEventListener(CHANGE, cb);
};
const noopSubscribe = () => () => {};

/** Mendaftarkan service worker dan menampilkan ajakan pasang setelah kunjungan kedua (PRD F-13, US-13). */
export function PwaClient() {
  const pathname = usePathname();
  const eligible = useSyncExternalStore(subscribe, eligibleNow, () => false);
  const ios = useSyncExternalStore(noopSubscribe, iosSafari, () => false);
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }

    // Hitung kunjungan sekali per sesi, lalu beri tahu store agar syarat tampil dihitung ulang.
    try {
      if (!window.sessionStorage.getItem("am-counted")) {
        window.sessionStorage.setItem("am-counted", "1");
        writeJson(VISITS_KEY, readJson<number>(VISITS_KEY, 0) + 1);
        window.dispatchEvent(new Event(CHANGE));
      }
    } catch {
      /* sessionStorage diblokir: ajakan tidak ditampilkan */
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      ev("pwa_install", { platform: iosSafari() ? "ios" : "chromium" });
      setDeferred(null);
      writeJson(DISMISS_KEY, Date.now());
      window.dispatchEvent(new Event(CHANGE));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onHome = pathname === "/" || pathname === "/favorit";
  if (!eligible || !onHome || (!deferred && !ios)) return null;

  const dismiss = () => {
    writeJson(DISMISS_KEY, Date.now());
    window.dispatchEvent(new Event(CHANGE));
  };

  return (
    <>
      <div
        role="region"
        aria-label="Pasang Ayo Makan"
        className="card-ink anim-menu fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center gap-3 p-3"
      >
        <DeviceMobile size={28} weight="bold" aria-hidden="true" className="shrink-0" />
        <p className="flex-1 text-sm font-semibold">Pasang Ayo Makan di HP</p>
        <button
          type="button"
          className="btn btn-primary shrink-0"
          onClick={async () => {
            if (deferred) {
              await deferred.prompt();
              const choice = await deferred.userChoice;
              if (choice.outcome === "accepted") ev("pwa_install", { platform: "chromium" });
              setDeferred(null);
              dismiss();
            } else {
              setGuide(true);
            }
          }}
        >
          {deferred ? "Pasang di HP" : "Cara pasang"}
        </button>
        <button type="button" className="btn btn-square shrink-0 !shadow-none" aria-label="Tutup ajakan pasang" onClick={dismiss}>
          <X size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <BottomSheet open={guide} onClose={() => setGuide(false)} title="Pasang di iPhone">
        <ol className="list-decimal space-y-3 pl-5">
          <li className="pl-1">
            Ketuk tombol Bagikan <ShareNetwork size={18} weight="bold" aria-hidden="true" className="inline" /> di bilah bawah Safari.
          </li>
          <li className="pl-1">Pilih &ldquo;Tambah ke Layar Utama&rdquo;.</li>
          <li className="pl-1">Ketuk &ldquo;Tambah&rdquo;. Ayo Makan muncul di layar utama.</li>
        </ol>
      </BottomSheet>
    </>
  );
}
