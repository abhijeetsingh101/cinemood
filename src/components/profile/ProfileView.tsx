"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useHydrated } from "@/lib/hooks";
import { MOODS, MOOD_MAP } from "@/lib/moods";
import { useMoodStore, type EffectsLevel } from "@/lib/store";
import { getSupabase, supabaseEnabled } from "@/lib/supabase";
import type { MoodId } from "@/lib/types";
import { useWatchlist } from "@/lib/watchlist";

const EFFECTS: { id: EffectsLevel; label: string; hint: string }[] = [
  { id: "full", label: "Full", hint: "3D universe at full detail" },
  { id: "lite", label: "Lite", hint: "Fewer particles, easier on battery" },
  { id: "off", label: "Off", hint: "Still backdrop, no 3D" },
];

type AuthState = { status: "idle" | "sending" | "sent" | "error"; message?: string };

export default function ProfileView() {
  const hydrated = useHydrated();
  const history = useMoodStore((s) => s.history);
  const displayName = useMoodStore((s) => s.displayName);
  const effects = useMoodStore((s) => s.effects);
  const setDisplayName = useMoodStore((s) => s.setDisplayName);
  const setEffects = useMoodStore((s) => s.setEffects);
  const clearHistory = useMoodStore((s) => s.clearHistory);
  const setMoods = useMoodStore((s) => s.setMoods);
  const saved = useWatchlist((s) => s.items.length);
  const syncError = useWatchlist((s) => s.syncError);

  const [email, setEmail] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [auth, setAuth] = useState<AuthState>({ status: "idle" });

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data } = sb.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  /** Share of sessions each mood appeared in, highest first. */
  const spectrum = useMemo(() => {
    const counts = new Map<MoodId, number>();
    for (const h of history) for (const m of h.moods) counts.set(m, (counts.get(m) ?? 0) + 1);
    const max = Math.max(1, ...counts.values());
    return MOODS.map((m) => ({ mood: m, count: counts.get(m.id) ?? 0, ratio: (counts.get(m.id) ?? 0) / max })).sort(
      (a, b) => b.count - a.count,
    );
  }, [history]);

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setAuth({ status: "sending" });
    const { error } = await sb.auth.signInWithOtp({
      email: input.trim(),
      options: { emailRedirectTo: `${window.location.origin}/profile` },
    });
    setAuth(
      error
        ? { status: "error", message: error.message }
        : { status: "sent", message: `Sign-in link sent to ${input.trim()}. Open it on this device.` },
    );
  }

  async function signOut() {
    await getSupabase()?.auth.signOut();
    setAuth({ status: "idle" });
  }

  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-5" aria-busy="true" aria-label="Loading profile">
        <div className="skeleton h-80 lg:col-span-3" />
        <div className="skeleton h-80 lg:col-span-2" />
      </div>
    );
  }

  const top = spectrum[0]?.count ? spectrum[0].mood : null;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Mood spectrum */}
      <section className="holo p-6 md:p-8 lg:col-span-3" aria-labelledby="spectrum-h">
        <h2 id="spectrum-h" className="display text-xl">
          Mood spectrum
        </h2>
        <dl className="mt-5 grid grid-cols-3 gap-4 border-b border-line pb-6">
          <div>
            <dt className="hud">Sessions</dt>
            <dd className="display mt-1 text-2xl">{history.length}</dd>
          </div>
          <div>
            <dt className="hud">Saved films</dt>
            <dd className="display mt-1 text-2xl">{saved}</dd>
          </div>
          <div>
            <dt className="hud">Most felt</dt>
            <dd className="display mt-1 text-base leading-8" style={{ color: top?.colors[0] }}>
              {top?.label ?? "—"}
            </dd>
          </div>
        </dl>

        {history.length === 0 ? (
          <p className="mt-6 text-sm text-dim">
            Nothing recorded yet. Each time you ask for recommendations, the moods you chose are added here.{" "}
            <Link href="/mood" className="text-[var(--mood-a)] underline underline-offset-4">
              Choose a mood
            </Link>
          </p>
        ) : (
          <>
            <ul className="mt-6 space-y-3">
              {spectrum.map(({ mood, count, ratio }) => (
                <li key={mood.id} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className={count ? "" : "text-faint"}>{mood.label}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-white/5" aria-hidden>
                    <span
                      className="block h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${ratio * 100}%`,
                        background: `linear-gradient(90deg, ${mood.colors[0]}, ${mood.colors[1]})`,
                        boxShadow: `0 0 12px ${mood.colors[0]}`,
                      }}
                    />
                  </span>
                  <span className="text-right text-xs text-dim tabular-nums">{count}</span>
                </li>
              ))}
            </ul>

            <h3 className="hud mt-8 mb-3">Recent sessions</h3>
            <ul className="divide-y divide-line">
              {history.slice(0, 6).map((h) => (
                <li key={h.at} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="flex flex-wrap gap-2">
                    {h.moods.map((id) => (
                      <span key={id} className="text-sm" style={{ color: MOOD_MAP[id]?.colors[0] }}>
                        {MOOD_MAP[id]?.label ?? id}
                      </span>
                    ))}
                  </span>
                  <span className="flex items-center gap-3">
                    <time dateTime={h.at} className="text-xs text-faint">
                      {new Date(h.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </time>
                    <Link
                      href="/calibrate"
                      onClick={() => setMoods(h.moods)}
                      className="min-h-10 content-center text-xs text-dim underline underline-offset-4 hover:text-ink"
                    >
                      Use again
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={clearHistory} className="ghost-btn mt-6">
              Clear mood history
            </button>
          </>
        )}
      </section>

      <div className="space-y-6 lg:col-span-2">
        {/* Account */}
        <section className="holo p-6 md:p-8" aria-labelledby="account-h">
          <h2 id="account-h" className="display text-xl">
            Account
          </h2>

          <label className="mt-5 block">
            <span className="hud mb-2 block">Display name</span>
            <input
              className="field w-full"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              maxLength={40}
              autoComplete="nickname"
            />
          </label>

          <div className="mt-6 border-t border-line pt-6">
            {!supabaseEnabled ? (
              <p className="text-sm leading-relaxed text-dim">
                Your watchlist and history are saved on this device. Account sync is not set up on this deployment.
              </p>
            ) : email ? (
              <>
                <p className="text-sm text-dim">
                  Signed in as <span className="text-ink">{email}</span>. Your watchlist syncs across devices.
                </p>
                {syncError && (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    {syncError}
                  </p>
                )}
                <button type="button" onClick={signOut} className="ghost-btn mt-4">
                  Sign out
                </button>
              </>
            ) : (
              <form onSubmit={sendLink}>
                <label className="block">
                  <span className="hud mb-2 block">Email</span>
                  <input
                    className="field w-full"
                    type="email"
                    required
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <p className="mt-2 text-xs text-faint">
                  We email you a sign-in link. No password. Films saved on this device are kept and merged.
                </p>
                <button type="submit" className="neon-btn mt-4" disabled={auth.status === "sending"}>
                  {auth.status === "sending" ? "Sending link" : "Email me a sign-in link"}
                </button>
                {auth.message && (
                  <p
                    role={auth.status === "error" ? "alert" : "status"}
                    className={`mt-3 text-sm ${auth.status === "error" ? "text-danger" : "text-[var(--mood-a)]"}`}
                  >
                    {auth.status === "error" ? `Link not sent: ${auth.message}` : auth.message}
                  </p>
                )}
              </form>
            )}
          </div>
        </section>

        {/* Visual effects */}
        <section className="holo p-6 md:p-8" aria-labelledby="effects-h">
          <h2 id="effects-h" className="display text-xl">
            Visual effects
          </h2>
          <div role="radiogroup" aria-labelledby="effects-h" className="mt-5 flex flex-wrap gap-2">
            {EFFECTS.map((e) => (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={effects === e.id}
                onClick={() => setEffects(e.id)}
                className="chip"
              >
                {e.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-dim">{EFFECTS.find((e) => e.id === effects)?.hint}</p>
          <p className="mt-2 text-xs text-faint">
            If your system is set to reduce motion, the 3D universe stays off regardless of this setting.
          </p>
        </section>
      </div>
    </div>
  );
}
