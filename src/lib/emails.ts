/** Branded booking emails. Table layout + inline styles so Gmail, Apple Mail and Outlook agree;
 *  a small <style> block adds dark mode where the client supports it (Apple Mail, iOS, Outlook.com).
 *  Words come from Studio → Bookings → Booking settings (with built-in defaults); the design stays here.
 *
 *  Sending: From "Somdatt Sharma <booking@somdattsharma.com>" (own domain with SPF/DKIM/DMARC — a @gmail.com
 *  From fails alignment and lands in spam), Reply-To his inbox.
 *  Privacy: EmailData has no field for the owner's private notes — they never reach the client. */

import { fmtDate, span, toInstant } from "./booking-time";
import { type ConfirmTpl, type DeclineTpl, type Lang, type OtherTpl, type ReceivedTpl, fillVars } from "./booking-config";

export type EmailBlock = { date: string; time: string };
export type EmailData = {
  lang: Lang;
  name: string;
  type: string;
  /** short label for subject and text: "Sat, 21 Nov 2026" or "10–13 Dec 2026" */
  when: string;
  blocks: EmailBlock[];
  venue?: string;
  services?: string[];
  /** Confirmed only: .ics link with every block (the file is also attached) + Google Calendar web links per block. */
  calendar?: { ics: string; google: { label: string; url: string }[] };
  replyTo: string;
  phone?: string;
  site: string;
};
export type Email = { subject: string; html: string; text: string };

/** Fixed words around the editable texts. */
const CHROME = {
  en: {
    chip: { pending: "Request received", confirmed: "Confirmed", declined: "Not available", note: "Message" },
    asked: "What you asked for",
    booking: "Your booking",
    request: "Your request",
    where: "Where",
    what: "What",
    tz: "All times are Hamburg time.",
    ask: "Add details or ask something",
    addCal: "Add to my calendar",
    calAll: (n: number) => (n > 1 ? `Adds all ${n} days at once` : "Works") + " on iPhone, Android and Outlook — the same file is attached. Google Calendar on a computer:",
    next: "What happens next",
    moveLine: "If your dates can move, I'd love to make it work:",
    freeDates: "See free dates",
    recommend: "Or just reply — I'm happy to recommend a photographer I trust.",
    tagline: "Photography & film · Hamburg",
    why: "You're getting this because you sent a booking request on my website.",
    pre: { received: "I'll get back to you within 24 hours.", confirmed: "Your dates are reserved — schedule and next steps inside.", declined: "A quick note about your request." },
  },
  de: {
    chip: { pending: "Anfrage erhalten", confirmed: "Bestätigt", declined: "Nicht verfügbar", note: "Nachricht" },
    asked: "Deine Anfrage",
    booking: "Deine Buchung",
    request: "Deine Anfrage",
    where: "Wo",
    what: "Was",
    tz: "Alle Zeiten in Hamburger Zeit.",
    ask: "Details ergänzen oder etwas fragen",
    addCal: "In meinen Kalender",
    calAll: (n: number) => (n > 1 ? `Trägt alle ${n} Tage auf einmal ein` : "Funktioniert") + " auf iPhone, Android und Outlook — die Datei hängt auch an. Google Kalender am Computer:",
    next: "Wie es weitergeht",
    moveLine: "Wenn sich dein Termin verschieben lässt, mache ich es gern möglich:",
    freeDates: "Freie Termine ansehen",
    recommend: "Oder antworte einfach — ich empfehle dir gern jemanden, dem ich vertraue.",
    tagline: "Fotografie & Film · Hamburg",
    why: "Du bekommst diese E-Mail, weil du über meine Website eine Anfrage gesendet hast.",
    pre: { received: "Ich melde mich innerhalb von 24 Stunden.", confirmed: "Deine Termine sind reserviert — Ablauf und nächste Schritte.", declined: "Eine kurze Nachricht zu deiner Anfrage." },
  },
} as const;

