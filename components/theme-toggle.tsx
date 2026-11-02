"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/lib/client/theme";

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      className={`btn ${withLabel ? "" : "btn-square"}`}
      aria-label={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
    >
      <Icon size={22} weight="bold" aria-hidden="true" />
      {withLabel && <span>{dark ? "Tema terang" : "Tema gelap"}</span>}
    </button>
  );
}
