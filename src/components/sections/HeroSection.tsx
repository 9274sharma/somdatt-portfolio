"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useI18n } from "@/components/i18n/useI18n";
import { easeOut, fadeUp } from "@/lib/motion";
import { portfolioData, publicImagePath } from "@/lib/content";

export function HeroSection() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const yTitle = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const scaleBackdrop = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  return (
    <section ref={ref} className="relative grid gap-10 md:grid-cols-[1.5fr,1fr]">
      <div className="space-y-8">
        <motion.div
          style={{ y: yTitle }}
          className="flex items-center gap-4"
        >
          <span className="h-px w-10 shrink-0 bg-accent/80" aria-hidden />
          <p className="text-xs uppercase tracking-[0.28em] text-ink-soft">
            {t("hero.tagline")}
          </p>
        </motion.div>
        <motion.h1
          style={{ y: yTitle }}
          className="font-display text-4xl leading-tight tracking-[0.02em] md:text-5xl"
        >
          {t("hero.title")}
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.12 }}
          className="max-w-lg text-sm leading-relaxed text-ink-soft md:text-base"
        >
          {t("hero.body")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease: easeOut }}
          className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em]"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/portfolio"
              className="inline-block rounded-full bg-ink px-6 py-3 text-page transition-colors duration-300 hover:bg-accent"
            >
              {t("hero.ctaPrimary")}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/contact"
              className="inline-block rounded-full border border-ink-soft/60 px-6 py-3 text-ink-soft transition-colors duration-300 hover:border-ink hover:text-ink"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </motion.div>
          <span className="text-ink-soft">{t("hero.experience")}</span>
        </motion.div>
      </div>

      <motion.div
        style={{ scale: scaleBackdrop }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.15, ease: easeOut }}
        className="relative h-[min(92vw,26rem)] min-h-[26rem] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-sand/40 via-page to-ink/5 shadow-[0_28px_60px_rgba(31,19,12,0.1)] ring-1 ring-sand/45 sm:min-h-[28rem] sm:h-[min(88vw,32rem)] md:min-h-[32rem] md:h-[min(70vh,36rem)] lg:min-h-[34rem] lg:h-[min(72vh,38rem)]"
      >
        <Link
          href="/about"
          className="absolute inset-0 z-[15] rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          aria-label={t("nav.aboutPhoto")}
        />
        <div className="absolute inset-3 z-0 overflow-hidden rounded-2xl sm:inset-4">
          <Image
            src={publicImagePath(portfolioData.heroImage)}
            alt=""
            fill
            className="object-cover"
            style={{
              objectPosition:
                portfolioData.heroImageObjectPosition ?? "center 32%",
            }}
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full border border-sand/70" />
          <div className="absolute -bottom-14 -right-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 rounded-b-3xl bg-gradient-to-t from-ink/85 via-ink/45 to-transparent px-5 pb-5 pt-14 sm:px-6 sm:pb-6">
          <p className="max-w-[18rem] text-[11px] font-medium uppercase leading-snug tracking-[0.2em] text-page drop-shadow-sm sm:text-xs sm:tracking-[0.22em]">
            {t("hero.locations")}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
