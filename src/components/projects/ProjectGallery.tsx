"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/i18n/useI18n";
import { publicImagePath } from "@/lib/content";

type Props = {
  /** On-page bento tiles (from JSON `previewGallery` or first of modal list). */
  previewImages: string[];
  /** Full lightbox list (folder scan or `gallery`). */
  modalGallery: string[];
  title: string;
};

function modalIndexForPreview(
  previewSrc: string,
  previewIndex: number,
  modalGallery: string[],
): number {
  const idx = modalGallery.indexOf(previewSrc);
  if (idx !== -1) return idx;
  return Math.min(previewIndex, Math.max(0, modalGallery.length - 1));
}

function bentoContainerClass(total: number): string {
  const base = "grid gap-3 sm:gap-4";
  if (total <= 2) return `${base} grid-cols-2`;
  if (total === 3)
    return `${base} grid-cols-2 md:min-h-[min(52vh,500px)] lg:min-h-[520px]`;
  if (total === 4)
    return `${base} grid-cols-2 md:min-h-[min(48vh,480px)] lg:min-h-[520px]`;
  return `${base} grid-cols-2 md:grid-cols-[1.32fr_1fr] md:grid-rows-3 md:min-h-[min(56vh,560px)] lg:min-h-[600px]`;
}

function bentoCellClass(index: number, total: number): string {
  const shell =
    "group relative h-full min-h-[140px] w-full overflow-hidden rounded-2xl border border-sand/50 bg-ink/5 text-left shadow-[0_12px_32px_rgba(31,19,12,0.08)] ring-1 ring-ink/[0.04] transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page";

  if (total === 1) {
    return `${shell} col-span-2 min-h-[240px] sm:min-h-[300px] md:min-h-[380px]`;
  }
  if (total === 2) {
    return `${shell} min-h-[180px] aspect-[4/3] sm:aspect-auto sm:min-h-[220px] md:min-h-[260px]`;
  }
  if (total === 3) {
    if (index === 0) {
      return `${shell} col-span-2 min-h-[220px] md:col-span-1 md:row-span-2 md:min-h-0`;
    }
    return `${shell} min-h-[160px] md:min-h-0`;
  }
  if (total === 4) {
    return `${shell} min-h-[160px] aspect-[4/3] md:aspect-auto md:min-h-0`;
  }
  // 5 — bento: tall hero left, two stacked right, two on bottom
  if (index === 0) {
    return `${shell} col-span-2 min-h-[200px] sm:min-h-[240px] md:col-span-1 md:row-span-2 md:min-h-0`;
  }
  return `${shell} min-h-[140px] md:min-h-0`;
}

