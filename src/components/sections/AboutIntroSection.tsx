"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/components/i18n/useI18n";
import { cardReveal, easeOut, stagger, viewportOnce } from "@/lib/motion";

export function AboutIntroSection() {
  const { t, tList } = useI18n();

  return (
    <section className="section relative grid gap-10 md:grid-cols-[1.4fr,1fr] md:gap-12">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="space-y-6"
      >
        <motion.div variants={cardReveal} className="flex items-center gap-4">
          <span className="h-px w-10 bg-accent/80" aria-hidden />
          <p className="text-xs uppercase tracking-[0.28em] text-ink-soft">
            {t("homeAbout.label")}
          </p>
        </motion.div>
        <motion.h2
          variants={cardReveal}
          className="font-display text-2xl tracking-[0.05em] md:text-[1.85rem]"
        >
          {t("homeAbout.title")}
        </motion.h2>
        <motion.p
          variants={cardReveal}
          className="max-w-xl text-sm leading-relaxed text-ink-soft md:text-base"
        >
          {t("homeAbout.body")}
        </motion.p>
        <motion.div
          variants={cardReveal}
          className="grid gap-3 text-xs uppercase tracking-[0.2em] text-ink-soft sm:grid-cols-3"
        >
          {[
            { n: "3+", l: t("homeAbout.statYears") },
            { n: "150+", l: t("homeAbout.statProjects") },
            { n: "2", l: t("homeAbout.statCountries") },
          ].map((stat) => (
            <div
              key={stat.l}
              className="rounded-2xl border border-sand/50 bg-page/60 px-4 py-4 transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(31,19,12,0.06)]"
            >
              <p className="font-display text-3xl font-medium tabular-nums text-ink">
                {stat.n}
              </p>
              <p className="mt-2 leading-snug">{stat.l}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="space-y-4 rounded-3xl border border-sand/55 bg-page/70 p-6 shadow-[0_20px_50px_rgba(31,19,12,0.07)] ring-1 ring-ink/[0.04] backdrop-blur-sm"
      >
        <p className="text-sm font-medium text-ink">
          {t("homeAbout.workOn")}
        </p>
        <ul className="space-y-3 text-sm text-ink-soft">
          {tList("homeAbout.list").map((item) => (
            <li key={item} className="flex gap-3">
              <span
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/75"
                aria-hidden
              />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
          <Link
            href="/about"
            className="inline-flex text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            {t("homeAbout.cta")}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
