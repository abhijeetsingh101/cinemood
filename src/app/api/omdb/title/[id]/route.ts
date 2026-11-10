import { getMovieById, omdbErrorResponse } from "@/lib/omdb";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/omdb/title/tt1375666 — full metadata + full plot for one film. */
export async function GET(request: Request, ctx: RouteContext<"/api/omdb/title/[id]">) {
  const limited = rateLimit(request, "title", 60);
  if (limited) return limited;
  const { id } = await ctx.params;
  try {
    const movie = await getMovieById(id);
    return Response.json(movie, {
      headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000" },
    });
  } catch (e) {
    return omdbErrorResponse(e);
  }
}
