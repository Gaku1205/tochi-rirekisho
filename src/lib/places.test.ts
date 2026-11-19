import { describe, expect, it } from "vitest";
import { PLACES } from "./places";

// 要約は昔の土地の様子だけを書く。浸水・地盤の安全さを言い切る言葉は入れない（docs/spec.md「AIの要約」）
const RISK_WORDS = [
  "浸水",
  "水に浸か",
  "水害",
  "冠水",
  "安全",
  "心配",
  "災害",
  "高い土地",
  "地盤",
];

describe("町の要約（summary）", () => {
  it.each(PLACES.map((p) => [p.slug, p.summary] as const))("%s に災害リスクの言い切りが無い", (_slug, summary) => {
    for (const word of RISK_WORDS) {
      expect(summary, `「${word}」が要約に入っている`).not.toContain(word);
    }
  });

  it("12の町すべてに要約がある", () => {
    expect(PLACES).toHaveLength(12);
    for (const p of PLACES) {
      expect(p.summary.length).toBeGreaterThan(0);
    }
  });
});
