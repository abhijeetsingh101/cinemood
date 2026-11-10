import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SimilarMovies from "@/components/movie/SimilarMovies";
import Poster from "@/components/ui/Poster";
import { BackLink, Notice, Scanner } from "@/components/ui/States";
import Tilt from "@/components/ui/Tilt";
import WatchlistButton from "@/components/ui/WatchlistButton";
import { ATLAS_BY_ID } from "@/lib/catalog";
import { MOOD_MAP } from "@/lib/moods";
import { getMovieById, OmdbError } from "@/lib/omdb";

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovieById(id);
    return {
      title: movie.year ? `${movie.title} (${movie.year})` : movie.title,
      description: movie.plot?.slice(0, 160) ?? undefined,
    };
  } catch {
    return { title: "Movie dossier" };
  }
}

export default function MoviePage({ params }: PageProps<"/movie/[id]">) {
  return (
    <Suspense fallback={<Scanner label="Decrypting dossier" />}>
      <Dossier params={params} />
    </Suspense>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="border-t border-line pt-3">
      <dt className="hud text-[10px]!">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

async function Dossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let movie;
  try {
    movie = await getMovieById(id);
  } catch (e) {
    if (e instanceof OmdbError && e.code === "not_found") notFound();
    const missing = e instanceof OmdbError && e.code === "missing_key";
    return (
      <Notice
        tone="error"
        title={missing ? "Movie details need an OMDb key" : "Could not load this film"}
        action={<BackLink href="/results">Back to results</BackLink>}
      >
        {missing
          ? "Set OMDB_API_KEY on the server to unlock posters, plots, cast and ratings."
          : e instanceof OmdbError
            ? e.message
            : "Something went wrong. Try again in a moment."}
      </Notice>
    );
  }

  const atlas = ATLAS_BY_ID.get(movie.imdbID);
  const meta = [movie.year, movie.runtime ? `${movie.runtime} min` : null, movie.rated].filter(Boolean).join("  ·  ");

  return (
    <article>
      <div className="mb-8">
        <BackLink href="/results">Results</BackLink>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,300px)_1fr] md:gap-12">
        <div className="mx-auto w-56 md:mx-0 md:w-full">
          <Tilt max={10} className="rounded-md">
            <Poster src={movie.poster} title={movie.title} eager className="shadow-[0_40px_90px_-30px_var(--mood-a)]" />
          </Tilt>
        </div>

        <div className="min-w-0">
          <p className="hud mb-3 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-[var(--mood-a)]" aria-hidden />
            Dossier · {movie.imdbID}
          </p>
          <h1 className="display text-3xl text-balance sm:text-4xl md:text-5xl">{movie.title}</h1>
          {meta && <p className="hud mt-4">{meta}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <span key={g} className="rounded-full border border-line px-3 py-1 text-xs text-dim">
                {g}
              </span>
            ))}
            {atlas?.moods.map((mid) => (
              <span
                key={mid}
                className="rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: MOOD_MAP[mid].colors[0], color: MOOD_MAP[mid].colors[0] }}
              >
                {MOOD_MAP[mid].glyph} {MOOD_MAP[mid].label}
              </span>
            ))}
          </div>

          <dl className="mt-7 flex flex-wrap gap-3">
            {movie.imdbRating !== null && (
              <div className="holo holo-plain px-4 py-3">
                <dt className="hud text-[10px]!">IMDb</dt>
                <dd className="display mt-1 text-2xl text-amber tabular-nums">
                  {movie.imdbRating.toFixed(1)}
                  <span className="ml-1 font-sans text-xs font-normal text-dim">/10</span>
                </dd>
                {movie.imdbVotes && <dd className="text-[11px] text-faint">{movie.imdbVotes} votes</dd>}
              </div>
            )}
            {movie.ratings
              .filter((r) => !/internet movie database/i.test(r.source))
              .map((r) => (
                <div key={r.source} className="holo holo-plain px-4 py-3">
                  <dt className="hud text-[10px]!">{r.source}</dt>
                  <dd className="display mt-1 text-2xl tabular-nums">{r.value}</dd>
                </div>
              ))}
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            <WatchlistButton movie={{ imdbID: movie.imdbID, title: movie.title, year: movie.year, poster: movie.poster }} />
            <a
              href={`https://www.imdb.com/title/${movie.imdbID}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="ghost-btn"
            >
              View on IMDb <span aria-hidden>↗</span>
            </a>
          </div>

          {movie.plot && (
            <section aria-labelledby="plot" className="mt-10">
              <h2 id="plot" className="hud mb-3">
                Plot
              </h2>
              <p className="max-w-2xl leading-relaxed text-ink/90">{movie.plot}</p>
            </section>
          )}

          <dl className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Fact label="Director" value={movie.director} />
            <Fact label="Writer" value={movie.writer} />
            <Fact label="Cast" value={movie.actors.join(", ") || null} />
            <Fact label="Language" value={movie.languages.join(", ") || null} />
            <Fact label="Country" value={movie.country} />
            <Fact label="Released" value={movie.released} />
            <Fact label="Awards" value={movie.awards} />
            <Fact label="Box office" value={movie.boxOffice} />
          </dl>
        </div>
      </div>

      <SimilarMovies id={movie.imdbID} />

      <p className="mt-16 text-center text-xs text-faint">
        Film data from the{" "}
        <Link href="https://www.omdbapi.com/" className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">
          OMDb API
        </Link>
        .
      </p>
    </article>
  );
}
