-- CineMood — Supabase schema
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

create table if not exists public.watchlist (
  user_id  uuid        not null references auth.users (id) on delete cascade,
  imdb_id  text        not null check (imdb_id ~ '^tt[0-9]{7,9}$'),
  title    text        not null check (char_length(title) <= 300),
  year     integer,
  poster   text        check (poster is null or char_length(poster) <= 600),
  added_at timestamptz not null default now(),
  primary key (user_id, imdb_id)
);

create index if not exists watchlist_user_added_idx
  on public.watchlist (user_id, added_at desc);

-- Row Level Security: the anon key is public, so these policies are what
-- keep each person's list private. Every statement is limited to rows the
-- signed-in user owns.
alter table public.watchlist enable row level security;

drop policy if exists "watchlist_select_own" on public.watchlist;
create policy "watchlist_select_own" on public.watchlist
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "watchlist_insert_own" on public.watchlist;
create policy "watchlist_insert_own" on public.watchlist
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "watchlist_update_own" on public.watchlist;
create policy "watchlist_update_own" on public.watchlist
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "watchlist_delete_own" on public.watchlist;
create policy "watchlist_delete_own" on public.watchlist
  for delete to authenticated using ((select auth.uid()) = user_id);
