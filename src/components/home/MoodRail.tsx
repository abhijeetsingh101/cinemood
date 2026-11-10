"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MOODS } from "@/lib/moods";
import { useMoodStore } from "@/lib/store";

/** Eight mood portals — jump straight into a scan with one mood armed. */
export default function MoodRail() {
  const router = useRouter();
  const setMoods = useMoodStore((s) => s.setMoods);
  const reduced = useReducedMotion();

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {MOODS.map((m, i) => (
        <motion.li
          key={m.id}
          initial={reduced ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className={i % 2 ? "sm:translate-y-5" : ""}
        >
          <button
            type="button"
            onClick={() => {
              setMoods([m.id]);
              router.push("/mood");
            }}
            style={{ "--mood-a": m.colors[0], "--mood-b": m.colors[1] } as React.CSSProperties}
            className="holo group w-full p-4 text-left transition-transform duration-500 hover:-translate-y-1.5"
          >
            <span
              aria-hidden
              className="mb-6 block text-2xl text-[var(--mood-a)] transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12"
              style={{ textShadow: "0 0 18px var(--mood-a)" }}
            >
              {m.glyph}
            </span>
            <span className="display block text-sm">{m.label}</span>
            <span className="mt-1 block text-xs text-dim">{m.blurb}</span>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}
