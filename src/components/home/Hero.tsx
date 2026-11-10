"use client";

import gsap from "gsap";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

const LINES = ["Discover movies", "that match", "your mood."];

/** Hero headline: letters resolve out of blur with a GSAP stagger. */
export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-char]", {
        yPercent: 110,
        opacity: 0,
        rotateX: -70,
        filter: "blur(10px)",
        duration: 1.3,
        stagger: 0.022,
      })
        .from("[data-rise]", { y: 24, opacity: 0, duration: 1, stagger: 0.12 }, "-=0.9")
        .from("[data-hud]", { opacity: 0, x: -16, duration: 0.8, stagger: 0.08 }, "-=1");
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="flex min-h-[calc(100svh-14rem)] flex-col justify-center">
      <p data-hud className="hud mb-6 flex items-center gap-3">
        <span className="inline-block size-1.5 rotate-45 bg-[var(--mood-a)] [animation:blink_2s_ease-in-out_infinite]" aria-hidden />
        Emotive cinema engine · online
      </p>

      <h1 className="display text-[clamp(2.4rem,8.4vw,6.75rem)]" aria-label={LINES.join(" ")}>
        {LINES.map((line, li) => (
          <span key={line} aria-hidden className="block overflow-hidden pb-[0.08em] [perspective:800px]">
            {line.split(" ").map((word, wi, words) => (
              <span key={wi} className="inline-block whitespace-nowrap">
                {word.split("").map((ch, i) => (
                  <span key={i} data-char className={`inline-block will-change-transform ${li === 2 ? "text-glow" : ""}`}>
                    {ch}
                  </span>
                ))}
                {wi < words.length - 1 && "\u00a0"}
              </span>
            ))}
          </span>
        ))}
      </h1>

      <p data-rise className="mt-7 max-w-lg text-base leading-relaxed text-dim md:text-lg">
        Tell CineMood how you feel. It reads the mood, scans the archive and returns films scored for
        this exact moment — with the reasons why.
      </p>

      <div data-rise className="mt-9 flex flex-wrap items-center gap-4">
        <Link href="/mood" className="neon-btn">
          Begin mood scan <span aria-hidden>→</span>
        </Link>
        <Link href="/watchlist" className="ghost-btn">
          Open watchlist
        </Link>
      </div>
    </section>
  );
}
