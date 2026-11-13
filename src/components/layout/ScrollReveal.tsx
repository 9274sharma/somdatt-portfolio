"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/* [data-reveal]: its children rise in one after another (see globals.css) */
const SELECTOR = ".hm-sec,.hm-pagehead,.hm-about,.hm-ctaband,.hm-cats,[data-reveal]";

/** Reveals sections as they scroll into view. Progressive-enhancement: without
 *  JS (or with reduced-motion) the `.anim` gate is never set, so content shows. */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("anim")) {
      // reduced-motion users: reveal everything immediately
      document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    const watch = (root: ParentNode) =>
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains("in")) io.observe(el);
      });
    watch(document);
    // Sections rendered later (client-side views, success screens) get revealed too.
    const mo = new MutationObserver((muts) => {
      for (const m of muts)
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches(SELECTOR) && !n.classList.contains("in")) io.observe(n);
          watch(n);
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
