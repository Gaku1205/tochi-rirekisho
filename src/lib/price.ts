// 地価。国土交通省の地価公示を、町の地点の近くの公示地点で調べてJSONにしたものから作る。
import data from "../data/price.json";
import { NO_DATA } from "./flood";

export type PriceSource = { name: string; version: string | null; retrievedAt: string | null };

/** manYen は1㎡あたり万円。確かめられなければ null */
export type Price = { manYen: number | null; change10y: number | null; note: string | null; source: PriceSource };

/** 画面・表に出す数字の文字（小数1桁）。データなしは NO_DATA */
export function priceValue(p: Price): string {
  return p.manYen === null || !Number.isFinite(p.manYen) ? NO_DATA : p.manYen.toFixed(1);
}

/** シェア画像など1行で出す文字 */
export function priceLine(p: Price): string {
  return p.manYen === null || !Number.isFinite(p.manYen) ? NO_DATA : `1㎡あたり ${p.manYen.toFixed(1)}万円`;
}

/** 欄の下の説明 */
export function priceNote(p: Price): string {
  if (p.manYen === null || !Number.isFinite(p.manYen)) {
    return "国土交通省の地価公示では、この町の近くの値を確かめられていません。";
  }
  const where = p.note ? `（${p.note}）` : "";
  if (p.change10y === null || !Number.isFinite(p.change10y)) return `地価公示の値${where}。`;
  const dir = p.change10y >= 0 ? "上がった" : "下がった";
  return `10年で ${Math.abs(p.change10y)}% ${dir}${where}。`;
}

type Entry = { slug: string; manYen: number | null; change10y: number | null; note: string | null };

export function priceFor(slug: string, entries: Entry[] = data.places, source: PriceSource = data.source): Price {
  const e = entries.find((x) => x.slug === slug);
  return { manYen: e?.manYen ?? null, change10y: e?.change10y ?? null, note: e?.note ?? null, source };
}
