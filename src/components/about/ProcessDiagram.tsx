"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

type Step = { title: string; text: string };

/** "How I work" — numbered steps joined by a line that draws in on scroll. */
export function ProcessDiagram({ steps }: { steps: Step[] }) {
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
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cols = steps.length;
  const edge = `${50 / cols}%`;

  return (
    <div ref={ref} className="relative">
      {/* desktop: horizontal connector between first and last node */}
      <span
        aria-hidden
        className="absolute top-7 hidden h-px bg-sand md:block"
        style={{ left: edge, right: edge }}
      />
      <span
        aria-hidden
        className="absolute top-7 hidden h-[2px] origin-left bg-accent md:block"
        style={{
          left: edge,
          right: edge,
          transform: on ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 1.6s cubic-bezier(.22,1,.36,1)",
        }}
      />
      {/* mobile: vertical connector */}
      <span aria-hidden className="absolute bottom-7 left-7 top-7 w-px bg-sand md:hidden" />
      <span
        aria-hidden
        className="absolute bottom-7 left-7 top-7 w-[2px] origin-top bg-accent md:hidden"
        style={{
          transform: on ? "scaleY(1)" : "scaleY(0)",
          transition: "transform 1.6s cubic-bezier(.22,1,.36,1)",
        }}
      />

      <ol
        className="relative grid gap-9 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))] md:gap-4"
        style={{ "--cols": cols } as CSSProperties}
      >
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="relative flex gap-5 md:block md:text-center"
            style={{
              opacity: on ? 1 : 0,
              transform: on ? "none" : "translateY(14px)",
              transition: "opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1)",
              transitionDelay: `${0.2 + i * 0.18}s`,
            }}
          >
            <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-accent bg-page font-display text-lg font-extrabold text-accent md:mx-auto">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="pt-2 md:mt-5 md:pt-0">
              <p className="font-display text-lg font-bold">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
