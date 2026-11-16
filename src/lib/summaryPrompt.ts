// AIの要約をLLMに頼むときの指示と入力。
import type { Place } from "./places";
import { summaryTable } from "./summaryTable";

export const SYSTEM_INSTRUCTION = [
  "あなたは、福岡市の土地の昔と災害リスクを説明する書き手です。",
  "利用者から渡される「事実の表」だけを根拠に、要約を書いてください。",
  "- 表に書かれていない事実・数字・固有名詞を足さない（表に無いことは書かない）。",
  "- 最初の1文で結論（その土地の昔と災害リスクのひとこと）を述べ、続けて根拠を1文で述べる。",
  "- 全部で2文、120字ほどにする。",
  "- 危なさを煽らず、淡々と書く。",
  "- 日本語で書く。前置き・見出し・箇条書き・記号の飾りは付けない。",
].join("\n");

export type SummaryPrompt = { system: string; user: string; table: string };

export function buildSummaryPrompt(p: Place): SummaryPrompt {
  const table = summaryTable(p);
  return {
    system: SYSTEM_INSTRUCTION,
    user: `次の事実の表から、要約を書いてください。\n\n${table}`,
    table,
  };
}
