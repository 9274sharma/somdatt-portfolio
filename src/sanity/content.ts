import { urlFor } from "./image";
import { fetchMaybeDraft } from "./fetch";

export type LocaleString = { en?: string; de?: string } | undefined;

export type SanityImage = { asset?: { _ref?: string } } | null | undefined;

/** Build an optimised CDN URL honouring the editor's crop + hotspot. */
export function img(source: SanityImage, w: number, h?: number): string | null {
  if (!source || !source.asset?._ref) return null;
  let b = urlFor(source).width(w).auto("format").quality(80);
  if (h) b = b.height(h).fit("crop");
  return b.url();
}

export function getProjectSlugs(): Promise<{ slug: string }[]> {
  return fetchMaybeDraft(
    `*[_type=="project" && defined(slug.current)]{"slug":slug.current}`,
    {},
    { next: { revalidate: 300 } },
  );
}
