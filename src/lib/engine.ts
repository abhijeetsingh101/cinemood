import "server-only";
import { ATLAS, ATLAS_BY_ID, type AtlasEntry } from "./catalog";
import { MOOD_MAP, tokenize } from "./moods";
import { getMovieById, getMovieByTitle, hasOmdbKey, OmdbError, searchMovies } from "./omdb";
import type {
  MoodId,
  Movie,
  Prefs,
  Recommendation,
  RecommendResponse,
  ScoreBreakdown,
} from "./types";

/**
 * CineMood recommendation engine.
 *
 * OMDb cannot filter by mood, so the pipeline is:
 *   1. Discover candidates — curated atlas rows tagged with the chosen
 *      moods, plus OMDb title searches seeded by each mood and by the
 *      user's own words.
 *   2. Hydrate each candidate with full OMDb metadata (cached).
 *   3. Apply hard filters (language, minimum rating, runtime, era).
 *   4. Score every survivor on six weighted signals and explain the result.
 */

export const WEIGHTS: ScoreBreakdown = {
  mood: 0.34,
  genre: 0.2,
  plot: 0.14,
  rating: 0.16,
  runtime: 0.08,
  year: 0.08,
};

const MAX_ATLAS_CANDIDATES = 34;
const MAX_SEARCH_CANDIDATES = 12;
const HITS_PER_SEARCH = 4;
const CONCURRENCY = 8;
const MAX_RESULTS = 18;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* ── helpers ─────────────────────────────────────────────────────── */

/** Small deterministic PRNG so the same request gives a stable ordering. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function languageMatches(pref: string, languages: string[]): boolean {
  if (pref === "any") return true;
  const p = pref.toLowerCase();
  return languages.some((l) => l.toLowerCase().includes(p));
}

/* ── 1. candidate discovery ─────────────────────────────────────── */

