// 入れた住所から、町を探す。福岡市の外や、記録の無い町は見つからない。
import { distanceMeters, type LatLon } from "./geo";
import { PLACES, type Place } from "./places";

/** 地図で選んだ地点を、記録のある町に結びつける最大の距離（m） */
export const POINT_RANGE_M = 1500;

export type PointResult =
  | { kind: "found"; place: Place; meters: number }
  | { kind: "outside"; meters: number };

/** 緯度経度から、いちばん近い記録のある町を探す。POINT_RANGE_M を超えたら範囲の外 */
export function searchPoint(at: LatLon): PointResult {
  let best = PLACES[0];
  let meters = distanceMeters(at, best.at);
  for (const p of PLACES.slice(1)) {
    const d = distanceMeters(at, p.at);
    if (d < meters) {
      best = p;
      meters = d;
    }
  }
  return meters <= POINT_RANGE_M ? { kind: "found", place: best, meters } : { kind: "outside", meters };
}

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
  const afterCity = q.replace(/^福岡市/, "");
  const wardMatch = afterCity.match(/^(東区|博多区|中央区|南区|城南区|早良区|西区)/);
  const ward = wardMatch ? wardMatch[1] : null;
  const body = ward ? afterCity.slice(ward.length) : afterCity;

  // 町名（または読み）で始まる記録のうち、丁目の決まりに合うものを探す（docs/spec.md「住所の一致の決まり」）
  for (const p of PLACES) {
    const prefix = body.startsWith(p.town) ? p.town : body.startsWith(p.kana) ? p.kana : null;
    if (!prefix) continue;
    if (ward && ward !== p.ward) continue;
    const chome = body.slice(prefix.length).match(/^(\d+)丁目/);
    if (chome) {
      if (`${chome[1]}丁目` === p.block) return { kind: "found", place: p };
    } else if (PLACES.filter((o) => o.town === p.town).length === 1) {
      return { kind: "found", place: p };
    }
  }
  return { kind: "unknown", query: raw };
}
