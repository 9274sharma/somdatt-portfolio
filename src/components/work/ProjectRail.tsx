/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

export type RailProject = {
  slug: string;
  title: string;
  summary?: string;
  meta?: string;
  cover: string | null;
  /** wide (≈3:2) crop used when a single project is shown as a feature */
  wide?: string | null;
  href?: string;
  /** feature card extras */
  photos?: number;
  thumbs?: string[];
  photosLabel?: string;
};

const CARD = 304; // px, rail card width on ≥sm
const GAP = 16;

/** Project list that adapts to how many projects exist:
 *  1 → feature card · fits on screen → even grid · otherwise → snap rail with arrows. */
export function ProjectRail({
  projects,
  heading,
  intro,
  cta = "View story",
}: {
  projects: RailProject[];
  heading?: ReactNode;
  intro?: ReactNode;
  cta?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const n = projects.length;
  // SSR guess: desktop fits up to 4 cards; refined after measuring.
  const [fits, setFits] = useState(n <= 4);
  const [edges, setEdges] = useState({ start: true, end: n <= 1 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth;
    // Grid only on ≥768px and only when the rail would overflow by less than one card.
    const need = n * CARD + (n - 1) * GAP;
    setFits(window.innerWidth >= 768 && need < w + CARD);
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, [n]);

  useEffect(() => {
    measure();
    const el = ref.current;
    el?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const by = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * (CARD + GAP) * Math.max(1, Math.floor(el.clientWidth / (CARD + GAP))), behavior: "smooth" });
  };

  const rail = n > 1 && !fits;
  const head =
    heading || rail ? (
      <div className="mb-5 flex min-h-11 items-center justify-between gap-4">
        <div className="min-w-0">{heading}</div>
        {rail ? (
          <div className="hidden shrink-0 gap-2 md:flex">
            <RailButton onClick={() => by(-1)} disabled={edges.start} label="Previous projects">
              ←
            </RailButton>
            <RailButton onClick={() => by(1)} disabled={edges.end} label="Next projects">
              →
            </RailButton>
          </div>
        ) : null}
      </div>
    ) : null;

  if (n === 1) {
    const p = projects[0];
    return (
      <div>
        {head}
        {intro}
        <Link
          href={p.href ?? `/projects/${p.slug}`}
          className="group grid overflow-hidden rounded-3xl border border-sand/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:grid-cols-[1.45fr_1fr]"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-black md:aspect-[3/2]">
            {p.wide ?? p.cover ? (
              <picture>
                {p.wide ? <source media="(min-width: 768px)" srcSet={p.wide} /> : null}
                <img
                  src={p.cover ?? p.wide ?? ""}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                />
              </picture>
            ) : null}
          </div>
          <div className="flex flex-col justify-center gap-3 p-7 md:p-10">
            {p.meta ? <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">{p.meta}</p> : null}
            <p className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">{p.title}</p>
            {p.summary ? <p className="leading-relaxed text-ink-soft">{p.summary}</p> : null}
            {p.photos ? (
              <p className="font-display text-4xl font-extrabold tracking-tight">
                {p.photos} <span className="text-base font-semibold text-ink-soft">{p.photosLabel ?? "photos"}</span>
              </p>
            ) : null}
            {p.thumbs?.length ? (
              <span className="flex gap-2">
                {p.thumbs.slice(0, 3).map((t, i) => (
                  <img key={i} src={t} alt="" loading="lazy" className="h-16 w-16 rounded-xl object-cover md:h-20 md:w-20" />
                ))}
              </span>
            ) : null}
            <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition group-hover:text-accent">
              {cta} <span aria-hidden>→</span>
            </span>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {head}
      {intro}
      <div className="relative">
        <div
          ref={ref}
          className={
            rail
              ? "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
              : "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:overflow-visible md:pb-0 md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
          }
          style={{ ["--n" as string]: n }}
        >
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={p.href ?? `/projects/${p.slug}`}
              className={`rail-card group relative shrink-0 snap-start rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                rail ? "w-[76vw] max-w-[19rem] sm:w-[19rem]" : "w-[76vw] max-w-[19rem] md:w-auto md:max-w-none"
              }`}
            >
              <div
                className={`relative overflow-hidden rounded-2xl bg-black ${
                  !rail && n === 2 ? "aspect-[4/5] md:aspect-[5/4]" : "aspect-[4/5]"
                }`}
              >
                {p.cover ? (
                  <img
                    src={!rail && n === 2 && p.wide ? p.wide : p.cover}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  {p.meta ? (
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">{p.meta}</p>
                  ) : null}
                  <p className="mt-1.5 font-display text-xl font-bold leading-tight text-white">{p.title}</p>
                  {p.summary ? <p className="rail-sum mt-2 text-sm leading-snug text-white/85">{p.summary}</p> : null}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 transition group-hover:text-accent">
                    {cta} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* edge fades (overlay in the page colour — no see-through haze on photos) */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-page to-transparent transition-opacity ${
            edges.start ? "opacity-0" : "opacity-100"
          } ${rail ? "" : "md:hidden"}`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-page to-transparent transition-opacity ${
            edges.end ? "opacity-0" : "opacity-100"
          } ${rail ? "" : "md:hidden"}`}
        />
      </div>
    </div>
  );
}

function RailButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-sand/70 text-ink transition hover:border-ink/40 disabled:cursor-default disabled:opacity-30"
    >
      {children}
    </button>
  );
}
