/* eslint-disable @next/next/no-img-element */
"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export type Stop = { year: string; title: string; text: string; image: string | null };

/** Journey strip, one photo per year. Desktop (with motion): pinned while vertical
 *  scroll drives it sideways, with a year rail that fills. Phones / reduced motion:
 *  a native swipe row. */
export function JourneyScroller({ stops, heading }: { stops: Stop[]; heading: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [pin, setPin] = useState(false);
  const [dist, setDist] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setPin(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let raf = 0;
    const n = stops.length;
    const setProgress = (p: number) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      const i = Math.min(n - 1, Math.round(p * (n - 1)));
      setActive((a) => (a === i ? a : i));
    };

    if (!pin) {
      t.style.transform = "";
      const onScroll = () => {
        const max = t.scrollWidth - t.clientWidth;
        setProgress(max > 0 ? t.scrollLeft / max : 0);
      };
      onScroll();
      t.addEventListener("scroll", onScroll, { passive: true });
      return () => t.removeEventListener("scroll", onScroll);
    }

    const measure = () => setDist(Math.max(0, t.scrollWidth - window.innerWidth));
    measure();
    const update = () => {
      raf = 0;
      const o = outer.current;
      if (!o) return;
      const r = o.getBoundingClientRect();
      const span = o.offsetHeight - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      t.style.transform = `translate3d(${-p * Math.max(0, t.scrollWidth - window.innerWidth)}px,0,0)`;
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [pin, stops.length]);

  const jump = (i: number) => {
    const t = track.current;
    const card = t?.children[i] as HTMLElement | undefined;
    if (!t || !card) return;
    if (!pin) {
      t.scrollTo({ left: card.offsetLeft - t.offsetLeft - 20, behavior: "smooth" });
      return;
    }
    const o = outer.current;
    if (!o) return;
    const span = o.offsetHeight - window.innerHeight;
    const top = o.getBoundingClientRect().top + window.scrollY + (span * i) / Math.max(1, stops.length - 1);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div ref={outer} style={pin ? { height: `calc(100vh + ${dist}px)` } : undefined}>
      <div className={pin ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16" : ""}>
        <div className="hm-wrap w-full">
          <div className="flex flex-wrap items-end justify-between gap-6">
            {heading}
            {/* year rail */}
            <div className="relative w-full max-w-md">
              <span aria-hidden className="absolute left-0 right-0 top-[7px] h-px bg-sand" />
              <span
                ref={bar}
                aria-hidden
                className="absolute left-0 right-0 top-[6px] h-[3px] origin-left rounded-full bg-accent"
                style={{ transform: "scaleX(0)" }}
              />
              <ol className="relative flex justify-between">
                {stops.map((s, i) => (
                  <li key={s.year}>
                    <button
                      type="button"
                      onClick={() => jump(i)}
                      className="group flex min-h-11 flex-col items-center gap-1.5"
                      aria-label={`${s.year}: ${s.title}`}
                      aria-current={active === i ? "step" : undefined}
                    >
                      <span
                        className={`h-[15px] w-[15px] rounded-full border-2 transition ${
                          i <= active ? "border-accent bg-accent" : "border-sand bg-page"
                        }`}
                      />
                      <span
                        className={`text-xs font-semibold tabular-nums transition ${
                          active === i ? "text-accent" : "text-ink-soft group-hover:text-ink"
                        }`}
                      >
                        {s.year}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <ol
          ref={track}
          className={
            pin
              ? "mt-10 flex w-max gap-6 pl-[max(1.25rem,calc((100vw-75rem)/2+1.25rem))] pr-[max(1.25rem,calc((100vw-75rem)/2+1.25rem))] will-change-transform"
              : "no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:scroll-px-[max(1.25rem,calc((100vw-75rem)/2+1.25rem))] md:px-[max(1.25rem,calc((100vw-75rem)/2+1.25rem))]"
          }
        >
          {stops.map((s, i) => (
            <li
              key={s.year}
              className={`w-[78vw] max-w-[22rem] shrink-0 snap-start transition-opacity duration-500 sm:w-[22rem] ${
                pin && active !== i ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand/30">
                {s.image ? <img src={s.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
                <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 font-display text-sm font-bold text-white backdrop-blur-sm">
                  {s.year}
                </span>
              </div>
              <p className="mt-4 font-display text-xl font-bold">{s.title}</p>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
