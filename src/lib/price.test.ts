import { describe, expect, it } from "vitest";
import data from "../data/price.json";
import { NO_DATA } from "./flood";
import { PLACES } from "./places";
import { priceFor, priceLine, priceNote, priceValue } from "./price";

const source = { name: "テスト", version: "v1", retrievedAt: "2026-01-01" };

describe("priceFor / 画面の文字", () => {
  it("値あり", () => {
    const p = priceFor("a", [{ slug: "a", manYen: 41.6, change10y: 38, note: "公示地点 2026年" }], source);
    expect(priceValue(p)).toBe("41.6");
    expect(priceLine(p)).toBe("1㎡あたり 41.6万円");
    expect(priceNote(p)).toContain("10年で 38% 上がった");
    expect(priceNote(p)).toContain("公示地点 2026年");
  });
  it("下がったときは下がったと出る", () => {
    const p = priceFor("a", [{ slug: "a", manYen: 10, change10y: -5, note: null }], source);
    expect(priceNote(p)).toContain("5% 下がった");
  });
  it("変化だけ null なら数字は出して変化の文は省く", () => {
    const p = priceFor("a", [{ slug: "a", manYen: 10, change10y: null, note: null }], source);
    expect(priceValue(p)).toBe("10.0");
    expect(priceNote(p)).not.toContain("10年");
  });
  it("null は データなし（0・空欄・NaN にならない）", () => {
    const p = priceFor("a", [{ slug: "a", manYen: null, change10y: null, note: null }], source);
    expect(priceValue(p)).toBe(NO_DATA);
    expect(priceLine(p)).toBe(NO_DATA);
    expect(priceNote(p)).toContain("確かめられていません");
  });
  it("知らない slug は データなし", () => {
    const p = priceFor("nowhere", [], source);
    expect(p.manYen).toBeNull();
    expect(priceValue(p)).toBe(NO_DATA);
  });
});

describe("price.json", () => {
  it("12の町すべてに行があり、出どころが書かれている", () => {
    expect(data.places.map((p) => p.slug).sort()).toEqual(PLACES.map((p) => p.slug).sort());
    expect(data.source.name).toContain("地価公示");
  });
});
