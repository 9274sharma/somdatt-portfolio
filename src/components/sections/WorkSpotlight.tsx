/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

export type WorkFrame = { src: string; title: string; cat: string; href: string };

const INTERVAL = 5000;

/** Home "recent work" spotlight: a large featured frame + thumbnail strip, with
 *  a progress bar, prev/next, and a position counter. Auto-advances (~5s) and
 *  pauses the instant the viewer interacts; fully manual under reduced-motion. */
export function WorkSpotlight({ frames }: { frames: WorkFrame[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotionSafe();
  const n = frames.length;

  useEffect(() => {
    if (reduce || paused || n <= 1) return;
    const id = setInterval(() => setI((p) => (p + 1) % n), INTERVAL);
    return () => clearInterval(id);
  }, [reduce, paused, n]);

  if (!n) return null;
  const f = frames[i];
  const go = (d: number) => setI((p) => (p + d + n) % n);

  return (
    <div
      className="flex flex-col gap-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="group relative aspect-[16/10] overflow-hidden rounded-3xl bg-black md:aspect-[2/1]">
        {/* clickable image layer */}
        <Link
          href={f.href}
          aria-label={`${f.title}${f.cat ? `, ${f.cat}` : ""} — view project`}
          className="absolute inset-0 z-0"
        >
          {frames.map((fr, idx) => (
            <img
              key={idx}
              src={fr.src}
              alt={fr.title}
              loading={idx === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-[1.02] ${
                idx === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        </Link>

        {/* autoplay progress */}
        {!reduce && n > 1 && (
          <div className="absolute inset-x-0 top-0 z-20 h-[3px] bg-white/15">
            <div
              key={i}
              className="h-full origin-left bg-accent"
              style={{
                transform: "scaleX(0)",
                animation: `wsProgress ${INTERVAL}ms linear forwards`,
                animationPlayState: paused ? "paused" : "running",
              }}
            />
          </div>
        )}

        {/* position + manual nav */}
        {n > 1 && (
          <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full bg-black/45 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous frame"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              ←
            </button>
            <span className="px-1 text-xs tabular-nums text-white/85">
              {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next frame"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              →
            </button>
          </div>
        )}

        {/* caption + CTA — clicks pass through to the image link except on the links */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-6 md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">
              {f.cat}
            </p>
            <Link
              href={f.href}
              className="hit44 pointer-events-auto inline-block font-display text-2xl tracking-tight text-white transition-colors hover:text-accent md:text-4xl"
            >
              {f.title}
            </Link>
          </div>
          <Link
            href={f.href}
            className="pointer-events-auto hidden shrink-0 rounded-full border border-white/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black sm:inline-block"
          >
            View project →
          </Link>
        </div>
      </div>

      {/* filmstrip */}
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {frames.map((fr, idx) => (
          <button
            key={idx}
            type="button"
            onMouseEnter={() => setI(idx)}
            onFocus={() => setI(idx)}
            onClick={() => setI(idx)}
            aria-label={`Show ${fr.title}`}
            aria-current={idx === i}
            className={`relative aspect-[4/3] h-20 shrink-0 overflow-hidden rounded-xl transition md:h-24 ${
              idx === i ? "ring-2 ring-accent" : "opacity-55 hover:opacity-100"
            }`}
          >
            <img src={fr.src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
