"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { writeClient } from "@/sanity/writeClient";
import { getSettings } from "@/sanity/queries";
import type { BookingRequestInput, SubmitResult } from "@/components/booking/BookingForm";
import { type Lang, resolveEmails, resolveForm } from "@/lib/booking-config";
import { MAX_DAYS, dateRange, dayStatus } from "@/lib/booking-time";
import { activityItem, getAllBookings, getBookingSettings, newBookingId, publicBusy, todayHamburg } from "@/lib/bookings";
import { whenLabel, wishBlocks } from "@/lib/booking-format";
import { requestReceived } from "@/lib/emails";
import { SITE_URL, pingWhatsApp, sendMail } from "@/lib/mailer";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const time = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isInteger(v) && v % 30 === 0 && v >= min && v <= max ? v : null);

/* Simple per-instance rate limit: 5 requests / 10 minutes per IP. */
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** A booking request from /contact: saved privately in Sanity (status "request"), then the owner gets an
 *  email + WhatsApp ping and the client gets the "request received" email. Nothing is blocked yet. */
export async function submitBookingRequest(input: BookingRequestInput): Promise<SubmitResult> {
  if (!input || typeof input !== "object") return { ok: false, error: "validation" };
  if (str(input.website, 200)) return { ok: true }; // bot: pretend it worked

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return { ok: false, error: "rate" };

  const lang: Lang = input.lang === "de" ? "de" : "en";
  const start = str(input.start, 10);
  const end = str(input.end, 10) || start;
  const today = todayHamburg();
  if (!DATE.test(start) || !DATE.test(end) || end < start || start < today) return { ok: false, error: "validation" };
  const days = dateRange(start, end);
  if (days.length > MAX_DAYS) return { ok: false, error: "validation" };
  const startTime = time(input.startTime, 360, 1410);
  const endTime = time(input.endTime, 420, 1800);
  if (start === end && startTime !== null && endTime !== null && endTime <= startTime) return { ok: false, error: "validation" };

  const name = str(input.name, 120);
  const email = str(input.email, 200);
  const venue = str(input.venue, 240);
  if (!name || !isEmail(email) || !venue) return { ok: false, error: "validation" };

  const [raw, all, settings] = await Promise.all([getBookingSettings(), getAllBookings(), getSettings().catch(() => null)]);
  const form = resolveForm(raw, "en");

  // A day may have filled up since the page loaded.
  const busy = publicBusy(all);
  if (days.some((d) => dayStatus(d, busy) === "full")) return { ok: false, error: "busy" };

  const typeOther = str(input.typeOther, 120);
  const eventType =
    input.type === "__other" ? (typeOther ? `Other: ${typeOther}` : "") : (form.eventTypes.find((x) => x.value === input.type)?.value ?? "");
  if (!eventType) return { ok: false, error: "validation" };
  const services = Array.isArray(input.services) ? form.services.map((s) => s.value).filter((v) => input.services.includes(v)) : [];

  const answers: { _key: string; label: string; value: string }[] = [];
  let phone = "";
  for (const f of form.fields) {
    const v = str(input.answers?.[f.key], f.type === "textarea" ? 2000 : 300);
    if (!v) {
      if (f.required) return { ok: false, error: "validation", detail: lang === "de" ? `Bitte fülle „${resolveForm(raw, "de").fields.find((x) => x.key === f.key)?.label ?? f.name}“ aus.` : `Please fill in “${f.name}”.` };
      continue;
    }
    if (f.type === "select" && f.options?.length && !f.options.some((o) => o.value === v)) continue;
    answers.push({ _key: f.key, label: f.name, value: v });
    if (f.type === "tel" && !phone) phone = v;
  }
  const message = str(input.message, 6000);

  const id = newBookingId();
  try {
    await writeClient.create({
      _id: id,
      _type: "booking",
      status: "request",
      client: name,
      email,
      ...(phone ? { phone } : {}),
      lang,
      eventType,
      startDate: start,
      endDate: end,
      ...(startTime !== null ? { wishStartTime: startTime } : {}),
      ...(endTime !== null ? { wishEndTime: endTime } : {}),
      venue,
      services,
      answers,
      ...(message ? { message } : {}),
      receivedAt: new Date().toISOString(),
      activity: [activityItem("received", `Request from the website (${lang === "de" ? "German" : "English"})`)],
    });
  } catch (e) {
    console.error("booking create:", e);
    return { ok: false, error: "server" };
  }
  revalidatePath("/admin");

  const wish = { start, end, startTime, endTime };
  const when = whenLabel(start, end, "en");
  const roughEn = wishBlocks(wish, "en")
    .map((b) => `${b.date} · ${b.time}`)
    .join(" → ");
  const owner = process.env.CONTACT_TO_EMAIL;
  const adminUrl = `${SITE_URL}/admin`;

  // Owner: email + WhatsApp (best effort, in parallel with the client email).
  const ownerMail = owner
    ? sendMail({
        to: owner,
        from: process.env.RESEND_FROM || undefined,
        replyTo: email,
        subject: `New request · ${name} · ${eventType} · ${when}`,
        html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#17140f">
<h2 style="margin:0 0 12px">New booking request</h2>
<p style="margin:0 0 4px"><b>${esc(name)}</b> · ${esc(eventType)}</p>
<p style="margin:0 0 4px">${esc(roughEn)}</p>
<p style="margin:0 0 4px">${esc(venue)}</p>
<p style="margin:0 0 4px">${esc(services.join(" · "))}${answers.map((a) => ` · ${esc(a.label)}: ${esc(a.value)}`).join("")}</p>
<p style="margin:0 0 4px">${esc(email)}${phone ? ` · ${esc(phone)}` : ""} · ${lang.toUpperCase()}</p>
${message ? `<p style="white-space:pre-wrap;margin:12px 0;padding:12px;background:#f4f3f0;border-radius:10px">${esc(message)}</p>` : ""}
<p style="margin:16px 0 0"><a href="${adminUrl}" style="display:inline-block;padding:11px 18px;border-radius:999px;background:#c84d27;color:#fff;text-decoration:none;font-weight:600">Open in admin → set times &amp; accept</a></p>
</div>`,
        text: [`New booking request`, `${name} · ${eventType}`, roughEn, venue, services.join(", "), ...answers.map((a) => `${a.label}: ${a.value}`), `${email}${phone ? ` · ${phone}` : ""}`, "", message, "", adminUrl].join("\n"),
      })
    : Promise.resolve({ ok: false });

  const wa = pingWhatsApp(
    [`📩 New booking request`, `${name} · ${eventType}`, roughEn, venue, services.join(", "), phone || email, message ? `\n${message.slice(0, 600)}` : "", `\n${adminUrl}`].filter(Boolean).join("\n"),
  );

  const texts = resolveEmails(raw, lang);
  const typeLabel = input.type === "__other" ? typeOther : (resolveForm(raw, lang).eventTypes.find((x) => x.value === input.type)?.label ?? eventType);
  const svcLabels = resolveForm(raw, lang).services.filter((s) => services.includes(s.value)).map((s) => s.label);
  const mail = requestReceived(
    {
      lang,
      name,
      type: typeLabel,
      when: whenLabel(start, end, lang),
      blocks: wishBlocks(wish, lang),
      venue,
      services: svcLabels,
      replyTo: settings?.contactEmail || owner || "hello@somdattsharma.com",
      phone: settings?.phone,
      site: SITE_URL,
    },
    texts.received,
  );
  const clientMail = sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text, replyTo: settings?.contactEmail || owner });

  const [, , sent] = await Promise.allSettled([ownerMail, wa, clientMail]);
  const ok = sent.status === "fulfilled" && sent.value.ok;
  await writeClient
    .patch(id)
    .append("activity", [activityItem("email", ok ? "Auto reply sent: “Request received”" : "Auto reply failed")])
    .commit()
    .catch(() => {});
  return { ok: true };
}

