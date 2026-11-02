// Screenshot tiap slide hero. Pakai: BASE=... OUT=... node scripts/shots-hero.mjs
import { chromium } from "@playwright/test";
const BASE = process.env.BASE ?? "http://localhost:3101";
const OUT = process.env.OUT ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [name, w, h, theme] of [["m", 390, 844, "light"], ["d", 1440, 900, "light"], ["dd", 1440, 900, "dark"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  if (theme === "dark") await page.addInitScript(() => localStorage.setItem("am-theme", "dark"));
  await page.route("**/api/places/search*", (r) => r.fulfill({ json: { mode: "explore", places: [], nextPageToken: null, truncated: false } }));
  await page.goto(BASE, { waitUntil: "networkidle" });
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/hero-${name}-${i + 1}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, name === "m" ? 600 : 800) } });
    await page.getByRole("button", { name: "Menu berikutnya" }).click();
  }
  await ctx.close();
}
await browser.close();
