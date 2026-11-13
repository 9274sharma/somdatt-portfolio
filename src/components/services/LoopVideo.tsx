/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

/** Muted ambient clip: plays only while on screen, never loads under reduced motion / Save-Data,
 *  and always has a visible pause control (WCAG 2.2.2). */
export function LoopVideo({
  src,
  poster,
  className = "",
  pauseLabel = "Pause video",
  playLabel = "Play video",
}: {
  src: string;
  poster: string | null;
  className?: string;
  pauseLabel?: string;
  playLabel?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [paused, setPaused] = useState(false);
  const userPaused = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setAllowed(!reduce && !saveData);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!allowed || !v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        if (e.isIntersecting && !userPaused.current) v.play().catch(() => setPaused(true));
        else v.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [allowed]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => undefined);
      setPaused(false);
    } else {
      userPaused.current = true;
      v.pause();
      setPaused(true);
    }
  };

  if (!allowed) {
    return poster ? <img src={poster} alt="" className={className} /> : null;
  }
  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className={className}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={paused ? playLabel : pauseLabel}
        className="absolute bottom-4 right-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
      >
        {paused ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
          </svg>
        )}
      </button>
    </>
  );
}
