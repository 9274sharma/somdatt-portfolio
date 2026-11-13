/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { getLenis } from "@/components/layout/lenis";

export type LightboxItem = {
  src: string;
  full?: string;
  /** optional `srcset` for the sharp file (e.g. 1600w + 2400w) */
  fullSet?: string;
  /** width ÷ height — lets both layers share one exactly-sized box */
  aspect?: number;
  alt: string;
  caption?: string;
  href?: string;
};

/** Shared modal behaviour: focus in + trapped + restored, Esc to close,
 *  page scroll (and Lenis) paused while open. */
export function useModal(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
  // Keep the latest onClose without re-running the effect: re-running would move focus back to
  // [data-autofocus] (e.g. while typing in a textarea inside the modal).
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const f = Array.from(
        root.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),video,[tabindex]:not([tabindex="-1"])'),
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      lenis?.start();
      opener?.focus?.();
    };
  }, [open, ref]);
}

/** Full-screen photo viewer: arrows / keys / swipe, counter, neighbour preload. */
export function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  label = "Photo viewer",
  fromLabel = "From",
  storyLabel = "View story",
}: {
  items: LightboxItem[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  label?: string;
  fromLabel?: string;
  storyLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const n = items.length;
  const open = index !== null;
  useModal(open, ref, onClose);

  const go = useCallback(
    (d: number) => {
      if (index !== null) onIndex((index + d + n) % n);
    },
    [index, n, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  // Preload neighbours so next/prev feel instant.
  useEffect(() => {
    if (index === null || n < 2) return;
    for (const d of [1, -1]) {
      const it = items[(index + d + n) % n];
      const im = new Image();
      if (it.fullSet) {
        im.sizes = "100vw";
        im.srcset = it.fullSet;
      }
      im.src = it.full ?? it.src;
    }
  }, [index, items, n]);

  const start = useRef<{ x: number; y: number } | null>(null);
  if (index === null) return null;
  const it = items[index];

  const arrow =
    "grid h-12 w-12 place-items-center rounded-full border border-white/30 text-white transition hover:bg-white hover:text-black";

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[120] flex flex-col bg-black/95 text-white backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-white/60 tabular-nums" aria-live="polite">
          {index + 1} / {n}
        </p>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-xl transition hover:bg-white hover:text-black"
        >
          ×
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4 md:px-20"
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          if (!s || n < 2) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
        }}
        style={{ touchAction: "pan-y" }}
      >
        {/* the grid thumbnail is already cached → shows instantly; the sharp file fades in over it */}
        <div
          key={it.src}
          className="view-in relative overflow-hidden rounded-lg shadow-2xl"
          style={
            it.aspect
              ? { aspectRatio: it.aspect, width: `min(100%, calc((100svh - 9.5rem) * ${it.aspect}))` }
              : undefined
          }
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={it.src}
            alt={it.alt}
            draggable={false}
            className={
              it.aspect
                ? "absolute inset-0 h-full w-full select-none object-cover"
                : "block max-h-[calc(100svh-9.5rem)] max-w-full select-none object-contain"
            }
          />
          {it.full && it.full !== it.src ? (
            <img
              src={it.full}
              srcSet={it.fullSet}
              sizes="100vw"
              alt=""
              aria-hidden
              draggable={false}
              onLoad={(e) => (e.currentTarget.style.opacity = "1")}
              style={{ opacity: 0 }}
              className={`absolute inset-0 h-full w-full select-none transition-opacity duration-300 ${
                it.aspect ? "object-cover" : "object-contain"
              }`}
            />
          ) : null}
        </div>
        {n > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous photo"
              className={`${arrow} absolute left-4 top-1/2 hidden -translate-y-1/2 md:grid`}
            >
              ←
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next photo"
              className={`${arrow} absolute right-4 top-1/2 hidden -translate-y-1/2 md:grid`}
            >
              →
            </button>
          </>
        ) : null}
      </div>

      <div
        className="flex items-center justify-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {n > 1 ? (
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${arrow} md:hidden`}>
            ←
          </button>
        ) : null}
        {it.href ? (
          <div className="flex min-w-0 items-center gap-3 rounded-full bg-white/10 py-1.5 pl-4 pr-1.5 text-sm backdrop-blur">
            <span className="truncate text-white/70">
              {fromLabel} <b className="font-semibold text-white">{it.caption}</b>
            </span>
            <Link
              href={it.href}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-accent hover:text-white"
            >
              {storyLabel} →
            </Link>
          </div>
        ) : it.caption ? (
          <p className="truncate text-sm text-white/70">{it.caption}</p>
        ) : (
          <span className="flex-1 md:hidden" />
        )}
        {n > 1 ? (
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${arrow} md:hidden`}>
            →
          </button>
        ) : null}
      </div>
    </div>
  );
}
