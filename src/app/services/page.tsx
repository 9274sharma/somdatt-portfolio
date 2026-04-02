"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/components/i18n/useI18n";
import { PageSurface } from "@/components/layout/PageSurface";
import { cardReveal, easeOut, stagger, viewportOnce } from "@/lib/motion";

const serviceBlocks = [
  {
    label: "servicesPage.weddingsLabel",
    title: "servicesPage.weddingsTitle",
    bullets: "servicesPage.weddingsBullets",
    note: "servicesPage.weddingsNote",
    step: "01",
  },
  {
    label: "servicesPage.brandsLabel",
    title: "servicesPage.brandsTitle",
    bullets: "servicesPage.brandsBullets",
    note: "servicesPage.brandsNote",
    step: "02",
  },
  {
    label: "servicesPage.socialLabel",
    title: "servicesPage.socialTitle",
    bullets: "servicesPage.socialBullets",
    note: "servicesPage.socialNote",
    step: "03",
  },
] as const;

export default function ServicesPage() {
  const { t, tList } = useI18n();

  return (
    <PageSurface>
      <div className="page-shell relative space-y-12 pb-24 pt-12 md:space-y-14 md:pt-16">
        <motion.header
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.div variants={cardReveal} className="flex items-center gap-4">
            <span className="h-px w-10 bg-accent/80" aria-hidden />
            <p className="text-xs uppercase tracking-[0.28em] text-ink-soft">
              {t("servicesPage.label")}
            </p>
          </motion.div>
          <motion.h1
            variants={cardReveal}
            className="font-display text-3xl tracking-[0.04em] md:text-[2.35rem]"
          >
            {t("servicesPage.title")}
          </motion.h1>
          <motion.p
            variants={cardReveal}
            className="max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base"
          >
            {t("servicesPage.intro")}
          </motion.p>
        </motion.header>

        <div className="grid gap-6 md:grid-cols-3">
          {serviceBlocks.map((block, index) => (
            <motion.article
              key={block.step}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{
                duration: 0.52,
                delay: index * 0.08,
                ease: easeOut,
              }}
              whileHover={{ y: -4 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-sand/55 bg-page/60 p-6 shadow-[0_18px_44px_rgba(31,19,12,0.07)] ring-1 ring-ink/[0.04] transition-shadow duration-500 hover:shadow-[0_26px_52px_rgba(31,19,12,0.1)]"
            >
              <div
                className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-accent/90 via-accent/50 to-transparent"
                aria-hidden
              />
              <p className="font-display text-4xl font-medium tabular-nums text-sand/90 transition-colors group-hover:text-accent/40">
                {block.step}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-accent">
                {t(block.label)}
              </p>
              <h2 className="mt-2 font-display text-xl tracking-[0.05em] text-ink">
                {t(block.title)}
              </h2>
              <ul className="mt-4 flex-1 space-y-2.5 text-sm leading-relaxed text-ink-soft">
                {tList(block.bullets).map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/70"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-sand/45 pt-4 text-xs uppercase leading-relaxed tracking-[0.18em] text-ink-soft">
                {t(block.note)}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </PageSurface>
  );
}
