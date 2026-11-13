"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { setLenis } from "./lenis";

type Props = {
  children: ReactNode;
};

export function SmoothScroll({ children }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    // Skip smooth-scroll in the Studio and the admin app: both are app-like UIs full of their own
    // scroll areas (sheets, the week grid…), and Lenis swallows wheel/touch events meant for them.
    if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) return;

    // allowNestedScroll: any inner element that can scroll (a sheet, a list) scrolls natively.
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, allowNestedScroll: true });
    setLenis(lenis);
    let id = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    });

    // Honour an incoming #hash (e.g. arriving from another page via /#work).
    let hashTimer: ReturnType<typeof setTimeout> | undefined;
    const hash = window.location.hash;
    if (hash.length > 1) {
      hashTimer = setTimeout(() => {
        try {
          lenis.scrollTo(hash, { offset: -80 });
        } catch {
          /* ignore */
        }
      }, 140);
    }

    return () => {
      if (hashTimer) clearTimeout(hashTimer);
      cancelAnimationFrame(id);
      setLenis(null);
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
