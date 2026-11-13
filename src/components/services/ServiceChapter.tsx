/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { LoopVideo } from "./LoopVideo";

export type Chapter = {
  id: string;
  n: number;
  title: string;
  intro: string;
  icon: ReactNode;
  image: string | null;
  /** short muted loop instead of the photo (e.g. Videography) */
  video?: string | null;
  bestFor: { label: string; href: string }[];
  included: string[];
  deliverables: string[];
  turnaround?: string;
  /** e.g. "From €1,490" — the price cell only appears when set */
  price?: string;
  cta: { label: string; href: string };
  frames: { src: string; href: string; alt: string }[];
};

export type ChapterLabels = {
  bestFor: string;
  included: string;
  youGet: string;
  turnaround: string;
  price: string;
  moreWork: string;
  /** e.g. "All prices incl. 19 % VAT." — shown under a price */
  vat?: string;
};

const Check = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className="mt-0.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10.5l4 4 8-9" />
  </svg>
);
const Gift = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className="mt-0.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h14v9H3zM2 5h16v3H2zM10 5v12M10 5c-1.5-3-5-3-5-.5S10 5 10 5zm0 0c1.5-3 5-3 5-.5S10 5 10 5z" />
  </svg>
);

/** One service as a chapter. Phones: name → key facts → media → details (accordions) → CTA.
 *  Desktop: media on one side (alternating), everything else on the other. */
export function ServiceChapter({ c, flip, labels }: { c: Chapter; flip: boolean; labels: ChapterLabels }) {
  const textCol = flip ? "lg:col-start-1" : "lg:col-start-2";
  const mediaCol = flip ? "lg:col-start-2" : "lg:col-start-1";
  const list = (items: string[], icon: ReactNode) => (
    <ul className="space-y-2.5">
      {items.map((x) => (
        <li key={x} className="flex items-start gap-3 text-[0.97rem] text-ink">
          {icon}
          {x}
        </li>
      ))}
    </ul>
  );

  return (
    <section id={c.id} className="hm-sec scroll-mt-36">
      <div className="grid gap-x-16 gap-y-7 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
        {/* name + key facts */}
        <div className={`min-w-0 ${textCol} lg:row-start-1`}>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">{c.icon}</span>
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">{c.title}</h2>
          </div>
          <p className="mt-5 max-w-xl text-[1.06rem] leading-relaxed text-ink-soft">{c.intro}</p>

          {c.turnaround || c.price ? (
            <dl className={`mt-6 grid gap-px overflow-hidden rounded-2xl border border-sand/60 bg-sand/60 ${c.price && c.turnaround ? "grid-cols-2" : "grid-cols-1"}`}>
              {c.price ? (
                <div className="bg-page px-5 py-4">
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">{labels.price}</dt>
                  <dd className="mt-1 font-display text-lg font-bold">{c.price}</dd>
                  {labels.vat ? <dd className="mt-0.5 text-[11px] text-ink-soft">{labels.vat}</dd> : null}
                </div>
              ) : null}
              {c.turnaround ? (
                <div className="bg-page px-5 py-4">
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">{labels.turnaround}</dt>
                  <dd className="mt-1 font-display text-lg font-bold">{c.turnaround}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {c.bestFor.length ? (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">{labels.bestFor}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {c.bestFor.map((b) => (
                  <Link
                    key={b.label}
                    href={b.href}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink-soft/40 px-4 text-sm text-ink transition hover:border-accent hover:text-accent"
                  >
                    {b.label} <span aria-hidden>→</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* media */}
        <div className={`min-w-0 ${mediaCol} lg:row-span-2 lg:row-start-1`}>
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-black">
            {c.video ? (
              <LoopVideo src={c.video} poster={c.image} className="h-full w-full object-cover" />
            ) : c.image ? (
              <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
            <span className="pointer-events-none absolute bottom-4 left-5 font-display text-5xl font-extrabold leading-none text-white md:text-6xl">
              {String(c.n).padStart(2, "0")}
            </span>
          </div>
          {c.frames.length ? (
            <div className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
              {c.frames.slice(0, 3).map((f, i) => (
                <Link
                  key={i}
                  href={f.href}
                  className="group relative aspect-square w-[38vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-sand/30 md:w-auto"
                  aria-label={`${labels.moreWork}: ${f.alt}`}
                >
                  <img src={f.src} alt={f.alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* details + CTA */}
        <div className={`min-w-0 ${textCol} lg:row-start-2`}>
          {/* phones/tablets: closed accordions */}
          <div className="divide-y divide-sand/60 border-y border-sand/60 lg:hidden">
            {c.included.length ? (
              <details className="group py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-semibold text-ink">
                  {labels.included}
                  <span aria-hidden className="text-ink-soft transition group-open:rotate-45">+</span>
                </summary>
                <div className="pt-2">{list(c.included, <Check />)}</div>
              </details>
            ) : null}
            {c.deliverables.length ? (
              <details className="group py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-semibold text-ink">
                  {labels.youGet}
                  <span aria-hidden className="text-ink-soft transition group-open:rotate-45">+</span>
                </summary>
                <div className="pt-2">{list(c.deliverables, <Gift />)}</div>
              </details>
            ) : null}
          </div>
          {/* desktop: open lists */}
          <div className="hidden gap-8 lg:grid lg:grid-cols-2">
            {c.included.length ? (
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ink-soft">{labels.included}</p>
                {list(c.included, <Check />)}
              </div>
            ) : null}
            {c.deliverables.length ? (
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ink-soft">{labels.youGet}</p>
                {list(c.deliverables, <Gift />)}
              </div>
            ) : null}
          </div>

          <Link href={c.cta.href} className="hm-btn dark mt-7">
            {c.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
