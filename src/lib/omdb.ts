import "server-only";
import { cacheLife } from "next/cache";
import type { Movie, SearchHit } from "./types";

/**
 * Server-only OMDb client.
 *
 * The API key is read from process.env on the server and never leaves it:
 * this module imports "server-only", so bundling it into client code is a
 * build error. The browser only ever talks to our own /api routes.
 *
 * Responses are cached with `use cache` (OMDb data is effectively static),
 * which keeps the app well inside OMDb's daily request limit.
 */

const BASE = "https://www.omdbapi.com/";
const TIMEOUT_MS = 8000;

export type OmdbErrorCode =
  | "missing_key"
  | "invalid_key"
  | "rate_limited"
  | "not_found"
  | "too_many_results"
  | "upstream";

export class OmdbError extends Error {
  constructor(
    public code: OmdbErrorCode,
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "OmdbError";
  }
}

export function hasOmdbKey(): boolean {
  return Boolean(process.env.OMDB_API_KEY);
}

type Raw = Record<string, unknown> & { Response?: string; Error?: string };

async function call(params: Record<string, string>): Promise<Raw> {
  const key = process.env.OMDB_API_KEY;
  if (!key) {
    throw new OmdbError("missing_key", 503, "OMDB_API_KEY is not configured on the server.");
  }
  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", key);

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new OmdbError("upstream", 502, "Could not reach OMDb.");
  }
  if (res.status === 401) {
    const body = (await res.json().catch(() => ({}))) as Raw;
    const limited = /limit/i.test(String(body.Error ?? ""));
    throw limited
      ? new OmdbError("rate_limited", 429, "OMDb daily request limit reached.")
      : new OmdbError("invalid_key", 503, "OMDb rejected the API key.");
  }
  if (!res.ok) throw new OmdbError("upstream", 502, `OMDb responded with ${res.status}.`);

  const json = (await res.json()) as Raw;
  if (json.Response === "False") {
    const msg = String(json.Error ?? "Unknown OMDb error");
    if (/not found|incorrect imdb/i.test(msg)) throw new OmdbError("not_found", 404, msg);
    if (/too many/i.test(msg)) throw new OmdbError("too_many_results", 422, msg);
    if (/limit/i.test(msg)) throw new OmdbError("rate_limited", 429, msg);
    if (/api key/i.test(msg)) throw new OmdbError("invalid_key", 503, msg);
    throw new OmdbError("upstream", 502, msg);
  }
  return json;
}

const na = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s && s !== "N/A" ? s : null;
};
const list = (v: unknown): string[] =>
  (na(v) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const num = (v: unknown): number | null => {
  const s = na(v);
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

function poster(v: unknown): string | null {
  const s = na(v);
  // Only allow https posters; anything else is dropped.
  return s && s.startsWith("https://") ? s : null;
}

function normalise(raw: Raw): Movie {
  const ratings = Array.isArray(raw.Ratings)
    ? (raw.Ratings as { Source?: string; Value?: string }[])
        .filter((r) => r.Source && r.Value)
        .map((r) => ({ source: r.Source as string, value: r.Value as string }))
    : [];
  return {
    imdbID: String(raw.imdbID),
    title: na(raw.Title) ?? "Untitled",
    year: num(raw.Year),
    rated: na(raw.Rated),
    released: na(raw.Released),
    runtime: num(raw.Runtime),
    genres: list(raw.Genre),
    director: na(raw.Director),
    writer: na(raw.Writer),
    actors: list(raw.Actors),
    plot: na(raw.Plot),
    languages: list(raw.Language),
    country: na(raw.Country),
    awards: na(raw.Awards),
    poster: poster(raw.Poster),
    imdbRating: num(raw.imdbRating),
    imdbVotes: na(raw.imdbVotes),
    metascore: num(raw.Metascore),
    boxOffice: na(raw.BoxOffice),
    ratings,
  };
}

export const IMDB_ID = /^tt\d{7,9}$/;

/*
 * Cached layer. Stable outcomes (a title, or "no such title") are returned
 * as values so they are cached; transient failures (rate limit, network,
 * bad key) throw, so they are never cached.
 */
async function cachedDetail(query: string): Promise<Movie | null> {
  "use cache";
  cacheLife("weeks");
  try {
    return normalise(await call({ ...JSON.parse(query), plot: "full", type: "movie" }));
  } catch (e) {
    if (e instanceof OmdbError && e.code === "not_found") return null;
    throw e;
  }
}

async function cachedSearch(query: string, page: number) {
  "use cache";
  cacheLife("days");
  try {
    const raw = await call({ s: query, type: "movie", page: String(page) });
    const rows = Array.isArray(raw.Search) ? (raw.Search as Raw[]) : [];
    const hits: SearchHit[] = rows
      .filter((r) => IMDB_ID.test(String(r.imdbID)))
      .map((r) => ({
        imdbID: String(r.imdbID),
        title: na(r.Title) ?? "Untitled",
        year: na(r.Year) ?? "",
        poster: poster(r.Poster),
      }));
    return { hits, total: num(raw.totalResults) ?? rows.length };
  } catch (e) {
    if (e instanceof OmdbError && (e.code === "not_found" || e.code === "too_many_results")) {
      return { hits: [] as SearchHit[], total: 0 };
    }
    throw e;
  }
}

/** Errors crossing the cache boundary may lose their class; restore it. */
function rethrow(e: unknown): never {
  if (e instanceof OmdbError) throw e;
  const msg = e instanceof Error ? e.message : "";
  if (/limit/i.test(msg)) throw new OmdbError("rate_limited", 429, "OMDb daily request limit reached.");
  if (/api key/i.test(msg)) throw new OmdbError("invalid_key", 503, "OMDb rejected the API key.");
  throw new OmdbError("upstream", 502, "OMDb is unavailable right now. Try again shortly.");
}

function requireKey() {
  if (!hasOmdbKey()) {
    throw new OmdbError("missing_key", 503, "OMDB_API_KEY is not configured on the server.");
  }
}

/** Full details (with full plot) for one IMDb ID. */
export async function getMovieById(imdbID: string): Promise<Movie> {
  if (!IMDB_ID.test(imdbID)) throw new OmdbError("not_found", 404, "Invalid IMDb ID.");
  requireKey();
  const movie = await cachedDetail(JSON.stringify({ i: imdbID })).catch(rethrow);
  if (!movie) throw new OmdbError("not_found", 404, "Movie not found.");
  return movie;
}

/** Details by exact title (+ optional year). Used as an ID-drift fallback. */
export async function getMovieByTitle(title: string, year?: number): Promise<Movie> {
  requireKey();
  const q: Record<string, string> = { t: title };
  if (year) q.y = String(year);
  const movie = await cachedDetail(JSON.stringify(q)).catch(rethrow);
  if (!movie) throw new OmdbError("not_found", 404, "Movie not found.");
  return movie;
}

/** Title search. Resolves to an empty list when nothing matches. */
export async function searchMovies(
  query: string,
  page = 1,
): Promise<{ hits: SearchHit[]; total: number }> {
  requireKey();
  return cachedSearch(query.trim().toLowerCase(), page).catch(rethrow);
}

/** Map any thrown value to a JSON error response. */
export function omdbErrorResponse(e: unknown): Response {
  if (e instanceof OmdbError) {
    return Response.json({ error: e.message, code: e.code }, { status: e.status });
  }
  console.error("[cinemood] unexpected error", e);
  return Response.json({ error: "Something went wrong.", code: "internal" }, { status: 500 });
}
