"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useI18n } from "@/components/i18n/useI18n";
import { aboutData, pickList, pickText, publicImagePath } from "@/lib/content";

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

const itemView = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export default function AboutPage() {
  const { t, language } = useI18n();
  const portrait = aboutData.portraitImage?.trim();
  const portraitPos =
    aboutData.portraitImageObjectPosition ?? "center 40%";

  return (
    <div className="page-shell relative overflow-hidden pb-24 pt-12 md:pt-16">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-40 h-64 w-64 rounded-full border border-sand/40 opacity-60"
        aria-hidden
      />

      <motion.header
        variants={stagger}
        initial="hidden"
        animate="show"
        className={`relative grid gap-10 md:gap-14 ${portrait ? "md:grid-cols-[1.12fr,0.88fr] md:items-start" : ""}`}
      >
        <div className="space-y-5">
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <span className="h-px w-10 bg-accent/80" aria-hidden />
            <p className="text-xs uppercase tracking-[0.28em] text-ink-soft">
              {t("aboutPage.label")}
            </p>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-display text-3xl tracking-[0.04em] md:text-[2.35rem] md:leading-tight"
          >
            {pickText(aboutData.header.title, language)}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base md:leading-relaxed"
          >
            {pickText(aboutData.header.intro, language)}
          </motion.p>
        </div>

        {portrait ? (
          <motion.div
            variants={fadeUp}
            className="relative mx-auto w-full max-w-sm md:mx-0 md:max-w-none"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-sand/35 via-page to-ink/[0.04] shadow-[0_24px_60px_rgba(31,19,12,0.12)] ring-1 ring-sand/50">
              <div className="absolute inset-3 overflow-hidden rounded-2xl sm:inset-4">
                <Image
                  src={publicImagePath(portrait)}
                  alt={`${t("aboutPage.label")} — Somdatt Sharma`}
                  fill
                  className="object-cover"
                  style={{ objectPosition: portraitPos }}
                  sizes="(min-width: 768px) 320px, 90vw"
                  priority
                />
              </div>
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-ink/[0.06]"
                aria-hidden
              />
            </div>
          </motion.div>
        ) : null}
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12%" }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="mt-16 grid gap-12 border-t border-sand/50 pt-16 md:mt-20 md:grid-cols-[1.45fr,1fr] md:gap-14 md:pt-20"
      >
        <div className="space-y-8">
          <h2 className="font-display text-xl tracking-[0.05em] text-ink">
            {pickText(aboutData.experienceHeading, language)}
          </h2>
          <div className="space-y-6">
            {aboutData.experience.map((item, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.06,
                  ease: easeOut,
                }}
                className="group relative overflow-hidden rounded-2xl border border-sand/50 bg-page/50 py-5 pl-6 pr-5 transition-shadow duration-500 hover:shadow-[0_16px_40px_rgba(31,19,12,0.08)] md:pl-7"
              >
                <div
                  className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent to-accent/40 transition-all duration-500 group-hover:w-1.5"
                  aria-hidden
                />
                <h3 className="text-[15px] font-medium leading-snug text-ink md:text-base">
                  {pickText(item.title, language)}
                </h3>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-accent">
                  {pickText(item.dates, language)}
                </p>
                <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-soft">
                  {pickList(item.bullets, language).map((line, j) => (
                    <li key={j} className="flex gap-3">
                      <span
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/70"
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.aside
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="space-y-0 overflow-hidden rounded-3xl border border-sand/55 bg-page/75 p-6 shadow-[0_20px_50px_rgba(31,19,12,0.07)] backdrop-blur-sm md:p-7"
        >
          <motion.div variants={itemView} className="border-b border-sand/45 pb-6">
            <h2 className="font-display text-lg tracking-[0.05em] text-ink">
              {pickText(aboutData.skillsHeading, language)}
            </h2>
            <div className="mt-4 space-y-3">
              {pickList(aboutData.skillsLines, language).map((line, row) => (
                <div key={row} className="flex flex-wrap gap-2">
                  {line
                    .split("·")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((chip) => (
                      <span
                        key={`${row}-${chip}`}
                        className="rounded-full border border-sand/60 bg-page/90 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft transition-colors duration-300 hover:border-accent/50 hover:text-ink"
                      >
                        {chip}
                      </span>
                    ))}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemView} className="border-b border-sand/45 py-6">
            <h2 className="font-display text-lg tracking-[0.05em] text-ink">
              {pickText(aboutData.educationHeading, language)}
            </h2>
            <div className="mt-3 space-y-2">
              {pickList(aboutData.educationLines, language).map((line, i) => (
                <p
                  key={i}
                  className="text-xs uppercase leading-relaxed tracking-[0.18em] text-ink-soft"
                >
                  {line}
                </p>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemView} className="border-b border-sand/45 py-6">
            <h2 className="font-display text-lg tracking-[0.05em] text-ink">
              {pickText(aboutData.languagesHeading, language)}
            </h2>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-soft">
              {pickText(aboutData.languagesLine, language)}
            </p>
          </motion.div>

          <motion.div variants={itemView} className="space-y-4 pt-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink">
              {pickText(aboutData.downloadCvLabel, language)}
            </p>
            <div className="flex flex-wrap gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="/Somdatt_CV.pdf"
                  download="Somdatt_CV.pdf"
                  className="inline-block rounded-full bg-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-page transition-colors duration-300 hover:bg-accent"
                >
                  EN CV
                </a>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="/Somdatt_Sharma_CV_German.pdf"
                  download="Somdatt_Sharma_CV_German.pdf"
                  className="inline-block rounded-full border border-ink/25 bg-transparent px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink/5"
                >
                  DE CV
                </a>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="/Portfolio_somu.pdf"
                  download="Portfolio_somu.pdf"
                  className="inline-block rounded-full border border-ink/25 bg-transparent px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink/5"
                >
                  PORTFOLIO
                </a>
              </motion.div>
            </div>
          </motion.div>
        </motion.aside>
      </motion.section>
    </div>
  );
}