function atlasCandidates(prefs: Prefs, rand: () => number): AtlasEntry[] {
  return ATLAS.filter((e) => e.moods.some((m) => prefs.moods.includes(m)))
    .filter((e) => prefs.language === "any" || e.language === prefs.language)
    .filter((e) => e.year >= prefs.years[0] - 2 && e.year <= prefs.years[1] + 2)
    .map((e) => {
      const overlap = e.moods.filter((m) => prefs.moods.includes(m)).length;
      const primary = prefs.moods.includes(e.moods[0]) ? 0.5 : 0;
      const ending = prefs.ending !== "any" && e.ending === prefs.ending ? 0.75 : 0;
      return { e, rank: overlap + primary + ending + rand() * 0.9 };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, MAX_ATLAS_CANDIDATES)
    .map((r) => r.e);
}

async function searchCandidates(prefs: Prefs, rand: () => number): Promise<string[]> {
  const terms = new Set<string>();
  for (const id of prefs.moods) {
    const seeds = MOOD_MAP[id].searchTerms;
    terms.add(seeds[Math.floor(rand() * seeds.length)]);
  }
  // The user's own words are the most personal signal — search them too.
  for (const t of tokenize(prefs.description).filter((w) => w.length > 3).slice(0, 2)) terms.add(t);

  const ids: string[] = [];
  const results = await Promise.allSettled([...terms].map((t) => searchMovies(t)));
  for (const r of results) {
    if (r.status === "rejected") {
      // Quota / key problems must surface; a single failed search must not.
      if (r.reason instanceof OmdbError && ["rate_limited", "invalid_key"].includes(r.reason.code)) {
        throw r.reason;
      }
      continue;
    }
    for (const hit of r.value.hits.slice(0, HITS_PER_SEARCH)) ids.push(hit.imdbID);
  }
  return [...new Set(ids)].slice(0, MAX_SEARCH_CANDIDATES);
}

/** Fetch by ID; if the ID resolves to a different film, retry by title. */
async function hydrate(id: string): Promise<Movie | null> {
  const entry = ATLAS_BY_ID.get(id);
  try {
    const movie = await getMovieById(id);
    if (entry && !norm(movie.title).includes(norm(entry.title).slice(0, 8))) {
      return await getMovieByTitle(entry.title, entry.year);
    }
    return movie;
  } catch (e) {
    if (e instanceof OmdbError && e.code === "not_found" && entry) {
      return getMovieByTitle(entry.title, entry.year).catch(() => null);
    }
    if (e instanceof OmdbError && ["rate_limited", "invalid_key", "missing_key"].includes(e.code)) {
      throw e;
    }
    return null;
  }
}

/* ── 3. hard filters ────────────────────────────────────────────── */

function passesFilters(m: Movie, prefs: Prefs): boolean {
  if (!languageMatches(prefs.language, m.languages)) return false;
  if (m.imdbRating !== null && m.imdbRating < prefs.minRating) return false;
  if (m.imdbRating === null && prefs.minRating > 5) return false;
  if (m.runtime !== null && (m.runtime < prefs.runtime[0] - 15 || m.runtime > prefs.runtime[1] + 15)) {
    return false;
  }
  if (m.year !== null && (m.year < prefs.years[0] - 2 || m.year > prefs.years[1] + 2)) return false;
  return true;
}

/* ── 4. scoring ─────────────────────────────────────────────────── */

const RATED_INTENSITY: Record<string, number> = {
  G: 0.15, "TV-G": 0.15, PG: 0.3, "TV-PG": 0.3, "PG-13": 0.55, "TV-14": 0.55,
  R: 0.85, "TV-MA": 0.9, "NC-17": 1,
};

/** How strongly a film's genres express a mood (0–1). */
function genreAffinity(genres: string[], mood: MoodId): number {
  const map = MOOD_MAP[mood].genres;
  if (!genres.length) return 0;
  const best = Math.max(...genres.map((g) => map[g] ?? 0));
  const avg = genres.reduce((s, g) => s + (map[g] ?? 0), 0) / genres.length;
  return clamp01(best * 0.7 + avg * 0.3);
}

export function scoreMovie(
  movie: Movie,
  prefs: Prefs,
  /** Signals to count. Demo mode has no OMDb metadata, so it scores on the ones it knows. */
  signals: (keyof ScoreBreakdown)[] = Object.keys(WEIGHTS) as (keyof ScoreBreakdown)[],
): Recommendation {
  const entry = ATLAS_BY_ID.get(movie.imdbID);
  const reasons: string[] = [];
  const moods = prefs.moods;

  // Mood — curated tags are the strongest evidence; genres back them up.
  const perMood = moods.map((id) => {
    const tagged = entry?.moods.indexOf(id) ?? -1;
    const tagScore = tagged === 0 ? 1 : tagged > 0 ? 0.85 : 0;
    const aff = genreAffinity(movie.genres, id);
    return { id, value: entry ? Math.max(tagScore, aff * 0.55) : aff * 0.8, tagged: tagged >= 0 };
  });
  const matchedMoods = perMood.filter((p) => p.value >= 0.5).map((p) => p.id);
  const moodCoverage = perMood.reduce((s, p) => s + p.value, 0) / Math.max(1, moods.length);

  const wantIntensity = (prefs.intensity - 1) / 9;
  const filmIntensity =
    (RATED_INTENSITY[movie.rated ?? ""] ?? 0.5) * 0.6 +
    (entry
      ? entry.moods.reduce((s, m) => s + MOOD_MAP[m].baseIntensity, 0) / entry.moods.length
      : movie.genres.some((g) => ["Horror", "Action", "Thriller", "War"].includes(g))
        ? 0.8
        : 0.45) *
      0.4;
  const intensityFit = 1 - Math.abs(wantIntensity - filmIntensity);
  const mood = clamp01(moodCoverage * 0.82 + intensityFit * 0.18);

  const tagged = perMood.filter((p) => p.tagged).map((p) => MOOD_MAP[p.id].label);
  if (tagged.length) {
    reasons.push(`Atlas-tagged ${tagged.join(" + ")}${tagged.length === moods.length && moods.length > 1 ? " — hits every mood you picked" : ""}`);
  } else if (matchedMoods.length) {
    reasons.push(`Its genres lean ${matchedMoods.map((m) => MOOD_MAP[m].label).join(" + ")}`);
  }
  if (intensityFit > 0.85) {
    reasons.push(
      prefs.intensity >= 7 ? "Hits hard, as requested" : prefs.intensity <= 4 ? "Gentle enough for the intensity you set" : "Sits right at your intensity level",
    );
  }

  // Genre — explicit picks win; otherwise use mood→genre affinity.
  let genre: number;
  if (prefs.genres.length) {
    const hits = prefs.genres.filter((g) => movie.genres.includes(g));
    genre = clamp01(hits.length / Math.min(prefs.genres.length, 2));
    if (hits.length) reasons.push(`Matches your genre pick${hits.length > 1 ? "s" : ""}: ${hits.join(", ")}`);
  } else {
    genre = moods.length ? Math.max(...moods.map((id) => genreAffinity(movie.genres, id))) : 0;
  }

  // Plot — mood vocabulary plus the user's own words, found in the full plot.
  const text = `${movie.title} ${movie.plot ?? ""}`.toLowerCase();
  const userWords = [...new Set(tokenize(prefs.description))].filter((w) => w.length > 3);
  const userHits = userWords.filter((w) => text.includes(w));
  const moodHits = [...new Set(moods.flatMap((id) => MOOD_MAP[id].plotWords))].filter((w) => text.includes(w));
  const plot = movie.plot ? clamp01((moodHits.length + userHits.length * 2) / 5) : 0;
  if (userHits.length) reasons.push(`Echoes your words: ${userHits.slice(0, 3).join(", ")}`);
  else if (moodHits.length >= 2) reasons.push(`Plot themes: ${moodHits.slice(0, 3).join(", ")}`);

  // Rating — 5.0 → 0, 9.0 → 1.
  const rating = movie.imdbRating === null ? 0.4 : clamp01((movie.imdbRating - 5) / 4);
  if (movie.imdbRating !== null && movie.imdbRating >= 8) reasons.push(`Acclaimed — IMDb ${movie.imdbRating.toFixed(1)}`);

  // Runtime — full marks inside the window, fading over 30 minutes outside.
  let runtime = 0.6;
  if (movie.runtime !== null) {
    const [lo, hi] = prefs.runtime;
    const dist = movie.runtime < lo ? lo - movie.runtime : movie.runtime > hi ? movie.runtime - hi : 0;
    runtime = clamp01(1 - dist / 30);
    const constrained = lo > 0 || hi < 400;
    if (constrained && dist === 0) reasons.push(`${movie.runtime} min fits your runtime window`);
  }

  // Release year — same idea, fading over a decade.
  let year = 0.6;
  if (movie.year !== null) {
    const [lo, hi] = prefs.years;
    const dist = movie.year < lo ? lo - movie.year : movie.year > hi ? movie.year - hi : 0;
    year = clamp01(1 - dist / 10);
  }

  const breakdown: ScoreBreakdown = { mood, genre, plot, rating, runtime, year };
  const weightSum = signals.reduce((s, k) => s + WEIGHTS[k], 0) || 1;
  let total = signals.reduce((s, k) => s + breakdown[k] * WEIGHTS[k] * 100, 0) / weightSum;

  // Ending preference — only known for atlas films; a nudge, not a filter.
  if (prefs.ending !== "any" && entry) {
    if (entry.ending === prefs.ending) {
      total += 5;
      reasons.push(`Delivers the ${prefs.ending === "happy" ? "uplifting" : prefs.ending === "tragic" ? "devastating" : prefs.ending} ending you asked for`);
    } else {
      total -= 4;
    }
  }

  if (!reasons.length) reasons.push("A wildcard pick surfaced from your mood search");

  return {
    movie,
    score: Math.round(Math.max(1, Math.min(99, total))),
    breakdown,
    reasons: reasons.slice(0, 4),
    matchedMoods,
  };
}

/* ── demo mode (no OMDb key) ────────────────────────────────────── */

function stub(e: AtlasEntry): Movie {
  return {
    imdbID: e.imdbID, title: e.title, year: e.year, rated: null, released: null,
    runtime: null, genres: [], director: null, writer: null, actors: [], plot: null,
    languages: [e.language], country: null, awards: null, poster: null,
    imdbRating: null, imdbVotes: null, metascore: null, boxOffice: null, ratings: [],
  };
}

/* ── public API ─────────────────────────────────────────────────── */

export async function recommend(prefs: Prefs, exclude: string[] = []): Promise<RecommendResponse> {
  const rand = seeded(JSON.stringify(prefs));
  const atlas = atlasCandidates(prefs, rand).filter((e) => !exclude.includes(e.imdbID));

  if (!hasOmdbKey()) {
    const results = atlas
      .map((e) => scoreMovie(stub(e), prefs, ["mood", "year"]))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);
    return { results, demo: true, considered: atlas.length };
  }

  const searched = await searchCandidates(prefs, rand);
  const ids = [...new Set([...atlas.map((e) => e.imdbID), ...searched])].filter((id) => !exclude.includes(id));
  const movies = (await mapLimit(ids, CONCURRENCY, hydrate)).filter((m): m is Movie => m !== null);

  const seen = new Set<string>();
  const results = movies
    .filter((m) => (seen.has(m.imdbID) ? false : (seen.add(m.imdbID), true)))
    .filter((m) => passesFilters(m, prefs))
    .map((m) => scoreMovie(m, prefs))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  return { results, demo: false, considered: movies.length };
}

