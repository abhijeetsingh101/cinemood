export type MoodId =
  | "mind-blown"
  | "emotional"
  | "adrenaline"
  | "romantic"
  | "mysterious"
  | "motivational"
  | "dark"
  | "escape";

export type Ending = "happy" | "bittersweet" | "twist" | "tragic" | "open";
export type EndingPref = Ending | "any";

/** Everything the user configures before asking for recommendations. */
export interface Prefs {
  moods: MoodId[];
  description: string;
  /** 1 (gentle) – 10 (overwhelming) */
  intensity: number;
  genres: string[];
  /** "any" or an OMDb language name, e.g. "Hindi" */
  language: string;
  /** minutes, inclusive */
  runtime: [number, number];
  minRating: number;
  years: [number, number];
  ending: EndingPref;
}

/** Normalised OMDb title. */
export interface Movie {
  imdbID: string;
  title: string;
  year: number | null;
  rated: string | null;
  released: string | null;
  runtime: number | null;
  genres: string[];
  director: string | null;
  writer: string | null;
  actors: string[];
  plot: string | null;
  languages: string[];
  country: string | null;
  awards: string | null;
  poster: string | null;
  imdbRating: number | null;
  imdbVotes: string | null;
  metascore: number | null;
  boxOffice: string | null;
  ratings: { source: string; value: string }[];
}

export interface SearchHit {
  imdbID: string;
  title: string;
  year: string;
  poster: string | null;
}

export interface ScoreBreakdown {
  mood: number;
  genre: number;
  plot: number;
  rating: number;
  runtime: number;
  year: number;
}

export interface Recommendation {
  movie: Movie;
  /** 0–99 compatibility */
  score: number;
  breakdown: ScoreBreakdown;
  reasons: string[];
  matchedMoods: MoodId[];
}

export interface RecommendResponse {
  results: Recommendation[];
  /** true when OMDB_API_KEY is missing and only the curated atlas was used */
  demo: boolean;
  considered: number;
}

export interface WatchlistItem {
  imdbID: string;
  title: string;
  year: number | null;
  poster: string | null;
  addedAt: string;
}

export interface ApiError {
  error: string;
  code: string;
}
