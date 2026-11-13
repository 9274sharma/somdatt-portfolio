import { urlFor } from "./image";
import type { SanityImage } from "./content";

type Hot = { hotspot?: { x: number; y: number } };

/** Original pixel size, read from the asset id (`image-<hash>-<w>x<h>-<ext>`). */
export function dims(source: SanityImage): { w: number; h: number } | null {
  const m = source?.asset?._ref?.match(/-(\d+)x(\d+)-/);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
}

/** Width ÷ height (falls back to 3:2 when unknown). */
export function aspect(source: SanityImage): number {
  const d = dims(source);
  return d ? d.w / d.h : 1.5;
}

/** Fixed-ratio crop that honours the editor's hotspot; without one it biases
 *  toward the upper third, where faces usually are. */
export function cropUrl(source: SanityImage, w: number, ratio: number, focal: [number, number] = [0.5, 0.32]): string | null {
  if (!source?.asset?._ref) return null;
  const h = Math.round(w / ratio);
  const b = urlFor(source).width(w).height(h).auto("format").quality(80);
  const hs = (source as Hot).hotspot;
  return (hs ? b.fit("crop") : b.fit("crop").crop("focalpoint").focalPoint(focal[0], focal[1])).url();
}

/** `srcset` for a fixed-ratio crop. */
export function cropSet(source: SanityImage, ratio: number, widths: number[], focal?: [number, number]): string {
  return widths
    .map((w) => {
      const u = cropUrl(source, w, ratio, focal);
      return u ? `${u} ${w}w` : "";
    })
    .filter(Boolean)
    .join(", ");
}
