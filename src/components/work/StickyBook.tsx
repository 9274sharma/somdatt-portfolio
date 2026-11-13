"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Phones only: a "Book a similar shoot" pill that appears while you browse the gallery
 *  and hides again when the booking band at the end — or the gallery's "Show all" button — is on screen. */
export function StickyBook({ href, label }: { href: string; label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const gallery = document.getElementById("gallery");
    const band = document.querySelector(".hm-ctaband");
    if (!gallery) return;
    let inGallery = false;
    let bandOn = false;
    // the gallery's "Show all" button sits right where the pill floats — step aside while it's on screen
    const stopOn = () => {
      const el = document.querySelector("[data-sticky-stop]");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const update = () => setShow(inGallery && !bandOn && !stopOn());
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.target === gallery) inGallery = e.isIntersecting || e.boundingClientRect.top < 0;
          if (e.target === band) bandOn = e.isIntersecting;
        }
        update();
      },
      { threshold: 0 },
    );
    io.observe(gallery);
    if (band) io.observe(band);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition duration-300 md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <Link href={href} tabIndex={show ? 0 : -1} className="hm-btn solid shadow-2xl">
        {label} →
      </Link>
    </div>
  );
}
