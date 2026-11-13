"use client";

import { useEffect, useRef, useState } from "react";

export type Milestone = { when: string; what: string; text: string };

/** "When do I get what" — a horizontal track that fills on scroll (vertical on phones). */
export function DeliveryTimeline({ items, eyebrow, title }: { items: Milestone[]; eyebrow: string; title: string }) {
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
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!items.length) return null;
  const n = items.length;
  return (
    <section className="hm-sec" id="timeline">
      <div className="mb-12 max-w-2xl">
        <p className="hm-eyebrow">{eyebrow}</p>
        <h2 className="hm-h2">{title}</h2>
      </div>
      <div ref={ref} className="relative">
        <span aria-hidden className="absolute left-[11px] top-2 bottom-2 w-px bg-sand md:left-0 md:right-0 md:top-[11px] md:bottom-auto md:h-px md:w-auto" />
        <span
          aria-hidden
          className="absolute left-[10px] top-2 bottom-2 w-[3px] origin-top rounded-full bg-accent md:left-0 md:right-0 md:top-[10px] md:bottom-auto md:h-[3px] md:w-auto md:origin-left"
          style={{
            transform: on ? "scale(1)" : "scale(0)",
            transition: "transform 1.8s cubic-bezier(.22,1,.36,1)",
          }}
        />
        <ol
          className="relative grid gap-8 md:gap-6 md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
          style={{ ["--n" as string]: n }}
        >
          {items.map((m, i) => (
            <li
              key={m.when}
              className="relative pl-10 md:pl-0 md:pt-10"
              style={{
                opacity: on ? 1 : 0,
                transform: on ? "none" : "translateY(12px)",
                transition: `opacity .6s ease ${0.25 + i * 0.25}s, transform .6s cubic-bezier(.22,1,.36,1) ${0.25 + i * 0.25}s`,
              }}
            >
              <span aria-hidden className="absolute left-0 top-0 grid h-[23px] w-[23px] place-items-center rounded-full border-2 border-accent bg-page md:left-0">
                <span className="h-2 w-2 rounded-full bg-accent" />
              </span>
              <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-accent">{m.when}</p>
              <p className="mt-1.5 font-display text-xl font-bold">{m.what}</p>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-soft">{m.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