const C = { page: "#f4f3f0", card: "#ffffff", box: "#f4f3f0", ink: "#17140f", soft: "#5d574d", line: "#e4e0d8", accent: "#c84d27" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;";

/* Dark mode: prefers-color-scheme (Apple Mail, iOS Mail, Outlook for Mac) + [data-ogsc]/[data-ogsb] (Outlook.com).
   Gmail apps ignore both and auto-invert; the palette is chosen so that still reads well. */
const dark = (pre: string) => `
  ${pre}.bg{background:#0d0c0a!important}
  ${pre}.card{background:#191612!important}
  ${pre}.box{background:#24201b!important}
  ${pre}.ink{color:#f1ece4!important}
  ${pre}.soft{color:#b3aa9c!important}
  ${pre}.line{border-color:#38322a!important}
  ${pre}.btn2{color:#f1ece4!important;border-color:#4a443b!important}
  ${pre}.lnk{color:#f1ece4!important}`;
const STYLE = `@media (prefers-color-scheme:dark){${dark("")}}
${dark("[data-ogsc] ")}
${dark("[data-ogsb] ")}`;

/** Bulletproof pill button: the colour sits on the table cell, so Outlook for Windows still shows a button. */
function button(href: string, label: string, solid = true) {
  const cell = solid
    ? `bgcolor="${C.accent}" style="border-radius:999px;background:${C.accent};mso-padding-alt:13px 22px;"`
    : `class="line" style="border-radius:999px;border:1px solid ${C.line};mso-padding-alt:13px 22px;"`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;"><tr><td ${cell}>
<a href="${esc(href)}" class="${solid ? "" : "btn2"}" style="${font}display:inline-block;padding:13px 22px;border-radius:999px;font-size:14px;font-weight:600;line-height:1.2;text-decoration:none;color:${solid ? "#ffffff" : C.ink};">${esc(label)}</a>
</td></tr></table>`;
}

function summary(d: EmailData, title: string) {
  const w = CHROME[d.lang];
  const rows = d.blocks
    .map(
      (b) => `<tr>
        <td class="ink line" style="${font}padding:11px 10px 11px 0;border-top:1px solid ${C.line};font-size:14px;color:${C.ink};font-weight:600;white-space:nowrap;">${esc(b.date)}</td>
        <td class="ink line" align="right" style="${font}padding:11px 0;border-top:1px solid ${C.line};font-size:14px;color:${C.ink};white-space:nowrap;">${esc(b.time)}</td>
      </tr>`,
    )
    .join("");
  const timed = d.blocks.some((b) => /\d:\d/.test(b.time));
  const meta = [
    d.venue
      ? `${w.where}: <a class="lnk" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(d.venue)}" style="color:${C.ink};">${esc(d.venue)}</a>`
      : "",
    d.services?.length ? `${w.what}: ${esc(d.services.join(" · "))}` : "",
    timed ? w.tz : "",
  ]
    .filter(Boolean)
    .map((t) => `<p class="soft" style="${font}margin:4px 0 0;font-size:13px;line-height:1.5;color:${C.soft};">${t}</p>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="box" style="background:${C.box};border-radius:16px;">
    <tr><td style="padding:18px 16px;">
      <p style="${font}margin:0 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${C.accent};">${esc(title)}</p>
      <p class="ink" style="${font}margin:0 0 10px;font-size:18px;font-weight:700;color:${C.ink};">${esc(d.type)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      <div style="margin-top:10px;">${meta}</div>
    </td></tr></table>`;
}

function layout(preheader: string, body: string, d: EmailData) {
  const w = CHROME[d.lang];
  return `<!doctype html><html lang="${d.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<style>${STYLE}</style></head>
<body class="bg" style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" bgcolor="${C.page}" style="background:${C.page};"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
  <tr><td class="ink" style="padding:0 8px 18px;${font}font-size:17px;font-weight:800;letter-spacing:.16em;color:${C.ink};">SOM<span style="color:${C.accent};">·</span>DATT</td></tr>
  <tr><td class="card" bgcolor="${C.card}" style="background:${C.card};border-radius:22px;padding:30px 24px;">${body}</td></tr>
  <tr><td class="soft" style="${font}padding:20px 8px 0;font-size:12px;line-height:1.7;color:${C.soft};">
    Somdatt Sharma · ${esc(w.tagline)}<br>
    <a class="soft" href="mailto:${esc(d.replyTo)}" style="color:${C.soft};">${esc(d.replyTo)}</a>${d.phone ? ` · ${esc(d.phone)}` : ""} · <a class="soft" href="${esc(d.site)}" style="color:${C.soft};">${esc(d.site.replace(/^https?:\/\//, ""))}</a><br>
    ${esc(w.why)}
  </td></tr>
</table></td></tr></table></body></html>`;
}

/** Studio text → paragraphs: blank line = new paragraph, single line break kept. Escaped first. */
const paras = (t: string, cls = "ink", color = C.ink, size = 15) =>
  t
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => `<p class="${cls}" style="${font}margin:0 0 18px;font-size:${size}px;line-height:1.6;color:${color};">${esc(x).replace(/\n/g, "<br>")}</p>`)
    .join("");