export function ProjectGallery({
  previewImages,
  modalGallery,
  title,
}: Props) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    /* createPortal(document.body) only after hydration — matches server HTML (no portal). */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client gate for portal
    setMounted(true);
  }, []);

  const openAtPreview = useCallback(
    (previewIndex: number) => {
      const src = previewImages[previewIndex];
      if (!src) return;
      const idx = modalIndexForPreview(src, previewIndex, modalGallery);
      setActiveIndex(idx);
      setLightboxOpen(true);
    },
    [previewImages, modalGallery],
  );

  const close = useCallback(() => setLightboxOpen(false), []);

  const go = useCallback(
    (delta: number) => {
      setActiveIndex((i) => {
        const n = modalGallery.length;
        if (n === 0) return 0;
        return (i + delta + n) % n;
      });
    },
    [modalGallery.length],
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, close, go]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    thumbBtnRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex, lightboxOpen]);

  if (previewImages.length === 0 || modalGallery.length === 0) return null;

  const nPreview = previewImages.length;
  const lastPreviewIndex = nPreview - 1;
  const extraCount = Math.max(0, modalGallery.length - nPreview);

  return (
    <>
      <div className={bentoContainerClass(nPreview)}>
        {previewImages.map((src, i) => {
          const showMoreOverlay = i === lastPreviewIndex && extraCount > 0;

          return (
            <motion.button
              key={`${src}-${i}`}
              type="button"
              layout
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.995 }}
              onClick={() => openAtPreview(i)}
              aria-label={`${t("projectPage.galleryOpen")} — ${i + 1}`}
              className={bentoCellClass(i, nPreview)}
            >
              <Image
                src={publicImagePath(src)}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(min-width: 768px) 42vw, 50vw"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              {showMoreOverlay ? (
                <div
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-ink/58 backdrop-blur-[2px]"
                  aria-hidden
                >
                  <span className="font-display text-4xl font-medium tabular-nums text-page md:text-5xl">
                    +{extraCount}
                  </span>
                  <span className="mt-1 max-w-[12rem] text-center text-[10px] uppercase tracking-[0.2em] text-page/85">
                    {t("projectPage.galleryMore")}
                  </span>
                </div>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      {mounted
        ? createPortal(
            <GalleryLightbox
              open={lightboxOpen}
              onClose={close}
              gallery={modalGallery}
              title={title}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              onPrev={() => go(-1)}
              onNext={() => go(1)}
              thumbBtnRefs={thumbBtnRefs}
            />,
            document.body,
          )
        : null}
    </>
  );
}

type LightboxProps = {
  open: boolean;
  onClose: () => void;
  gallery: string[];
  title: string;
  activeIndex: number;
  onSelect: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  thumbBtnRefs: MutableRefObject<(HTMLButtonElement | null)[]>;
};

function GalleryLightbox({
  open,
  onClose,
  gallery,
  title,
  activeIndex,
  onSelect,
  onPrev,
  onNext,
  thumbBtnRefs,
}: LightboxProps) {
  const { t } = useI18n();
  const labelId = useId();
  const total = gallery.length;
  const currentSrc = gallery[activeIndex];

  return (
    <AnimatePresence>
      {open && currentSrc ? (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex max-h-[100dvh] flex-col bg-[#1a1a1c]/94 backdrop-blur-md"
        >
          <div
            className="flex max-h-[100dvh] min-h-0 flex-1 flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
              <p
                id={labelId}
                className="truncate font-display text-sm tracking-[0.04em] text-white/90 sm:text-base"
              >
                {title}
              </p>
              <div className="flex items-center gap-3">
                <span className="hidden tabular-nums text-xs text-white/45 sm:inline">
                  {activeIndex + 1} / {total}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white/90 transition-colors hover:bg-white/18"
                  aria-label={t("projectPage.galleryClose")}
                >
                  ×
                </button>
              </div>
            </header>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4 sm:px-8">
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4 sm:h-12 sm:w-12"
                aria-label={t("projectPage.galleryPrev")}
              >
                <span className="text-xl leading-none">‹</span>
              </button>
              <button
                type="button"
                onClick={onNext}
                className="absolute right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4 sm:h-12 sm:w-12"
                aria-label={t("projectPage.galleryNext")}
              >
                <span className="text-xl leading-none">›</span>
              </button>

              <motion.div
                key={activeIndex}
                initial={{ opacity: 0.35, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative h-full w-full max-h-[min(72vh,calc(100dvh-200px))] max-w-6xl"
              >
                <Image
                  src={publicImagePath(currentSrc)}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </motion.div>
            </div>

            <footer className="shrink-0 border-t border-white/10 bg-black/25 px-2 py-3 sm:px-4">
              <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
                {gallery.map((src, i) => (
                  <button
                    key={`thumb-${i}-${src}`}
                    ref={(el) => {
                      thumbBtnRefs.current[i] = el;
                    }}
                    type="button"
                    onClick={() => onSelect(i)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-16 ${
                      i === activeIndex
                        ? "border-white shadow-[0_0_0_1px_rgba(255,255,255,0.4)]"
                        : "border-transparent opacity-55 hover:opacity-90"
                    }`}
                    aria-label={`${i + 1} / ${total}`}
                    aria-current={i === activeIndex ? "true" : undefined}
                  >
                    <Image
                      src={publicImagePath(src)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            </footer>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
