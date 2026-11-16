import { callGemini } from "../../../lib/llm";
import { placeBySlug } from "../../../lib/places";
import { makeSummary, type SummaryCache } from "../../../lib/summaryService";

const cache: SummaryCache = new Map();

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const place = placeBySlug(slug);
  if (!place) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(await makeSummary(place, callGemini, cache));
}
