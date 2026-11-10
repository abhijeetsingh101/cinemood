# CineMood

**Discover movies that match your mood.**

CineMood is an immersive movie discovery site. You describe how you feel (or pick up to three moods), tune a few dials, and a custom recommendation engine returns films scored for that emotional state, each with the reasons it was picked.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Three.js / React Three Fiber, GSAP, Framer Motion, the OMDb API and Supabase.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

| Variable | Required | Where it is used |
| --- | --- | --- |
| `OMDB_API_KEY` | For real data | Server only. Free key: https://www.omdbapi.com/apikey.aspx |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Browser. Enables sign-in and cloud watchlist |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Browser. Safe to expose; data is protected by RLS |

The app runs with none of them set:

- **No OMDb key → demo mode.** Recommendations come from the built-in atlas of 186 mood-tagged films, scored on mood fit and release era only. No posters, plots, ratings, search or detail pages. A banner says so.
- **No Supabase → local mode.** The watchlist and mood history are stored in the browser. Sign-in is hidden.

Scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## How it works

### User flow

| Route | Purpose |
| --- | --- |
| `/` | Homepage: 3D hero and the eight moods |
| `/mood` | Describe a mood in words and/or pick up to three moods |
| `/calibrate` | Intensity, genres, language, runtime, minimum rating, release era, ending |
| `/results` | Scored recommendations with a per-signal breakdown and reasons |
| `/movie/[id]` | Full plot, cast, director, ratings, similar films |
| `/watchlist` | Saved films (device, or synced when signed in) |
| `/profile` | Mood history, account, visual-effects level |

### Recommendation engine (`src/lib/engine.ts`)

OMDb has no mood filter and no discovery endpoint, so the engine does its own:

1. **Discover candidates.** Atlas films tagged with the chosen moods (`src/lib/catalog.ts`), plus OMDb title searches seeded by each mood and by the user's own words.
2. **Hydrate.** Each candidate is fetched from OMDb by IMDb ID with the full plot. If an atlas ID resolves to a different title, the engine retries by title and year.
3. **Filter.** Language, minimum IMDb rating, runtime window and release era.
4. **Score** on six weighted signals:

| Signal | Weight | Source |
| --- | --- | --- |
| Mood compatibility | 34% | Atlas mood tags, mood→genre affinity, intensity fit |
| Genre compatibility | 20% | Your genre picks, else mood→genre mapping |
| Plot relevance | 14% | Mood vocabulary and your words found in the full plot |
| IMDb rating | 16% | 5.0 → 0, 9.0 → 1 |
| Runtime | 8% | Full marks inside your window, fading outside |
| Release year | 8% | Same, fading over a decade |

An ending preference adds or subtracts a few points for atlas films. Every result carries up to four plain-language reasons. Weights live in `WEIGHTS`; mood definitions (genres, vocabulary, colours, search seeds) live in `src/lib/moods.ts`. To grow the atlas, add rows to `catalog.ts`.

### OMDb integration (`src/lib/omdb.ts`)

- The module imports `server-only`, so it cannot be bundled into client code. The browser only calls this app's own routes.
- Responses are cached with Next's `use cache` for weeks; movie metadata rarely changes, and this keeps usage inside OMDb's daily quota (1,000 requests on the free tier).
- Errors are mapped to typed codes (`missing_key`, `invalid_key`, `rate_limited`, `not_found`, `upstream`) and shown as specific messages in the UI.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/recommend` | POST | Body: preferences. Returns scored picks |
| `/api/similar/[id]` | GET | Films sharing a film's mood profile |
| `/api/omdb/search?q=` | GET | Title search |
| `/api/omdb/title/[id]` | GET | Full details by IMDb ID |

All routes validate input (`src/lib/validate.ts`) and are rate limited per IP (`src/lib/rate-limit.ts`). The limiter is in-memory per server instance; for a strict global limit, back it with a shared store such as Upstash.

### Visual layer

- `src/components/scene/Universe.tsx` is one persistent WebGL scene behind every page: a shader particle field, a wireframe core and drifting shards. The camera glides to a new pose on each route, and the palette cross-fades to the selected moods.
- `SceneRoot.tsx` decides what to render. three.js is loaded after first paint, client-only. A CSS aurora backdrop is always underneath and is the only layer when WebGL is unavailable, when the OS asks for reduced motion, or when effects are turned off in the profile. Low-power devices get a lighter scene.
- Design tokens and component classes (`holo`, `neon-btn`, `chip`, `hud`) are in `src/app/globals.css`. Fonts are self-hosted through Fontsource, so builds need no font network requests.

### Project layout

```
src/
  app/                 routes, API handlers, layout, error and 404 pages
  components/
    scene/             WebGL universe and its fallback logic
    ui/                Nav, Poster, MovieCard, ScoreRing, Tilt, states
    home|mood|calibrate|results|movie|watchlist|profile/
  lib/
    engine.ts          recommendation engine
    catalog.ts         mood-tagged film atlas
    moods.ts           mood definitions and text → mood parsing
    omdb.ts            server-only OMDb client
    store.ts           preferences, history, settings (persisted)
    watchlist.ts       local-first watchlist with Supabase sync
supabase/schema.sql    watchlist table and row-level security
```

## Supabase setup (optional)

1. Create a project at https://supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run. This creates `watchlist` with row-level security so each user can only read and write their own rows.
3. Authentication → URL Configuration: set **Site URL** to your production URL and add `http://localhost:3000/profile` and `https://YOUR_DOMAIN/profile` to **Redirect URLs**.
4. Project Settings → API: copy the project URL and anon key into the two `NEXT_PUBLIC_SUPABASE_*` variables.

Sign-in is by emailed magic link. Films saved before signing in are merged into the account on first sign-in.

## Deploying to Vercel

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel: **Add New → Project**, import the repository. The framework preset is detected; no build settings need changing.
3. Add the environment variables from the table above under **Settings → Environment Variables** (Production and Preview). Keep `OMDB_API_KEY` without the `NEXT_PUBLIC_` prefix.
4. Deploy. Then add the deployed URL to Supabase's redirect URLs (step 3 above).

With the CLI: `npx vercel`, then `npx vercel env add OMDB_API_KEY`, then `npx vercel --prod`.

`/api/recommend` can take several seconds on a cold cache because it hydrates up to about 45 titles; it declares `maxDuration = 30`.

## Verification status

Checked: production build, type check, lint, all seven pages and the four API routes in demo mode, desktop and mobile rendering with WebGL.

Not yet exercised against live services: OMDb requests and Supabase sign-in/sync need your keys. After adding them, run one recommendation and one sign-in to confirm. Atlas IMDb IDs were entered by hand; the engine verifies each one against its title and falls back to a title lookup if they disagree.

## Attribution

Movie data and posters are provided by the [OMDb API](https://www.omdbapi.com/). Check OMDb's terms for your use case, including poster usage on commercial sites.
