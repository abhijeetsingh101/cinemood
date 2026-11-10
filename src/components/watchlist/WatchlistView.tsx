"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Poster from "@/components/ui/Poster";
import { Notice } from "@/components/ui/States";
import { useHydrated } from "@/lib/hooks";
import { supabaseEnabled } from "@/lib/supabase";
import { useWatchlist } from "@/lib/watchlist";

export default function WatchlistView() {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const items = useWatchlist((s) => s.items);
  const userId = useWatchlist((s) => s.userId);
  const syncError = useWatchlist((s) => s.syncError);
  const remove = useWatchlist((s) => s.remove);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-busy="true" aria-label="Loading watchlist">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton aspect-[2/3]" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <Notice title="The vault is empty" action={<Link href="/mood" className="neon-btn">Find something to watch</Link>}>
        Save films from your results and they will wait for you here.
      </Notice>
    );
  }

  return (
    <>
      <p className="hud mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>
          {items.length} film{items.length === 1 ? "" : "s"}
        </span>
        <span className="text-faint">
          {userId ? "Synced to your account" : supabaseEnabled ? "Saved on this device · sign in to sync" : "Saved on this device"}
        </span>
        {!userId && supabaseEnabled && (
          <Link href="/profile" className="text-[var(--mood-a)] underline underline-offset-4">
            Sign in
          </Link>
        )}
      </p>
      {syncError && (
        <p role="alert" className="mb-6 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {syncError}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.li
              key={item.imdbID}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, filter: "blur(8px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              <Link href={`/movie/${item.imdbID}`} className="block">
                <div className="transition-transform duration-500 group-hover:-translate-y-2">
                  <Poster src={item.poster} title={item.title} />
                </div>
                <span className="mt-3 block text-sm leading-snug group-hover:text-[var(--mood-a)]">{item.title}</span>
              </Link>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-faint">{item.year ?? "—"}</span>
                <button
                  type="button"
                  onClick={() => remove(item.imdbID)}
                  aria-label={`Remove ${item.title} from watchlist`}
                  className="-mr-2 min-h-10 px-2 text-xs text-dim underline-offset-4 hover:text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </>
  );
}
