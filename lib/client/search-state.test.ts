import { describe, expect, it } from "vitest";
import { parseState, serializeState } from "./search-state";

const sp = (q: string) => new URLSearchParams(q);

describe("parseState", () => {
  it("memangkas spasi di kata kunci (selaras dengan validasi server)", () => {
    expect(parseState(sp("q=%20a")).q).toBe("a");
    expect(parseState(sp("q=%20%20seblak%20")).q).toBe("seblak");
  });
  it("default dan nilai tidak valid jatuh ke default", () => {
    const s = parseState(sp("cat=ngawur&r=1234&rt=9&urut=x"));
    expect(s).toMatchObject({ q: "", cat: "makanan", radius: 1000, minRating: 4, sort: "cocok" });
  });
  it("serialize hanya nilai non-default dan bisa dibaca balik", () => {
    const s = parseState(sp("q=bakso&cat=minuman&r=2000&buka=1&murah=1&urut=teruji"));
    expect(parseState(sp(serializeState(s).slice(1)))).toEqual(s);
    expect(serializeState(parseState(sp("")))).toBe("");
  });
});
