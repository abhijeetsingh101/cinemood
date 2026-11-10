"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PREFS, MAX_MOODS } from "./moods";
import type { MoodId, Prefs, RecommendResponse } from "./types";

export type EffectsLevel = "full" | "lite" | "off";

interface HistoryEntry {
  moods: MoodId[];
  at: string;
}

interface MoodState {
  prefs: Prefs;
  history: HistoryEntry[];
  displayName: string;
  effects: EffectsLevel;
  /** last result set, keyed by the prefs that produced it (not persisted) */
  cache: { key: string; data: RecommendResponse } | null;

  toggleMood: (id: MoodId) => void;
  setMoods: (ids: MoodId[]) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  resetPrefs: () => void;
  logSession: (moods: MoodId[]) => void;
  setCache: (key: string, data: RecommendResponse) => void;
  setDisplayName: (name: string) => void;
  setEffects: (level: EffectsLevel) => void;
  clearHistory: () => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set) => ({
      prefs: DEFAULT_PREFS,
      history: [],
      displayName: "",
      effects: "full",
      cache: null,

      toggleMood: (id) =>
        set((s) => {
          const has = s.prefs.moods.includes(id);
          if (!has && s.prefs.moods.length >= MAX_MOODS) return s;
          const moods = has ? s.prefs.moods.filter((m) => m !== id) : [...s.prefs.moods, id];
          return { prefs: { ...s.prefs, moods } };
        }),
      setMoods: (ids) => set((s) => ({ prefs: { ...s.prefs, moods: ids.slice(0, MAX_MOODS) } })),
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      resetPrefs: () => set({ prefs: DEFAULT_PREFS, cache: null }),
      logSession: (moods) =>
        set((s) => ({
          history: [{ moods, at: new Date().toISOString() }, ...s.history].slice(0, 60),
        })),
      setCache: (key, data) => set({ cache: { key, data } }),
      setDisplayName: (displayName) => set({ displayName: displayName.slice(0, 40) }),
      setEffects: (effects) => set({ effects }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "cinemood:session",
      version: 1,
      partialize: (s) => ({
        prefs: s.prefs,
        history: s.history,
        displayName: s.displayName,
        effects: s.effects,
      }),
    },
  ),
);
