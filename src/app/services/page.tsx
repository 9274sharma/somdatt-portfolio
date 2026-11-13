import Link from "next/link";
import type { Metadata } from "next";
import { cropUrl } from "@/sanity/media";
import { getServicesFull } from "@/sanity/queries";
import { getLang } from "@/i18n/server";
import { pick, tr } from "@/i18n/messages";
import { ui } from "@/i18n/ui";
import { ServiceIcon } from "@/components/sections/ServiceIcon";
import { CategoryIcon } from "@/components/work/CategoryIcon";
import { ServiceChapter, type Chapter } from "@/components/services/ServiceChapter";
import { Bundles } from "@/components/services/Bundles";
import { DeliveryTimeline } from "@/components/services/DeliveryTimeline";
import { ServiceNav } from "@/components/services/ServiceNav";
import { Testimonials } from "@/components/reviews/Testimonials";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Photography, videography and editing in Hamburg — what's included, what you get and when. One team from the first frame to the final cut.",
};

const TYPE_LABEL: Record<string, { en: string; de: string }> = {
  wedding: { en: "Wedding", de: "Hochzeit" },
  event: { en: "Event", de: "Event" },
  brand: { en: "Brand", de: "Marke" },
  portrait: { en: "Portrait", de: "Porträt" },
  other: { en: "Other", de: "Sonstiges" },
};

