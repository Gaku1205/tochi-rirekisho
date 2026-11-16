// LLMの返事を確かめる。2文を超える・長すぎる・空・表に無い数字を含む返事は不合格。
export const MAX_SENTENCES = 2;
export const MAX_LENGTH = 180;

export type CheckResult = { ok: true; text: string } | { ok: false; reason: string };

function toHalfWidth(s: string): string {
  return s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

function numbersIn(s: string): string[] {
  return toHalfWidth(s).match(/[0-9]+/g) ?? [];
}

function countSentences(s: string): number {
  return s.split(/[。！？!?\n]/).filter((x) => x.trim().length > 0).length;
}

export function checkSummary(reply: string, table: string): CheckResult {
  const text = reply.trim();
  if (text === "") return { ok: false, reason: "empty" };
  if (text.length > MAX_LENGTH) return { ok: false, reason: "too-long" };
  if (countSentences(text) > MAX_SENTENCES) return { ok: false, reason: "too-many-sentences" };
  const known = new Set(numbersIn(table));
  if (numbersIn(text).some((n) => !known.has(n))) return { ok: false, reason: "unknown-number" };
  return { ok: true, text };
}
