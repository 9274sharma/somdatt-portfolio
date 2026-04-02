import { notFound } from "next/navigation";
import { PageSurface } from "@/components/layout/PageSurface";
import { ProjectPageClient } from "@/components/projects/ProjectPageClient";
import { getProjectBySlug } from "@/lib/content";
import { resolveProjectGalleries } from "@/lib/gallery-folder";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { previewImages, modalGallery } = resolveProjectGalleries(project);

  return (
    <PageSurface>
      <div className="page-shell relative z-0 space-y-12 pb-28 pt-12 md:space-y-14 md:pt-16">
        <ProjectPageClient
          project={project}
          previewImages={previewImages}
          modalGallery={modalGallery}
        />
      </div>
    </PageSurface>
  );
}
