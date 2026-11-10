"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Cinematic page transition. The template remounts on every navigation, so
 * each page "racks into focus" while the 3D camera glides behind it.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.985, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
