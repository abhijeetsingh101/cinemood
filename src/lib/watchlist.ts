"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSupabase } from "./supabase";
import type { WatchlistItem } from "./types";

/**
 * Watchlist store.
 *
 * Local-first: every change lands in localStorage immediately. When a user
 * is signed in, changes are mirrored to Supabase and the two sides are
 * merged on sign-in, so a list started anonymously is never lost.
 */
interface WatchlistState {
  items: WatchlistItem[];
  userId: string | null;
  syncError: string | null;
  has: (id: string) => boolean;
  toggle: (item: Omit<WatchlistItem, "addedAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** call with the signed-in user id (or null on sign-out) */
  attachUser: (userId: string | null) => Promise<void>;
}

type Row = { imdb_id: string; title: string; year: number | null; poster: string | null; added_at: string };

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      syncError: null,

      has: (id) => get().items.some((i) => i.imdbID === id),

      toggle: (item) => {
        if (get().has(item.imdbID)) return get().remove(item.imdbID);
        const full: WatchlistItem = { ...item, addedAt: new Date().toISOString() };
        set((s) => ({ items: [full, ...s.items] }));
        const { userId } = get();
        const sb = getSupabase();
        if (sb && userId) {
          sb.from("watchlist")
            .upsert({ user_id: userId, imdb_id: full.imdbID, title: full.title, year: full.year, poster: full.poster, added_at: full.addedAt })
            .then(({ error }) => set({ syncError: error ? "Could not sync to your account. Saved on this device." : null }));
        }
      },

      remove: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.imdbID !== id) }));
        const { userId } = get();
        const sb = getSupabase();
        if (sb && userId) {
          sb.from("watchlist")
            .delete()
            .eq("user_id", userId)
            .eq("imdb_id", id)
            .then(({ error }) => set({ syncError: error ? "Could not sync the removal to your account." : null }));
        }
      },

      clear: () => {
        const { userId } = get();
        set({ items: [] });
        const sb = getSupabase();
        if (sb && userId) void sb.from("watchlist").delete().eq("user_id", userId);
      },

      attachUser: async (userId) => {
        set({ userId, syncError: null });
        const sb = getSupabase();
        if (!sb || !userId) return;

        const { data, error } = await sb
          .from("watchlist")
          .select("imdb_id,title,year,poster,added_at")
          .eq("user_id", userId);
        if (error) {
          set({ syncError: "Could not load your cloud watchlist. Showing this device's list." });
          return;
        }
        const remote: WatchlistItem[] = ((data ?? []) as Row[]).map((r) => ({
          imdbID: r.imdb_id, title: r.title, year: r.year, poster: r.poster, addedAt: r.added_at,
        }));
        const remoteIds = new Set(remote.map((r) => r.imdbID));
        const localOnly = get().items.filter((i) => !remoteIds.has(i.imdbID));

        if (localOnly.length) {
          await sb.from("watchlist").upsert(
            localOnly.map((i) => ({
              user_id: userId, imdb_id: i.imdbID, title: i.title, year: i.year, poster: i.poster, added_at: i.addedAt,
            })),
          );
        }
        set({
          items: [...localOnly, ...remote].sort((a, b) => b.addedAt.localeCompare(a.addedAt)),
        });
      },
    }),
    { name: "cinemood:watchlist", version: 1, partialize: (s) => ({ items: s.items }) },
  ),
);
