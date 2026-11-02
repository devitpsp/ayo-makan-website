import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { LIMITS, clientIp, enforceRateLimit } = await import("./ratelimit");

const req = (headers: Record<string, string>) => new Request("http://x/api", { headers });

describe("clientIp: urutan sumber", () => {
  it("memilih header platform Vercel (tidak bisa diisi klien) sebelum X-Forwarded-For", () => {
    expect(clientIp(req({ "x-vercel-forwarded-for": "1.1.1.1", "x-forwarded-for": "9.9.9.9, 2.2.2.2" }))).toBe("1.1.1.1");
  });
  it("lalu x-real-ip, lalu entri pertama X-Forwarded-For, lalu 'unknown'", () => {
    expect(clientIp(req({ "x-real-ip": "3.3.3.3", "x-forwarded-for": "9.9.9.9" }))).toBe("3.3.3.3");
    expect(clientIp(req({ "x-forwarded-for": " 4.4.4.4 , 5.5.5.5" }))).toBe("4.4.4.4");
    expect(clientIp(req({}))).toBe("unknown");
  });
});

describe("batas laju per IP (cadangan memori)", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("angka cukup longgar untuk Wi-Fi kampus bersama, tetap membatasi penyalahgunaan", () => {
    expect(LIMITS.search).toBeGreaterThanOrEqual(60);
    expect(LIMITS.details).toBeGreaterThanOrEqual(60);
    expect(LIMITS.photo).toBeGreaterThanOrEqual(240);
  });

  it("permintaan ke-(batas+1) ditolak RATE_LIMITED dengan Retry-After; batas pertama masih lolos", async () => {
    const r = req({ "x-real-ip": "10.0.0.1" });
    for (let i = 0; i < LIMITS.search; i++) await enforceRateLimit(r, "search");
    await expect(enforceRateLimit(r, "search")).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
    await expect(enforceRateLimit(r, "search")).rejects.toMatchObject({ retryAfterSec: expect.any(Number) });
  });

  it("IP berbeda dan cakupan berbeda dihitung terpisah", async () => {
    const a = req({ "x-real-ip": "10.0.0.2" });
    for (let i = 0; i < LIMITS.search; i++) await enforceRateLimit(a, "search");
    await expect(enforceRateLimit(a, "details")).resolves.toBeUndefined();
    await expect(enforceRateLimit(req({ "x-real-ip": "10.0.0.3" }), "search")).resolves.toBeUndefined();
  });

  it("X-Forwarded-For palsu tidak menghindari batas bila header platform ada", async () => {
    const hdr = (spoof: string) => req({ "x-vercel-forwarded-for": "10.0.0.4", "x-forwarded-for": spoof });
    for (let i = 0; i < LIMITS.search; i++) await enforceRateLimit(hdr(`203.0.113.${i}`), "search");
    await expect(enforceRateLimit(hdr("203.0.113.250"), "search")).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});
