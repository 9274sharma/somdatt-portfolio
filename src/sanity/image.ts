import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "./client";

const builder = createImageUrlBuilder(client);

/** The source shape accepted by the builder (derived so it survives version bumps). */
type ImageSource = Parameters<typeof builder.image>[0];

/** Build a CDN URL for a Sanity image (respects the editor's crop + hotspot). */
export function urlFor(source: ImageSource) {
  return builder.image(source);
}
