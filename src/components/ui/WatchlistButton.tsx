"use client";

import { useHydrated } from "@/lib/hooks";
import { useWatchlist } from "@/lib/watchlist";

interface Props {
  movie: { imdbID: string; title: string; year: number | null; poster: string | null };
  compact?: boolean;
}

export default function WatchlistButton({ movie, compact = false }: Props) {
  const hydrated = useHydrated();
  const saved = useWatchlist((s) => s.items.some((i) => i.imdbID === movie.imdbID));
  const toggle = useWatchlist((s) => s.toggle);
  const on = hydrated && saved;

  return (
    <button
      type="button"
      className="ghost-btn"
      aria-pressed={on}
      aria-label={on ? `Remove ${movie.title} from watchlist` : `Save ${movie.title} to watchlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ imdbID: movie.imdbID, title: movie.title, year: movie.year, poster: movie.poster });
      }}
    >
      <span aria-hidden>{on ? "✓" : "+"}</span>
      {compact ? (on ? "Saved" : "Save") : on ? "In watchlist" : "Add to watchlist"}
    </button>
  );
}
