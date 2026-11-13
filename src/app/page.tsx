/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { img, type LocaleString } from "@/sanity/content";
import { cropSet, cropUrl } from "@/sanity/media";
import { TiltCard } from "@/components/about/TiltCard";
import { CountUp } from "@/components/about/CountUp";
import { Marquee } from "@/components/about/Marquee";
import { getHome, pickBlocks, type GalleryImg } from "@/sanity/queries";
import { getLang } from "@/i18n/server";
import { pick, tr, type MsgKey } from "@/i18n/messages";
import { ui, fill } from "@/i18n/ui";
import { HomeHero } from "@/components/sections/HomeHero";
import { WorkSpotlight, type WorkFrame } from "@/components/sections/WorkSpotlight";
import { ServiceIcon } from "@/components/sections/ServiceIcon";
import { CategoryIcon } from "@/components/work/CategoryIcon";
import { RichText } from "@/components/RichText";

/** About teaser portrait without a Studio hotspot: anchor the crop low — the current portrait has
 *  dark sky in its top third, so a top-biased crop wastes ~30 % of the frame on black. */
const PORTRAIT_FOCAL: [number, number] = [0.5, 1];
import { Testimonials } from "@/components/reviews/Testimonials";

export const revalidate = 60;

const TYPE_LABEL: Record<string, { en: string; de: string }> = {
  wedding: { en: "Wedding", de: "Hochzeit" },
  event: { en: "Event", de: "Event" },
  brand: { en: "Brand", de: "Marke" },
  portrait: { en: "Portrait", de: "Porträt" },
  other: { en: "Other", de: "Sonstiges" },
};