const note = (t: string) => `<div style="margin-top:18px;">${paras(t, "soft", C.soft, 14)}</div>`;
const h1 = (t: string) => `<h1 class="ink" style="${font}margin:0 0 14px;font-size:26px;line-height:1.15;font-weight:800;color:${C.ink};">${esc(t)}</h1>`;
const label = (t: string) => `<p style="${font}margin:28px 0 8px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${C.accent};">${esc(t)}</p>`;
const CHIP_COLOR = { pending: "#b7791f", confirmed: "#2f855a", declined: "#8a8278", note: "#8a8278" } as const;
const chip = (d: EmailData, k: keyof typeof CHIP_COLOR) =>
  `<p style="${font}margin:0 0 14px;"><span style="display:inline-block;padding:5px 11px;border-radius:999px;border:1px solid ${CHIP_COLOR[k]};color:${CHIP_COLOR[k]};font-size:12px;font-weight:700;letter-spacing:.04em;">&#9679;&nbsp; ${esc(CHROME[d.lang].chip[k])}</span></p>`;
/** "Anika R." → "Anika", "Priya & Arjun" → "Priya & Arjun". */
export const firstNames = (n: string) =>
  n
    .split(/\s*&\s*/)
    .map((x) => x.trim().split(/\s+/)[0])
    .filter(Boolean)
    .join(" & ") || n;
const vars = (d: EmailData) => ({ name: firstNames(d.name), dates: d.when, type: d.type });
const f = (s: string, d: EmailData) => fillVars(s, vars(d));

