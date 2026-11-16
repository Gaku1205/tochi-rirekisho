// slug から要約を作る流れ：表 → LLM → 確認。だめなら place.summary に戻す。
import type { Llm } from "./llm";
import type { Place } from "./places";
import { checkSummary } from "./summaryCheck";
import { buildSummaryPrompt } from "./summaryPrompt";

export type SummaryResult = { summary: string; source: "llm" | "fallback" };

/** 同じ町の結果はプロセス内に覚える（再起動で消えてよい） */
export type SummaryCache = Map<string, SummaryResult>;

export async function makeSummary(p: Place, llm: Llm, cache?: SummaryCache): Promise<SummaryResult> {
  const hit = cache?.get(p.slug);
  if (hit) return hit;
  const fallback: SummaryResult = { summary: p.summary, source: "fallback" };
  const { system, user, table } = buildSummaryPrompt(p);
  let reply: string | null = null;
  try {
    reply = await llm(system, user);
  } catch {
    reply = null;
  }
  if (reply === null) return fallback;
  const checked = checkSummary(reply, table);
  if (!checked.ok) return fallback;
  const result: SummaryResult = { summary: checked.text, source: "llm" };
  cache?.set(p.slug, result);
  return result;
}
