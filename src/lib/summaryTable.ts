// AIの要約に渡す「事実の表」。町の記録をテキストにする。LLMにはこの表だけを渡す。
import { floodNote, floodValue } from "./flood";
import { address, type Place } from "./places";

export function summaryTable(p: Place): string {
  const lines: string[] = [];
  lines.push(`場所: ${address(p)}（${p.near}）`);
  lines.push("");
  lines.push("年代ごとの土地の様子:");
  for (const e of p.eras) {
    lines.push(`- ${e.era}年 ${e.title}: ${e.text}`);
  }
  lines.push("");
  lines.push(`浸水の想定: ${floodValue(p.flood)}。${floodNote(p.flood)}（出どころ: ${p.flood.source.name}）`);
  lines.push(`地盤: ${p.ground.value}。${p.ground.note}`);
  lines.push(`地価: 1平方メートルあたり${p.price.manYen}万円、10年で${p.price.change10y}%の変化（${p.price.note}）`);
  return lines.join("\n");
}
