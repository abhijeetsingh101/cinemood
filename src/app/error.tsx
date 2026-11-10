"use client";

import { useEffect } from "react";
import { Notice } from "@/components/ui/States";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Notice
      tone="error"
      title="Something broke in transit"
      action={
        <button type="button" className="neon-btn" onClick={reset}>
          Try again
        </button>
      }
    >
      An unexpected error interrupted this page. Your watchlist and preferences are safe.
    </Notice>
  );
}