const SERVICE_PARAM: Record<string, string> = { photo: "photo", video: "film", edit: "edit" };
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default async function ServicesPage() {
  const [lang, data] = await Promise.all([getLang(), getServicesFull()]);
  const u = ui(lang);
  const s = u.services;
  const page = data.page;

  // one pool of distinct photos (no asset twice), so every chapter gets its own thumbnails
  const seen = new Set<string>();
  const frames = data.frames
    .flatMap((p) => (p.imgs ?? []).map((g) => ({ g, slug: p.slug, title: pick(p.title, lang) })))
    .filter((f) => {
      const ref = f.g?.asset?._ref;
      if (!ref || seen.has(ref)) return false;
      seen.add(ref);
      return true;
    });
  const chapters: Chapter[] = data.items.map((it, i) => {
    const title = pick(it.title, lang);
    const icon =
      it.icon && ["wedding", "event", "brand"].includes(it.icon) ? (
        <CategoryIcon hint={it.icon === "brand" ? "commercial" : it.icon} />
      ) : (
        <ServiceIcon hint={it.icon ?? `${pick(it.title, "en")} ${pick(it.title, "de")}`} />
      );
    const own = frames.slice(i * 3 + 1, i * 3 + 4);
    return {
      id: `svc-${it._id}`,
      n: i + 1,
      title,
      intro: pick(it.intro, lang) || pick(it.description, lang),
      icon,
      image: cropUrl(it.image ?? frames[i * 7]?.g, 1000, 4 / 5),
      video: it.videoUrl ?? null,
      bestFor: (it.bestFor ?? []).filter((c) => c?.slug).map((c) => ({ label: pick(c.title, lang), href: `/portfolio?cat=${c.slug}` })),
      included: (it.points ?? []).map((p) => pick(p, lang)).filter(Boolean),
      deliverables: (it.deliverables ?? []).map((p) => pick(p, lang)).filter(Boolean),
      turnaround: pick(it.turnaround, lang) || undefined,
      price: pick(it.priceFrom, lang) || undefined,
      cta: {
        label: s.askAbout.replace("{service}", title.toLowerCase()),
        href: `/contact?service=${SERVICE_PARAM[it.icon ?? ""] ?? slug(pick(it.title, "en"))}`,
      },
      frames: own.map((f) => ({ src: cropUrl(f.g, 400, 1) ?? "", href: `/projects/${f.slug}`, alt: f.title || title })).filter((f) => f.src),
    };
  });

  const bundles = (page?.bundles ?? [])
    .filter((b) => pick(b.title, lang))
    .map((b) => ({
      title: pick(b.title, lang),
      bestFor: pick(b.bestFor, lang) || undefined,
      text: pick(b.text, lang),
      includes: (b.includes ?? []).map((x) => pick(x, lang)).filter(Boolean),
      price: pick(b.price, lang) || undefined,
      featured: b.featured,
      cta: { label: s.quote, href: `/contact?bundle=${slug(pick(b.title, "en"))}` },
    }));
  const timeline = (page?.timeline ?? [])
    .map((m) => ({ when: pick(m.when, lang), what: pick(m.what, lang), text: pick(m.text, lang) }))
    .filter((m) => m.when && m.what);
  const vat = page?.vat === "small" ? s.vatSmall : s.vatIncl;
  // "How much does it cost?" answers itself from the Studio prices once they exist.
  const priced = [
    ...chapters.filter((c) => c.price).map((c) => `${c.title} ${c.price}`),
    ...bundles.filter((b) => b.price).map((b) => `${b.title} ${b.price}`),
  ];
  const costQ = /cost|price|kostet|preis/i;
  const faq = (page?.faq ?? [])
    .map((f) => ({ q: pick(f.q, lang), a: pick(f.a, lang) }))
    .filter((f) => f.q)
    .map((f) => (costQ.test(f.q) && priced.length ? { ...f, a: `${s.costAnswer.replace("{list}", priced.join(" · "))} ${vat}` } : f));
  const shortOf = (t: string) =>
    /photo|foto/i.test(t) ? s.short.photography : /video|film/i.test(t) ? s.short.videography : /edit|schnitt/i.test(t) ? s.short.editing : t;
  const hero = cropUrl(page?.heroImage ?? frames[11]?.g, 1100, 16 / 10);
  const reviews = data.latestReviews.map((r) => ({
    id: r._id,
    quote: r.text,
    name: r.name,
    role: r.role,
    rating: r.rating,
    verified: r.verified,
    type: r.type ? TYPE_LABEL[r.type]?.[lang] : undefined,
  }));

  return (
    <div className="hm-wrap">
      <header className={`hm-pagehead grid items-end gap-10 ${hero ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
        <div>
          <p className="hm-eyebrow">{pick(page?.eyebrow, lang) || tr("home.whatido", lang)}</p>
          <h1>{pick(page?.title, lang) || tr("home.oneTeam", lang)}</h1>
          <p className="lead">{pick(page?.lead, lang) || tr("services.lead", lang)}</p>
        </div>
        {hero ? (
          <div className="relative hidden aspect-[16/10] overflow-hidden rounded-3xl bg-black lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
      </header>

      {chapters.length ? (
        <ServiceNav
          label={s.navLabel}
          items={[
            ...chapters.map((c) => ({ href: `#${c.id}`, label: c.title, short: shortOf(c.title), icon: c.icon })),
            ...(bundles.length ? [{ href: "#bundles", label: s.bundlesChip, short: s.short.bundles }] : []),
          ]}
          cta={{ href: "/contact", label: tr("cta.checkAvail", lang), short: s.short.book }}
        />
      ) : null}

      {chapters.map((c, i) => (
        <ServiceChapter key={c.id} c={c} flip={i % 2 === 1} labels={{ ...s.chapter, vat }} />
      ))}

      <Bundles
        bundles={bundles}
        eyebrow={s.bundlesEyebrow}
        title={s.bundlesTitle}
        featuredLabel={s.mostBooked}
        pricingNote={pick(page?.pricingNote, lang) || (bundles.some((b) => b.price) ? undefined : s.pricingNote)}
        vatNote={vat}
      />

      <DeliveryTimeline items={timeline} eyebrow={s.timelineEyebrow} title={s.timelineTitle} />

      {faq.length ? (
        <section className="hm-sec">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="hm-eyebrow">FAQ</p>
              <h2 className="hm-h2">{s.faqTitle}</h2>
            </div>
            <div className="divide-y divide-sand/60 border-t border-sand/60">
              {faq.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-bold">
                    {f.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-sand/70 text-ink-soft transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Testimonials reviews={reviews} labels={u.reviews} eyebrow={u.reviews.eyebrow} title={u.reviews.title} />

      <section className="hm-ctaband">
        <p className="hm-eyebrow">{tr("services.got", lang)}</p>
        <h2>{s.ctaTitle}</h2>
        <p>{tr("services.tell", lang)}</p>
        <Link className="hm-btn dark" href="/contact">
          {tr("cta.checkAvail", lang)}
        </Link>
      </section>
    </div>
  );
}
