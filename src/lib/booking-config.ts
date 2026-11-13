/** Booking form + email templates: what Studio → Bookings → Booking settings holds, with built-in defaults
 *  for anything left empty. Client-safe (no secrets, no imports — also used by the seed script and the Studio). */

export type Lang = "en" | "de";
export type L = { en?: string; de?: string } | null | undefined;
/** Pick a language, falling back to the other one, then to `fallback`. */
export const pickL = (v: L, lang: Lang, fallback = "") => ((lang === "de" ? v?.de || v?.en : v?.en || v?.de) || fallback).trim();
/** Fill {name}, {dates}, {type}. */
export const fillVars = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);

/* ── raw shapes (as stored in Sanity) ─────────────────────────── */

type RawField = { _key?: string; label?: L; type?: FormField["type"]; options?: L[]; placeholder?: L; required?: boolean; half?: boolean };
export type RawTemplate = {
  _key: string;
  name?: string;
  subject?: L;
  heading?: L;
  text?: L;
  /** confirm: "what happens next" points + last line */
  steps?: L[];
  closing?: L;
  /** decline: add the "See free dates" button */
  freeDates?: boolean;
  /** other: optional button */
  buttonLabel?: L;
  buttonUrl?: string;
};
export type RawBookingSettings = {
  eventTypes?: L[];
  services?: { _key?: string; label?: L; preselected?: boolean }[];
  fields?: RawField[];
  emailReceived?: { subject?: L; heading?: L; text?: L; note?: L };
  confirmTemplates?: RawTemplate[];
  declineTemplates?: RawTemplate[];
  otherTemplates?: RawTemplate[];
} | null;

/* ── built-in defaults (also what the seed script writes into Studio) ── */

