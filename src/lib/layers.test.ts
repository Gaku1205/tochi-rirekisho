import { describe, expect, it } from "vitest";
import { ERA_INFO, ERAS, NOW_MAP, OLD_MAP, isBundled, tileUrl } from "./layers";

describe("年代の層", () => {
  it("年代は4つ（1926・1948・1975・2026）", () => {
    expect(ERAS).toEqual(["1926", "1948", "1975", "2026"]);
    expect(ERA_INFO["1926"].layer.kind).toBe("image");
  });
  it("古い地形図の図郭は、大橋（北緯33.56・東経130.42）を含む", () => {
    expect(OLD_MAP.topLeft.lat).toBeGreaterThan(33.56);
    expect(OLD_MAP.bottomRight.lat).toBeLessThan(33.56);
    expect(OLD_MAP.topLeft.lon).toBeLessThan(130.42);
    expect(OLD_MAP.bottomRight.lon).toBeGreaterThan(130.42);
  });
});

describe("tileUrl", () => {
  it("同梱のある層（gazo1・1975年）の大橋のまわりは public/tiles から読む", () => {
    const gazo1 = ERA_INFO["1975"].layer;
    if (gazo1.kind !== "tiles") throw new Error("1975年は地理院タイルのはず");
    expect(isBundled("gazo1", 15, 28255, 13137)).toBe(true);
    expect(tileUrl(gazo1, 15, 28255, 13137)).toBe("/tiles/gazo1/15/28255/13137.jpg");
    expect(tileUrl(gazo1, 16, 56509, 26280)).toBe("/tiles/gazo1/16/56509/26280.jpg");
  });
  it("同梱のある層でも、同梱の範囲の外は地理院から読む", () => {
    const gazo1 = ERA_INFO["1975"].layer;
    if (gazo1.kind !== "tiles") throw new Error("1975年は地理院タイルのはず");
    expect(tileUrl(gazo1, 15, 28200, 13137)).toBe(
      "https://cyberjapandata.gsi.go.jp/xyz/gazo1/15/28200/13137.jpg",
    );
    // z16 の x=56511 以降は public/tiles に無い
    expect(tileUrl(gazo1, 16, 56511, 26275)).toBe(
      "https://cyberjapandata.gsi.go.jp/xyz/gazo1/16/56511/26275.jpg",
    );
  });
  it("同梱が無い層（1948年・いまの地図）は、大橋のまわりでも /tiles を返さない", () => {
    const ort = ERA_INFO["1948"].layer;
    if (ort.kind !== "tiles") throw new Error("1948年は地理院タイルのはず");
    expect(isBundled("ort_USA10", 15, 28255, 13137)).toBe(false);
    expect(tileUrl(ort, 15, 28255, 13137)).toBe(
      "https://cyberjapandata.gsi.go.jp/xyz/ort_USA10/15/28255/13137.png",
    );
    expect(tileUrl(ort, 16, 56510, 26275)).toBe(
      "https://cyberjapandata.gsi.go.jp/xyz/ort_USA10/16/56510/26275.png",
    );
    expect(tileUrl(NOW_MAP, 15, 28255, 13137)).toBe(
      "https://cyberjapandata.gsi.go.jp/xyz/std/15/28255/13137.png",
    );
  });
});
