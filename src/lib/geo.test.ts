import { describe, expect, it } from "vitest";
import { bearingName, distanceMeters, project, tokyoToWgs, unproject } from "./geo";

describe("project / unproject", () => {
  it("大橋のあたりは、ズーム15でタイル (28255, 13137) に入る", () => {
    const p = project({ lat: 33.5605, lon: 130.4228 }, 15);
    expect(Math.floor(p.x / 256)).toBe(28255);
    expect(Math.floor(p.y / 256)).toBe(13137);
  });
  it("行って戻ると同じ場所になる", () => {
    const back = unproject(project({ lat: 33.59, lon: 130.4 }, 16), 16);
    expect(back.lat).toBeCloseTo(33.59, 8);
    expect(back.lon).toBeCloseTo(130.4, 8);
  });
});

describe("tokyoToWgs", () => {
  it("福岡では、北へ約12秒・西へ約8秒ずれる", () => {
    const w = tokyoToWgs({ lat: 33.58, lon: 130.38 });
    expect((w.lat - 33.58) * 3600).toBeGreaterThan(10);
    expect((w.lat - 33.58) * 3600).toBeLessThan(13);
    expect((w.lon - 130.38) * 3600).toBeLessThan(-7);
    expect((w.lon - 130.38) * 3600).toBeGreaterThan(-10);
  });
});

describe("distanceMeters / bearingName", () => {
  it("経度0.01度は福岡で約930m", () => {
    const d = distanceMeters({ lat: 33.56, lon: 130.42 }, { lat: 33.56, lon: 130.43 });
    expect(d).toBeGreaterThan(900);
    expect(d).toBeLessThan(960);
  });
  it("東にある所は「東」", () => {
    expect(bearingName({ lat: 33.56, lon: 130.42 }, { lat: 33.56, lon: 130.43 })).toBe("東");
  });
});
