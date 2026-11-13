import { draftMode } from "next/headers";
import { client } from "./client";

/**
 * Fetch that renders drafts + stega overlays **only** when Studio's
 * Presentation preview has enabled draft mode. Everywhere else (the live site,
 * build time, anywhere without a request) it falls back to the normal CDN read,
 * so production behaviour is unchanged.
 */
export async function fetchMaybeDraft<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors client.fetch's default
  T = any,
>(
  query: string,
  params: Record<string, unknown> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- passthrough fetch options
  opts: any = {},
): Promise<T> {
  let isDraft = false;
  try {
    isDraft = (await draftMode()).isEnabled;
  } catch {
    isDraft = false;
  }

  if (isDraft) {
    return client
      .withConfig({
        token: process.env.SANITY_WRITE_TOKEN,
        useCdn: false,
        perspective: "drafts",
        stega: { enabled: true, studioUrl: "/studio" },
      })
      .fetch<T>(query, params, { cache: "no-store" });
  }
  return client.fetch<T>(query, params, opts);
}