export const DEFAULTS = {
  eventTypes: [
    { en: "Wedding", de: "Hochzeit" },
    { en: "DJ & Nightlife", de: "DJ & Nightlife" },
    { en: "Private party", de: "Private Feier" },
    { en: "Corporate / brand", de: "Firma / Marke" },
    { en: "Portrait", de: "Porträt" },
  ],
  services: [
    { _key: "photo", label: { en: "Photo", de: "Foto" }, preselected: true },
    { _key: "video", label: { en: "Video", de: "Video" }, preselected: false },
    { _key: "editing", label: { en: "Editing", de: "Schnitt" }, preselected: false },
    { _key: "reels", label: { en: "Reels", de: "Reels" }, preselected: false },
  ],
  fields: [
    { _key: "phone", label: { en: "Phone / WhatsApp", de: "Telefon / WhatsApp" }, type: "tel", placeholder: { en: "+49 …", de: "+49 …" }, required: true, half: true },
    { _key: "guests", label: { en: "Number of guests", de: "Anzahl Gäste" }, type: "number", placeholder: { en: "e.g. 120", de: "z. B. 120" }, required: false, half: true },
    {
      _key: "budget",
      label: { en: "Budget", de: "Budget" },
      type: "select",
      required: false,
      half: true,
      options: [
        { en: "Not sure yet", de: "Noch unklar" },
        { en: "Under €1,000", de: "Unter 1.000 €" },
        { en: "€1,000–2,500", de: "1.000–2.500 €" },
        { en: "€2,500–5,000", de: "2.500–5.000 €" },
        { en: "€5,000+", de: "Über 5.000 €" },
      ],
    },
  ] as RawField[],
  emailReceived: {
    subject: { en: "Request received — {type}, {dates}", de: "Anfrage erhalten — {type}, {dates}" },
    heading: { en: "Got it — thank you!", de: "Danke — ist angekommen!" },
    text: {
      en: "Hi {name}, your request is with me. I'll get back to you within 24 hours, usually much sooner.",
      de: "Hallo {name}, deine Anfrage ist bei mir. Ich melde mich innerhalb von 24 Stunden, meistens viel schneller.",
    },
    note: {
      en: "Nothing is booked yet. If anything is still open (like exact times), we'll sort it out together — then you get a confirmation with the final schedule.",
      de: "Noch ist nichts gebucht. Wenn noch etwas offen ist (zum Beispiel die genauen Zeiten), klären wir das zusammen — danach bekommst du eine Bestätigung mit dem finalen Ablauf.",
    },
  },
  confirmTemplates: [
    {
      _key: "standard",
      name: "Standard confirmation",
      subject: { en: "Confirmed — {type}, {dates}", de: "Bestätigt — {type}, {dates}" },
      heading: { en: "You're in my calendar!", de: "Du stehst in meinem Kalender!" },
      text: {
        en: "Hi {name}, I've reserved {dates} for you — the deposit makes it final. Here's the schedule:",
        de: "Hallo {name}, ich habe {dates} für dich reserviert — mit der Anzahlung ist es fix. Hier ist der Ablauf:",
      },
      steps: [
        {
          en: "Within 2 days you get the invoice for the 30% deposit. Once it's paid, your booking is final.",
          de: "Innerhalb von 2 Tagen bekommst du die Rechnung über 30 % Anzahlung. Sobald sie bezahlt ist, ist deine Buchung fix.",
        },
        {
          en: "About two weeks before, we do a short planning call: timeline, must-have moments, people.",
          de: "Etwa zwei Wochen vorher machen wir ein kurzes Planungsgespräch: Ablauf, wichtige Momente, Personen.",
        },
        { en: "Sneak peeks within 48 hours after, the full gallery in 2–3 weeks.", de: "Erste Vorschau innerhalb von 48 Stunden, die komplette Galerie in 2–3 Wochen." },
      ],
      closing: { en: "Something changed? Just reply to this email — no form needed.", de: "Hat sich etwas geändert? Antworte einfach auf diese E-Mail — kein Formular nötig." },
    },
    {
      _key: "short",
      name: "Short shoot (no deposit)",
      subject: { en: "Confirmed — {type}, {dates}", de: "Bestätigt — {type}, {dates}" },
      heading: { en: "See you there!", de: "Bis dann!" },
      text: { en: "Hi {name}, you're booked — here's the time we agreed on:", de: "Hallo {name}, du bist gebucht — das ist die Zeit, auf die wir uns geeinigt haben:" },
      steps: [
        { en: "I'll be there 15 minutes early to look at the light.", de: "Ich bin 15 Minuten früher da, um mir das Licht anzusehen." },
        { en: "You get the edited photos within a week.", de: "Die bearbeiteten Fotos bekommst du innerhalb einer Woche." },
      ],
      closing: { en: "Questions? Just reply to this email.", de: "Fragen? Antworte einfach auf diese E-Mail." },
    },
  ] as RawTemplate[],
  declineTemplates: [
    {
      _key: "booked",
      name: "Already booked",
      freeDates: true,
      subject: { en: "About your request for {dates}", de: "Zu deiner Anfrage für {dates}" },
      heading: { en: "Sorry — I can't make that date.", de: "Sorry — an dem Termin kann ich leider nicht." },
      text: {
        en: "Hi {name}, thank you so much for thinking of me. Unfortunately I'm already booked on {dates}.",
        de: "Hallo {name}, vielen Dank, dass du an mich gedacht hast. Leider bin ich am {dates} schon gebucht.",
      },
    },
    {
      _key: "far",
      name: "Too far to travel",
      freeDates: false,
      subject: { en: "About your request ({type})", de: "Zu deiner Anfrage ({type})" },
      heading: { en: "Sorry — I have to pass on this one.", de: "Sorry — diesmal muss ich absagen." },
      text: {
        en: "Hi {name}, thank you so much for thinking of me. Unfortunately this one is too far for me to travel to.\n\nJust reply if you'd like a recommendation — I know some great people.",
        de: "Hallo {name}, vielen Dank, dass du an mich gedacht hast. Leider ist das für mich zu weit weg.\n\nAntworte einfach, wenn du eine Empfehlung möchtest — ich kenne tolle Leute.",
      },
    },
    {
      _key: "fit",
      name: "Not the right fit",
      freeDates: false,
      subject: { en: "About your request ({type})", de: "Zu deiner Anfrage ({type})" },
      heading: { en: "Sorry — I have to pass on this one.", de: "Sorry — diesmal muss ich absagen." },
      text: {
        en: "Hi {name}, thank you so much for thinking of me. After reading your request, I don't think I'm the right photographer for this one — and you deserve someone who is.\n\nJust reply if you'd like a recommendation.",
        de: "Hallo {name}, vielen Dank, dass du an mich gedacht hast. Nach deiner Anfrage glaube ich nicht, dass ich der richtige Fotograf dafür bin — und du verdienst jemanden, der es ist.\n\nAntworte einfach, wenn du eine Empfehlung möchtest.",
      },
    },
  ] as RawTemplate[],
  otherTemplates: [
    {
      _key: "deposit",
      name: "Deposit reminder",
      subject: { en: "Quick reminder — deposit for {dates}", de: "Kurze Erinnerung — Anzahlung für {dates}" },
      heading: { en: "Just a friendly reminder", de: "Nur eine kurze Erinnerung" },
      text: {
        en: "Hi {name}, your date is still held for you — I just haven't received the deposit yet. Once it's paid, your booking is final.\n\nAlready paid? Then please ignore this email.",
        de: "Hallo {name}, dein Termin ist weiter für dich reserviert — ich habe nur die Anzahlung noch nicht bekommen. Sobald sie bezahlt ist, ist deine Buchung fix.\n\nSchon bezahlt? Dann ignoriere diese E-Mail einfach.",
      },
    },
    {
      _key: "gallery",
      name: "Gallery is ready",
      subject: { en: "Your photos are ready!", de: "Deine Fotos sind fertig!" },
      heading: { en: "Your gallery is ready 🎉", de: "Deine Galerie ist fertig 🎉" },
      text: {
        en: "Hi {name}, it was a joy to be part of your {type}. Your full gallery is online now — have fun looking through it!\n\nIf you liked working with me, a short review would mean a lot.",
        de: "Hallo {name}, es war schön, bei deinem Event ({type}) dabei zu sein. Deine komplette Galerie ist jetzt online — viel Spaß beim Anschauen!\n\nWenn dir die Zusammenarbeit gefallen hat, würde mir eine kurze Bewertung viel bedeuten.",
      },
      buttonLabel: { en: "Open the gallery", de: "Zur Galerie" },
    },
  ] as RawTemplate[],
};

