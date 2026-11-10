import { similarTo } from "@/lib/engine";
import { getMovieById, omdbErrorResponse } from "@/lib/omdb";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

/** GET /api/similar/tt1375666 — films sharing this one's mood profile. */
export async function GET(request: Request, ctx: RouteContext<"/api/similar/[id]">) {
  const limited = rateLimit(request, "similar", 20);
  if (limited) return limited;
  const { id } = await ctx.params;
  try {
    const movie = await getMovieById(id);
    const results = await similarTo(movie);
    return Response.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (e) {
    return omdbErrorResponse(e);
  }
}
