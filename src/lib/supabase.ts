"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client.
 *
 * Only the public URL and anon key are used here — both are designed to be
 * shipped to the browser. Data is protected by Row Level Security
 * (see supabase/schema.sql), not by hiding the key.
 *
 * When the env vars are absent the app runs in "local mode": watchlist and
 * profile live in localStorage and every Supabase call is skipped.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anon);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (!client) {
    client = createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}
