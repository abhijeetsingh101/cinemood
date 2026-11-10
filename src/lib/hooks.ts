"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/** False on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Tracks the OS-level "reduce motion" setting. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export type GpuTier = "none" | "low" | "high";

/** One-off capability probe: is WebGL available, and is this a weak device? */
export function detectGpuTier(): GpuTier {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "none";
    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return cores <= 4 || mem <= 4 || small ? "low" : "high";
  } catch {
    return "none";
  }
}

export function useGpuTier(): GpuTier | null {
  const [tier, setTier] = useState<GpuTier | null>(null);
  useEffect(() => {
    // Probe after first paint so the scene never blocks initial render.
    const id = window.setTimeout(() => setTier(detectGpuTier()), 0);
    return () => window.clearTimeout(id);
  }, []);
  return tier;
}
