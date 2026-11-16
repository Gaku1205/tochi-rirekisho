import { describe, expect, it } from "vitest";
import { PLACES, placeBySlug } from "./places";
import { findSimilar, similarity, similarityWord } from "./similar";

describe("similarity", () => {
  it("同じ特徴なら 1", () => {
    const f = PLACES[0].features;
    expect(similarity(f, f)).toBe(1);
  });
  it("田んぼの低地どうしは、林の丘より似ている", () => {
    const ohashi = placeBySlug("ohashi-2")!.features;
    expect(similarity(ohashi, placeBySlug("iseri-3")!.features)).toBeGreaterThan(
      similarity(ohashi, placeBySlug("nagaoka-3")!.features),
    );
  });
});

describe("similarityWord", () => {
  it("数字を言葉にする", () => {
    expect(similarityWord(0.9)).toBe("よく似ている");
    expect(similarityWord(0.8)).toBe("似ている");
    expect(similarityWord(0.65)).toBe("少し似ている");
    expect(similarityWord(0.3)).toBe("あまり似ていない");
  });
});

describe("findSimilar", () => {
  it("自分を除いて、近い順に3件", () => {
    const list = findSimilar(placeBySlug("ohashi-2")!, PLACES);
    expect(list).toHaveLength(3);
    expect(list.map((s) => s.place.slug)).not.toContain("ohashi-2");
    expect(list[0].score).toBeGreaterThanOrEqual(list[1].score);
    expect(list[1].score).toBeGreaterThanOrEqual(list[2].score);
  });
});
