import fs from "fs";
import path from "path";
import type { ProjectEntry } from "@/types/content";

const WEB_IMAGE = /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i;

/**
 * Lists image files in `public/{folder}` and returns URL paths like `/images/...`.
 * Skips HEIC and other non-web formats. Server-only.
 */
export function listPublicGalleryFolder(folder: string): string[] {
  const normalized = folder.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!normalized || normalized.includes("..")) return [];

  const segments = normalized.split("/").filter(Boolean);
  const abs = path.join(process.cwd(), "public", ...segments);

  const publicRoot = path.join(process.cwd(), "public");
  if (!abs.startsWith(publicRoot)) return [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return [];
  }

  const names = entries
    .filter((d) => d.isFile() && WEB_IMAGE.test(d.name))
    .map((d) => d.name)
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );

  const base = `/${segments.join("/")}`;
  return names.map((name) => `${base}/${name}`);
}

const PREVIEW_CAP = 5;

export type ResolvedProjectGalleries = {
  previewImages: string[];
  modalGallery: string[];
};

/**
 * `modalGallery`: all images from `galleryFolder` on disk, or `project.gallery` as fallback.
 * `previewImages`: `previewGallery` from JSON (capped at 5), or first images from the modal list.
 */
export function resolveProjectGalleries(
  project: ProjectEntry,
): ResolvedProjectGalleries {
  let modalGallery: string[];

  const folder = project.galleryFolder?.trim();
  if (folder) {
    modalGallery = listPublicGalleryFolder(folder);
    if (modalGallery.length === 0) {
      modalGallery = [...(project.gallery ?? [])];
    }
  } else {
    modalGallery = [...(project.gallery ?? [])];
  }

  let previewImages: string[];
  if (project.previewGallery?.length) {
    previewImages = project.previewGallery.slice(0, PREVIEW_CAP);
  } else {
    previewImages = modalGallery.slice(0, Math.min(PREVIEW_CAP, modalGallery.length));
  }

  return { previewImages, modalGallery };
}
