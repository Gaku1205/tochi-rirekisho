// LLM（Gemini の無料枠）を fetch で呼ぶ小さな関数。キーとモデル名は環境変数から読む。
export const DEFAULT_MODEL = "gemini-2.5-flash-lite";
export const TIMEOUT_MS = 8000;

export type Llm = (system: string, user: string) => Promise<string | null>;

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

/** キーが無い・失敗・遅いときは null を返す（投げない） */
export const callGemini: Llm = async (system, user) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return text || null;
  } catch {
    return null;
  }
};