function steps(items: string[]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="${font}font-size:15px;line-height:1.55;">${items
    .map(
      (t, i) =>
        `<tr><td valign="top" style="padding:4px 12px 4px 0;color:${C.accent};font-weight:700;">${i + 1}</td><td class="ink" style="padding:4px 0;color:${C.ink};">${esc(t)}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Plain-text twin (better deliverability, and what some watches/clients show). */
function plain(d: EmailData, parts: (string | false | undefined)[]) {
  const w = CHROME[d.lang];
  const sched = d.blocks.map((b) => `  ${b.date}  ${b.time}`).join("\n");
  return [
    ...parts.filter(Boolean),
    "",
    `${d.type}`,
    sched,
    d.venue ? `${w.where}: ${d.venue}` : "",
    d.services?.length ? `${w.what}: ${d.services.join(", ")}` : "",
    "",
    `— Somdatt Sharma · ${w.tagline}`,
    `${d.replyTo}${d.phone ? ` · ${d.phone}` : ""} · ${d.site}`,
  ]
    .filter((x) => x !== "")
    .join("\n");
}

/** Sent the moment a request arrives. */
export function requestReceived(d: EmailData, t: ReceivedTpl): Email {
  const w = CHROME[d.lang];
  const body = `${chip(d, "pending")}${h1(f(t.heading, d))}
${paras(f(t.text, d))}
${summary(d, w.asked)}
${note(f(t.note, d))}
<div style="margin-top:22px;">${button(`mailto:${d.replyTo}`, w.ask, false)}</div>`;
  return { subject: f(t.subject, d), html: layout(w.pre.received, body, d), text: plain(d, [f(t.heading, d), "", f(t.text, d), "", f(t.note, d)]) };
}

function calendarButtons(d: EmailData, c: NonNullable<EmailData["calendar"]>) {
  const w = CHROME[d.lang];
  const links = c.google
    .map(
      (x) =>
        `<tr><td style="padding:2px 0;"><a class="lnk" href="${esc(x.url)}" style="${font}display:inline-block;padding:6px 0;font-size:14px;color:${C.ink};">+ ${esc(x.label)}</a></td></tr>`,
    )
    .join("");
  return `<div style="margin-top:20px;">${button(c.ics, w.addCal)}</div>
<p class="soft" style="${font}margin:10px 0 0;font-size:13px;line-height:1.6;color:${C.soft};">${esc(w.calAll(c.google.length))}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:2px;">${links}</table>`;
}

/** Sent when the owner accepts (with the final schedule he set). */
export function bookingConfirmed(d: EmailData, t: ConfirmTpl): Email {
  const w = CHROME[d.lang];
  const body = `${chip(d, "confirmed")}${h1(f(t.heading, d))}
${paras(f(t.text, d))}
${summary(d, w.booking)}
${d.calendar ? calendarButtons(d, d.calendar) : ""}
${t.steps.length ? `${label(w.next)}${steps(t.steps.map((s) => f(s, d)))}` : ""}
${t.closing ? note(f(t.closing, d)) : ""}`;
  return {
    subject: f(t.subject, d),
    html: layout(w.pre.confirmed, body, d),
    text: plain(d, [f(t.heading, d), "", f(t.text, d), "", ...t.steps.map((s, i) => `${i + 1}. ${f(s, d)}`), "", f(t.closing, d), d.calendar ? `\n${w.addCal}: ${d.calendar.ics}` : ""]),
  };
}

/** Sent when the owner declines — kind, with a way forward. */
export function bookingDeclined(d: EmailData, t: DeclineTpl): Email {
  const w = CHROME[d.lang];
  const body = `${chip(d, "declined")}${h1(f(t.heading, d))}
${paras(f(t.text, d))}
${summary(d, w.request)}
${
  t.freeDates
    ? `<div style="margin-top:22px;">${paras(w.moveLine)}</div>${button(`${d.site}/contact`, w.freeDates)}${note(w.recommend)}`
    : ""
}`;
  return {
    subject: f(t.subject, d),
    html: layout(w.pre.declined, body, d),
    text: plain(d, [f(t.heading, d), "", f(t.text, d), t.freeDates ? `\n${w.moveLine} ${d.site}/contact` : ""]),
  };
}

/** A template from Studio, sent by hand from /admin. */
export function customEmail(d: EmailData, t: OtherTpl): Email {
  const body = `${t.heading ? h1(f(t.heading, d)) : ""}
${paras(f(t.text, d))}
${d.blocks.length ? summary(d, CHROME[d.lang].booking) : ""}
${t.buttonLabel && t.buttonUrl ? `<div style="margin-top:22px;">${button(t.buttonUrl, f(t.buttonLabel, d))}</div>` : ""}`;
  return {
    subject: f(t.subject, d),
    html: layout(f(t.subject, d), body, d),
    text: plain(d, [f(t.heading, d), "", f(t.text, d), t.buttonLabel && t.buttonUrl ? `\n${f(t.buttonLabel, d)}: ${t.buttonUrl}` : ""]),
  };
}

/* ── Sample data for previews (Studio + admin) ─────────────────── */

const SAMPLE = [
  { date: "2026-12-10", from: 1080, until: 1320 },
  { date: "2026-12-11", from: 1080, until: 1500 },
  { date: "2026-12-12", from: 750, until: 1410 },
];
/** A made-up client for template previews — never a real booking. */
export function sampleData(lang: Lang, kind: "received" | "confirm" | "decline" | "other", contact: { replyTo: string; phone?: string; site: string }): EmailData {
  const de = lang === "de";
  const base = { ...contact, lang, name: "Priya & Arjun", type: de ? "Hochzeit" : "Wedding", venue: "Hotel Louis C. Jacob, Elbchaussee, Hamburg", services: de ? ["Foto", "Video"] : ["Photo", "Video"] };
  if (kind === "received" || kind === "decline")
    return {
      ...base,
      when: de ? "10.–12. Dez. 2026" : "10–12 Dec 2026",
      blocks: [
        { date: fmtDate("2026-12-10", lang), time: de ? "ab 18:00" : "from 18:00" },
        { date: fmtDate("2026-12-12", lang), time: de ? "bis 23:30" : "until 23:30" },
      ],
    };
  return {
    ...base,
    when: de ? "10.–12. Dez. 2026" : "10–12 Dec 2026",
    blocks: SAMPLE.map((x) => ({ date: fmtDate(x.date, lang), time: span(x.from, x.until) })),
    ...(kind === "confirm" ? { calendar: { ics: "#", google: SAMPLE.map((x) => ({ label: fmtDate(x.date, lang), url: "#" })) } } : {}),
  };
}

/* ── Calendar ─────────────────────────────────────────────────── */

/** One block of a confirmed booking. `uid` must stay the same for that block forever, so updates replace it.
 *  Real flow: store the UIDs sent per booking; when the schedule changes, send CANCEL for removed UIDs and
 *  PUBLISH with sequence + 1 for the rest. */
export type CalEvent = { uid: string; title: string; date: string; from: number; until: number; location?: string; details?: string };
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const range = (e: CalEvent) => ({ start: toInstant(e.date, e.from), end: toInstant(e.date, e.until) });

/** Google Calendar "add event" link for one block. */
export function googleCalendarUrl(e: CalEvent) {
  const r = range(e);
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${stamp(r.start)}/${stamp(r.end)}`, ctz: "Europe/Berlin" });
  if (e.location) q.set("location", e.location);
  if (e.details) q.set("details", e.details);
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** RFC 5545 line folding: max 75 octets per line, continuation lines start with a space. */
function fold(line: string) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      size = 0;
    }
    cur += ch;
    size += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}
const text = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

/** .ics for the client (attached + linked). PUBLISH adds/updates (raise `sequence` on every change), CANCEL removes. */
export function icsFile(events: CalEvent[], opts: { method?: "PUBLISH" | "CANCEL"; sequence?: number } = {}) {
  const method = opts.method ?? "PUBLISH";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//somdattsharma.com//booking//EN", "CALSCALE:GREGORIAN", `METHOD:${method}`];
  for (const e of events) {
    const r = range(e);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@somdattsharma.com`,
      `SEQUENCE:${opts.sequence ?? 0}`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(r.start)}`,
      `DTEND:${stamp(r.end)}`,
      `SUMMARY:${text(e.title)}`,
      ...(e.location ? [`LOCATION:${text(e.location)}`] : []),
      ...(e.details ? [`DESCRIPTION:${text(e.details)}`] : []),
      `STATUS:${method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