/* ── form ─────────────────────────────────────────────────────── */

/** `value` is what gets stored (English, so the admin reads one language); `label` is what the visitor sees. */
export type Choice = { value: string; label: string };
export type FormField = {
  key: string;
  label: string;
  /** English label, used for the answer in admin */
  name: string;
  type: "text" | "tel" | "number" | "select" | "textarea";
  required?: boolean;
  options?: Choice[];
  placeholder?: string;
  half?: boolean;
};
export type BookingConfig = { eventTypes: Choice[]; services: (Choice & { checked?: boolean })[]; fields: FormField[] };

const choice = (v: L, lang: Lang): Choice | null => {
  const value = pickL(v, "en");
  return value ? { value, label: pickL(v, lang) } : null;
};

export function resolveForm(raw: RawBookingSettings, lang: Lang): BookingConfig {
  const types = raw?.eventTypes?.length ? raw.eventTypes : DEFAULTS.eventTypes;
  const services = raw?.services?.length ? raw.services : DEFAULTS.services;
  const fields = raw?.fields ?? DEFAULTS.fields;
  return {
    eventTypes: types.map((t) => choice(t, lang)).filter((x): x is Choice => !!x),
    services: services.flatMap((s) => {
      const c = choice(s.label, lang);
      return c ? [{ ...c, checked: !!s.preselected }] : [];
    }),
    fields: fields.flatMap((f, i) => {
      const name = pickL(f.label, "en");
      if (!name) return [];
      return [
        {
          key: (f._key || `f${i}`).replace(/[^a-zA-Z0-9_-]/g, ""),
          name,
          label: pickL(f.label, lang),
          type: f.type ?? "text",
          required: !!f.required,
          half: f.half ?? true,
          placeholder: pickL(f.placeholder, lang) || undefined,
          options: f.type === "select" ? (f.options ?? []).map((o) => choice(o, lang)).filter((x): x is Choice => !!x) : undefined,
        },
      ];
    }),
  };
}

/* ── email templates ──────────────────────────────────────────── */

export type ReceivedTpl = { subject: string; heading: string; text: string; note: string };
export type ConfirmTpl = { key: string; name: string; subject: string; heading: string; text: string; steps: string[]; closing: string };
export type DeclineTpl = { key: string; name: string; subject: string; heading: string; text: string; freeDates: boolean };
export type OtherTpl = { key: string; name: string; subject: string; heading: string; text: string; buttonLabel?: string; buttonUrl?: string };
export type EmailSet = { received: ReceivedTpl; confirm: ConfirmTpl[]; decline: DeclineTpl[]; other: OtherTpl[] };

const t = (v: L, lang: Lang, fb: L) => pickL(v, lang) || pickL(fb, lang);

export function resolveConfirm(x: RawTemplate, lang: Lang): ConfirmTpl {
  const steps = (x.steps ?? []).map((s) => pickL(s, lang)).filter(Boolean);
  return { key: x._key, name: x.name || "Confirmation", subject: pickL(x.subject, lang), heading: pickL(x.heading, lang), text: pickL(x.text, lang), steps, closing: pickL(x.closing, lang) };
}
export function resolveDecline(x: RawTemplate, lang: Lang): DeclineTpl {
  return { key: x._key, name: x.name || "Decline", subject: pickL(x.subject, lang), heading: pickL(x.heading, lang), text: pickL(x.text, lang), freeDates: !!x.freeDates };
}
export function resolveOther(x: RawTemplate, lang: Lang): OtherTpl {
  return {
    key: x._key,
    name: x.name || "Email",
    subject: pickL(x.subject, lang),
    heading: pickL(x.heading, lang),
    text: pickL(x.text, lang),
    buttonLabel: pickL(x.buttonLabel, lang) || undefined,
    buttonUrl: x.buttonUrl || undefined,
  };
}

export function resolveEmails(raw: RawBookingSettings, lang: Lang): EmailSet {
  const r = raw?.emailReceived;
  const d = DEFAULTS.emailReceived;
  const usable = (x: RawTemplate) => Boolean(x?._key && pickL(x.subject, lang) && pickL(x.text, lang));
  const confirm = (raw?.confirmTemplates ?? []).filter(usable);
  const decline = (raw?.declineTemplates ?? []).filter(usable);
  const other = raw?.otherTemplates === undefined ? DEFAULTS.otherTemplates : raw.otherTemplates.filter(usable);
  return {
    received: { subject: t(r?.subject, lang, d.subject), heading: t(r?.heading, lang, d.heading), text: t(r?.text, lang, d.text), note: t(r?.note, lang, d.note) },
    confirm: (confirm.length ? confirm : DEFAULTS.confirmTemplates).map((x) => resolveConfirm(x, lang)),
    decline: (decline.length ? decline : DEFAULTS.declineTemplates).map((x) => resolveDecline(x, lang)),
    other: other.map((x) => resolveOther(x, lang)),
  };
}
