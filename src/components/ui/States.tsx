import Link from "next/link";
import type { ReactNode } from "react";

/** Full-panel loading state with a scanning beam. */
export function Scanner({ label = "Scanning the archive", lines = [] }: { label?: string; lines?: string[] }) {
  return (
    <div role="status" aria-live="polite" className="holo mx-auto max-w-xl overflow-hidden p-8 text-center">
      <div className="relative mx-auto mb-6 size-24">
        <span className="absolute inset-0 rounded-full border border-[var(--mood-a)] [animation:pulse-ring_1.8s_ease-out_infinite]" />
        <span className="absolute inset-0 rounded-full border border-[var(--mood-b)] [animation:pulse-ring_1.8s_ease-out_0.6s_infinite]" />
        <span className="absolute inset-[34%] rotate-45 bg-[var(--mood-a)] shadow-[0_0_30px_var(--mood-a)]" />
      </div>
      <p className="display text-lg">{label}</p>
      {lines.length > 0 && (
        <ul className="hud mt-4 space-y-1.5">
          {lines.map((l) => (
            <li key={l} className="[animation:blink_1.4s_ease-in-out_infinite]">
              {l}
            </li>
          ))}
        </ul>
      )}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-[color-mix(in_oklab,var(--mood-a)_14%,transparent)] to-transparent [animation:scan_2.4s_linear_infinite]" aria-hidden />
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "error";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="holo mx-auto max-w-xl p-8 text-center"
      style={tone === "error" ? ({ "--mood-a": "#ff5c7a", "--mood-b": "#ff9f43" } as React.CSSProperties) : undefined}
    >
      <p className="hud mb-3" style={{ color: "var(--mood-a)" }}>
        {tone === "error" ? "Signal lost" : "Standing by"}
      </p>
      <h2 className="display text-xl md:text-2xl">{title}</h2>
      {children && <div className="mt-3 text-sm leading-relaxed text-dim">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function PageHeader({ step, title, sub }: { step: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-8 md:mb-12">
      <p className="hud mb-3 flex items-center gap-3">
        <span className="inline-block h-px w-8 bg-[var(--mood-a)]" aria-hidden />
        {step}
      </p>
      <h1 className="display text-3xl text-balance sm:text-4xl md:text-5xl">{title}</h1>
      {sub && <p className="mt-4 max-w-xl text-dim">{sub}</p>}
    </header>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="ghost-btn">
      <span aria-hidden>←</span> {children}
    </Link>
  );
}
