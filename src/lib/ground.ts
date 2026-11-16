// 地盤。国土地理院の土地条件図の地形分類を、町の地点で調べてJSONにしたものから作る。
import data from "../data/ground.json";
import { NO_DATA } from "./flood";

export type GroundSource = { name: string; version: string | null; retrievedAt: string | null };

/** value は土地条件図の地形分類の名前。確かめられなければ null */
export type Ground = { value: string | null; note: string | null; source: GroundSource };

/** 地形分類 → 低い土地か（低地 1・台地 0.4・山地や丘陵 0）。知らない分類・null は null（手書きの値を使う） */
export function lowlandFeature(value: string | null): number | null {
  if (value === null) return null;
  if (/山地|丘陵|砂丘/.test(value)) return 0;
  if (/台地|段丘|砂州|砂堆|礫堆/.test(value)) return 0.4;
  if (/低地|平野|氾濫原|三角州|湿地|旧河道|埋立|干拓|盛土|自然堤防|扇状地/.test(value)) return 1;
  return null;
}

/** 画面・表に出す値の文字 */
export function groundValue(g: Ground): string {
  return g.value === null ? NO_DATA : g.value;
}

/** 欄の下の説明 */
export function groundNote(g: Ground): string {
  if (g.value === null) return "国土地理院の土地条件図では、この町の値を確かめられていません。";
  return g.note ?? "国土地理院の土地条件図の地形分類。";
}

type Entry = { slug: string; value: string | null; note: string | null };

export function groundFor(slug: string, entries: Entry[] = data.places, source: GroundSource = data.source): Ground {
  const e = entries.find((x) => x.slug === slug);
  return { value: e?.value ?? null, note: e?.value ? (e.note ?? null) : null, source };
}
