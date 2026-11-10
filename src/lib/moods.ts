import type { MoodId } from "./types";

export interface MoodDef {
  id: MoodId;
  label: string;
  blurb: string;
  glyph: string;
  /** primary / secondary neon used by UI and the 3D scene */
  colors: [string, string];
  /** OMDb genre → affinity (0–1) */
  genres: Record<string, number>;
  /** words a person uses to describe this feeling */
  signals: string[];
  /** words that show up in plots of films with this feeling */
  plotWords: string[];
  /** title-search seeds for OMDb candidate discovery */
  searchTerms: string[];
  /** how intense the mood is by nature (0–1) */
  baseIntensity: number;
}

export const MOODS: MoodDef[] = [
  {
    id: "mind-blown",
    label: "Mind-Blown",
    blurb: "Bend reality. Question everything.",
    glyph: "◈",
    colors: ["#5ef2ff", "#8b5cff"],
    genres: { "Sci-Fi": 1, Mystery: 0.8, Thriller: 0.6, Fantasy: 0.4, Drama: 0.3 },
    signals: ["mind", "blown", "think", "thinking", "twist", "trippy", "confus", "puzzle", "philosoph", "complex", "smart", "clever", "brain", "wtf", "reality", "curious", "cerebral", "deep"],
    plotWords: ["dream", "reality", "memory", "time", "paradox", "simulation", "identity", "consciousness", "dimension", "loop", "parallel", "illusion", "experiment", "mind", "universe", "artificial"],
    searchTerms: ["paradox", "dimension", "mind", "simulation", "infinity", "memory"],
    baseIntensity: 0.7,
  },
  {
    id: "emotional",
    label: "Emotional",
    blurb: "Feel it all. Let it out.",
    glyph: "❖",
    colors: ["#7aa7ff", "#ff8fb1"],
    genres: { Drama: 1, Family: 0.6, Biography: 0.6, Romance: 0.6, Animation: 0.4, War: 0.5, Music: 0.3 },
    signals: ["sad", "cry", "tears", "emotional", "feel", "feels", "heartbroken", "lonely", "alone", "grief", "miss", "nostalg", "melanchol", "blue", "moved", "cathar", "heavy", "lost", "hurt", "homesick"],
    plotWords: ["family", "loss", "grief", "father", "mother", "son", "daughter", "friendship", "dying", "love", "memories", "childhood", "sacrifice", "forgive", "reunite", "illness", "orphan"],
    searchTerms: ["goodbye", "father", "letters", "home", "memories", "heart"],
    baseIntensity: 0.6,
  },
  {
    id: "adrenaline",
    label: "Adrenaline",
    blurb: "Pulse up. No brakes.",
    glyph: "⟁",
    colors: ["#ff7a3d", "#ff2e63"],
    genres: { Action: 1, Thriller: 0.7, Adventure: 0.6, Crime: 0.5, War: 0.5, Sport: 0.3, "Sci-Fi": 0.3 },
    signals: ["adrenaline", "action", "hype", "hyped", "energy", "energetic", "pumped", "thrill", "excited", "restless", "fast", "explos", "fight", "intense", "wired", "rush", "bored"],
    plotWords: ["chase", "assassin", "heist", "mission", "war", "fight", "escape", "agent", "revenge", "race", "survive", "soldier", "hunt", "bomb", "hostage", "mercenary", "battle"],
    searchTerms: ["fury", "strike", "mission", "heist", "speed", "war"],
    baseIntensity: 0.85,
  },
  {
    id: "romantic",
    label: "Romantic",
    blurb: "Soft light. Slow burn.",
    glyph: "♡",
    colors: ["#ff4fd8", "#ffb86b"],
    genres: { Romance: 1, Comedy: 0.5, Drama: 0.5, Musical: 0.5, Music: 0.3 },
    signals: ["love", "romantic", "romance", "crush", "date", "cozy", "cuddle", "warm", "butterflies", "longing", "valentine", "partner", "girlfriend", "boyfriend", "wife", "husband", "tender", "flirt"],
    plotWords: ["love", "falls", "romance", "wedding", "marriage", "couple", "relationship", "lovers", "heart", "kiss", "soulmate", "affair", "courtship", "engaged"],
    searchTerms: ["love", "wedding", "heart", "kiss", "summer", "paris"],
    baseIntensity: 0.35,
  },
  {
    id: "mysterious",
    label: "Mysterious",
    blurb: "Follow the thread into the fog.",
    glyph: "◐",
    colors: ["#3de8b0", "#2d7dff"],
    genres: { Mystery: 1, Thriller: 0.7, Crime: 0.7, "Film-Noir": 0.8, Horror: 0.3, Drama: 0.2 },
    signals: ["myster", "curious", "detective", "whodunit", "secret", "suspens", "intrigu", "puzzle", "investigat", "noir", "crime", "clue", "suspicious", "eerie", "enigma"],
    plotWords: ["detective", "murder", "disappearance", "investigation", "secret", "missing", "conspiracy", "clue", "killer", "suspect", "mystery", "vanish", "truth", "case", "stranger"],
    searchTerms: ["secret", "mystery", "missing", "detective", "shadow", "stranger"],
    baseIntensity: 0.6,
  },
  {
    id: "motivational",
    label: "Motivational",
    blurb: "Get up. Go again.",
    glyph: "△",
    colors: ["#ffd23f", "#ff7a3d"],
    genres: { Biography: 1, Sport: 1, Drama: 0.5, History: 0.5, Music: 0.4, Family: 0.3 },
    signals: ["motivat", "inspir", "stuck", "tired", "lazy", "goal", "dream", "ambition", "hustle", "work", "exam", "study", "gym", "grind", "confidence", "burnout", "giving up", "procrastinat", "discipline", "hope"],
    plotWords: ["champion", "dream", "overcome", "struggle", "true story", "coach", "team", "underdog", "determination", "against all odds", "inspiring", "training", "win", "persever", "teacher", "prodigy"],
    searchTerms: ["champion", "dream", "rise", "glory", "believe", "legend"],
    baseIntensity: 0.55,
  },
  {
    id: "dark",
    label: "Dark",
    blurb: "Lights off. Look anyway.",
    glyph: "◆",
    colors: ["#b21f4a", "#5b2a9d"],
    genres: { Horror: 1, Crime: 0.8, Thriller: 0.8, Drama: 0.4, Mystery: 0.5, "Film-Noir": 0.6 },
    signals: ["dark", "angry", "rage", "bleak", "disturb", "creepy", "scary", "horror", "grim", "twisted", "violent", "nihil", "cynical", "morbid", "unsettl", "numb", "bitter"],
    plotWords: ["serial killer", "murder", "obsession", "violence", "madness", "revenge", "descent", "psychopath", "corruption", "cult", "demon", "haunted", "brutal", "addiction", "crime", "sinister"],
    searchTerms: ["night", "blood", "dark", "killer", "devil", "evil"],
    baseIntensity: 0.9,
  },
  {
    id: "escape",
    label: "Escape Reality",
    blurb: "Somewhere else. Anywhere else.",
    glyph: "✦",
    colors: ["#a6ff5e", "#5ef2ff"],
    genres: { Fantasy: 1, Adventure: 0.9, Animation: 0.8, "Sci-Fi": 0.6, Family: 0.5, Comedy: 0.3, Musical: 0.3 },
    signals: ["escape", "escap", "fantasy", "magic", "adventure", "wander", "travel", "wonder", "stress", "overwhelm", "anxious", "anxiety", "break", "away", "dreamy", "whimsical", "another world", "relax", "unwind"],
    plotWords: ["magical", "kingdom", "journey", "quest", "wizard", "galaxy", "world", "adventure", "spirit", "planet", "creature", "legend", "enchanted", "voyage", "realm", "island", "dragon"],
    searchTerms: ["kingdom", "magic", "journey", "galaxy", "island", "wonder"],
    baseIntensity: 0.4,
  },
];

