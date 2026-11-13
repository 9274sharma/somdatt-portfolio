"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import type { UI } from "@/i18n/ui";
import { ReviewCard, type ReviewLabels } from "./Testimonials";

export type ReviewInput = {
  rating: number;
  type: string;
  name: string;
  role: string;
  text: string;
  consent: boolean;
  website: string; // honeypot — must stay empty
  invite?: string; // personal-link token (booking), if any
};
export type ReviewResult = { ok: true } | { ok: false; error: string };
/** Pre-filled when the client opens a personal link created from a booking. */
export type ReviewInvite = { token: string; name: string; type?: string; label: string };

const TYPE_KEYS = ["wedding", "event", "brand", "portrait", "other"] as const;
const MIN = 30;
const MAX = 600;
const STAR = "M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z";
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ""));

/** Public review form (link / QR) with a live preview of the card it becomes. */
export function ReviewForm({
  action,
  t,
  cardLabels,
  initialType = "",
  invite,
  contactEmail,
  googleReviewUrl,
  privacyHref = "/datenschutz#reviews",
  workHref = "/portfolio",
}: {
  action: (input: ReviewInput) => Promise<ReviewResult>;
  t: UI["form"];
  cardLabels: ReviewLabels;
  initialType?: string;
  invite?: ReviewInvite;
  contactEmail: string;
  googleReviewUrl?: string;
  privacyHref?: string;
  workHref?: string;
}) {
  const startType = invite?.type ?? initialType;
  const [v, setV] = useState<ReviewInput>({
    rating: 0,
    type: (TYPE_KEYS as readonly string[]).includes(startType) ? startType : "",
    name: invite?.name ?? "",
    role: "",
    text: "",
    consent: false,
    website: "",
    invite: invite?.token,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ReviewInput, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [hover, setHover] = useState(0);
  const set = <K extends keyof ReviewInput>(k: K, val: ReviewInput[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!v.rating) err.rating = t.errRating;
    if (!v.name.trim()) err.name = t.errName;
    if (v.text.trim().length < MIN) err.text = fill(t.errText, { n: MIN });
    if (!v.consent) err.consent = t.errConsent;
    setErrors(err);
    if (Object.keys(err).length) {
      document.querySelector<HTMLElement>(`[data-field="${Object.keys(err)[0]}"]`)?.focus();
      return;
    }
    setState("sending");
    try {
      const r = await action(v);
      setState(r.ok ? "done" : "failed");
      if (r.ok) window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setState("failed");
    }
  };

  const typeLabel = v.type ? t.types[v.type as keyof UI["form"]["types"]] : undefined;

  if (state === "done") {
    return (
      <div className="view-in max-w-2xl pb-6" role="status">
        <header className="hm-pagehead in">
          <p className="hm-eyebrow">{t.doneEyebrow}</p>
          <h1 tabIndex={-1} ref={(el) => el?.focus({ preventScroll: true })} className="outline-none">
            {fill(t.doneTitle, { name: v.name.trim().split(" ")[0] })}
          </h1>
          <p className="lead">{t.doneText}</p>
        </header>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={workHref} className="hm-btn dark">
            {t.seeWork}
          </Link>
          {googleReviewUrl ? (
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hm-btn"
              style={{ border: "1px solid color-mix(in srgb, var(--color-ink) 25%, transparent)", color: "var(--color-ink)" }}
            >
              {t.google}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border bg-transparent px-4 py-3 text-[0.98rem] text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";
  const border = (k: keyof ReviewInput) => (errors[k] ? "border-danger" : "border-ink-soft/50");
  const errText = (k: keyof ReviewInput) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1.5 text-sm font-medium text-danger">
        {errors[k]}
      </p>
    ) : null;
  const shown = hover || v.rating;

  return (
    <>
      <header className="hm-pagehead max-w-2xl">
        <p className="hm-eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <form onSubmit={submit} noValidate className="grid gap-7">
          {invite ? (
            <p className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink">
              <span aria-hidden className="text-accent">
                ✓
              </span>
              <span>
                {t.invite} <b className="font-semibold">{invite.label}</b>
              </span>
            </p>
          ) : null}

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-ink">{t.ratingLegend}</legend>
            <div className="flex gap-1" onPointerLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer" onPointerEnter={(e) => e.pointerType === "mouse" && setHover(n)}>
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={v.rating === n}
                    onChange={() => set("rating", n)}
                    className="peer sr-only"
                    data-field={n === 1 ? "rating" : undefined}
                    aria-describedby={errors.rating ? "rating-err" : undefined}
                  />
                  <span className="sr-only">
                    {n} {n > 1 ? t.stars : t.star}
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden
                    fill={n <= shown ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={n <= shown ? 0 : 1.3}
                    strokeLinejoin="round"
                    className={`h-11 w-11 rounded-lg p-1 transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
                      n <= shown ? "text-accent" : errors.rating ? "text-danger" : "text-ink-soft"
                    }`}
                  >
                    <path d={STAR} />
                  </svg>
                </label>
              ))}
            </div>
            {errText("rating")}
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-ink">
              {t.typeLegend} <span className="font-normal text-ink-soft">{t.typeHint}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {TYPE_KEYS.map((key) => (
                <label key={key}>
                  <input
                    type="radio"
                    name="type"
                    value={key}
                    checked={v.type === key}
                    onChange={() => set("type", key)}
                    onClick={() => v.type === key && set("type", "")}
                    className="peer sr-only"
                  />
                  <span className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-ink-soft/50 px-4 text-sm text-ink-soft transition hover:border-ink hover:text-ink peer-checked:border-ink! peer-checked:bg-ink! peer-checked:text-page! peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                    {t.types[key]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rv-name" className="mb-2 block text-sm font-semibold text-ink">
                {t.name}
              </label>
              <input
                id="rv-name"
                data-field="name"
                value={v.name}
                maxLength={60}
                autoComplete="name"
                onChange={(e) => set("name", e.target.value)}
                placeholder={t.namePh}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-err" : "name-hint"}
                className={`${field} ${border("name")}`}
              />
              {errors.name ? (
                errText("name")
              ) : (
                <p id="name-hint" className="mt-1.5 text-xs text-ink-soft">
                  {t.nameHint}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="rv-role" className="mb-2 block text-sm font-semibold text-ink">
                {t.about} <span className="font-normal text-ink-soft">{t.optional}</span>
              </label>
              <input
                id="rv-role"
                value={v.role}
                maxLength={60}
                onChange={(e) => set("role", e.target.value)}
                placeholder={t.aboutPh}
                className={`${field} border-ink-soft/50`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="rv-text" className="mb-2 block text-sm font-semibold text-ink">
              {t.review}
            </label>
            <textarea
              id="rv-text"
              data-field="text"
              rows={6}
              maxLength={MAX}
              value={v.text}
              onChange={(e) => set("text", e.target.value)}
              placeholder={t.reviewPh}
              aria-invalid={Boolean(errors.text)}
              aria-describedby={errors.text ? "text-err text-count" : "text-count"}
              className={`${field} resize-y leading-relaxed ${border("text")}`}
            />
            <div className="mt-1.5 flex justify-between gap-4">
              {errors.text ? errText("text") : <span />}
              <span id="text-count" className="shrink-0 text-xs tabular-nums text-ink-soft">
                {v.text.length}/{MAX}
                {v.text.trim().length < MIN ? ` · ${fill(t.min, { n: MIN })}` : ""}
              </span>
            </div>
          </div>

          <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
              <input
                type="checkbox"
                data-field="consent"
                checked={v.consent}
                onChange={(e) => set("consent", e.target.checked)}
                aria-describedby={errors.consent ? "consent-err" : undefined}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span>
                {t.consentA}{" "}
                <a href={`mailto:${contactEmail}`} className="underline underline-offset-2 hover:text-ink">
                  {contactEmail}
                </a>{" "}
                {t.consentB}{" "}
                <Link href={privacyHref} className="underline underline-offset-2 hover:text-ink">
                  {t.privacy}
                </Link>
              </span>
            </label>
            {errText("consent")}
            <p className="text-xs leading-relaxed text-ink-soft">{t.moderation}</p>
          </div>

          {state === "failed" ? (
            <p role="alert" className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-ink">
              {t.failed}
            </p>
          ) : null}

          <div>
            <button type="submit" disabled={state === "sending"} className="hm-btn solid min-w-[12rem] disabled:opacity-60">
              {state === "sending" ? t.sending : t.send}
            </button>
          </div>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-ink-soft">{t.preview}</p>
            <ReviewCard
              labels={cardLabels}
              r={{
                id: "preview",
                rating: v.rating,
                type: typeLabel,
                name: v.name.trim() || t.yourName,
                role: v.role.trim() || undefined,
                quote: v.text.trim() || t.previewPh,
                verified: Boolean(invite),
              }}
              className={v.text.trim() ? "" : "opacity-70"}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
