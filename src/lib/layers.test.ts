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
  it("大橋のまわりは public/tiles から読む", () => {
    expect(isBundled(15, 28255, 13137)).toBe(true);
    expect(tileUrl(NOW_MAP, 15, 28255, 13137)).toBe("/tiles/std/15/28255/13137.webp");
  });
  it("範囲の外は地理院タイルから読む", () => {
    expect(tileUrl(NOW_MAP, 15, 28200, 13137)).toBe(
      "https://cyberjapandata.gsi.go.jp/xyz/std/15/28200/13137.png",
    );
  });
});
