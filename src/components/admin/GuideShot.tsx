"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useModal } from "@/components/work/Lightbox";

/** A guide screenshot: phone capture on phones (when there is one), desktop capture above md.
 *  Tap to open it full size — pan and pinch to read the small print. */
export function GuideShot({ src, phoneSrc, alt, phone = false }: { src: string; phoneSrc?: string; alt: string; phone?: boolean }) {
  /** what the zoom shows: the phone capture on phones, the desktop one from md up */
  const [open, setOpen] = useState<{ src: string; phone: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useModal(Boolean(open), ref, () => setOpen(null));
  const zoom = () => {
    const small = window.matchMedia("(max-width: 767px)").matches;
    setOpen(phone ? { src, phone: true } : phoneSrc && small ? { src: phoneSrc, phone: true } : { src, phone: false });
  };
  const url = (n: string) => `/admin-guide/${n}.jpg`;
  const isPhone = phone;
  return (
    <>
      <button type="button" onClick={zoom} className="group relative block w-full text-left" aria-label={`${alt} — tap to zoom`}>
        {isPhone ? (
          <figure className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-[2.2rem] border-[6px] border-ink/85 bg-black shadow-2xl">
            <img src={url(src)} alt={alt} width={780} height={1688} loading="lazy" className="block h-auto w-full" />
          </figure>
        ) : (
          <>
            {phoneSrc ? (
              <figure className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-[2.2rem] border-[6px] border-ink/85 bg-black shadow-2xl md:hidden">
                <img src={url(phoneSrc)} alt={alt} width={780} height={1688} loading="lazy" className="block h-auto w-full" />
              </figure>
            ) : null}
            <figure className={`overflow-hidden rounded-2xl border border-sand/70 bg-black shadow-2xl ${phoneSrc ? "hidden md:block" : ""}`}>
              <div className="flex gap-1.5 border-b border-white/10 bg-[#1b1814] px-3 py-2" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              </div>
              <img src={url(src)} alt={alt} width={1920} height={1200} loading="lazy" className="block h-auto w-full" />
            </figure>
          </>
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white opacity-90 md:opacity-0 md:transition md:group-hover:opacity-100">
          Tap to zoom
        </span>
      </button>
      {open ? (
        <div ref={ref} role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[140] overflow-auto bg-black/95" onClick={() => setOpen(null)}>
          <button
            type="button"
            data-autofocus
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="fixed right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-[1] grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl text-white"
          >
            ×
          </button>
          <img
            src={url(open.src)}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className={open.phone ? "mx-auto my-[max(4rem,env(safe-area-inset-top))] block w-[min(26rem,92vw)] rounded-3xl" : "mx-auto my-16 block w-[min(1600px,94vw)] max-w-none"}
          />
        </div>
      ) : null}
    </>
  );
}
