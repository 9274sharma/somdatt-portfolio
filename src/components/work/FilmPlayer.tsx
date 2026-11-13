/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useRef, useState } from "react";
import { useModal } from "./Lightbox";

type Source =
  | { kind: "file"; src: string }
  | { kind: "embed"; src: string }
  | { kind: "link"; src: string };

/** YouTube / Vimeo → privacy-friendly embed; .mp4/.webm → native video; else open in new tab. */
function resolve(url: string): Source {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "embed", src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&dnt=1` };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "file", src: url };
  return { kind: "link", src: url };
}

/** Poster card with a play button; plays in a focus-trapped modal. */
export function FilmPlayer({
  url,
  poster,
  title,
  duration,
  vertical,
  className = "",
}: {
  url: string;
  poster: string | null;
  title: string;
  duration?: string;
  /** 9:16 reel; auto-detected for YouTube Shorts */
  vertical?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useModal(open, ref, close);
  const s = resolve(url);
  const tall = vertical ?? /youtube\.com\/shorts\//.test(url);

  const card = (
    <>
      {poster ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-90"
        />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-black shadow-2xl transition group-hover:scale-110 group-hover:bg-accent group-hover:text-white md:h-20 md:w-20">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </span>
      <span className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white">
        <span className="truncate">{title}</span>
        {duration ? <span className="tabular-nums text-white/75">{duration}</span> : null}
      </span>
    </>
  );

  const box = `group relative block overflow-hidden rounded-3xl bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
    tall ? "mx-auto aspect-[9/16] w-full max-w-[20rem]" : "aspect-video w-full"
  } ${className}`;

  if (s.kind === "link") {
    return (
      <a href={s.src} target="_blank" rel="noopener noreferrer" className={box} aria-label={`${title} (opens in a new tab)`}>
        {card}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={box} aria-label={`Play ${title}`}>
        {card}
      </button>
      {open ? (
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={close}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            data-autofocus
            onClick={close}
            aria-label="Close video"
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full border border-white/30 text-xl text-white transition hover:bg-white hover:text-black"
          >
            ×
          </button>
          <div
            className={`view-in overflow-hidden rounded-xl bg-black shadow-2xl ${
              tall ? "aspect-[9/16] h-[min(85svh,calc((100vw-2rem)*16/9))]" : "aspect-video w-full max-w-6xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {s.kind === "file" ? (
              <video src={s.src} poster={poster ?? undefined} controls autoPlay playsInline className="h-full w-full" />
            ) : (
              <iframe
                src={s.src}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
