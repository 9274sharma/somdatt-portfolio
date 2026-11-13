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
    // Skip smooth-scroll inside the Studio (it has its own scroll areas).
    if (pathname?.startsWith("/studio")) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
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
