"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Component, useEffect, type ReactNode } from "react";
import { useGpuTier, useHydrated, usePrefersReducedMotion } from "@/lib/hooks";
import { MOOD_MAP } from "@/lib/moods";
import { useMoodStore } from "@/lib/store";

// three.js is ~150 kB gzipped: load it after first paint, client-only.
const Universe = dynamic(() => import("./Universe"), { ssr: false });

/** If WebGL dies at runtime (context loss, driver bug), keep the CSS backdrop. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Chooses how the universe is rendered:
 *   • WebGL scene — default on capable devices
 *   • CSS aurora backdrop — always present underneath, and the only layer
 *     when WebGL is missing, the user prefers reduced motion, or effects
 *     are switched off in the profile.
 * Also publishes the active mood palette as CSS variables for the UI.
 */
export default function SceneRoot() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const reduced = usePrefersReducedMotion();
  const tier = useGpuTier();
  const moods = useMoodStore((s) => s.prefs.moods);
  const effects = useMoodStore((s) => s.effects);

  const first = hydrated && moods[0] ? MOOD_MAP[moods[0]] : null;
  const second = hydrated && moods[1] ? MOOD_MAP[moods[1]] : null;
  const colorA = first?.colors[0] ?? "#5ef2ff";
  const colorB = second?.colors[0] ?? first?.colors[1] ?? "#8b5cff";

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--mood-a", colorA);
    root.style.setProperty("--mood-b", colorB);
  }, [colorA, colorB]);

  const webgl = hydrated && tier !== null && tier !== "none" && !reduced && effects !== "off";

  return (
    <>
      <div className="backdrop" data-quiet={webgl} aria-hidden>
        <div className="aurora aurora-a" />
        <div className="aurora aurora-b" />
      </div>
      {webgl && (
        <SceneBoundary>
          <Universe
            colorA={colorA}
            colorB={colorB}
            route={pathname}
            quality={tier === "low" || effects === "lite" ? "low" : "high"}
          />
        </SceneBoundary>
      )}
      <div className="cine-overlay" aria-hidden />
    </>
  );
}
