"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useI18n } from "@/components/i18n/useI18n";
import { PageSurface } from "@/components/layout/PageSurface";
import { cardReveal, easeOut, stagger } from "@/lib/motion";

type FormStatus =
  | "idle"
  | "sending"
  | "success"
  | "error"
  | "validation"
  | "config";

export default function ContactPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      projectType: String(fd.get("projectType") ?? "other"),
      budget: String(fd.get("budget") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
      website: String(fd.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };

      if (res.ok && data.ok) {
        setStatus("success");
        form.reset();
        return;
      }
      if (res.status === 503 && data.error === "config") {
        setStatus("config");
        return;
      }
      if (res.status === 400 && data.error === "validation") {
        setStatus("validation");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <PageSurface>
      <div className="page-shell relative space-y-12 pb-24 pt-12 md:pt-16">
        <motion.header
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.div variants={cardReveal} className="flex items-center gap-4">
            <span className="h-px w-10 bg-accent/80" aria-hidden />
            <p className="text-xs uppercase tracking-[0.28em] text-ink-soft">
              {t("contactPage.label")}
            </p>
          </motion.div>
          <motion.h1
            variants={cardReveal}
            className="font-display text-3xl tracking-[0.04em] md:text-[2.35rem]"
          >
            {t("contactPage.title")}
          </motion.h1>
          <motion.p
            variants={cardReveal}
            className="max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base"
          >
            {t("contactPage.intro")}
          </motion.p>
        </motion.header>

        <section className="grid gap-10 md:grid-cols-[1.45fr,1fr] md:gap-12">
          <motion.form
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.55, ease: easeOut }}
            className="space-y-5 rounded-3xl border border-sand/55 bg-page/70 p-6 shadow-[0_22px_52px_rgba(31,19,12,0.08)] ring-1 ring-ink/[0.04] backdrop-blur-sm md:p-8"
            onSubmit={handleSubmit}
            noValidate
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="pointer-events-none fixed left-[9999px] top-0 h-px w-px opacity-0"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="contact-name"
                  className="text-xs uppercase tracking-[0.2em] text-ink-soft"
                >
                  {t("contactPage.name")}
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  className="w-full rounded-full border border-sand/70 bg-page/80 px-4 py-2.5 text-sm outline-none ring-ink/0 transition-[border-color,box-shadow] focus:border-ink/40 focus:ring-2 focus:ring-accent/25"
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="contact-email"
                  className="text-xs uppercase tracking-[0.2em] text-ink-soft"
                >
                  {t("contactPage.email")}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  className="w-full rounded-full border border-sand/70 bg-page/80 px-4 py-2.5 text-sm outline-none ring-ink/0 transition-[border-color,box-shadow] focus:border-ink/40 focus:ring-2 focus:ring-accent/25"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="projectType"
                className="text-xs uppercase tracking-[0.2em] text-ink-soft"
              >
                {t("contactPage.projectType")}
              </label>
              <select
                id="projectType"
                name="projectType"
                defaultValue="wedding"
                className="w-full cursor-pointer rounded-full border border-sand/70 bg-page/80 px-4 py-2.5 text-sm outline-none ring-ink/0 transition-[border-color,box-shadow] focus:border-ink/40 focus:ring-2 focus:ring-accent/25"
              >
                <option value="wedding">{t("contactPage.typeWedding")}</option>
                <option value="brand">{t("contactPage.typeBrand")}</option>
                <option value="social">{t("contactPage.typeSocial")}</option>
                <option value="other">{t("contactPage.typeOther")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="contact-budget"
                className="text-xs uppercase tracking-[0.2em] text-ink-soft"
              >
                {t("contactPage.budget")}
              </label>
              <input
                id="contact-budget"
                type="text"
                name="budget"
                className="w-full rounded-full border border-sand/70 bg-page/80 px-4 py-2.5 text-sm outline-none ring-ink/0 transition-[border-color,box-shadow] focus:border-ink/40 focus:ring-2 focus:ring-accent/25"
                placeholder={t("contactPage.budgetPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="contact-message"
                className="text-xs uppercase tracking-[0.2em] text-ink-soft"
              >
                {t("contactPage.message")}
              </label>
              <textarea
                id="contact-message"
                name="message"
                className="min-h-[132px] w-full rounded-2xl border border-sand/70 bg-page/80 px-4 py-3 text-sm outline-none ring-ink/0 transition-[border-color,box-shadow] focus:border-ink/40 focus:ring-2 focus:ring-accent/25"
                placeholder={t("contactPage.messagePlaceholder")}
              />
            </div>
            {status !== "idle" && status !== "sending" && (
              <p
                role="status"
                aria-live="polite"
                className={
                  status === "success"
                    ? "text-sm leading-relaxed text-ink"
                    : "text-sm leading-relaxed text-rose-800"
                }
              >
                {status === "success" && t("contactPage.submitSuccess")}
                {status === "error" && t("contactPage.submitError")}
                {status === "validation" &&
                  t("contactPage.submitErrorValidation")}
                {status === "config" && t("contactPage.submitErrorConfig")}
              </p>
            )}
            <motion.div
              whileHover={{ scale: status === "sending" ? 1 : 1.02 }}
              whileTap={{ scale: status === "sending" ? 1 : 0.98 }}
            >
              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-1 rounded-full bg-ink px-8 py-3 text-xs uppercase tracking-[0.22em] text-page transition-colors duration-300 hover:bg-accent disabled:pointer-events-none disabled:opacity-55"
              >
                {status === "sending"
                  ? t("contactPage.submitSending")
                  : t("contactPage.submit")}
              </button>
            </motion.div>
          </motion.form>

          <motion.aside
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.55, delay: 0.08, ease: easeOut }}
            className="flex flex-col justify-center space-y-6 rounded-3xl border border-sand/55 bg-page/55 p-6 shadow-[0_18px_44px_rgba(31,19,12,0.06)] ring-1 ring-ink/[0.04] backdrop-blur-sm md:p-7"
          >
            <h2 className="font-display text-xl tracking-[0.05em] text-ink">
              {t("contactPage.directTitle")}
            </h2>
            <div className="space-y-4 text-sm text-ink-soft">
              <p>
                <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-ink/70">
                  {t("contactPage.directEmail")}
                </span>
                <Link
                  href="mailto:somdattaatre@gmail.com"
                  className="text-ink underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  somdattaatre@gmail.com
                </Link>
              </p>
              <p>
                <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-ink/70">
                  {t("contactPage.directPhone")}
                </span>
                <Link
                  href="tel:+4915253427924"
                  className="text-ink underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  +49 1525 342 7924
                </Link>
              </p>
            </div>
            <p className="border-t border-sand/45 pt-4 text-xs uppercase leading-relaxed tracking-[0.2em] text-ink-soft">
              {t("contactPage.directLine")}
            </p>
          </motion.aside>
        </section>
      </div>
    </PageSurface>
  );
}
