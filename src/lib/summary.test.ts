import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/summary/route";
import { floodValue } from "./flood";
import { placeBySlug, DEFAULT_PLACE } from "./places";
import { checkSummary } from "./summaryCheck";
import { buildSummaryPrompt } from "./summaryPrompt";
import { makeSummary } from "./summaryService";
import { summaryTable } from "./summaryTable";

const ohashi = DEFAULT_PLACE;

describe("summaryTable", () => {
  it("年代・浸水・地盤・地価が表に入る", () => {
    const t = summaryTable(ohashi);
    expect(t).toContain("福岡市南区大橋2丁目");
    for (const e of ohashi.eras) expect(t).toContain(`${e.era}年 ${e.title}`);
    expect(t).toContain(`浸水の想定: ${floodValue(ohashi.flood)}`);
    expect(t).toContain(ohashi.ground.value);
    expect(t).toContain("41.6万円");
  });
});

describe("buildSummaryPrompt", () => {
  it("指示に、表に無いことは書かない・結論を先に・2文が入り、入力は表だけ", () => {
    const p = buildSummaryPrompt(ohashi);
    expect(p.system).toContain("表に無いことは書かない");
    expect(p.system).toContain("最初の1文で結論");
    expect(p.system).toContain("2文");
    expect(p.user).toContain(p.table);
  });
});

describe("checkSummary", () => {
  const table = summaryTable(ohashi);
  it("合格", () => {
    expect(checkSummary("昔は川ぞいの田んぼでした。1975年に住宅地になっています。", table).ok).toBe(true);
  });
  it("空は不合格", () => {
    expect(checkSummary("  ", table).ok).toBe(false);
  });
  it("3文は不合格", () => {
    expect(checkSummary("一つ。二つ。三つ。", table).ok).toBe(false);
  });
  it("長すぎは不合格", () => {
    expect(checkSummary("あ".repeat(300) + "。", table).ok).toBe(false);
  });
  it("表に無い数字は不合格（全角も）", () => {
    expect(checkSummary("1888年は田んぼでした。", table).ok).toBe(false);
    expect(checkSummary("１８８８年は田んぼでした。", table).ok).toBe(false);
  });
  it("全角でも表にある数字なら合格", () => {
    expect(checkSummary("１９７５年に住宅地になりました。", table).ok).toBe(true);
  });
});

describe("makeSummary", () => {
  const good = "昔は川ぞいの田んぼでした。1975年に住宅地になっています。";
  it("成功したら llm", async () => {
    const r = await makeSummary(ohashi, async () => good);
    expect(r).toEqual({ summary: good, source: "llm" });
  });
  it("成功した結果は覚える", async () => {
    const cache = new Map();
    const llm = vi.fn(async () => good);
    await makeSummary(ohashi, llm, cache);
    await makeSummary(ohashi, llm, cache);
    expect(llm).toHaveBeenCalledTimes(1);
  });
  it("null・例外・不合格は fallback", async () => {
    const fb = { summary: ohashi.summary, source: "fallback" };
    expect(await makeSummary(ohashi, async () => null)).toEqual(fb);
    expect(
      await makeSummary(ohashi, async () => {
        throw new Error("x");
      }),
    ).toEqual(fb);
    expect(await makeSummary(ohashi, async () => "1888年の田んぼです。")).toEqual(fb);
  });
});

describe("GET /api/summary", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("キーが無ければ 200 で fallback", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const res = await GET(new Request("http://localhost/api/summary?slug=ohashi-2"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ summary: placeBySlug("ohashi-2")?.summary, source: "fallback" });
  });
  it("知らない slug は 404", async () => {
    const res = await GET(new Request("http://localhost/api/summary?slug=nowhere"));
    expect(res.status).toBe(404);
  });
});
