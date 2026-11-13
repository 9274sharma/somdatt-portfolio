/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { cropSet, cropUrl } from "@/sanity/media";
import { getAboutFull, pickBlocks } from "@/sanity/queries";
import { getLang } from "@/i18n/server";
import { pick, tr } from "@/i18n/messages";
import { ui } from "@/i18n/ui";
import { TiltCard } from "@/components/about/TiltCard";
import { CountUp } from "@/components/about/CountUp";
import { ProcessDiagram } from "@/components/about/ProcessDiagram";
import { Marquee } from "@/components/about/Marquee";
import { RouteMap } from "@/components/about/RouteMap";
import { JourneyScroller, type Stop } from "@/components/about/JourneyScroller";
import { ServiceIcon } from "@/components/sections/ServiceIcon";
import { Testimonials } from "@/components/reviews/Testimonials";
import { RichText } from "@/components/RichText";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About",
  description:
    "Somdatt Sharma — photographer & filmmaker based in Hamburg. Weddings, events and brand films.",
};

const TYPE_LABEL: Record<string, { en: string; de: string }> = {
  wedding: { en: "Wedding", de: "Hochzeit" },
  event: { en: "Event", de: "Event" },
  brand: { en: "Brand", de: "Marke" },
  portrait: { en: "Portrait", de: "Porträt" },
  other: { en: "Other", de: "Sonstiges" },
};

/** Capability card → its chapter on the Services page. */
const svcAnchor = (t: string) =>
  /photo|foto/i.test(t)
    ? "#svc-service-photography"
    : /video|film/i.test(t)
      ? "#svc-service-videography"
      : /edit|schnitt/i.test(t)
        ? "#svc-service-editing"
        : "";

function SecHead({ eyebrow, title }: { eyebrow: string; title?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="hm-eyebrow">{eyebrow}</p>
      {title ? <h2 className="hm-h2">{title}</h2> : null}
    </div>
  );
}