export default async function Home() {
  const [lang, home] = await Promise.all([getLang(), getHome()]);
  /** Studio text first, then the built-in default. */
  const t = (f: LocaleString | undefined, key: MsgKey) => pick(f, lang) || tr(key, lang);
  const u = ui(lang);

  const heroImgs = (home.hero?.images ?? []).filter((s) => s?.asset?._ref);
  // Desktop 16:10 and a 4:5 hotspot crop for phones (a landscape crop on a tall phone looked cut and soft).
  const heroes = heroImgs.map((s) => ({
    src: img(s, 1600, 1000) as string,
    srcSet: cropSet(s, 16 / 10, [1200, 1600, 2400]),
    mobileSet: cropSet(s, 4 / 5, [600, 900, 1200]),
  }));
  const heroRefs = new Set(heroImgs.map((s) => s.asset!._ref));

  // Selected work: photos ticked "Show on Home"; until any are ticked, covers + first frames.
  // The same photo never shows twice (cover = first gallery photo, hero photos, …).
  const frames: (WorkFrame & { ref: string })[] = [];
  const seen = new Set<string>();
  const push = (g: GalleryImg | undefined, p: (typeof home.projects)[number]) => {
    const ref = g?.asset?._ref;
    if (!ref || seen.has(ref)) return;
    const src = img(g, 1600, 1000);
    if (!src) return;
    seen.add(ref);
    frames.push({
      src,
      title: pick(p.title, lang) || "Untitled",
      cat: pick(p.cat, lang),
      href: `/projects/${p.slug}`,
      ref,
    });
  };
  const picked = home.projects.some((p) => p.picks?.length);
  for (const p of home.projects) {
    if (picked) (p.picks ?? []).forEach((g) => push(g, p));
    else push(p.cover as GalleryImg, p);
  }
  if (!picked) for (const p of home.projects) (p.gallery ?? []).forEach((g) => push(g, p));
  // keep the hero photos out of the spotlight when there are enough others
  const notHero = frames.filter((f) => !heroRefs.has(f.ref));
  const workFrames: WorkFrame[] = (notHero.length >= 3 ? notHero : frames).slice(0, 12).map((f) => ({ src: f.src, title: f.title, cat: f.cat, href: f.href }));
  const clients = (home.clients ?? []).filter(Boolean);
  const stats = (home.aboutStats ?? []).filter((x) => typeof x.value === "number");
  const photoCards = home.serviceItems.some((x) => x.image?.asset?._ref);
  // German consumer prices need the VAT wording next to them — same Studio setting as the Services page
  const showsPrices = photoCards && home.serviceItems.slice(0, 6).some((x) => pick(x.priceFrom, lang));
  const vatNote = home.vat === "small" ? ui(lang).services.vatSmall : ui(lang).services.vatIncl;

  const aboutBody = pickBlocks(home.about?.body, lang);
  const showReviews = home.reviews?.show !== false && home.latestReviews.length > 0;

  return (
    <>
      <HomeHero
        heroes={heroes}
        eyebrow={t(home.hero?.eyebrow, "hero.eyebrow")}
        l1={t(home.hero?.line1, "hero.l1")}
        l2={t(home.hero?.line2, "hero.l2")}
        sub={t(home.hero?.sub, "hero.sub")}
        cta1={t(home.hero?.cta1, "hero.cta1")}
        cta2={t(home.hero?.cta2, "hero.cta2")}
      />

      <div className="hm-wrap">
        {workFrames.length ? (
          <section className="hm-sec" id="work" style={{ borderTop: "none" }}>
            <div className="hm-sechead">
              <div>
                <p className="hm-eyebrow">{t(home.work?.eyebrow, "home.selectedWork")}</p>
                <h2 className="hm-h2">{t(home.work?.heading, "home.workTitle")}</h2>
              </div>
              <Link className="hm-alink" href="/portfolio">
                {t(home.work?.linkLabel, "home.viewAll")} →
              </Link>
            </div>
            <WorkSpotlight frames={workFrames} />
            {clients.length >= 3 ? (
              <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
                <p className="shrink-0 text-xs uppercase tracking-[0.22em] text-ink-soft">{lang === "de" ? "Gearbeitet mit" : "Worked with"}</p>
                <div className="min-w-0 flex-1">
                  <Marquee items={clients} />
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {home.serviceItems.length ? (
          <section className="hm-sec" id="services">
            <div className="hm-sechead">
              <div>
                <p className="hm-eyebrow">{t(home.services?.eyebrow, "home.whatido")}</p>
                <h2 className="hm-h2">{t(home.services?.heading, "home.oneTeam")}</h2>
              </div>
              <Link className="hm-alink" href="/services">
                {t(home.services?.linkLabel, "home.seeServices")} →
              </Link>
            </div>
            {photoCards ? (
              <>
                <div
                  data-reveal
                  className="no-scrollbar -mx-5 mt-7 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0"
                >
                  {home.serviceItems.slice(0, 6).map((s, i) => {
                    const photo = cropUrl(s.image, 720, 4 / 5);
                    const price = pick(s.priceFrom, lang);
                    return (
                      <div key={s._id} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto">
                        <TiltCard max={5}>
                          <Link href={`/services#svc-${s._id}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[#15120f] shadow-xl">
                            {photo ? (
                              <img
                                src={photo}
                                srcSet={cropSet(s.image, 4 / 5, [420, 640, 900])}
                                sizes="(min-width: 768px) 30vw, 78vw"
                                alt=""
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                              />
                            ) : (
                              <span className="absolute inset-0 grid place-items-center text-accent [&_svg]:h-16 [&_svg]:w-16">
                                <ServiceIcon hint={s.icon ?? `${pick(s.title, "en")} ${pick(s.title, "de")}`} />
                              </span>
                            )}
                            <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                            <span className="tilt-glare pointer-events-none absolute inset-0" />
                            <span className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
                              <span className="text-xs font-semibold tracking-[0.2em] text-white/70">{String(i + 1).padStart(2, "0")}</span>
                              <span className="mt-1 block font-display text-2xl font-extrabold tracking-tight md:text-3xl">{pick(s.title, lang)}</span>
                              {pick(s.description, lang) ? (
                                <span className="mt-1.5 line-clamp-2 block min-h-[2lh] text-sm leading-snug text-white/80">{pick(s.description, lang)}</span>
                              ) : null}
                              <span className="mt-4 flex items-center justify-between gap-3">
                                {price ? <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">{price}</span> : <span />}
                                <span
                                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-black transition group-hover:bg-accent group-hover:text-white"
                                  aria-hidden
                                >
                                  →
                                </span>
                              </span>
                            </span>
                          </Link>
                        </TiltCard>
                      </div>
                    );
                  })}
                </div>
                {showsPrices ? <p className="mt-4 text-xs text-ink-soft">{vatNote}</p> : null}
              </>
            ) : (
              <div className="hm-svc" style={{ marginTop: "1.6rem" }}>
                {home.serviceItems.slice(0, 6).map((s, i) => (
                  <Link className="c" key={s._id} href={`/services#svc-${s._id}`}>
                    <div className="top">
                      <span className="ic">
                        {s.icon && ["wedding", "event", "brand"].includes(s.icon) ? (
                          <CategoryIcon hint={s.icon === "brand" ? "commercial" : s.icon} />
                        ) : (
                          <ServiceIcon hint={s.icon ?? `${pick(s.title, "en")} ${pick(s.title, "de")}`} />
                        )}
                      </span>
                      <span className="n">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3>{pick(s.title, lang)}</h3>
                    <p>{pick(s.description, lang)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {home.about ? (
          <section className="hm-sec relative" id="about">
            <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-[110px]" />
            <div className="relative grid items-center gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
              {home.about.photo?.asset?._ref ? (
                <TiltCard className="mx-auto w-full max-w-[20rem] md:max-w-sm">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-black shadow-2xl">
                    <img
                      src={cropUrl(home.about.photo, 760, 4 / 5, PORTRAIT_FOCAL) ?? ""}
                      srcSet={cropSet(home.about.photo, 4 / 5, [380, 560, 760, 1000], PORTRAIT_FOCAL)}
                      sizes="(min-width: 768px) 384px, 320px"
                      alt="Somdatt Sharma"
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="tilt-glare pointer-events-none absolute inset-0" />
                  </div>
                </TiltCard>
              ) : null}
              <div data-reveal>
                <p className="hm-eyebrow">{t(home.about.eyebrow, "about.label")}</p>
                <h2 className="hm-h2" style={{ marginBottom: "1.1rem" }}>
                  {t(home.about.title, "home.aboutTitle")}
                </h2>
                <div className="text-[1.02rem] leading-[1.75] text-ink-soft [&_p+p]:mt-4">
                  <RichText value={aboutBody} />
                </div>
                {stats.length ? (
                  <div className="mt-8 grid grid-cols-3 gap-4 border-y border-sand/60 py-6">
                    {stats.map((x) => (
                      <div key={x._key}>
                        <p className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                          <CountUp to={x.value as number} suffix={x.suffix ?? ""} />
                        </p>
                        <p className="mt-1 text-xs leading-snug text-ink-soft">{pick(x.label, lang)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-8">
                  <Link className="hm-btn solid" href="/about">
                    {t(home.about.linkLabel, "home.readMore")} →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {showReviews ? (
          <Testimonials
            reviews={home.latestReviews.map((r) => ({
              id: r._id,
              quote: r.text,
              name: r.name,
              role: r.role,
              rating: r.rating,
              verified: r.verified,
              type: r.type ? TYPE_LABEL[r.type]?.[lang] : undefined,
            }))}
            total={home.reviewCount}
            eyebrow={pick(home.reviews?.eyebrow, lang) || u.reviews.eyebrow}
            title={pick(home.reviews?.heading, lang) || u.reviews.title}
            more={{
              href: "/about#reviews",
              label: pick(home.reviews?.linkLabel, lang) || fill(u.reviews.allLink, { n: home.reviewCount }),
            }}
            labels={u.reviews}
          />
        ) : null}
      </div>

      <section className="hm-ctaband hm-wrap" id="contact">
        <p className="hm-eyebrow">{t(home.contact?.eyebrow, "cta.getInTouch")}</p>
        <h2>{t(home.contact?.heading, "cta.worthKeeping")}</h2>
        <p>{t(home.contact?.text, "cta.tellMe")}</p>
        <Link className="hm-btn dark" href="/contact">
          {t(home.contact?.button, "cta.checkAvail")}
        </Link>
      </section>
    </>
  );
}
