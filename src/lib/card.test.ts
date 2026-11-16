import { describe, expect, it } from "vitest";
import { sheetCrop, wrapText } from "./card";
import { OLD_MAP } from "./layers";

describe("wrapText", () => {
  const measure = (s: string) => [...s].length * 10;
  it("幅に収まるように折り返す", () => {
    expect(wrapText("あいうえおかきくけこ", 50, measure)).toEqual(["あいうえお", "かきくけこ"]);
  });
  it("句読点を行頭に置かない", () => {
    expect(wrapText("あいうえお。かきく", 50, measure)).toEqual(["あいうえお。", "かきく"]);
  });
});

describe("sheetCrop", () => {
  it("切り抜きは画像の中に収まる", () => {
    const c = sheetCrop(OLD_MAP, { lat: 33.5557, lon: 130.4309 }, { w: 1080, h: 2160 }, 0.7);
    expect(c.sx).toBeGreaterThanOrEqual(0);
    expect(c.sy).toBeGreaterThanOrEqual(0);
    expect(c.sx + c.sw).toBeLessThanOrEqual(OLD_MAP.width);
    expect(c.sy + c.sh).toBeLessThanOrEqual(OLD_MAP.height);
  });
});