export default async function AboutPage() {
  const [lang, a] = await Promise.all([getLang(), getAboutFull()]);
  const u = ui(lang);
  const intro = pick(a?.intro, lang);
  const story = pickBlocks(a?.story, lang);
  const quote = pick(a?.quote, lang);
  const stats = (a?.stats ?? []).filter((s) => typeof s.value === "number");
  const bts = (a?.behindTheLens ?? []).filter((b) => b.asset?._ref).slice(0, 5);
  const stops: Stop[] = (a?.journey ?? []).map((j) => ({
    year: j.year ?? "",
    title: pick(j.title, lang),
    text: pick(j.text, lang),
    image: cropUrl(j.image, 720, 4 / 3),
  }));
  const steps = (a?.process ?? [])
    .map((s) => ({ title: pick(s.title, lang), text: pick(s.text, lang) }))
    .filter((s) => s.title);
  const caps = (a?.capabilities ?? []).filter((c) => pick(c.title, lang));
  const clients = (a?.clients ?? [])
    .map((c) => c.name)
    .filter((n): n is string => Boolean(n));
  const faq = (a?.faq ?? [])
    .map((f) => ({ q: pick(f.q, lang), a: pick(f.a, lang) }))
    .filter((f) => f.q);
  const reviews = (a?.reviews ?? []).map((r) => ({
    id: r._id,
    quote: r.text,
    name: r.name,
    role: r.role,
    rating: r.rating,
    verified: r.verified,
    type: r.type ? TYPE_LABEL[r.type]?.[lang] : undefined,
  }));

  return (
    <>
      {/* Hero — mobile order: name → face → words */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-accent/20 blur-[120px]"
        />
        <div className="hm-wrap relative grid gap-x-14 gap-y-8 py-10 md:grid-cols-[1.1fr_0.9fr] md:grid-rows-[auto_1fr] md:py-20">
          <div className="md:self-end">
            <p className="hm-eyebrow">{u.about.eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.92] tracking-tight md:text-7xl">
              Somdatt
              <br />
              Sharma
            </h1>
          </div>

          {a?.portrait ? (
            <TiltCard className="mx-auto w-full max-w-[19rem] md:col-start-2 md:row-span-2 md:row-start-1 md:max-w-sm md:self-center">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-black shadow-2xl">
                <img
                  src={cropUrl(a.portrait, 760, 4 / 5) ?? ""}
                  srcSet={cropSet(a.portrait, 4 / 5, [380, 560, 760, 1000])}
                  sizes="(min-width: 768px) 384px, 304px"
                  alt="Somdatt Sharma"
                  className="h-full w-full object-cover"
                />
                <span className="tilt-glare pointer-events-none absolute inset-0" />
              </div>
              {a.basedIn ? (
                <div className="absolute -bottom-4 -left-3 rounded-2xl border border-sand/60 bg-page px-5 py-3 shadow-xl [transform:translateZ(40px)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                    {u.about.basedIn}
                  </p>
                  <p className="font-display text-lg font-bold">{a.basedIn}</p>
                </div>
              ) : null}
            </TiltCard>
          ) : null}

          <div className="pt-2 md:pt-0">
            <p className="font-display text-xl font-semibold text-ink md:text-2xl">
              {pick(a?.tagline, lang) || tr("hero.eyebrow", lang)}
            </p>
            {story.length && intro ? (
              <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
                {intro}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="hm-btn solid">
                {u.about.bookShoot}
              </Link>
              <Link
                href="/portfolio"
                className="hm-btn"
                style={{
                  border:
                    "1px solid color-mix(in srgb, var(--color-ink) 25%, transparent)",
                  color: "var(--color-ink)",
                }}
              >
                {u.about.seeWork}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="hm-wrap">
        {stats.length ? (
          <section className="grid grid-cols-2 gap-x-6 gap-y-10 border-y border-sand/60 py-12 md:grid-cols-4 md:py-14">
            {stats.map((s) => (
              <div key={s._key}>
                <p className="font-display text-5xl font-extrabold tracking-tight md:text-6xl">
                  <CountUp to={s.value as number} suffix={s.suffix ?? ""} />
                </p>
                <p className="mt-2 text-sm leading-snug text-ink-soft">
                  {pick(s.label, lang)}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {/* Story + map (until a story is written, the intro text lives here) */}
        <section
          className="hm-sec"
          style={stats.length ? { borderTop: "none" } : undefined}
        >
          <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
            <div className="flex flex-col gap-8">
              <div>
                <p className="hm-eyebrow">{u.about.story}</p>
                {pick(a?.storyTitle, lang) ? (
                  <h2 className="hm-h2">{pick(a?.storyTitle, lang)}</h2>
                ) : null}
              </div>
              <RouteMap
                from={a?.map?.from || "Delhi"}
                fromNote={pick(a?.map?.fromNote, lang) || u.about.mapFrom}
                to={a?.map?.to || "Hamburg"}
                toNote={pick(a?.map?.toNote, lang) || u.about.mapTo}
                distance={a?.map?.distance || "≈ 6,000 km"}
              />
            </div>
            <div className="min-w-0">
              <div className="text-[1.05rem] leading-[1.75] text-ink-soft">
                {story.length ? (
                  <RichText value={story} />
                ) : intro ? (
                  <p>{intro}</p>
                ) : null}
              </div>
              {quote ? (
                <blockquote className="mt-9 border-l-[3px] border-accent pl-6 font-display text-2xl font-semibold italic leading-snug text-ink md:text-3xl">
                  &ldquo;{quote}&rdquo;
                </blockquote>
              ) : null}
              {a?.signature ? (
                <p
                  className="mt-6 font-display text-3xl italic text-ink"
                  style={{ fontWeight: 300 }}
                >
                  {a.signature}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {bts.length ? (
          <section className="hm-sec">
            <SecHead eyebrow={u.about.behind} title={u.about.behindTitle} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
              {bts.map((b, i) => (
                <TiltCard
                  key={b._key}
                  max={5}
                  className={i === 0 ? "col-span-2 md:row-span-2" : "md:h-full"}
                >
                  <figure
                    className={`relative overflow-hidden rounded-2xl bg-sand/30 ${i === 0 ? "aspect-square" : "aspect-[4/3] md:aspect-auto md:h-full"}`}
                  >
                    <img
                      src={
                        cropUrl(b, i === 0 ? 1100 : 700, i === 0 ? 1 : 4 / 3) ??
                        ""
                      }
                      alt={pick(b.caption, lang)}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="tilt-glare pointer-events-none absolute inset-0" />
                    {pick(b.caption, lang) ? (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white md:p-4">
                        {pick(b.caption, lang)}
                      </figcaption>
                    ) : null}
                  </figure>
                </TiltCard>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {stops.length ? (
        <section className="border-t border-sand/60 py-14 md:py-20 lg:py-0">
          <JourneyScroller
            stops={stops}
            heading={
              <div>
                <p className="hm-eyebrow">{u.about.journey}</p>
              </div>
            }
          />
        </section>
      ) : null}

      <div className="hm-wrap">
        {steps.length ? (
          <section className="hm-sec">
            <SecHead eyebrow={u.about.howIWork} title={u.about.howTitle} />
            <ProcessDiagram steps={steps} />
          </section>
        ) : null}

        {caps.length ? (
          <section className="hm-sec">
            <SecHead eyebrow={u.about.bring} title={u.about.bringTitle} />
            <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
              {caps.map((c) => (
                <Link
                  key={c._key}
                  href={`/services${svcAnchor(pick(c.title, "en"))}`}
                  className="block w-[78vw] max-w-[20rem] shrink-0 snap-start rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-auto md:max-w-none"
                >
                  <TiltCard max={6}>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-black">
                      {c.image ? (
                        <img
                          src={cropUrl(c.image, 800, 4 / 5) ?? ""}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover opacity-90"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                      <span className="tilt-glare pointer-events-none absolute inset-0" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white [transform:translateZ(30px)]">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                          <ServiceIcon
                            hint={`${pick(c.title, "en")} ${pick(c.title, "de")}`}
                          />
                        </span>
                        <p className="mt-4 font-display text-2xl font-bold">
                          {pick(c.title, lang)}
                        </p>
                        {c.points?.length ? (
                          <ul className="mt-3 space-y-1.5 text-sm text-white/85">
                            {c.points.map((pt, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                {pick(pt, lang)}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {clients.length ? (
          <section className="border-y border-sand/60 py-10">
            <p className="mb-6 text-xs uppercase tracking-[0.22em] text-ink-soft">
              {u.about.workedWith}
            </p>
            <Marquee items={clients} />
          </section>
        ) : null}

        <Testimonials
          reviews={reviews}
          mode="all"
          eyebrow={u.reviews.eyebrow}
          title={u.reviews.title}
          labels={u.reviews}
          className="hm-sec"
        />

        {faq.length ? (
          <section className="hm-sec">
            <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="hm-eyebrow">{u.about.faq}</p>
                <h2 className="hm-h2">{u.about.faqTitle}</h2>
              </div>
              <div className="divide-y divide-sand/60 border-t border-sand/60">
                {faq.map((f) => (
                  <details key={f.q} className="group py-5">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-bold">
                      {f.q}
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-sand/70 text-ink-soft transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="hm-ctaband">
          <p className="hm-eyebrow">{u.about.ctaEyebrow}</p>
          <h2>{u.about.ctaTitle}</h2>
          <p>{u.about.ctaText}</p>
          <Link className="hm-btn dark" href="/contact">
            {u.about.ctaButton}
          </Link>
        </section>
      </div>
    </>
  );
}
