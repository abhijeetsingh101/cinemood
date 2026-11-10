"use client";

import { useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Poster from "@/components/ui/Poster";
import type { Recommendation } from "@/lib/types";

type State = { status: "idle" | "loading" } | { status: "done"; items: Recommendation[] } | { status: "error" };

/** "Same wavelength" strip. Fetches only once it scrolls near the viewport. */
export default function SimilarMovies({ id }: { id: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "300px" });
  const [state, setState] = useState<State>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const ctrl = new AbortController();
    fetch(`/api/similar/${id}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { results: Recommendation[] };
        setState({ status: "done", items: json.results });
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ status: "error" });
      });
    return () => ctrl.abort();
  }, [inView, id, attempt]);

  return (
    <section ref={ref} aria-labelledby="similar" className="mt-20">
      <p className="hud mb-3">Same wavelength</p>
      <h2 id="similar" className="display mb-6 text-2xl md:text-3xl">
        If this one fits, try these.
      </h2>

      {state.status === "error" ? (
        <div role="alert" className="holo flex flex-wrap items-center justify-between gap-4 p-5 text-sm text-dim">
          Could not load similar films.
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : state.status === "done" && state.items.length === 0 ? (
        <p className="text-sm text-dim">No close matches in the atlas yet.</p>
      ) : (
        <ul className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 md:-mx-10 md:px-10" aria-busy={state.status !== "done"}>
          {state.status === "done"
            ? state.items.map((rec) => (
                <li key={rec.movie.imdbID} className="w-36 shrink-0 snap-start sm:w-40">
                  <Link href={`/movie/${rec.movie.imdbID}`} className="group block">
                    <div className="relative transition-transform duration-500 group-hover:-translate-y-2">
                      <Poster src={rec.movie.poster} title={rec.movie.title} />
                      <span className="hud absolute top-2 right-2 rounded bg-void/80 px-1.5 py-0.5 text-[10px]! text-[var(--mood-a)]!">
                        {rec.score}%
                      </span>
                    </div>
                    <span className="mt-2 block text-sm leading-snug group-hover:text-[var(--mood-a)]">{rec.movie.title}</span>
                    <span className="text-xs text-faint">{rec.movie.year}</span>
                  </Link>
                </li>
              ))
            : Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="w-36 shrink-0 sm:w-40" aria-hidden>
                  <div className="skeleton aspect-[2/3]" />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}
