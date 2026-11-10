"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useWatchlist } from "@/lib/watchlist";

/** Keeps the watchlist store attached to the current Supabase user. */
export default function AuthSync() {
  const attachUser = useWatchlist((s) => s.attachUser);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => attachUser(data.session?.user.id ?? null));
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void attachUser(session?.user.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, [attachUser]);
  return null;
}
