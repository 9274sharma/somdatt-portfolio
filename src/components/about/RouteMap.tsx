"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DELHI, DOTS, DOT_R, HAMBURG, MAP_H, MAP_W } from "./dotmap-data";

type P = { x: number; y: number };

/** Dot-matrix map (Europe → India) with an animated Delhi → Hamburg route.
 *  Pure SVG, no map service — fast, no cookies, works offline. */
export function RouteMap({
  from = "Delhi",
  fromNote = "Where it started",
  to = "Hamburg",
  toNote = "Home base",
  distance = "≈ 6,000 km",
}: {
  from?: string;
  fromNote?: string;
  to?: string;
  toNote?: string;
  distance?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Split dots into "near a pin" (accent glow) and the rest, as two compact paths.
  const { base, glow } = useMemo(() => {
    const near = (d: P, p: P, r: number) => (d.x - p.x) ** 2 + (d.y - p.y) ** 2 < r * r;
    const r = DOT_R;
    const circle = (d: P) => `M${d.x - r} ${d.y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
    let b = "";
    let g = "";
    for (const s of DOTS.split(" ")) {
      const [x, y] = s.split(",").map(Number);
      const d = { x, y };
      if (near(d, HAMBURG, 3.6) || near(d, DELHI, 3.6)) g += circle(d);
      else b += circle(d);
    }
    return { base: b, glow: g };
  }, []);

  const mid = { x: (HAMBURG.x + DELHI.x) / 2, y: (HAMBURG.y + DELHI.y) / 2 };
  const ctrl = { x: mid.x - 4, y: mid.y - 22 };
  const route = `M${DELHI.x} ${DELHI.y} Q${ctrl.x} ${ctrl.y} ${HAMBURG.x} ${HAMBURG.y}`;
  // quadratic midpoint (t = .5) — where the distance pill sits
  const apex = { x: 0.25 * DELHI.x + 0.5 * ctrl.x + 0.25 * HAMBURG.x, y: 0.25 * DELHI.y + 0.5 * ctrl.y + 0.25 * HAMBURG.y };
  const ease = "cubic-bezier(.65,0,.35,1)";

  return (
    <div ref={ref} className="relative overflow-hidden rounded-3xl border border-sand/60 bg-sand/10 p-3 md:p-4">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="h-auto w-full" role="img" aria-label={`Map: ${from} to ${to}, ${distance}`}>
        <path d={base} className="text-ink-soft" fill="currentColor" style={{ opacity: "var(--map-dot)" }} />
        <path
          d={glow}
          className="text-accent"
          fill="currentColor"
          style={{ opacity: on ? 0.7 : 0.28, transition: "opacity 1.2s ease .4s" }}
        />

        {/* route */}
        <path d={route} fill="none" className="text-ink-soft" stroke="currentColor" strokeWidth=".35" strokeDasharray=".9 1.1" opacity=".5" />
        <path
          d={route}
          fill="none"
          className="text-accent"
          stroke="currentColor"
          strokeWidth=".7"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          style={{ strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset 2.2s ${ease}` }}
        />
        <circle
          r="1"
          className="text-accent"
          fill="currentColor"
          style={{ offsetPath: `path("${route}")`, offsetDistance: on ? "100%" : "0%", transition: `offset-distance 2.2s ${ease}` }}
        />

        {/* Delhi */}
        <circle cx={DELHI.x} cy={DELHI.y} r="1.2" className="text-ink" fill="currentColor" />
        {/* Hamburg + pulse */}
        <circle cx={HAMBURG.x} cy={HAMBURG.y} r="1.3" className="text-accent" fill="currentColor" />
        {on ? (
          <circle cx={HAMBURG.x} cy={HAMBURG.y} r="1.3" className="map-pulse text-accent" fill="none" stroke="currentColor" strokeWidth=".5" />
        ) : null}

        {/* labels */}
        <g style={{ fontFamily: "var(--font-display)" }} fontWeight="700" fontSize="3.4" className="map-label text-ink" fill="currentColor">
          <text x={HAMBURG.x - 0.6} y={HAMBURG.y + 7.4}>{to}</text>
          <text x={DELHI.x + 2.4} y={DELHI.y + 6} textAnchor="end">{from}</text>
        </g>
        <g fontSize="1.85" letterSpacing=".28" className="map-label text-ink-soft" fill="currentColor">
          <text x={HAMBURG.x - 0.6} y={HAMBURG.y + 10}>{toNote.toUpperCase()}</text>
          <text x={DELHI.x + 2.4} y={DELHI.y + 8.6} textAnchor="end">{fromNote.toUpperCase()}</text>
        </g>

        {/* distance pill */}
        <g style={{ opacity: on ? 1 : 0, transition: "opacity .5s 1.3s" }}>
          <rect x={apex.x - 7.4} y={apex.y + 2.2} width="14.8" height="4.6" rx="2.3" className="text-page" fill="currentColor" />
          <rect x={apex.x - 7.4} y={apex.y + 2.2} width="14.8" height="4.6" rx="2.3" className="text-accent" fill="currentColor" opacity=".18" />
          <text x={apex.x} y={apex.y + 5.3} textAnchor="middle" fontSize="2.2" fontWeight="600" className="text-accent" fill="currentColor">
            {distance}
          </text>
        </g>
      </svg>
    </div>
  );
}
