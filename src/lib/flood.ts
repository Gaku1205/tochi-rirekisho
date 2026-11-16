// 浸水の想定。国土数値情報の洪水浸水想定区域を、町の地点で調べてJSONにしたものから作る。
import data from "../data/flood.json";

export type FloodSource = { name: string; version: string | null; retrievedAt: string | null };

/** depth は「0.5〜1.0m」などの区分、浸水なしは「なし」、確かめられなければ null */
export type Flood = { depth: string | null; river: string | null; source: FloodSource };

export const NO_DATA = "データなし";

const DEPTH_FEATURE: Record<string, number> = {
  なし: 0,
  "0.5m未満": 0.1,
  "0.5〜1.0m": 0.25,
  "0.5〜3.0m": 0.4,
  "1.0〜3.0m": 0.6,
  "3.0〜5.0m": 1,
  "5.0m以上": 1,
};

/** 深さの区分 → 0〜1（3m で 1）。null・知らない区分は null（比べない） */
export function floodFeature(depth: string | null): number | null {
  if (depth === null) return null;
  return depth in DEPTH_FEATURE ? DEPTH_FEATURE[depth] : null;
}

/** 画面・表に出す値の文字 */
export function floodValue(f: Flood): string {
  if (f.depth === null) return NO_DATA;
  return f.depth === "なし" ? "想定なし" : f.depth;
}

/** 欄の下の説明 */
export function floodNote(f: Flood): string {
  if (f.depth === null) return "国土数値情報の洪水浸水想定区域では、この町の値を確かめられていません。";
  const base = f.river ? `${f.river}があふれたときの想定（最大規模）。` : "洪水浸水想定区域（最大規模）。";
  return f.depth === "なし" ? "国土数値情報の洪水浸水想定区域の外。" : base;
}

type Entry = { slug: string; depth: string | null; river: string | null };

export function floodFor(slug: string, entries: Entry[] = data.places, source: FloodSource = data.source): Flood {
  const e = entries.find((x) => x.slug === slug);
  return { depth: e?.depth ?? null, river: e?.river ?? null, source };
}
