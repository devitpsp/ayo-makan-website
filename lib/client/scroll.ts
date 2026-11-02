/** Gulir ke area hasil; menghormati prefers-reduced-motion. */
export function scrollToResults() {
  const el = document.getElementById("hasil");
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/** Asal pencarian terakhir untuk event analytics (ketik / saran / hero). Hanya di memori. */
let lastSource: "ketik" | "saran" | "hero" = "ketik";
export const setSearchSource = (s: typeof lastSource) => {
  lastSource = s;
};
export const takeSearchSource = () => lastSource;
