// 入れた住所から、町を探す。福岡市の外や、記録の無い町は見つからない。
import { PLACES, type Place } from "./places";

export type SearchResult =
  | { kind: "found"; place: Place }
  | { kind: "outside"; query: string }
  | { kind: "unknown"; query: string };

const ZEN = "０１２３４５６７８９";
const KANJI = "〇一二三四五六七八九";

export function normalize(q: string): string {
  let s = q.normalize("NFKC").replace(/\s+/g, "");
  s = s.replace(/[０-９]/g, (c) => String(ZEN.indexOf(c)));
  // 「二丁目」→「2丁目」
  s = s.replace(/([〇一二三四五六七八九])丁目/g, (_, k: string) => `${KANJI.indexOf(k)}丁目`);
  s = s.replace(/(\d+)[-ー－](\d+.*)?$/, "$1丁目");
  return s.replace(/^福岡県/, "");
}

const OTHER_CITIES = ["北九州", "春日", "大野城", "糸島", "筑紫野", "那珂川市", "太宰府", "久留米", "東京", "大阪"];

export function searchAddress(raw: string): SearchResult {
  const q = normalize(raw);
  if (!q) return { kind: "unknown", query: raw };
  if (OTHER_CITIES.some((c) => q.includes(c))) return { kind: "outside", query: raw };
  const body = q.replace(/^福岡市/, "").replace(/^(東区|博多区|中央区|南区|城南区|早良区|西区)/, "");
  const hit =
    PLACES.find((p) => body.startsWith(p.town + p.block)) ??
    PLACES.find((p) => body === p.town || body.startsWith(p.kana)) ??
    PLACES.find((p) => body.startsWith(p.town) && !p.block);
  if (hit) return { kind: "found", place: hit };
  const sameTown = PLACES.find((p) => body.startsWith(p.town));
  if (sameTown) return { kind: "found", place: sameTown };
  return { kind: "unknown", query: raw };
}
