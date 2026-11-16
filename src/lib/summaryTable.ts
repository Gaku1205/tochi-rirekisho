// AIの要約に渡す「事実の表」。町の記録をテキストにする。LLMにはこの表だけを渡す。
import { floodNote, floodValue, NO_DATA } from "./flood";
import { groundNote, groundValue } from "./ground";
import { priceNote, priceValue } from "./price";
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
  lines.push(`地盤: ${groundValue(p.ground)}。${groundNote(p.ground)}（出どころ: ${p.ground.source.name}）`);
  const priceText = p.price.manYen === null ? NO_DATA : `1平方メートルあたり${priceValue(p.price)}万円`;
  lines.push(`地価: ${priceText}。${priceNote(p.price)}（出どころ: ${p.price.source.name}）`);
  return lines.join("\n");
}