/** Derive a mood profile for a film, then recommend around it. */
export async function similarTo(movie: Movie, limit = 8): Promise<Recommendation[]> {
  const entry = ATLAS_BY_ID.get(movie.imdbID);
  const moods: MoodId[] = entry
    ? entry.moods.slice(0, 3)
    : (Object.keys(MOOD_MAP) as MoodId[])
        .map((id) => ({ id, a: genreAffinity(movie.genres, id) }))
        .sort((a, b) => b.a - a.a)
        .slice(0, 2)
        .map((r) => r.id);

  const prefs: Prefs = {
    moods,
    description: "",
    intensity: 6,
    genres: movie.genres.slice(0, 2),
    language: "any",
    runtime: [0, 400],
    minRating: 6.5,
    years: [1920, new Date().getFullYear()],
    ending: "any",
  };
  // Atlas-only candidates keep "similar" cheap: no extra title searches.
  const rand = seeded(movie.imdbID);
  const candidates = atlasCandidates(prefs, rand).filter((e) => e.imdbID !== movie.imdbID).slice(0, 16);
  const movies = (await mapLimit(candidates.map((c) => c.imdbID), CONCURRENCY, hydrate)).filter(
    (m): m is Movie => m !== null,
  );
  return movies
    .map((m) => scoreMovie(m, prefs))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
