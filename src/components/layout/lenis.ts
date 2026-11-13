import type Lenis from "lenis";

/** Shared handle to the single Lenis instance created in <SmoothScroll>, so the
 *  header's anchor links can drive smooth scrolling to home sections. */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export const getLenis = (): Lenis | null => instance;
