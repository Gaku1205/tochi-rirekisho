import { describe, expect, it } from "vitest";
import { normalize, searchAddress } from "./search";

describe("normalize", () => {
  it("全角の数字と漢数字の丁目をそろえる", () => {
    expect(normalize("福岡市南区大橋２丁目")).toBe("福岡市南区大橋2丁目");
    expect(normalize("大橋二丁目")).toBe("大橋2丁目");
    expect(normalize("福岡県福岡市南区大橋2-3-1")).toBe("福岡市南区大橋2丁目");
  });
});

describe("searchAddress", () => {
  it("区を付けても付けなくても見つかる", () => {
    const a = searchAddress("福岡市南区大橋2丁目");
    const b = searchAddress("大橋2丁目");
    expect(a.kind === "found" && a.place.slug).toBe("ohashi-2");
    expect(b.kind === "found" && b.place.slug).toBe("ohashi-2");
  });
  it("福岡市の外は「範囲の外」", () => {
    expect(searchAddress("春日市須玖北").kind).toBe("outside");
  });
  it("記録の無い町は「見つからない」", () => {
    expect(searchAddress("福岡市南区大楠1丁目").kind).toBe("unknown");
    expect(searchAddress("").kind).toBe("unknown");
  });
});
