import Link from "next/link";
import type { ReactNode } from "react";

/** Sticky jump bar under the site header: chips scroll (to the screen edge on phones),
 *  the booking pill stays put on the right. Must sit directly inside the page wrapper so `sticky` spans the page. */
export function ServiceNav({
  items,
  cta,
  label,
}: {
  items: { href: string; label: string; short?: string; icon?: ReactNode }[];
  cta: { href: string; label: string; short?: string };
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="svc-nav sticky top-[73px] z-30 -mx-5 mb-2 flex items-center gap-2 bg-page/90 py-2.5 pr-5 backdrop-blur-md md:top-[65px] md:mx-0 md:pr-0"
    >
      <div className="relative min-w-0 flex-1">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pl-5 pr-6 md:pl-0">
          {items.map((it) => (
            <a
              key={it.href}
              href={it.href}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-ink-soft/40 px-4 text-sm text-ink transition hover:border-accent hover:text-accent"
            >
              {it.icon ? <span className="text-accent [&_svg]:h-[18px] [&_svg]:w-[18px]">{it.icon}</span> : null}
              <span className="md:hidden">{it.short ?? it.label}</span>
              <span className="hidden md:inline">{it.label}</span>
            </a>
          ))}
        </div>
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-page to-transparent md:hidden" />
      </div>
      <Link
        href={cta.href}
        className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:opacity-90 md:px-5"
      >
        <span className="md:hidden">{cta.short ?? cta.label}</span>
        <span className="hidden md:inline">{cta.label}</span>
      </Link>
    </nav>
  );
}
