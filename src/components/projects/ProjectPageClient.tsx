"use client";

import { useI18n } from "@/components/i18n/useI18n";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { portfolioCategoryKey } from "@/lib/categoryLabels";
import { pickList, pickText } from "@/lib/content";
import type { ProjectEntry } from "@/types/content";

type Props = {
  project: ProjectEntry;
  previewImages: string[];
  modalGallery: string[];
};

export function ProjectPageClient({
  project,
  previewImages,
  modalGallery,
}: Props) {
  const { t, language } = useI18n();
  const title = pickText(project.title, language);
  const categoryLabel = t(portfolioCategoryKey(project.category));
  const results = pickList(project.resultsBullets, language);

  const metaItems = [
    { label: t("projectPage.client"), value: pickText(project.client, language) },
    { label: t("projectPage.role"), value: pickText(project.role, language) },
    { label: t("projectPage.year"), value: project.year },
    { label: t("projectPage.location"), value: pickText(project.location, language) },
  ];

  return (
    <>
      <header className="space-y-8">
        <div className="flex items-center gap-4">
          <span className="h-px w-12 shrink-0 bg-accent/85" aria-hidden />
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-accent">
            {categoryLabel}
          </p>
        </div>

        <h1 className="max-w-4xl font-display text-[2.1rem] font-medium leading-[1.12] tracking-[0.02em] text-ink md:text-4xl md:leading-[1.1] lg:text-[2.65rem]">
          {title}
        </h1>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {metaItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-sand/55 bg-page/75 px-4 py-4 shadow-[0_10px_36px_rgba(31,19,12,0.05)] ring-1 ring-ink/[0.03] backdrop-blur-[2px] md:px-5 md:py-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft/90">
                {item.label}
              </p>
              <p className="mt-2.5 text-[13px] font-medium uppercase leading-snug tracking-[0.12em] text-ink md:text-sm md:tracking-[0.1em]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="relative max-w-2xl border-l-2 border-accent/45 pl-5 md:pl-6">
          <p className="text-base font-normal leading-[1.7] text-ink/[0.88] md:text-lg md:leading-[1.65]">
            {pickText(project.brief, language)}
          </p>
        </div>
      </header>

      <section className="space-y-14 md:space-y-16">
        <div className="border-t border-sand/50 pt-2">
          <ProjectGallery
            previewImages={previewImages}
            modalGallery={modalGallery}
            title={title}
          />
        </div>

        <div className="grid gap-12 border-t border-sand/45 pt-14 md:grid-cols-[1.55fr_1fr] md:gap-14 md:pt-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-accent/80" aria-hidden />
              <h2 className="font-display text-xl font-medium tracking-[0.04em] text-ink md:text-2xl md:tracking-[0.045em]">
                {t("projectPage.behind")}
              </h2>
            </div>
            <p className="max-w-xl text-[15px] leading-[1.75] text-ink-soft md:text-base md:leading-[1.8]">
              {pickText(project.behind, language)}
            </p>
          </div>

          <aside className="relative overflow-hidden rounded-3xl border border-sand/50 bg-gradient-to-br from-page/95 via-page/80 to-sand/[0.12] p-6 shadow-[0_20px_50px_rgba(31,19,12,0.07)] ring-1 ring-ink/[0.04] md:p-7">
            <div
              className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-accent/90 via-accent/45 to-transparent"
              aria-hidden
            />
            <p className="font-display text-lg font-medium tracking-[0.04em] text-ink">
              {t("projectPage.results")}
            </p>
            <ul className="mt-5 space-y-3.5 text-sm leading-relaxed text-ink-soft">
              {results.map((line, i) => (
                <li key={i} className="flex gap-3.5">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80"
                    aria-hidden
                  />
                  <span className="text-[15px] leading-[1.65] text-ink/[0.82]">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
