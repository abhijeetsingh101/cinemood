import type { Metadata } from "next";
import WatchlistView from "@/components/watchlist/WatchlistView";
import { PageHeader } from "@/components/ui/States";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <>
      <PageHeader step="Vault" title="Your watchlist." sub="Films you've pulled out of the signal, saved for later." />
      <WatchlistView />
    </>
  );
}
