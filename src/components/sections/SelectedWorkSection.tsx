"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/components/i18n/useI18n";
import { portfolioCategoryKey } from "@/lib/categoryLabels";
import { getFeaturedProjects, pickText, publicImagePath } from "@/lib/content";
import { cardReveal, easeOut, stagger, viewportOnce } from "@/lib/motion";

export function SelectedWorkSection() {
  const { t, language } = useI18n();
  const featuredProjects = getFeaturedProjects();

  return (
    <section className="section relative space-y-10">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-4">
          <motion.div variants={cardReveal} className="flex items-center gap-4">
            <span className="h-px w-10 bg-accent/80" aria-hidden />
            <p className="text-xs uppercase tracking-[0.28em] text-ink-soft">
              {t("selectedWork.label")}
            </p>
          </motion.div>
          <motion.h2
            variants={cardReveal}
            className="font-display text-2xl tracking-[0.05em] md:text-[1.75rem]"
          >
            {t("selectedWork.title")}
          </motion.h2>
        </div>
        <motion.div variants={cardReveal}>
          <Link
            href="/portfolio"
            className="inline-flex text-xs uppercase tracking-[0.26em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            {t("selectedWork.cta")}
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {featuredProjects.map((project, index) => {
          const title = pickText(project.title, language);
          const role = pickText(project.role, language);
          const location = pickText(project.location, language);
          const tag = t(portfolioCategoryKey(project.category));

          return (
            <motion.article
              key={project.slug}
              initial={{ y: 28, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{
                duration: 0.55,
                delay: index * 0.07,
                ease: easeOut,
              }}
              whileHover={{ y: -6 }}
              className="group flex flex-col justify-between rounded-3xl border border-sand/55 bg-page/55 p-4 pb-5 shadow-[0_20px_48px_rgba(31,19,12,0.07)] ring-1 ring-ink/[0.04] transition-shadow duration-500 hover:shadow-[0_28px_56px_rgba(31,19,12,0.11)]"
            >
              <Link href={`/projects/${project.slug}`} className="space-y-3">
                <div className="relative h-52 overflow-hidden rounded-2xl">
                  <Image
                    src={publicImagePath(project.cover)}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 via-ink/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-sand/30 bg-page/90 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-ink-soft backdrop-blur-sm">
                    {tag}
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <h3 className="font-display text-lg tracking-[0.04em] transition-colors group-hover:text-accent">
                    {title}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.22em] text-ink-soft">
                    {role}
                  </p>
                  <p className="text-xs text-ink-soft">{location}</p>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