export const MOOD_MAP: Record<MoodId, MoodDef> = Object.fromEntries(
  MOODS.map((m) => [m.id, m]),
) as Record<MoodId, MoodDef>;

export const MOOD_IDS = MOODS.map((m) => m.id);
export const MAX_MOODS = 3;

export const GENRES = [
  "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Drama",
  "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance",
  "Sci-Fi", "Sport", "Thriller", "War",
];

export const LANGUAGES = [
  "any", "English", "Hindi", "Japanese", "Korean", "French", "Spanish",
  "Italian", "Mandarin", "Portuguese", "Telugu",
];

export const RUNTIME_PRESETS: { label: string; value: [number, number] }[] = [
  { label: "Any length", value: [0, 400] },
  { label: "Under 100 min", value: [0, 100] },
  { label: "100–130 min", value: [100, 130] },
  { label: "130–160 min", value: [130, 160] },
  { label: "Epic 160+", value: [160, 400] },
];

export const CURRENT_YEAR = new Date().getFullYear();

export const ERA_PRESETS: { label: string; value: [number, number] }[] = [
  { label: "Any era", value: [1920, CURRENT_YEAR] },
  { label: "Classics · pre-1980", value: [1920, 1979] },
  { label: "1980–1999", value: [1980, 1999] },
  { label: "2000–2014", value: [2000, 2014] },
  { label: "2015–now", value: [2015, CURRENT_YEAR] },
];

export const ENDINGS: { id: "any" | "happy" | "bittersweet" | "twist" | "tragic" | "open"; label: string }[] = [
  { id: "any", label: "Surprise me" },
  { id: "happy", label: "Uplifting" },
  { id: "bittersweet", label: "Bittersweet" },
  { id: "twist", label: "Twist" },
  { id: "tragic", label: "Devastating" },
  { id: "open", label: "Open-ended" },
];

export const DEFAULT_PREFS = {
  moods: [] as MoodId[],
  description: "",
  intensity: 6,
  genres: [] as string[],
  language: "any",
  runtime: [0, 400] as [number, number],
  minRating: 6.5,
  years: [1920, CURRENT_YEAR] as [number, number],
  ending: "any" as const,
};

const STOP = new Set(
  "a an and the i im i'm me my to of in on for with want need something some feel feeling like really very just so that this it is am are be been was have had movie movies film films watch tonight today day night after long bit kind sort little lot not no but or if about into from at as".split(" "),
);

/** Lower-cased meaningful tokens from free text. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * Infer up to three moods from a free-text description by matching
 * signal stems. Returns moods ordered by strength.
 */
export function inferMoods(text: string): { id: MoodId; hits: number }[] {
  const lower = ` ${text.toLowerCase()} `;
  if (lower.trim().length < 3) return [];
  return MOODS.map((m) => ({
    id: m.id,
    hits: m.signals.reduce((n, s) => (lower.includes(s) ? n + 1 : n), 0),
  }))
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, MAX_MOODS);
}
