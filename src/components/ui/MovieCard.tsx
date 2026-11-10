"use client";

import Link from "next/link";
import { MOOD_MAP } from "@/lib/moods";
import type { Recommendation } from "@/lib/types";
import Poster from "./Poster";
import ScoreRing from "./ScoreRing";
import Tilt from "./Tilt";
import WatchlistButton from "./WatchlistButton";

const BARS: { key: keyof Recommendation["breakdown"]; label: string }[] = [
  { key: "mood", label: "Mood" },
  { key: "genre", label: "Genre" },
  { key: "plot", label: "Plot" },
  { key: "rating", label: "Rating" },
];

export function Meta({ rec }: { rec: Recommendation }) {
  const m = rec.movie;
  const bits = [m.year, m.runtime ? `${m.runtime} min` : null, m.rated, m.imdbRating ? `IMDb ${m.imdbRating.toFixed(1)}` : null].filter(Boolean);
  return <p className="hud">{bits.join("  ·  ") || "Metadata offline"}</p>;
}

export function Breakdown({ rec }: { rec: Recommendation }) {
  return (
    <dl className="grid grid-cols-4 gap-3">
      {BARS.map((b) => (
        <div key={b.key}>
          <dt className="hud text-[9px]!">{b.label}</dt>
          <dd className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-[var(--mood-a)] to-[var(--mood-b)]"
              style={{ width: `${Math.round(rec.breakdown[b.key] * 100)}%` }}
            />
            <span className="sr-only">{Math.round(rec.breakdown[b.key] * 100)}%</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Reasons({ rec, max = 3 }: { rec: Recommendation; max?: number }) {
  return (
    <ul className="space-y-1.5 text-sm text-dim">
      {rec.reasons.slice(0, max).map((r) => (
        <li key={r} className="flex gap-2">
          <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 rotate-45 bg-[var(--mood-a)]" />
          {r}
        </li>
      ))}
    </ul>
  );
}

/** Result card: poster, score ring, and the "why" behind the pick. */
export default function MovieCard({ rec, rank, linkable = true }: { rec: Recommendation; rank: number; linkable?: boolean }) {
  const m = rec.movie;
  const title = (
    <h3 className="display text-lg leading-tight text-balance">
      {linkable ? (
        <Link href={`/movie/${m.imdbID}`} className="after:absolute after:inset-0 hover:text-[var(--mood-a)]">
          {m.title}
        </Link>
      ) : (
        m.title
      )}
    </h3>
  );

  return (
    <Tilt className="h-full rounded-[10px]">
      <article className="holo relative flex h-full flex-col gap-4 p-4">
        <div className="flex gap-4">
          <Poster src={m.poster} title={m.title} className="w-24 shrink-0 sm:w-28" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className="hud text-[var(--mood-a)]!">#{String(rank).padStart(2, "0")}</span>
              <ScoreRing score={rec.score} size={56} />
            </div>
            {title}
            <Meta rec={rec} />
            <div className="flex flex-wrap gap-1.5">
              {rec.matchedMoods.map((id) => (
                <span key={id} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-dim">
                  {MOOD_MAP[id].glyph} {MOOD_MAP[id].label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Reasons rec={rec} />
        <div className="mt-auto space-y-4">
          <Breakdown rec={rec} />
          <div className="relative z-10 flex justify-end">
            <WatchlistButton movie={{ imdbID: m.imdbID, title: m.title, year: m.year, poster: m.poster }} compact />
          </div>
        </div>
      </article>
    </Tilt>
  );
}
