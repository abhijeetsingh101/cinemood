"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated } from "@/lib/hooks";
import { useWatchlist } from "@/lib/watchlist";

const LINKS = [
  { href: "/", label: "Home", glyph: "◎" },
  { href: "/mood", label: "Discover", glyph: "◈" },
  { href: "/watchlist", label: "Watchlist", glyph: "▤" },
  { href: "/profile", label: "Profile", glyph: "◉" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/mood") return ["/mood", "/calibrate", "/results"].some((p) => pathname.startsWith(p));
  return pathname.startsWith(href);
}

export default function Nav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useWatchlist((s) => s.items.length);
  const badge = hydrated && count > 0 ? count : null;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="group flex items-center gap-3" aria-label="CineMood home">
          <span
            aria-hidden
            className="grid size-8 rotate-45 place-items-center border border-[var(--mood-a)] shadow-[0_0_18px_-2px_var(--mood-a)] transition-transform duration-500 group-hover:rotate-[225deg]"
          >
            <span className="size-2.5 bg-[var(--mood-b)]" />
          </span>
          <span className="display text-sm tracking-[0.14em]">
            CINE<span className="text-[var(--mood-a)]">MOOD</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="holo holo-plain hidden items-center gap-1 rounded-full! p-1 md:flex">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`hud relative rounded-full px-4 py-2.5 transition-colors ${
                  active ? "bg-white/10 text-ink!" : "hover:text-ink"
                }`}
              >
                {l.label}
                {l.href === "/watchlist" && badge && (
                  <span className="ml-2 rounded-full bg-[var(--mood-a)] px-1.5 py-0.5 text-[10px] tracking-normal text-void">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Mobile dock */}
      <nav
        aria-label="Primary"
        className="holo holo-plain fixed! inset-x-3 bottom-3 z-40 grid grid-cols-4 p-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] tracking-[0.14em] uppercase ${
                active ? "text-[var(--mood-a)]" : "text-dim"
              }`}
            >
              <span aria-hidden className="text-base leading-none">
                {l.glyph}
              </span>
              {l.label}
              {l.href === "/watchlist" && badge && (
                <span className="absolute top-1 right-[22%] rounded-full bg-[var(--mood-a)] px-1.5 text-[10px] text-void">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
