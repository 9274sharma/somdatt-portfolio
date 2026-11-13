/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectSlugs, img } from "@/sanity/content";
import { aspect, cropSet, cropUrl } from "@/sanity/media";
import { getProjectFull, pickBlocks } from "@/sanity/queries";
import { getLang } from "@/i18n/server";
import { pick } from "@/i18n/messages";
import { fill, ui } from "@/i18n/ui";
import { JustifiedGallery, type GalleryPhoto } from "@/components/work/JustifiedGallery";
import { ProjectRail, type RailProject } from "@/components/work/ProjectRail";
import { CategoryIcon } from "@/components/work/CategoryIcon";
import { FilmPlayer } from "@/components/work/FilmPlayer";
import { ReadMore } from "@/components/work/ReadMore";
import { RichText } from "@/components/RichText";
import { StickyBook } from "@/components/work/StickyBook";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectFull(slug);
  if (!p) return { title: "Project" };
  const og = cropUrl(p.cover, 1200, 1200 / 630);
  return {
    title: pick(p.title, "en"),
    description: pick(p.description, "en") || undefined,
    openGraph: og ? { images: [{ url: og, width: 1200, height: 630 }] } : undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [lang, p] = await Promise.all([getLang(), getProjectFull(slug)]);
  if (!p) notFound();
  const u = ui(lang).project;
  const title = pick(p.title, lang) || "Untitled";
  const cat = p.category ? pick(p.category.title, lang) : "";
  const location = pick(p.location, lang);

  const gal = p.gallery ?? [];
  const land = gal.filter((g) => aspect(g) > 1.2);
  const side = [land[0] ?? gal[0], land[1] ?? gal[1]].filter(Boolean);

  const photos: GalleryPhoto[] = gal.flatMap((g, i) => {
    const src = img(g, 900);
    return src
      ? [{ src, full: img(g, 1600) ?? src, fullSet: `${img(g, 1600)} 1600w, ${img(g, 2400)} 2400w`, alt: g.alt || `${title} — ${i + 1}`, aspect: aspect(g) }]
      : [];
  });

  const written = (p.facts ?? [])
    .map((f) => ({ k: pick(f.label, lang), v: pick(f.value, lang) }))
    .filter((f) => f.k && f.v);
  const de = lang === "de";
  // until facts are written in the Studio, show what we already know
  const facts = written.length
    ? written
    : [
        { k: de ? "Fotos" : "Photos", v: gal.length ? String(gal.length) : "" },
        { k: de ? "Kategorie" : "Category", v: pick(p.category?.title, lang) },
        { k: de ? "Ort" : "Where", v: pick(p.location, lang) },
        { k: de ? "Datum" : "When", v: p.date ?? "" },
      ].filter((f) => f.v);

  const videos = (p.videos ?? []).filter((v) => v.fileUrl || v.url);
  const story = pickBlocks(p.story, lang);
  const intro = pick(p.description, lang);
  const highlights = (p.highlights ?? []).map((h) => ({ t: pick(h.title, lang), x: pick(h.text, lang) })).filter((h) => h.t);
  const more: RailProject[] = p.more.map((m) => ({
    slug: m.slug,
    title: pick(m.title, lang) || "Untitled",
    meta: [pick(m.location, lang), m.date].filter(Boolean).join(" · ") || undefined,
    summary: pick(m.description, lang) || undefined,
    cover: cropUrl(m.cover, 760, 4 / 5),
    wide: cropUrl(m.cover, 1400, 3 / 2),
    href: `/projects/${m.slug}`,
  }));
  const tile = "relative overflow-hidden bg-white/5 md:rounded-2xl";
  const film = (i: number) => {
    const v = videos[i];
    return (
      <FilmPlayer
        url={(v.fileUrl ?? v.url) as string}
        poster={v.poster ? cropUrl(v.poster, 1280, v.vertical ? 9 / 16 : 16 / 9) : cropUrl(p.cover, 1280, 16 / 9)}
        title={pick(v.title, lang) || u.reel}
        duration={v.duration}
        vertical={v.vertical}
      />
    );
  };

  return (
    <>
      <section className="relative overflow-hidden bg-black text-white">
        <div aria-hidden className="pointer-events-none absolute -right-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-[130px]" />
        <div className="hm-wrap relative grid gap-6 pb-10 pt-8 lg:grid-cols-[0.9fr_1.2fr] lg:gap-x-14 lg:gap-y-8 lg:pb-16 lg:pt-14">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.2em] text-white/60">
              <Link href="/portfolio" className="hover:text-white">
                {u.breadcrumb}
              </Link>
              {p.category ? (
                <>
                  {" / "}
                  <Link href={`/portfolio?cat=${p.category.slug}`} className="hover:text-white">
                    {cat}
                  </Link>
                </>
              ) : null}
            </nav>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">{title}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm uppercase tracking-[0.18em] text-white/75">
              {p.category ? (
                <span className="inline-flex items-center gap-2 text-accent">
                  <CategoryIcon hint={p.category.slug} size={16} /> {cat}
                </span>
              ) : null}
              {location ? (
                <>
                  <span aria-hidden>·</span> {location}
                </>
              ) : null}
              {p.date ? (
                <>
                  <span aria-hidden>·</span> {p.date}
                </>
              ) : null}
            </p>
          </div>

          <div
            className={`-mx-5 grid grid-cols-2 gap-2 md:mx-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center lg:gap-3 ${
              side.length ? "lg:h-[30rem] lg:grid-cols-[1.35fr_1fr] lg:grid-rows-2" : ""
            }`}
          >
            <div className={`${tile} col-span-2 aspect-[4/5] max-h-[64svh] ${side.length ? "lg:col-span-1 lg:row-span-2 lg:aspect-auto lg:h-full lg:max-h-none" : "lg:max-h-[34rem]"}`}>
              <img
                src={cropUrl(p.cover, 960, 4 / 5) ?? ""}
                srcSet={cropSet(p.cover, 4 / 5, [480, 720, 960, 1280])}
                sizes="(min-width: 1024px) 380px, 100vw"
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
            {side.map((f, i) => (
              <a key={i} href="#gallery" className={`${tile} group aspect-[6/5] lg:aspect-auto`} aria-label={u.viewPhotos}>
                <img
                  src={cropUrl(f, 720, 6 / 5) ?? ""}
                  srcSet={cropSet(f, 6 / 5, [360, 540, 720])}
                  sizes="(min-width: 1024px) 280px, 50vw"
                  alt=""
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              </a>
            ))}
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            {facts.length ? (
              <dl className="grid grid-cols-2 gap-2 sm:max-w-md">
                {facts.slice(0, 4).map((f) => (
                  <div key={f.k} className="rounded-2xl border border-white/15 px-4 py-3">
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-white/55">{f.k}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-white">{f.v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {photos.length ? (
                <a href="#gallery" className="hm-btn solid">
                  {u.viewPhotos} ↓
                </a>
              ) : null}
              {videos.length ? (
                <a href="#film" className="hm-btn" style={{ border: "1px solid rgba(255,255,255,.3)", color: "#fff" }}>
                  ▶ {u.watchReel}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="hm-wrap">
        {story.length || intro || videos.length ? (
          <section className={`grid gap-10 py-14 md:py-20 ${videos.length ? "lg:grid-cols-[1.1fr_1fr] lg:gap-16" : ""}`}>
            <article className="min-w-0 max-w-2xl">
              <p className="hm-eyebrow">{u.story}</p>
              {pick(p.headline, lang) ? (
                <h2 className="hm-h2" style={{ marginBottom: "1.2rem" }}>
                  {pick(p.headline, lang)}
                </h2>
              ) : null}
              <ReadMore more={u.readMore} less={u.showLess}>
                <div className="text-[1.05rem] leading-[1.75] text-ink-soft">
                  {story.length ? <RichText value={story} /> : <p>{intro}</p>}
                </div>
              </ReadMore>
            </article>
            {videos.length ? (
              <aside id="film" className="scroll-mt-28">
                <p className="hm-eyebrow mb-4">{u.reel}</p>
                {film(0)}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sand/60 p-5">
                  <p className="text-sm text-ink-soft">
                    {u.planning}
                    <br />
                    <span className="font-semibold text-ink">{u.oneTeam}</span>
                  </p>
                  <Link href={`/contact${p.category ? `?type=${p.category.slug}` : ""}`} className="hm-btn dark">
                    {u.bookSimilar}
                  </Link>
                </div>
              </aside>
            ) : null}
          </section>
        ) : null}

        {photos.length ? (
          <section id="gallery" className="scroll-mt-24 border-t border-sand/60 pb-28 pt-14 md:pb-20 md:pt-20">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="hm-eyebrow">{u.gallery}</p>
                <h2 className="hm-h2">{u.fullSet}</h2>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">{fill(u.photosHint, { n: photos.length })}</p>
            </div>
            <JustifiedGallery photos={photos} limit={24} rowHeight={{ base: 240, md: 300 }} moreLabel={fill(u.showAll, { n: photos.length })} />
          </section>
        ) : null}

        {videos.length > 1 ? (
          <section className="hm-sec mt-16">
            <div className="grid gap-5 md:grid-cols-2">
              {videos.slice(1).map((v, i) => (
                <div key={v._key}>{film(i + 1)}</div>
              ))}
            </div>
          </section>
        ) : null}

        {highlights.length ? (
          <section className="hm-sec mt-16">
            <p className="hm-eyebrow">{u.unique}</p>
            <ol className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-3">
              {highlights.map((h, i) => (
                <li key={h.t} className="border-t-2 border-accent/70 pt-5">
                  <p className="font-display text-sm font-extrabold text-accent">{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-2 font-display text-xl font-bold">{h.t}</p>
                  {h.x ? <p className="mt-2 text-sm leading-relaxed text-ink-soft">{h.x}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {more.length ? (
          <section className="hm-sec">
            <ProjectRail projects={more} cta={ui(lang).work.viewStory} heading={<h2 className="hm-h2">{fill(u.moreFrom, { cat })}</h2>} />
          </section>
        ) : null}

        {photos.length ? <StickyBook href={`/contact${p.category ? `?type=${p.category.slug}` : ""}`} label={de ? "Ähnliches Shooting buchen" : "Book a similar shoot"} /> : null}
        <section className="hm-ctaband">
          <p className="hm-eyebrow">{u.ctaEyebrow}</p>
          <h2>{u.ctaTitle}</h2>
          <p>{u.ctaText}</p>
          <Link className="hm-btn dark" href={`/contact${p.category ? `?type=${p.category.slug}` : ""}`}>
            {u.ctaButton}
          </Link>
        </section>
      </div>
    </>
  );
}
