"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/components/i18n/useI18n";
import { PageSurface } from "@/components/layout/PageSurface";
import { portfolioCategoryKey } from "@/lib/categoryLabels";
import { cardReveal, easeOut, stagger } from "@/lib/motion";
import { pickText, portfolioData, publicImagePath } from "@/lib/content";
import type { ProjectCategory } from "@/types/content";

const categories = ["All", "Weddings", "Commercial", "Social", "Personal"] as const;

type FilterKey = (typeof categories)[number];

export default function PortfolioPage() {
  const { t, language } = useI18n();
  const [activeCategory, setActiveCategory] = useState<FilterKey>("All");
  const introText = pickText(portfolioData.portfolioIntro, language);

  const visibleProjects = useMemo(() => {
    if (activeCategory === "All") return portfolioData.projects;
    return portfolioData.projects.filter(
      (p) => p.category === (activeCategory as ProjectCategory),
    );
  }, [activeCategory]);

  return (
    <PageSurface>
      <div className="page-shell relative space-y-10 pb-24 pt-12 md:pt-16">
        <motion.header
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.div variants={cardReveal} className="flex items-center gap-4">
            <span className="h-px w-10 bg-accent/80" aria-hidden />
            <p className="text-xs uppercase tracking-[0.28em] text-ink-soft">
              {t("portfolioPage.label")}
            </p>
          </motion.div>
          <motion.h1
            variants={cardReveal}
            className="font-display text-3xl tracking-[0.04em] md:text-[2.35rem]"
          >
            {t("portfolioPage.title")}
          </motion.h1>
          {introText.trim() ? (
            <motion.p
              variants={cardReveal}
              className="max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base"
            >
              {introText}
            </motion.p>
          ) : null}
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: easeOut }}
          className="flex flex-wrap gap-2.5 sm:gap-3"
        >
          {categories.map((category) => {
            const active = category === activeCategory;
            return (
              <motion.button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition-colors duration-300 ${
                  active
                    ? "border-ink bg-ink text-page shadow-[0_8px_24px_rgba(31,19,12,0.2)]"
                    : "border-sand/70 text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {category === "All"
                  ? t("portfolioPage.categoryAll")
                  : category === "Weddings"
                    ? t("portfolioPage.categoryWeddings")
                    : category === "Commercial"
                      ? t("portfolioPage.categoryCommercial")
                      : category === "Social"
                        ? t("portfolioPage.categorySocial")
                        : t("portfolioPage.categoryPersonal")}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="grid gap-6 md:grid-cols-3"
        >
          {visibleProjects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </motion.div>
      </div>
    </PageSurface>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: (typeof portfolioData.projects)[number];
  index: number;
}) {
  const { t, language } = useI18n();
  const title = pickText(project.title, language);
  const location = pickText(project.location, language);
  const categoryLabel = t(portfolioCategoryKey(project.category));

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: easeOut }}
      whileHover={{ y: -5 }}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group block space-y-3 rounded-3xl border border-sand/55 bg-page/55 p-3 pb-5 shadow-[0_16px_40px_rgba(31,19,12,0.06)] ring-1 ring-ink/[0.04] transition-shadow duration-500 hover:shadow-[0_24px_48px_rgba(31,19,12,0.1)]"
      >
        <div className="relative h-56 overflow-hidden rounded-2xl">
          <Image
            src={publicImagePath(project.cover)}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
        <div className="space-y-1 px-0.5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">
            {categoryLabel}
          </p>
          <h2 className="font-display text-lg tracking-[0.05em] transition-colors group-hover:text-accent">
            {title}
          </h2>
          <p className="text-xs text-ink-soft">{location}</p>
        </div>
      </Link>
    </motion.div>
  );
}
