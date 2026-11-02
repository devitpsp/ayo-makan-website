import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { googleFetch } = await import("./client");

const REQ = { method: "POST" as const, path: "places:searchText", body: { textQuery: "x" } };
const ok = () => new Response(JSON.stringify({ places: [] }), { status: 200 });
const err = (status: number) => new Response(JSON.stringify({ error: { status: "X" } }), { status });

describe("googleFetch: kebijakan retry (PRD 11)", () => {
  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("5xx lalu sukses: diulang satu kali", async () => {
    const f = vi.fn().mockResolvedValueOnce(err(503)).mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", f);
    await expect(googleFetch(REQ)).resolves.toEqual({ places: [] });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("timeout atau jaringan: TIDAK diulang (Google bisa sudah menagih permintaan pertama)", async () => {
    const f = vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    vi.stubGlobal("fetch", f);
    await expect(googleFetch(REQ)).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("4xx: tidak diulang dan dipetakan (404 NOT_FOUND, 429 UPSTREAM_QUOTA)", async () => {
    for (const [status, code] of [[404, "NOT_FOUND"], [429, "UPSTREAM_QUOTA"], [400, "UPSTREAM_ERROR"]] as const) {
      const f = vi.fn().mockResolvedValue(err(status));
      vi.stubGlobal("fetch", f);
      await expect(googleFetch(REQ)).rejects.toMatchObject({ code });
      expect(f).toHaveBeenCalledTimes(1);
    }
  });

  it("5xx dua kali: berhenti setelah satu retry", async () => {
    const f = vi.fn().mockResolvedValue(err(500));
    vi.stubGlobal("fetch", f);
    await expect(googleFetch(REQ)).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("tanpa key: UPSTREAM_ERROR tanpa memanggil Google", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    await expect(googleFetch(REQ)).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
    expect(f).not.toHaveBeenCalled();
  });
});
