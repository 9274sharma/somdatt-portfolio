export type Review = {
  id: string;
  quote: string;
  name: string;
  role?: string;
  rating?: number;
  /** shoot type label, e.g. "Wedding" */
  type?: string;
  /** submitted through a personal link sent for a real booking */
  verified?: boolean;
};

export type ReviewLabels = {
  verified: string;
  disclosure: string;
  howLink: string;
  /** "{n}" is replaced */
  showAll: string;
};

const EN: ReviewLabels = {
  verified: "Verified client",
  disclosure:
    "Reviews come from clients through my review form. “Verified client” means it was sent through a personal link for a real booking. Every review is checked for spam before it’s published — critical ones are published too.",
  howLink: "How reviews work",
  showAll: "Show all {n} reviews",
};

const STAR = "M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z";

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-accent" aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          aria-hidden
          fill={i <= value ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={i <= value ? 0 : 1.4}
          className={i <= value ? "" : "text-ink-soft"}
        >
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

/** One review card — used by the section and by the form's live preview. */
export function ReviewCard({ r, className = "", labels = EN }: { r: Review; className?: string; labels?: ReviewLabels }) {
  return (
    <figure className={`flex h-full flex-col rounded-3xl border border-sand/60 bg-page p-7 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <Stars value={r.rating ?? 0} />
        {r.type ? (
          <span className="rounded-full border border-sand/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">
            {r.type}
          </span>
        ) : null}
      </div>
      <blockquote className="mt-5 flex-1 text-[1.02rem] leading-relaxed text-ink">&ldquo;{r.quote}&rdquo;</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 text-sm">
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 font-display font-bold text-accent">
          {r.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{r.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 text-ink-soft">
            {r.role ? <span className="truncate">{r.role}</span> : null}
            {r.verified ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-accent">
                <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden fill="currentColor">
                  <path d="M10 1l2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.2L10 19l-2.4-1.8-3 .2-.9-2.9-2.4-1.8 1-2.8-1-2.8 2.4-1.8.9-2.9 3 .2zm-1.2 11.6l5-5-1.2-1.2-3.8 3.8-1.8-1.8-1.2 1.2z" />
                </svg>
                {labels.verified}
              </span>
            ) : null}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/** "What clients say". `latest` (Home): newest few in a swipe row. `all` (About): stacked on phones,
 *  first 6 then "Show all". Renders nothing when there are no reviews (no empty band). */
export function Testimonials({
  reviews,
  total = reviews.length,
  mode = "latest",
  eyebrow = "Kind words",
  title = "What clients say",
  more,
  howHref = "/datenschutz#reviews",
  labels = EN,
  className = "hm-sec",
}: {
  reviews: Review[];
  total?: number;
  mode?: "latest" | "all";
  eyebrow?: string;
  title?: string;
  more?: { href: string; label: string };
  howHref?: string;
  labels?: ReviewLabels;
  className?: string;
}) {
  const n = reviews.length;
  if (!n) return null;
  const cols = n === 1 ? "md:grid-cols-1 md:max-w-xl" : n === 2 ? "md:grid-cols-2 md:max-w-4xl" : "md:grid-cols-3";
  const card = (r: Review, swipe: boolean) => (
    <ReviewCard
      key={r.id}
      r={r}
      labels={labels}
      className={swipe ? "w-[82vw] max-w-[22rem] shrink-0 snap-start md:w-auto md:max-w-none" : ""}
    />
  );
  const first = mode === "all" ? reviews.slice(0, 6) : reviews;
  const rest = mode === "all" ? reviews.slice(6) : [];

  return (
    <section id="reviews" className={`scroll-mt-24 ${className}`}>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="hm-eyebrow">{eyebrow}</p>
          <h2 className="hm-h2">{title}</h2>
        </div>
        {more && total > n ? (
          <a href={more.href} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4">
            {more.label} <span aria-hidden>→</span>
          </a>
        ) : null}
      </div>

      {mode === "latest" ? (
        <div className={`no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:gap-5 md:overflow-visible md:px-0 md:pb-0 ${cols}`}>
          {first.map((r) => card(r, n > 1))}
        </div>
      ) : (
        <>
          <div className={`grid gap-4 md:gap-5 ${cols}`}>{first.map((r) => card(r, false))}</div>
          {rest.length ? (
            <details className="group mt-5">
              <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center rounded-full border border-sand/80 px-6 text-sm font-medium text-ink transition hover:border-ink group-open:hidden">
                {labels.showAll.replace("{n}", String(n))}
              </summary>
              <div className={`grid gap-4 md:gap-5 ${cols}`}>{rest.map((r) => card(r, false))}</div>
            </details>
          ) : null}
        </>
      )}

      <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-soft">
        {labels.disclosure}{" "}
        <a href={howHref} className="underline underline-offset-2 hover:text-ink">
          {labels.howLink}
        </a>
      </p>
    </section>
  );
}
