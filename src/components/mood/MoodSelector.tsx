"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { useHydrated } from "@/lib/hooks";
import { inferMoods, MAX_MOODS, MOOD_MAP, MOODS } from "@/lib/moods";
import { useMoodStore } from "@/lib/store";

/* Orbit positions (percent of the stage), starting at 12 o'clock. */
const ORBIT = MOODS.map((_, i) => {
  const angle = (i / MOODS.length) * Math.PI * 2 - Math.PI / 2;
  return { x: 50 + Math.cos(angle) * 41, y: 50 + Math.sin(angle) * 41 };
});

export default function MoodSelector() {
  const hydrated = useHydrated();
  const stored = useMoodStore((s) => s.prefs.moods);
  const description = useMoodStore((s) => s.prefs.description);
  const toggleMood = useMoodStore((s) => s.toggleMood);
  const setMoods = useMoodStore((s) => s.setMoods);
  const setPrefs = useMoodStore((s) => s.setPrefs);

  const selected = hydrated ? stored : [];
  const text = hydrated ? description : "";
  const detected = useMemo(() => inferMoods(text), [text]);
  const full = selected.length >= MAX_MOODS;
  const detectedIds = detected.map((d) => d.id);
  const alreadyApplied = detectedIds.length > 0 && detectedIds.every((id) => selected.includes(id));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
      {/* ── Free-text mood ── */}
      <section aria-labelledby="describe" className="holo p-5 md:p-7">
        <label id="describe" htmlFor="mood-text" className="hud mb-3 block">
          Describe your mood
        </label>
        <textarea
          id="mood-text"
          rows={4}
          maxLength={280}
          value={text}
          onChange={(e) => setPrefs({ description: e.target.value })}
          placeholder="e.g. Long week, a bit lonely, want something that makes me feel hopeful again…"
          className="field resize-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="hud text-[10px]!">{text.length}/280</span>
        </div>

        <div aria-live="polite" className="mt-4 min-h-16">
          {detected.length > 0 ? (
            <>
              <p className="hud mb-2">Signal detected</p>
              <div className="flex flex-wrap items-center gap-2">
                {detected.map((d) => (
                  <span
                    key={d.id}
                    className="rounded-full border px-3 py-1 text-xs"
                    style={{ borderColor: MOOD_MAP[d.id].colors[0], color: MOOD_MAP[d.id].colors[0] }}
                  >
                    {MOOD_MAP[d.id].glyph} {MOOD_MAP[d.id].label}
                  </span>
                ))}
                <button type="button" className="ghost-btn" disabled={alreadyApplied} onClick={() => setMoods(detectedIds)}>
                  {alreadyApplied ? "Armed" : "Arm these"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-faint">
              {text.trim().length > 8
                ? "No clear signal yet — keep typing, or pick from the orbit."
                : "CineMood listens for feeling-words and suggests spectrums as you type."}
            </p>
          )}
        </div>
      </section>

      {/* ── Orbital selector ── */}
      <section aria-labelledby="orbit-label">
        <h2 id="orbit-label" className="sr-only">
          Choose up to {MAX_MOODS} moods
        </h2>
        <div className="relative mx-auto grid max-w-[560px] grid-cols-2 gap-3 md:block md:aspect-square">
          {/* decorative rings + constellation lines (desktop) */}
          <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
            <span className="absolute inset-[9%] rounded-full border border-dashed border-line [animation:orbit_90s_linear_infinite]" />
            <span className="absolute inset-[27%] rounded-full border border-line/60 [animation:orbit_60s_linear_infinite_reverse]" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
              {MOODS.map((m, i) =>
                selected.includes(m.id) ? (
                  <motion.line
                    key={m.id}
                    x1="50"
                    y1="50"
                    x2={ORBIT[i].x}
                    y2={ORBIT[i].y}
                    stroke={m.colors[0]}
                    strokeWidth="0.35"
                    strokeDasharray="1.2 1.2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.9 }}
                    transition={{ duration: 0.6 }}
                  />
                ) : null,
              )}
            </svg>
          </div>

          {/* centre readout (desktop) */}
          <div
            aria-live="polite"
            className="pointer-events-none absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-center md:block"
          >
            <p className="display text-4xl tabular-nums">
              {selected.length}
              <span className="text-white/30">/{MAX_MOODS}</span>
            </p>
            <p className="hud mt-1">{selected.length ? "spectrums armed" : "select a spectrum"}</p>
          </div>

          {MOODS.map((m, i) => {
            const on = selected.includes(m.id);
            const locked = full && !on;
            return (
              <motion.button
                key={m.id}
                type="button"
                aria-pressed={on}
                disabled={locked}
                onClick={() => toggleMood(m.id)}
                whileTap={{ scale: 0.94 }}
                style={
                  {
                    "--x": `${ORBIT[i].x}%`,
                    "--y": `${ORBIT[i].y}%`,
                    "--mood-a": m.colors[0],
                    "--mood-b": m.colors[1],
                  } as React.CSSProperties
                }
                className={`group relative flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center backdrop-blur-md transition-[border-color,box-shadow,background,opacity] duration-500 md:absolute md:top-[var(--y)] md:left-[var(--x)] md:size-[124px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-full ${
                  on
                    ? "border-[var(--mood-a)] bg-[color-mix(in_oklab,var(--mood-a)_18%,rgb(8_10_28/0.7))] shadow-[0_0_42px_-6px_var(--mood-a),inset_0_0_24px_-8px_var(--mood-a)]"
                    : "border-line bg-[rgb(10_12_31/0.55)] hover:border-[var(--mood-a)] hover:shadow-[0_0_28px_-10px_var(--mood-a)]"
                } ${locked ? "cursor-not-allowed opacity-35" : "cursor-pointer"}`}
              >
                <span
                  aria-hidden
                  className="text-2xl text-[var(--mood-a)] transition-transform duration-500 group-hover:scale-125"
                  style={{ textShadow: "0 0 16px var(--mood-a)" }}
                >
                  {m.glyph}
                </span>
                <span className="text-[13px] leading-tight font-medium">{m.label}</span>
                <span className="text-[11px] leading-tight text-dim md:hidden">{m.blurb}</span>
              </motion.button>
            );
          })}
        </div>

        <p className="hud mt-5 text-center md:hidden" aria-live="polite">
          {selected.length}/{MAX_MOODS} armed
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 lg:col-span-2">
        <p className="text-sm text-dim">
          {full ? "Maximum reached — release one to swap." : "Blend moods for stranger, more specific picks."}
        </p>
        {selected.length > 0 ? (
          <Link href="/calibrate" className="neon-btn">
            Calibrate <span aria-hidden>→</span>
          </Link>
        ) : (
          <button type="button" className="neon-btn" disabled>
            Select a mood
          </button>
        )}
      </div>
    </div>
  );
}
