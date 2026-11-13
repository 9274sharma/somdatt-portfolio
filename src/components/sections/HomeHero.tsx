/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

type Props = {
  /** desktop (16:10) + phone (4:5, hotspot crop) versions of each slide */
  heroes: { src: string; srcSet: string; mobileSet: string }[];
  eyebrow: string;
  l1: string;
  l2: string;
  sub: string;
  cta1: string;
  cta2: string;
};

/** Hero with a tasteful scroll parallax: the imagery drifts down slightly and
 *  the copy lifts + fades as you scroll past. Disabled under reduced-motion.
 *  The image layer stays `priority` (LCP) — parallax is a transform on top. */
export function HomeHero({ heroes, eyebrow, l1, l2, sub, cta1, cta2 }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const slidesY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -64]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={ref} className="hm-hero" id="top">
      <motion.div
        className="hm-slides"
        style={reduce ? undefined : { y: slidesY, top: "-16%", bottom: "-16%" }}
      >
        {heroes.length ? (
          heroes.slice(0, 4).map((h, i) => (
            <picture key={i} className="hm-slide">
              <source media="(max-width: 767px)" srcSet={h.mobileSet} sizes="100vw" />
              <img src={h.src} srcSet={h.srcSet} sizes="100vw" alt="" fetchPriority={i === 0 ? "high" : "auto"} />
            </picture>
          ))
        ) : (
          <div className="hm-slide" style={{ opacity: 1 }} />
        )}
      </motion.div>
      <motion.div
        className="hm-hero-inner"
        style={reduce ? undefined : { y: textY, opacity: textOpacity }}
      >
        <p className="hm-hero-eyebrow">{eyebrow}</p>
        <h1>
          <span>
            <span>{l1}</span>
          </span>
          <span>
            <span>{l2}</span>
          </span>
        </h1>
        <p>{sub}</p>
        <div className="hm-cta">
          <Link className="hm-btn solid" href="/portfolio">
            {cta1}
          </Link>
          <Link className="hm-btn ghost" href="/contact">
            {cta2}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
