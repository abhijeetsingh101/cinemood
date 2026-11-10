"use client";

import { useState } from "react";

/**
 * Lazy-loaded poster with a holographic placeholder.
 * OMDb posters live on third-party CDNs with unpredictable hosts, so a
 * plain lazy <img> is used rather than next/image's host allow-list.
 */
export default function Poster({
  src,
  title,
  className = "",
  eager = false,
}: {
  src: string | null;
  title: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const show = src && !failed;

  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-md bg-deep ${className}`}>
      {show ? (
        <>
          {!loaded && <div className="skeleton absolute inset-0 rounded-none!" aria-hidden />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Poster for ${title}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`size-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </>
      ) : (
        <div
          role="img"
          aria-label={`No poster available for ${title}`}
          className="flex size-full flex-col justify-between p-3"
          style={{
            background:
              "linear-gradient(150deg, color-mix(in oklab, var(--mood-a) 30%, #0a0c1f), #0a0c1f 55%, color-mix(in oklab, var(--mood-b) 32%, #0a0c1f))",
          }}
        >
          <span className="hud text-[9px]!">No signal</span>
          <span className="display text-base leading-tight break-words text-white/90">{title}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-white/5" aria-hidden />
    </div>
  );
}
