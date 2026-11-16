import { describe, expect, it } from "vitest";
import data from "../data/ground.json";
import { NO_DATA } from "./flood";
import { groundFor, groundNote, groundValue, lowlandFeature } from "./ground";
import { PLACES } from "./places";

const source = { name: "テスト", version: "v1", retrievedAt: "2026-01-01" };

describe("lowlandFeature", () => {
  it("分類から低い土地かを作る", () => {
    expect(lowlandFeature("谷底平野・氾濫原")).toBe(1);
    expect(lowlandFeature("埋立地")).toBe(1);
    expect(lowlandFeature("台地・段丘")).toBe(0.4);
    expect(lowlandFeature("丘陵")).toBe(0);
  });
  it("null と知らない分類は null", () => {
    expect(lowlandFeature(null)).toBeNull();
    expect(lowlandFeature("よくわからない")).toBeNull();
  });
});

describe("groundFor / 画面の文字", () => {
  it("値あり", () => {
    const g = groundFor("a", [{ slug: "a", value: "台地・段丘", note: "土地条件図" }], source);
    expect(groundValue(g)).toBe("台地・段丘");
    expect(groundNote(g)).toBe("土地条件図");
  });
  it("null は データなし", () => {
    const g = groundFor("a", [{ slug: "a", value: null, note: null }], source);
    expect(groundValue(g)).toBe(NO_DATA);
    expect(groundNote(g)).toContain("確かめられていません");
  });
  it("知らない slug は データなし", () => {
    const g = groundFor("nowhere", [], source);
    expect(g.value).toBeNull();
    expect(groundValue(g)).toBe(NO_DATA);
  });
});

describe("ground.json", () => {
  it("12の町すべてに行があり、出どころが書かれている", () => {
    expect(data.places.map((p) => p.slug).sort()).toEqual(PLACES.map((p) => p.slug).sort());
    expect(data.source.name).toContain("土地条件図");
  });
  it("null の町は手書きの lowland のまま", () => {
    for (const p of PLACES) if (p.ground.value === null) expect(p.features.lowland).toBeGreaterThanOrEqual(0);
  });
});
