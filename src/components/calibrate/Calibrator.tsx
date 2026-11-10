"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BackLink, Notice } from "@/components/ui/States";
import { useHydrated } from "@/lib/hooks";
import { ENDINGS, ERA_PRESETS, GENRES, LANGUAGES, MOOD_MAP, RUNTIME_PRESETS } from "@/lib/moods";
import { useMoodStore } from "@/lib/store";

const INTENSITY_WORDS = ["", "Featherlight", "Gentle", "Easy", "Steady", "Engaged", "Charged", "Gripping", "Intense", "Relentless", "Overwhelming"];

function Panel({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={`holo min-w-0 p-5 md:p-6 ${className}`}>
      <legend className="hud float-left mb-4 w-full">
        {label}
        {hint && <span className="ml-3 tracking-normal text-faint normal-case">{hint}</span>}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

const same = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];

export default function Calibrator() {
  const router = useRouter();
  const hydrated = useHydrated();
  const prefs = useMoodStore((s) => s.prefs);
  const setPrefs = useMoodStore((s) => s.setPrefs);

  if (!hydrated) return <div className="skeleton h-96" aria-busy="true" aria-label="Loading calibration" />;

  if (!prefs.moods.length) {
    return (
      <Notice title="No mood armed yet" action={<Link href="/mood" className="neon-btn">Run mood scan</Link>}>
        Calibration needs at least one spectrum to tune against.
      </Notice>
    );
  }

  const toggleGenre = (g: string) =>
    setPrefs({ genres: prefs.genres.includes(g) ? prefs.genres.filter((x) => x !== g) : [...prefs.genres, g].slice(0, 6) });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/results");
      }}
      className="grid gap-5 md:grid-cols-2"
    >
      <div className="flex flex-wrap items-center gap-2 md:col-span-2">
        <span className="hud mr-1">Armed</span>
        {prefs.moods.map((id) => (
          <span
            key={id}
            className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: MOOD_MAP[id].colors[0], color: MOOD_MAP[id].colors[0] }}
          >
            {MOOD_MAP[id].glyph} {MOOD_MAP[id].label}
          </span>
        ))}
        <Link href="/mood" className="ml-1 text-xs text-dim underline underline-offset-4 hover:text-ink">
          Change
        </Link>
      </div>

      <Panel label="Intensity" className="md:col-span-2">
        <div className="flex items-end justify-between gap-4">
          <p className="display text-2xl md:text-3xl">{INTENSITY_WORDS[prefs.intensity]}</p>
          <p className="display text-4xl text-white/15 tabular-nums">{String(prefs.intensity).padStart(2, "0")}</p>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={prefs.intensity}
          onChange={(e) => setPrefs({ intensity: Number(e.target.value) })}
          aria-label="Intensity"
          aria-valuetext={INTENSITY_WORDS[prefs.intensity]}
          className="range mt-4"
          style={{ "--fill": `${((prefs.intensity - 1) / 9) * 100}%` } as React.CSSProperties}
        />
        <div className="hud mt-1 flex justify-between text-[10px]!">
          <span>Soft landing</span>
          <span>Full impact</span>
        </div>
      </Panel>

      <Panel label="Genres" hint="optional · up to 6" className="md:col-span-2">
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button key={g} type="button" className="chip" aria-pressed={prefs.genres.includes(g)} onClick={() => toggleGenre(g)}>
              {g}
            </button>
          ))}
        </div>
      </Panel>

      <Panel label="Language">
        <div role="radiogroup" aria-label="Language" className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button key={l} type="button" role="radio" className="chip" aria-checked={prefs.language === l} onClick={() => setPrefs({ language: l })}>
              {l === "any" ? "Any language" : l}
            </button>
          ))}
        </div>
      </Panel>

      <Panel label="Runtime">
        <div role="radiogroup" aria-label="Runtime" className="flex flex-wrap gap-2">
          {RUNTIME_PRESETS.map((r) => (
            <button key={r.label} type="button" role="radio" className="chip" aria-checked={same(prefs.runtime, r.value)} onClick={() => setPrefs({ runtime: r.value })}>
              {r.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel label="Minimum IMDb rating">
        <div className="flex items-center gap-5">
          <p className="display w-16 text-3xl text-[var(--mood-a)] tabular-nums">{prefs.minRating.toFixed(1)}</p>
          <input
            type="range"
            min={5}
            max={9}
            step={0.5}
            value={prefs.minRating}
            onChange={(e) => setPrefs({ minRating: Number(e.target.value) })}
            aria-label="Minimum IMDb rating"
            className="range"
            style={{ "--fill": `${((prefs.minRating - 5) / 4) * 100}%` } as React.CSSProperties}
          />
        </div>
        {prefs.minRating >= 8.5 && <p className="mt-2 text-xs text-amber">Very strict — expect a short list.</p>}
      </Panel>

      <Panel label="Release era">
        <div role="radiogroup" aria-label="Release era" className="flex flex-wrap gap-2">
          {ERA_PRESETS.map((r) => (
            <button key={r.label} type="button" role="radio" className="chip" aria-checked={same(prefs.years, r.value)} onClick={() => setPrefs({ years: r.value })}>
              {r.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel label="Ending" hint="how should it leave you?" className="md:col-span-2">
        <div role="radiogroup" aria-label="Ending" className="flex flex-wrap gap-2">
          {ENDINGS.map((e) => (
            <button key={e.id} type="button" role="radio" className="chip" aria-checked={prefs.ending === e.id} onClick={() => setPrefs({ ending: e.id })}>
              {e.label}
            </button>
          ))}
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
        <BackLink href="/mood">Mood scan</BackLink>
        <button type="submit" className="neon-btn">
          Find my films <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  );
}
