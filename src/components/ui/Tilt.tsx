"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Pointer-reactive 3D tilt with a moving specular highlight — gives glass
 * cards physical depth. Inert on touch devices and under reduced motion.
 */
export default function Tilt({ children, className = "", max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const reduced = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.13), transparent 60%)`;

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={`group/tilt relative ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, transformStyle: "preserve-3d" }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const b = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width;
        const py = (e.clientY - b.top) / b.height;
        ry.set((px - 0.5) * max * 2);
        rx.set((0.5 - py) * max * 2);
        gx.set(px * 100);
        gy.set(py * 100);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        style={{ background: glare }}
      />
    </motion.div>
  );
}
