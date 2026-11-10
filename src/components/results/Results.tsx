"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import MovieCard, { Meta, Reasons } from "@/components/ui/MovieCard";
import Poster from "@/components/ui/Poster";
import ScoreRing from "@/components/ui/ScoreRing";
import { BackLink, Notice, PageHeader, Scanner } from "@/components/ui/States";
import Tilt from "@/components/ui/Tilt";
import WatchlistButton from "@/components/ui/WatchlistButton";
import { useHydrated } from "@/lib/hooks";
import { MOOD_MAP } from "@/lib/moods";
import { useMoodStore } from "@/lib/store";
import type { ApiError, Recommendation, RecommendResponse, ScoreBreakdown } from "@/lib/types";

const SIGNALS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "mood", label: "Mood fit" },
  { key: "genre", label: "Genre" },
  { key: "plot", label: "Plot relevance" },
  { key: "rating", label: "IMDb rating" },
  { key: "runtime", label: "Runtime" },
  { key: "year", label: "Release era" },
];

const HELP: Record<string, string> = {
  missing_key: "The server has no OMDb key yet. Add OMDB_API_KEY to the environment and redeploy.",
  invalid_key: "OMDb rejected the server's API key. Check OMDB_API_KEY.",
  rate_limited: "The request limit was reached. Wait a minute and try again.",
  upstream: "The movie database did not answer. Try again in a moment.",
};

function Featured({ rec, linkable, demo }: { rec: Recommendation; linkable: boolean; demo: boolean }) {
  const m = rec.movie;
  return (
    <Tilt max={4} className="rounded-[10px]">
      <article className="holo relative grid gap-6 p-5 md:grid-cols-[220px_1fr] md:gap-9 md:p-8">
        <Poster src={m.poster} title={m.title} eager className="mx-auto w-44 md:w-full" />
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="hud mb-2 text-[var(--mood-a)]!">Strongest signal</p>
              <h2 className="display text-2xl text-balance md:text-4xl">
                {linkable ? (
                  <Link href={`/movie/${m.imdbID}`} className="after:absolute after:inset-0 hover:text-[var(--mood-a)]">
                    {m.title}
                  </Link>
                ) : (
                  m.title
                )}
              </h2>
            </div>
            <ScoreRing score={rec.score} size={92} />
          </div>
          <Meta rec={rec} />
          {m.plot && <p className="line-clamp-3 text-sm leading-relaxed text-dim">{m.plot}</p>}
          <div>
            <p className="hud mb-2">Why this film</p>
            <Reasons rec={rec} max={4} />
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {SIGNALS.filter((s) => !demo || s.key === "mood" || s.key === "year").map((s) => (
              <div key={s.key}>
                <dt className="flex justify-between text-xs text-dim">
                  {s.label}
                  <span className="tabular-nums">{Math.round(rec.breakdown[s.key] * 100)}</span>
                </dt>
                <dd className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[var(--mood-a)] to-[var(--mood-b)]"
                    style={{ width: `${Math.round(rec.breakdown[s.key] * 100)}%` }}
                  />
                </dd>
              </div>
            ))}
          </dl>
          <div className="relative z-10 mt-auto flex flex-wrap gap-3">
            {linkable && (
              <Link href={`/movie/${m.imdbID}`} className="neon-btn">
                Open dossier
              </Link>
            )}
            <WatchlistButton movie={{ imdbID: m.imdbID, title: m.title, year: m.year, poster: m.poster }} />
          </div>
        </div>
      </article>
    </Tilt>
  );
}

type Outcome = { key: string; data?: RecommendResponse; error?: ApiError };

export default function Results() {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const prefs = useMoodStore((s) => s.prefs);
  const cache = useMoodStore((s) => s.cache);
  const setCache = useMoodStore((s) => s.setCache);
  const logSession = useMoodStore((s) => s.logSession);

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempt, setAttempt] = useState(0);

  const ready = hydrated && prefs.moods.length > 0;
  const key = JSON.stringify(prefs);
  const requestKey = `${key}#${attempt}`;
  const cached = cache?.key === key ? cache.data : null;

  useEffect(() => {
    if (!ready || cached) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: key,
          signal: ctrl.signal,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json) {
          setOutcome({ key: requestKey, error: (json as ApiError) ?? { error: "Unexpected response.", code: "upstream" } });
          return;
        }
        const data = json as RecommendResponse;
        setCache(key, data);
        logSession(JSON.parse(key).moods);
        setOutcome({ key: requestKey, data });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setOutcome({ key: requestKey, error: { error: "You appear to be offline.", code: "network" } });
      }
    })();
    return () => ctrl.abort();
  }, [ready, cached, key, requestKey, setCache, logSession]);

  if (!hydrated) return <Scanner label="Waking the engine" />;

  if (!prefs.moods.length) {
    return (
      <Notice title="Nothing to tune against" action={<Link href="/mood" className="neon-btn">Run mood scan</Link>}>
        Pick at least one mood and CineMood will do the rest.
      </Notice>
    );
  }

  const current = outcome?.key === requestKey ? outcome : null;
  const data = cached ?? current?.data ?? null;
  const error = !data ? current?.error : undefined;

  if (error) {
    return (
      <Notice
        tone="error"
        title="The transmission dropped"
        action={
          <>
            <button type="button" className="neon-btn" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </button>
            <BackLink href="/calibrate">Recalibrate</BackLink>
          </>
        }
      >
        {HELP[error.code] ?? error.error}
      </Notice>
    );
  }

  if (!data) {
    return (
      <Scanner
        label="Scanning the archive"
        lines={["Mapping moods to genres", "Retrieving candidates from OMDb", "Scoring compatibility"]}
      />
    );
  }

  const [top, ...rest] = data.results;

  return (
    <>
      <PageHeader
        step="Step 3 of 3 · Transmissions"
        title={
          <>
            {data.results.length} films tuned to{" "}
            <span className="text-glow">{prefs.moods.map((id) => MOOD_MAP[id].label).join(" + ")}</span>
          </>
        }
        sub={`${data.considered} candidates scored on ${data.demo ? "mood fit and release era" : "six signals"}. Highest compatibility first.`}
      />

      {data.demo && (
        <div role="status" className="mb-6 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
          Demo mode: no OMDb key is configured, so these picks come from the built-in atlas without
          posters, plots or ratings. Add <code className="font-mono">OMDB_API_KEY</code> to unlock the full engine.
        </div>
      )}

      {!top ? (
        <Notice title="Nothing cleared your filters" action={<Link href="/calibrate" className="neon-btn">Loosen the dials</Link>}>
          Try a lower minimum rating, any language, or a wider era.
        </Notice>
      ) : (
        <>
          <Featured rec={top} linkable={!data.demo} demo={data.demo} />
          <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((rec, i) => (
              <motion.li
                key={rec.movie.imdbID}
                className={i % 3 === 1 ? "xl:translate-y-6" : ""}
                initial={reduced ? false : { opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.8, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <MovieCard rec={rec} rank={i + 2} linkable={!data.demo} />
              </motion.li>
            ))}
          </ul>
          <div className="mt-14 flex flex-wrap justify-between gap-3">
            <BackLink href="/calibrate">Recalibrate</BackLink>
            <Link href="/mood" className="ghost-btn">
              New mood scan
            </Link>
          </div>
        </>
      )}
    </>
  );
}
