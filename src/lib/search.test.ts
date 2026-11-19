import { describe, expect, it } from "vitest";
import { normalize, POINT_RANGE_M, searchAddress, searchPoint } from "./search";

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
  it("記録の無い丁目は、別の丁目に飛ばさず「見つからない」", () => {
    expect(searchAddress("大橋5丁目").kind).toBe("unknown");
    expect(searchAddress("福岡市南区大橋1丁目").kind).toBe("unknown");
  });
  it("違う区は「見つからない」、合う区なら見つかる", () => {
    expect(searchAddress("東区大橋2丁目").kind).toBe("unknown");
    expect(searchAddress("福岡市東区大橋2丁目").kind).toBe("unknown");
    const r = searchAddress("南区大橋2丁目");
    expect(r.kind === "found" && r.place.slug).toBe("ohashi-2");
  });
  it("丁目が無い町名だけは、記録が1つなら見つかる", () => {
    const r = searchAddress("大橋");
    expect(r.kind === "found" && r.place.slug).toBe("ohashi-2");
    const k = searchAddress("おおはし");
    expect(k.kind === "found" && k.place.slug).toBe("ohashi-2");
  });
  it("ほかの市は、区や丁目が合って見えても「範囲の外」", () => {
    expect(searchAddress("久留米市大橋2丁目").kind).toBe("outside");
    expect(searchAddress("東京都大橋2丁目").kind).toBe("outside");
  });
  it("記録の無い町は「見つからない」", () => {
    expect(searchAddress("福岡市南区大楠1丁目").kind).toBe("unknown");
    expect(searchAddress("").kind).toBe("unknown");
  });
});

describe("searchPoint", () => {
  it("町の真上は、その町が見つかる", () => {
    const r = searchPoint({ lat: 33.5557, lon: 130.4309 });
    expect(r.kind === "found" && r.place.slug).toBe("ohashi-2");
    expect(r.meters).toBeLessThan(1);
  });
  it("少し離れた地点は、近い町に結びつく", () => {
    // 北へ約 500m
    const r = searchPoint({ lat: 33.5557 + 0.0045, lon: 130.4309 });
    expect(r.kind).toBe("found");
    expect(r.meters).toBeGreaterThan(300);
    expect(r.meters).toBeLessThanOrEqual(POINT_RANGE_M);
  });
  it("福岡市の外は「範囲の外」", () => {
    expect(searchPoint({ lat: 35.68, lon: 139.76 }).kind).toBe("outside");
  });
  it("どの町からも 1,500m より遠い地点は「範囲の外」", () => {
    const r = searchPoint({ lat: 33.0, lon: 130.4309 });
    expect(r.kind).toBe("outside");
    expect(r.meters).toBeGreaterThan(POINT_RANGE_M);
  });
});
