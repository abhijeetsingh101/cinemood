import { recommend } from "@/lib/engine";
import { omdbErrorResponse } from "@/lib/omdb";
import { rateLimit } from "@/lib/rate-limit";
import { parsePrefs } from "@/lib/validate";

// Each run can hydrate ~45 titles on a cold cache.
export const maxDuration = 30;

/** POST /api/recommend — body: Prefs. Returns scored, explained picks. */
export async function POST(request: Request) {
  const limited = rateLimit(request, "recommend", 12);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON.", code: "bad_request" }, { status: 400 });
  }
  const prefs = parsePrefs(body);
  if (!prefs) {
    return Response.json({ error: "Pick at least one mood.", code: "bad_request" }, { status: 400 });
  }
  try {
    return Response.json(await recommend(prefs));
  } catch (e) {
    return omdbErrorResponse(e);
  }
}
