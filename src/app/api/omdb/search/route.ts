import { omdbErrorResponse, searchMovies } from "@/lib/omdb";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/omdb/search?q=blade&page=1 — title search proxy. */
export async function GET(request: Request) {
  const limited = rateLimit(request, "search", 30);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(10, Number(searchParams.get("page")) || 1));
  if (q.length < 2) {
    return Response.json({ error: "Query must be at least 2 characters.", code: "bad_request" }, { status: 400 });
  }
  try {
    const data = await searchMovies(q, page);
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (e) {
    return omdbErrorResponse(e);
  }
}
