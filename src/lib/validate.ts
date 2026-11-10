import { CURRENT_YEAR, ENDINGS, GENRES, LANGUAGES, MAX_MOODS, MOOD_IDS } from "./moods";
import type { EndingPref, MoodId, Prefs } from "./types";

const clamp = (n: unknown, lo: number, hi: number, fallback: number) => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.max(lo, Math.min(hi, v));
};

const pair = (v: unknown, lo: number, hi: number): [number, number] => {
  const a = Array.isArray(v) ? v : [];
  const x = clamp(a[0], lo, hi, lo);
  const y = clamp(a[1], lo, hi, hi);
  return x <= y ? [x, y] : [y, x];
};

/**
 * Parse untrusted JSON into a safe Prefs object. Unknown values are
 * dropped or clamped; returns null when no valid mood is present.
 */
export function parsePrefs(input: unknown): Prefs | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;

  const moods = (Array.isArray(o.moods) ? o.moods : [])
    .filter((m): m is MoodId => MOOD_IDS.includes(m as MoodId))
    .filter((m, i, a) => a.indexOf(m) === i)
    .slice(0, MAX_MOODS);
  if (!moods.length) return null;

  const genres = (Array.isArray(o.genres) ? o.genres : [])
    .filter((g): g is string => typeof g === "string" && GENRES.includes(g))
    .slice(0, 6);

  const language = typeof o.language === "string" && LANGUAGES.includes(o.language) ? o.language : "any";
  const ending = ENDINGS.some((e) => e.id === o.ending) ? (o.ending as EndingPref) : "any";

  return {
    moods,
    description: typeof o.description === "string" ? o.description.slice(0, 280) : "",
    intensity: Math.round(clamp(o.intensity, 1, 10, 6)),
    genres,
    language,
    runtime: pair(o.runtime, 0, 400),
    minRating: Math.round(clamp(o.minRating, 0, 9.5, 6.5) * 2) / 2,
    years: pair(o.years, 1900, CURRENT_YEAR + 1),
    ending,
  };
}
