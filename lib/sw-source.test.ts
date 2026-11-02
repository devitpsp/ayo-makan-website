import { Script } from "node:vm";
import { describe, expect, it } from "vitest";
import { swSource } from "./sw-source";

describe("swSource", () => {
  it("menanam versi build di nama cache", () => {
    expect(swSource("abc123")).toContain('const VERSION = "am-shell-abc123";');
    expect(swSource("def456")).not.toContain("abc123");
  });
  it("sintaks JavaScript valid (regex dan escape utuh)", () => {
    expect(() => new Script(swSource("x"))).not.toThrow();
    expect(swSource("x")).toContain('/(?:href|src)="(\\/_next\\/static\\/[^"]+)"/g'.replace(/\\\\/g, "\\"));
  });
  it("API dan lintas origin tidak pernah di-cache (kebijakan Places API)", () => {
    const s = swSource("x");
    expect(s).toContain('url.pathname.startsWith("/api/")');
    expect(s).toContain("url.origin !== self.location.origin");
  });
});
