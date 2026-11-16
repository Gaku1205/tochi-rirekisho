import { describe, expect, it } from "vitest";
import data from "../data/flood.json";
import { floodFeature, floodFor, floodNote, floodValue, NO_DATA } from "./flood";
import { PLACES } from "./places";
import { findSimilar, sharedTrait, similarity } from "./similar";
import { summaryTable } from "./summaryTable";

const source = { name: "テスト", version: "v1", retrievedAt: "2026-01-01" };

describe("floodFeature", () => {
  it("深さの区分を 0〜1 にする（3m で 1）", () => {
    expect(floodFeature("なし")).toBe(0);
    expect(floodFeature("0.5m未満")).toBe(0.1);
    expect(floodFeature("0.5〜1.0m")).toBe(0.25);
    expect(floodFeature("1.0〜3.0m")).toBe(0.6);
    expect(floodFeature("3.0〜5.0m")).toBe(1);
  });
  it("null と知らない区分は null", () => {
    expect(floodFeature(null)).toBeNull();
    expect(floodFeature("とても深い")).toBeNull();
  });
});

describe("floodFor / 画面の文字", () => {
  it("JSON に無い町は null（データなし）", () => {
    const f = floodFor("nowhere", [], source);
    expect(f.depth).toBeNull();
    expect(floodValue(f)).toBe(NO_DATA);
    expect(floodNote(f)).toContain("確かめられていません");
  });
  it("区分と川の名前から文字を作る", () => {
    const f = floodFor("a", [{ slug: "a", depth: "0.5〜1.0m", river: "那珂川" }], source);
    expect(floodValue(f)).toBe("0.5〜1.0m");
    expect(floodNote(f)).toContain("那珂川");
  });
  it("なし は想定なし", () => {
    const f = floodFor("a", [{ slug: "a", depth: "なし", river: null }], source);
    expect(floodValue(f)).toBe("想定なし");
  });
});

describe("flood.json", () => {
  it("12の町すべてに行があり、出どころが書かれている", () => {
    expect(data.places.map((p) => p.slug).sort()).toEqual(PLACES.map((p) => p.slug).sort());
    expect(data.source.name).toContain("国土数値情報");
  });
  it("入っている区分は知っている区分だけ", () => {
    for (const p of data.places) if (p.depth !== null) expect(floodFeature(p.depth)).not.toBeNull();
  });
});

describe("null の町の扱い", () => {
  const base = PLACES[0].features;
  const withFlood = { ...base, flood: 0.25 };
  const noFlood = { ...base, flood: null };
  it("似た土地の計算は他の特徴だけで比べる", () => {
    expect(similarity(noFlood, withFlood)).toBe(similarity(noFlood, noFlood));
    expect(similarity(noFlood, noFlood)).toBe(1);
  });
  it("共通点の言葉に浸水を足さない", () => {
    expect(sharedTrait(noFlood, withFlood)).not.toContain("浸水");
  });
  it("findSimilar が落ちない", () => {
    const r = findSimilar(PLACES[0], PLACES);
    expect(r).toHaveLength(3);
    for (const s of r) expect(Number.isFinite(s.score)).toBe(true);
  });
  it("AIの事実の表に「データなし」と出どころが出る", () => {
    const t = summaryTable({ ...PLACES[0], flood: floodFor("x", [], source) });
    expect(t).toContain(`浸水の想定: ${NO_DATA}`);
    expect(t).toContain("出どころ: テスト");
  });
});
