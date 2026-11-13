import Link from "next/link";

export type Bundle = {
  title: string;
  bestFor?: string;
  text: string;
  includes: string[];
  price?: string;
  featured?: boolean;
  cta: { label: string; href: string };
};

/** "Book it together": up to 3 package cards. The featured one is lifted on desktop and comes first on phones.
 *  Prices show only when set; otherwise one honest line explains what a quote depends on. */
export function Bundles({
  bundles,
  eyebrow,
  title,
  featuredLabel,
  pricingNote,
  vatNote,
}: {
  bundles: Bundle[];
  eyebrow: string;
  title: string;
  featuredLabel: string;
  pricingNote?: string;
  /** shown under the cards whenever a price is visible */
  vatNote?: string;
}) {
  if (!bundles.length) return null;
  const anyPrice = bundles.some((b) => b.price);
  return (
    <section className="hm-sec scroll-mt-36" id="bundles">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="hm-eyebrow">{eyebrow}</p>
          <h2 className="hm-h2">{title}</h2>
        </div>
        {pricingNote ? <p className="max-w-md text-sm leading-relaxed text-ink-soft">{pricingNote}</p> : null}
      </div>
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 pt-3 md:mx-0 md:grid md:grid-cols-3 md:items-stretch md:gap-5 md:overflow-visible md:px-0">
        {bundles.map((b) => (
          <article
            key={b.title}
            className={`relative flex w-[82vw] max-w-[22rem] shrink-0 snap-start flex-col rounded-3xl border p-7 md:order-none md:w-auto md:max-w-none ${
              b.featured ? "order-first border-accent bg-accent/[0.07] md:-translate-y-3" : "border-sand/60"
            }`}
          >
            {b.featured ? (
              <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                {featuredLabel}
              </span>
            ) : null}
            <h3 className="font-display text-2xl font-bold">{b.title}</h3>
            {b.bestFor ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{b.bestFor}</p> : null}
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{b.text}</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {b.includes.map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[0.95rem] text-ink">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {x}
                </li>
              ))}
            </ul>
            {anyPrice ? <p className="mt-6 font-display text-xl font-bold">{b.price ?? ""}</p> : null}
            <Link
              href={b.cta.href}
              className={`hm-btn mt-5 w-full justify-center text-center ${b.featured ? "solid" : ""}`}
              style={b.featured ? undefined : { border: "1px solid color-mix(in srgb, var(--color-ink) 30%, transparent)", color: "var(--color-ink)" }}
            >
              {b.cta.label}
            </Link>
          </article>
        ))}
      </div>
      {anyPrice && vatNote ? <p className="mt-2 text-xs text-ink-soft">{vatNote}</p> : null}
    </section>
  );
}
