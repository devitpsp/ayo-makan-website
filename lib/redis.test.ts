import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const KEYS = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN"];

async function load() {
  vi.resetModules();
  return (await import("./redis")).redisCredentials;
}

describe("redisCredentials: nama variabel Upstash dan Vercel Marketplace", () => {
  afterEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  it("memakai UPSTASH_REDIS_REST_* bila ada", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://a.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tok-a";
    expect(await (await load())()).toEqual({ url: "https://a.upstash.io", token: "tok-a" });
  });

  it("menerima KV_REST_API_* yang disuntikkan Vercel saat Upstash dipasang dari Marketplace", async () => {
    process.env.KV_REST_API_URL = "https://b.upstash.io";
    process.env.KV_REST_API_TOKEN = "tok-b";
    expect(await (await load())()).toEqual({ url: "https://b.upstash.io", token: "tok-b" });
  });

  it("UPSTASH_REDIS_REST_* didahulukan bila keduanya ada", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://a.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tok-a";
    process.env.KV_REST_API_URL = "https://b.upstash.io";
    process.env.KV_REST_API_TOKEN = "tok-b";
    expect((await (await load())())?.url).toBe("https://a.upstash.io");
  });

  it("URL tanpa token (atau sebaliknya) dianggap belum dikonfigurasi", async () => {
    process.env.KV_REST_API_URL = "https://b.upstash.io";
    expect(await (await load())()).toBeNull();
  });

  it("tanpa variabel apa pun: null (dev memakai penghitung memori, production gagal tertutup)", async () => {
    expect(await (await load())()).toBeNull();
  });
});
