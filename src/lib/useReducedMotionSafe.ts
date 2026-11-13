import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const m = window.matchMedia(QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

/** Like framer-motion's `useReducedMotion`, but hydration-safe: the server and the
 *  hydrating render both see `false` (motion on), then React re-renders with the
 *  visitor's real preference. Use it whenever the answer changes the markup. */
export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
