"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

/** Circular compatibility gauge. */
export default function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const id = useId();
  const reduced = useReducedMotion();
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${score} percent mood match`}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--mood-a)" />
            <stop offset="1" stopColor="var(--mood-b)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="rgb(4 5 14 / 0.7)" stroke="rgb(160 175 255 / 0.15)" strokeWidth="5" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduced ? offset : c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ filter: "drop-shadow(0 0 5px var(--mood-a))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="display tabular-nums" style={{ fontSize: size * 0.3 }}>
          {score}
        </span>
      </div>
    </div>
  );
}
