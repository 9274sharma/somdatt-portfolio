/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Lightbox, type LightboxItem } from "./Lightbox";

export type GalleryPhoto = LightboxItem & { aspect: number };

const GAP = 8;

/** Break `a` (aspect ratios, in order) into full-width rows whose heights stay as
 *  close as possible to `target` (optimal over all break points, so the last row
 *  is never a stretched or stunted leftover). */
function partition(a: number[], width: number, target: number, maxPer = Infinity): number[][] {
  const n = a.length;
  const pre = [0];
  for (const x of a) pre.push(pre[pre.length - 1] + x);
  const height = (i: number, j: number) => (width - GAP * (j - i - 1)) / (pre[j] - pre[i]);
  const best = Array(n + 1).fill(Infinity);
  const cut = Array(n + 1).fill(0);
  best[0] = 0;
  for (let j = 1; j <= n; j++) {
    for (let i = j - 1; i >= 0; i--) {
      const h = height(i, j);
      if (h < target * 0.45 || j - i > maxPer) break; // rows only get shorter as they grow
      const c = best[i] + ((h - target) / target) ** 2;
      if (c < best[j]) {
        best[j] = c;
        cut[j] = i;
      }
    }
    if (best[j] === Infinity) {
      best[j] = best[j - 1];
      cut[j] = j - 1;
    }
  }
  const rows: number[][] = [];
  for (let j = n; j > 0; j = cut[j]) {
    rows.unshift(Array.from({ length: j - cut[j] }, (_, t) => cut[j] + t));
  }
  return rows;
}

/** Justified photo rows (clean edges, reading order = lightbox order). */
export function JustifiedGallery({
  photos,
  rowHeight = { base: 190, md: 300 },
  limit,
  moreLabel = "Show all {n} photos",
  fromLabel,
  storyLabel,
  showCaptions = false,
}: {
  photos: GalleryPhoto[];
  rowHeight?: { base: number; md: number };
  limit?: number;
  /** "{n}" is replaced with the photo count */
  moreLabel?: string;
  fromLabel?: string;
  storyLabel?: string;
  showCaptions?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1120);
  const [all, setAll] = useState(!limit || photos.length <= limit);
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setWidth(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shown = all ? photos : photos.slice(0, limit);
  const rows = useMemo(() => {
    const target = width < 768 ? rowHeight.base : rowHeight.md;
    return partition(
      shown.map((p) => p.aspect),
      width,
      target,
      width < 768 ? 3 : Infinity, // never postage stamps on phones
    );
  }, [shown, width, rowHeight.base, rowHeight.md]);

  if (!photos.length) return null;

  return (
    <>
      {/* data-reveal: rows rise in one after another the first time the gallery scrolls into view */}
      <div ref={ref} data-reveal className="flex flex-col" style={{ gap: GAP }}>
        {rows.map((row, r) => (
          <div key={r} className="flex" style={{ gap: GAP }}>
            {row.map((i) => {
              const p = shown[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`Open photo ${i + 1}${p.caption ? ` — ${p.caption}` : ""}`}
                  className="group relative min-w-0 overflow-hidden rounded-lg bg-sand/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  style={{ flex: `${p.aspect} 1 0`, aspectRatio: p.aspect, cursor: "zoom-in" }}
                >
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="lazy"
                    className="h-full w-full object-cover text-transparent transition duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  {showCaptions && p.caption ? (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-left text-[11px] font-medium uppercase tracking-[0.16em] text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                      {p.caption}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {!all ? (
        <div data-sticky-stop className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="min-h-11 rounded-full border border-sand/80 px-6 text-sm font-medium text-ink transition hover:border-ink"
          >
            {moreLabel.replace("{n}", String(photos.length))}
          </button>
        </div>
      ) : null}

      <Lightbox
        items={shown}
        index={open}
        onIndex={setOpen}
        onClose={close}
        fromLabel={fromLabel}
        storyLabel={storyLabel}
      />
    </>
  );
}
