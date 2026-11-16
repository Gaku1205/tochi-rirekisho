// 似た土地を探す。昔の土地の使われ方・浸水・地盤・川の近さを並べた特徴の、重みつきの距離で近い順に。
import type { Features, Place } from "./places";

const WEIGHTS: Record<keyof Features, number> = {
  paddy: 1.4,
  forest: 1.2,
  town: 1.0,
  sand: 1.0,
  flood: 1.2,
  lowland: 1.0,
  river: 0.8,
  late: 0.6,
};

const KEYS = Object.keys(WEIGHTS) as (keyof Features)[];

/** 0〜1。1 が同じ。どちらかが null（データなし）の特徴は使わず、残りの特徴だけで比べる */
export function similarity(a: Features, b: Features): number {
  let sum = 0;
  let max = 0;
  for (const k of KEYS) {
    const x = a[k];
    const y = b[k];
    if (x === null || y === null) continue;
    sum += WEIGHTS[k] * (x - y) ** 2;
    max += WEIGHTS[k];
  }
  if (max === 0) return 0;
  return Math.round((1 - Math.sqrt(sum) / Math.sqrt(max)) * 100) / 100;
}

export function similarityWord(score: number): string {
  if (score >= 0.85) return "よく似ている";
  if (score >= 0.75) return "似ている";
  if (score >= 0.6) return "少し似ている";
  return "あまり似ていない";
}

/** いちばん効いた共通点を1つ、言葉で */
export function sharedTrait(a: Features, b: Features): string {
  const traits: { key: "paddy" | "forest" | "sand" | "town"; word: string }[] = [
    { key: "paddy", word: "昔は田んぼ" },
    { key: "forest", word: "昔は林の丘" },
    { key: "sand", word: "昔は砂丘・松原" },
    { key: "town", word: "昔から町" },
  ];
  const best = traits
    .map((t) => ({ ...t, v: Math.min(a[t.key], b[t.key]) }))
    .sort((x, y) => y.v - x.v)[0];
  const fa = a.flood;
  const fb = b.flood;
  const flood =
    fa === null || fb === null
      ? ""
      : fa > 0.15 && fb > 0.15
        ? "・浸水の想定あり"
        : fa === 0 && fb === 0
          ? "・浸水の想定なし"
          : "";
  return best.v > 0.3 ? `${best.word}${flood}` : `地盤が近い${flood}`;
}

export type SimilarPlace = { place: Place; score: number; word: string; trait: string };

export function findSimilar(target: Place, all: Place[], count = 3): SimilarPlace[] {
  return all
    .filter((p) => p.slug !== target.slug)
    .map((p) => {
      const score = similarity(target.features, p.features);
      return { place: p, score, word: similarityWord(score), trait: sharedTrait(target.features, p.features) };
    })
    .sort((a, b) => b.score - a.score || a.place.slug.localeCompare(b.place.slug))
    .slice(0, count);
}
