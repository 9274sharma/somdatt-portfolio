/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getLenis } from "@/components/layout/lenis";
import { CategoryIcon } from "./CategoryIcon";
import { ProjectRail, type RailProject } from "./ProjectRail";
import { JustifiedGallery, type GalleryPhoto } from "./JustifiedGallery";
import { CountUp } from "@/components/about/CountUp";

export type ExplorerCategory = {
  slug: string;
  title: string;
  description: string;
  cover: string | null;
  count: number;
  /** CTA band copy for this category */
  cta: { title: string; text: string };
};
export type ExplorerProject = RailProject & { catSlug: string };
export type ExplorerFrame = GalleryPhoto & { catSlug: string };
export type ExplorerLabels = {
  eyebrow: string;
  title: string;
  lead: string;
  all: string;
  project: string;
  projects: string;
  recent: string;
  mix: string;
  empty: string;
  emptyCta: string;
  viewStory: string;
  from: string;
  ctaEyebrow: string;
  ctaAllTitle: string;
  ctaAllText: string;
  ctaButton: string;
  photos: string;
  place: string;
};

/** Work page: header + chips; "All" = category cards; a category = projects + frame mix.
 *  State lives in `?cat=` so views are shareable and the back button works. */
export function WorkExplorer({
  categories,
  projects,
  frames,
  initialCat = "all",
  basePath,
  labels,
  totals,
}: {
  categories: ExplorerCategory[];
  projects: ExplorerProject[];
  frames: ExplorerFrame[];
  initialCat?: string;
  basePath: string;
  labels: ExplorerLabels;
  totals?: { projects: number; photos: number };
}) {
  const slugs = useMemo(() => new Set(categories.map((c) => c.slug)), [categories]);
  const [cat, setCat] = useState(slugs.has(initialCat) ? initialCat : "all");

  useEffect(() => {
    const onPop = () => {
      const p = new URLSearchParams(window.location.search).get("cat");
      setCat(p && slugs.has(p) ? p : "all");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [slugs]);

  const select = useCallback(
    (slug: string, e?: MouseEvent) => {
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return; // let new-tab work
      e?.preventDefault();
      setCat(slug);
      window.history.pushState(null, "", slug === "all" ? basePath : `${basePath}?cat=${slug}`);
      const el = document.getElementById("work-chips");
      if (el && el.getBoundingClientRect().top < 0) {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(el, { offset: -100 });
        else el.scrollIntoView({ behavior: "smooth" });
      }
    },
    [basePath],
  );

  const active = categories.find((c) => c.slug === cat);
  const catProjects = useMemo(() => projects.filter((p) => p.catSlug === cat), [projects, cat]);
  const catFrames = useMemo(() => frames.filter((f) => f.catSlug === cat), [frames, cat]);
  const countLabel = (n: number) => `${n} ${n === 1 ? labels.project : labels.projects}`;

  const chip = (on: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-[0.8rem] transition ${
      on
        ? "border-ink bg-ink text-page"
        : "border-sand/80 text-ink-soft hover:border-ink hover:text-ink"
    }`;

  return (
    <>
      {/* About-style header: big type, glow and the numbers */}
      <header className="hm-pagehead relative">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-32 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-[110px]" />
        <p className="hm-eyebrow relative">{labels.eyebrow}</p>
        <h1 className="relative !text-5xl !leading-[0.92] md:!text-7xl">{labels.title}</h1>
        {!active ? <p className="lead relative">{labels.lead}</p> : null}
        {totals && !active ? (
          <p className="relative mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-ink-soft">
            <span>
              <span className="font-display text-3xl font-extrabold text-ink">
                <CountUp to={totals.projects} duration={900} />
              </span>{" "}
              {totals.projects === 1 ? labels.project : labels.projects}
            </span>
            {totals.photos ? (
              <span>
                <span className="font-display text-3xl font-extrabold text-ink">
                  <CountUp to={totals.photos} duration={1100} />
                </span>{" "}
                {labels.photos}
              </span>
            ) : null}
            <span className="text-sm uppercase tracking-[0.2em]">{labels.place}</span>
          </p>
        ) : null}
      </header>

      <nav
        id="work-chips"
        aria-label="Filter work"
        className="no-scrollbar -mx-5 my-6 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      >
        <a
          href={basePath}
          onClick={(e) => select("all", e)}
          aria-current={cat === "all" ? "page" : undefined}
          className={chip(cat === "all")}
        >
          {labels.all}
        </a>
        {categories.map((c) => (
          <a
            key={c.slug}
            href={`${basePath}?cat=${c.slug}`}
            onClick={(e) => select(c.slug, e)}
            aria-current={cat === c.slug ? "page" : undefined}
            className={chip(cat === c.slug)}
          >
            {c.title} <span className="opacity-50">{c.count}</span>
          </a>
        ))}
      </nav>

      <div key={cat} className="view-in">
        {!active ? (
          <div data-reveal className={`grid gap-x-6 gap-y-12 pt-2 ${categories.length > 2 ? "md:grid-cols-2" : ""}`}>
            {categories.map((c) => (
              <a
                key={c.slug}
                href={`${basePath}?cat=${c.slug}`}
                onClick={(e) => select(c.slug, e)}
                className={`group block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  categories.length <= 2 ? "md:grid md:grid-cols-[1.5fr_1fr] md:items-center md:gap-10" : ""
                }`}
              >
                <div className={`relative overflow-hidden rounded-3xl bg-black ${categories.length <= 2 ? "aspect-[16/11] md:aspect-[16/10]" : "aspect-[16/11]"}`}>
                  {c.cover ? (
                    <img
                      src={c.cover}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-sand/30 text-ink-soft">
                      <CategoryIcon hint={c.slug} size={44} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                    <CategoryIcon hint={c.slug} size={14} />
                    {countLabel(c.count)}
                  </span>
                </div>
                <div className={`mt-5 flex items-start justify-between gap-6 ${categories.length <= 2 ? "md:mt-0 md:flex-col md:items-start md:gap-6" : ""}`}>
                  <div className="min-w-0">
                    <h2 className={`font-display font-bold tracking-tight ${categories.length <= 2 ? "text-2xl md:text-5xl md:font-extrabold" : "text-2xl md:text-3xl"}`}>{c.title}</h2>
                    <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">{c.description}</p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-sand/70 text-ink transition group-hover:border-accent group-hover:bg-accent group-hover:text-white"
                  >
                    →
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="pt-2">
            {catProjects.length ? (
              <ProjectRail
                projects={catProjects}
                cta={labels.viewStory}
                heading={
                  <h2 className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                      <CategoryIcon hint={active.slug} size={20} />
                    </span>
                    <span className="truncate">
                      {active.title}
                      <span className="font-semibold text-ink-soft"> · {active.count}</span>
                    </span>
                  </h2>
                }
                intro={
                  <p className="-mt-2 mb-6 max-w-2xl text-[0.98rem] leading-relaxed text-ink-soft">
                    {active.description}
                  </p>
                }
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-sand/60 p-10 text-center">
                <p className="text-ink-soft">{labels.empty}</p>
                <Link href="/contact" className="hm-btn dark mt-5">
                  {labels.emptyCta}
                </Link>
              </div>
            )}

            {catFrames.length ? (
              <section className="mt-16 md:mt-20">
                <p className="hm-eyebrow">{labels.recent}</p>
                <h2 className="hm-h2" style={{ marginBottom: "1.6rem" }}>
                  {labels.mix}
                </h2>
                <JustifiedGallery
                  photos={catFrames}
                  rowHeight={{ base: 230, md: 330 }}
                  fromLabel={labels.from}
                  storyLabel={labels.viewStory}
                  showCaptions
                />
              </section>
            ) : null}
          </div>
        )}

        {/* `in`: this band remounts per view, after ScrollReveal has already run */}
        <section className="hm-ctaband in mt-20">
          <p className="hm-eyebrow">{labels.ctaEyebrow}</p>
          <h2>{active ? active.cta.title : labels.ctaAllTitle}</h2>
          <p>{active ? active.cta.text : labels.ctaAllText}</p>
          <Link className="hm-btn dark" href={active ? `/contact?type=${active.slug}` : "/contact"}>
            {labels.ctaButton}
          </Link>
        </section>
      </div>
    </>
  );
}
