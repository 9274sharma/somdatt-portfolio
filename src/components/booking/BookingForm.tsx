"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { type Busy, MAX_DAYS, busyOn, clock, dateRange, dayStatus, fmtDate, hhmm, overlaps, span } from "@/lib/booking-time";
import type { BookingConfig, Lang } from "@/lib/booking-config";

/** What the browser sends; the server checks everything again. */
export type BookingRequestInput = {
  start: string;
  end: string;
  startTime: number | null;
  endTime: number | null;
  /** English value of the event type, or "__other" */
  type: string;
  typeOther: string;
  venue: string;
  services: string[];
  name: string;
  email: string;
  answers: Record<string, string>;
  message: string;
  lang: Lang;
  /** honeypot — must stay empty */
  website: string;
};
export type SubmitResult = { ok: true } | { ok: false; error: "validation" | "busy" | "rate" | "server"; detail?: string };

const T = {
  en: {
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    dow: ["M", "T", "W", "T", "F", "S", "S"],
    prev: "Previous month",
    next: "Next month",
    fullyBooked: "fully booked",
    someBooked: "some hours booked",
    legend: ["Free", "Some hours booked", "Fully booked", "Your dates"],
    tapFirst: "Tap your date. Several days? Tap the first day, then the last.",
    selected: (d: string) => `${d} selected — tap a later day if it runs over several days.`,
    days: (n: number) => `${n} days`,
    justThis: (d: string) => `Just ${d}?`,
    fullInRange: (d: string) => `${d} is fully booked — pick dates before or after it.`,
    tooLong: (n: number) => `That's more than ${n} days — pick the main days and write the rest in the message.`,
    roughTimes: "Rough times",
    roughTime: "Rough time",
    startOn: (d: string) => `Start · ${d}`,
    endOn: (d: string) => `End · ${d}`,
    from: "From",
    until: "Until",
    notSure: "Not sure yet",
    booked: " · booked",
    fromX: (t: string) => `from ${t}`,
    untilX: (t: string) => `until ${t}`,
    overlap: (h: string) => `That overlaps hours that are already booked (${h}). Send it anyway if the time is fixed — I'll see what's possible.`,
    partly: (x: string) => `Some hours are already booked on ${x} — I'll confirm what's possible.`,
    hintMulti: "Different times on each day (e.g. haldi in the morning, sangeet at night)? Write them in the message — I'll set the exact schedule with you when I confirm.",
    hintSingle: "Not sure about the times yet? That's fine — we'll fix them together before I confirm.",
    eventType: "Event type",
    other: "Other…",
    otherQ: "What kind of event?",
    otherPh: "e.g. Baby shower, product launch…",
    venue: "Venue / address",
    venuePh: "e.g. Uebel & Gefährlich, Feldstraße 66, Hamburg",
    venueHint: "The district is fine if you don't know the exact place yet",
    venueHintMulti: " — different venues per day can go in the message",
    services: "Services needed",
    name: "Name",
    email: "Email",
    optional: "optional",
    message: "Anything else?",
    messagePh: "Timeline, special moments, references…",
    send: "Send request",
    sending: "Sending…",
    legal: "Nothing is booked until I confirm — usually within 24 hours. I'll only use your details to reply to this request.",
    privacy: "Privacy policy",
    errDate: "Pick your date (or dates) first.",
    errEnd: "The end time needs to be after the start time.",
    errVenue: "Please add the venue or at least the district.",
    errOther: "Please tell me what kind of event it is.",
    errName: "Please add your name.",
    errEmail: "Please add a valid email address.",
    errField: (l: string) => `Please fill in “${l}”.`,
    errBusy: "Sorry — one of those days was just booked. Please pick other dates.",
    errRate: "Too many requests in a short time — please try again in a few minutes.",
    errServer: "Something went wrong. Please try again, or email me directly.",
    sentEyebrow: "Request sent",
    sentTitle: "Thank you — I'll get back to you within 24 hours.",
    sentText: (w: string) => `${w}. A confirmation is on its way to your inbox. We'll fix the exact times together — nothing is booked until I confirm it by email.`,
    more: "Add details (optional)",
    moreHint: "guests, budget, a message…",
    less: "Hide details",
  },
  de: {
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    dow: ["M", "D", "M", "D", "F", "S", "S"],
    prev: "Vorheriger Monat",
    next: "Nächster Monat",
    fullyBooked: "ausgebucht",
    someBooked: "teilweise gebucht",
    legend: ["Frei", "Teilweise gebucht", "Ausgebucht", "Deine Tage"],
    tapFirst: "Tippe auf deinen Tag. Mehrere Tage? Erst den ersten, dann den letzten antippen.",
    selected: (d: string) => `${d} gewählt — tippe einen späteren Tag an, wenn es über mehrere Tage geht.`,
    days: (n: number) => `${n} Tage`,
    justThis: (d: string) => `Nur ${d}?`,
    fullInRange: (d: string) => `${d} ist ausgebucht — wähle Tage davor oder danach.`,
    tooLong: (n: number) => `Das sind mehr als ${n} Tage — wähle die wichtigsten Tage und schreib den Rest in die Nachricht.`,
    roughTimes: "Ungefähre Zeiten",
    roughTime: "Ungefähre Zeit",
    startOn: (d: string) => `Beginn · ${d}`,
    endOn: (d: string) => `Ende · ${d}`,
    from: "Von",
    until: "Bis",
    notSure: "Noch unklar",
    booked: " · gebucht",
    fromX: (t: string) => `ab ${t}`,
    untilX: (t: string) => `bis ${t}`,
    overlap: (h: string) => `Das überschneidet sich mit schon gebuchten Stunden (${h}). Schick es trotzdem, wenn die Zeit fest ist — ich schaue, was möglich ist.`,
    partly: (x: string) => `Ein paar Stunden sind schon gebucht: ${x} — ich sage dir, was möglich ist.`,
    hintMulti: "Jeden Tag andere Zeiten (z. B. Haldi morgens, Sangeet abends)? Schreib es in die Nachricht — den genauen Ablauf legen wir beim Bestätigen zusammen fest.",
    hintSingle: "Die Zeiten stehen noch nicht fest? Kein Problem — wir klären sie zusammen, bevor ich bestätige.",
    eventType: "Art des Events",
    other: "Anderes…",
    otherQ: "Was für ein Event?",
    otherPh: "z. B. Babyparty, Produktlaunch…",
    venue: "Ort / Adresse",
    venuePh: "z. B. Uebel & Gefährlich, Feldstraße 66, Hamburg",
    venueHint: "Der Stadtteil reicht, wenn der genaue Ort noch nicht feststeht",
    venueHintMulti: " — verschiedene Orte pro Tag gern in die Nachricht",
    services: "Was brauchst du?",
    name: "Name",
    email: "E-Mail",
    optional: "optional",
    message: "Sonst noch etwas?",
    messagePh: "Ablauf, besondere Momente, Referenzen…",
    send: "Anfrage senden",
    sending: "Wird gesendet…",
    legal: "Gebucht ist erst, wenn ich bestätige — meistens innerhalb von 24 Stunden. Deine Angaben nutze ich nur, um auf diese Anfrage zu antworten.",
    privacy: "Datenschutz",
    errDate: "Wähle zuerst deinen Tag (oder deine Tage).",
    errEnd: "Das Ende muss nach dem Beginn liegen.",
    errVenue: "Bitte gib den Ort an — der Stadtteil reicht.",
    errOther: "Bitte schreib, was für ein Event es ist.",
    errName: "Bitte gib deinen Namen an.",
    errEmail: "Bitte gib eine gültige E-Mail-Adresse an.",
    errField: (l: string) => `Bitte fülle „${l}“ aus.`,
    errBusy: "Sorry — einer der Tage wurde gerade gebucht. Bitte wähle andere Tage.",
    errRate: "Zu viele Anfragen in kurzer Zeit — bitte versuch es in ein paar Minuten noch einmal.",
    errServer: "Da ist etwas schiefgelaufen. Bitte versuch es noch einmal oder schreib mir direkt.",
    sentEyebrow: "Anfrage gesendet",
    sentTitle: "Danke — ich melde mich innerhalb von 24 Stunden.",
    sentText: (w: string) => `${w}. Eine Bestätigung ist auf dem Weg in dein Postfach. Die genauen Zeiten klären wir zusammen — gebucht ist erst, wenn ich per E-Mail bestätige.`,
    more: "Details hinzufügen (optional)",
    moreHint: "Gäste, Budget, eine Nachricht…",
    less: "Details ausblenden",
  },
} as const;

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const START_TIMES = Array.from({ length: 36 }, (_, i) => 6 * 60 + i * 30); // 06:00 … 23:30
const END_TIMES = Array.from({ length: 47 }, (_, i) => 7 * 60 + i * 30); // 07:00 … 06:00 (+1)
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** Booking request: pick dates (first tap = start, second = end), then rough start/end times.
 *  The exact schedule (one block, same hours daily, or per day) is set by the owner when he confirms. */
export function BookingForm({
  configs,
  busy,
  today,
  preset,
  action,
  aside,
}: {
  configs: Record<Lang, BookingConfig>;
  busy: Busy[];
  today: string;
  preset?: { type?: string; services?: string[]; message?: string };
  action: (input: BookingRequestInput) => Promise<SubmitResult>;
  /** shown under the calendar on wide screens (e.g. "what happens next") */
  aside?: ReactNode;
}) {
  const { language } = useLanguage();
  const lang: Lang = language === "de" ? "de" : "en";
  const t = T[lang];
  const config = configs[lang];
  const short = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const date = (d: string) => fmtDate(d, lang);

  const [view, setView] = useState(() => ({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 }));
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [type, setType] = useState(() => (preset?.type && configs.en.eventTypes.some((x) => x.value === preset.type) ? preset.type : (config.eventTypes[0]?.value ?? "__other")));
  const [other, setOther] = useState("");
  const [venue, setVenue] = useState("");
  const [services, setServices] = useState(() => new Set(preset?.services?.length ? preset.services : config.services.filter((s) => s.checked).map((s) => s.value)));
  const [problem, setProblem] = useState<string | null>(null);
  /** calendar-only message (shown right under the calendar, not at the submit button) */
  const [calNote, setCalNote] = useState<{ text: string; day: string | null } | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  /** optional questions + message fold away (long form on phones); opens for multi-day or a preset message */
  const [details, setDetails] = useState(Boolean(preset?.message));
  /** phones: a sticky "Send request" bar once a date is picked and the real button is still BELOW the screen
   *  (never once it's scrolled past — then the bar would sit over the footer's Impressum/Datenschutz links) */
  const [submitVisible, setSubmitVisible] = useState(true);
  useEffect(() => {
    const el = submitRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSubmitVisible(!e || e.isIntersecting || e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1));
    const lead = (first.getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [view]);

  const range = start ? dateRange(start, end ?? start) : [];
  const multi = range.length > 1;
  const required = config.fields.filter((f) => f.required);
  const optional = config.fields.filter((f) => !f.required);
  const showDetails = details || multi;
  const partly = range.filter((d) => dayStatus(d, busy) === "partly");

  const pick = (d: string) => {
    setProblem(null);
    setCalNote(null);
    if (picking === "start" || !start || d < start) {
      setStart(d);
      setEnd(d);
      setPicking("end");
      return;
    }
    const days = dateRange(start, d);
    const full = days.find((x) => dayStatus(x, busy) === "full");
    if (full) {
      setCalNote({ text: t.fullInRange(date(full)), day: full });
      return;
    }
    if (days.length > MAX_DAYS) {
      setCalNote({ text: t.tooLong(MAX_DAYS), day: null });
      return;
    }
    setEnd(d);
    setPicking("start");
  };
  /** "Just 23 Nov?" — the start time belonged to the first day, so it goes; the end time stays. */
  const onlyEnd = () => {
    if (!end) return;
    setStart(end);
    setPicking("end");
    setCalNote(null);
    setStartTime(null);
  };
  // Whenever the request is a single day, an end at or before the start can't stand (selects and summary must agree).
  useEffect(() => {
    if (!multi && startTime !== null && endTime !== null && endTime <= startTime) setEndTime(null);
  }, [multi, startTime, endTime]);
  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);
  const changeStartTime = (v: number | null) => {
    setStartTime(v);
    if (!multi && v !== null && endTime !== null && endTime <= v) setEndTime(null);
  };
  const bookedAt = (d: string, m: number, isEnd: boolean) => busyOn(d, busy).some((b) => (isEnd ? m > b.from && m <= b.until : m >= b.from && m < b.until));
  const clashHours =
    start && !multi && startTime !== null && endTime !== null ? busyOn(start, busy).filter((b) => overlaps({ from: startTime, until: endTime }, b)) : [];

  const when = start
    ? multi
      ? `${date(start)}${startTime !== null ? ` ${hhmm(startTime)}` : ""} → ${date(end ?? start)}${endTime !== null ? ` ${clock(endTime)}` : ""} · ${t.days(range.length)}`
      : `${date(start)}${
          startTime !== null && endTime !== null
            ? ` · ${hhmm(startTime)}–${clock(endTime)}`
            : startTime !== null
              ? ` · ${t.fromX(hhmm(startTime))}`
              : endTime !== null
                ? ` · ${t.untilX(clock(endTime))}`
                : ""
        }`
    : "";

  const fail = (msg: string, focusId?: string) => {
    setProblem(msg);
    if (focusId) document.getElementById(focusId)?.focus();
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    if (!start) {
      setProblem(t.errDate);
      calRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      calRef.current?.querySelector<HTMLElement>("button.hm-cell")?.focus({ preventScroll: true });
      return;
    }
    if (!multi && startTime !== null && endTime !== null && endTime <= startTime) return fail(t.errEnd, "bk-end");
    if (type === "__other" && !other.trim()) return fail(t.errOther, "bk-other");
    if (!venue.trim()) return fail(t.errVenue, "bk-loc");
    if (!name) return fail(t.errName, "bk-name");
    if (!isEmail(email)) return fail(t.errEmail, "bk-email");
    const answers: Record<string, string> = {};
    for (const f of config.fields) {
      const v = String(fd.get(`q-${f.key}`) ?? "").trim();
      if (f.required && !v) return fail(t.errField(f.label), `bk-${f.key}`);
      if (v) answers[f.key] = v;
    }
    setProblem(null);
    setSending(true);
    try {
      const res = await action({
        start,
        end: end ?? start,
        startTime,
        endTime,
        type,
        typeOther: other.trim(),
        venue: venue.trim(),
        services: [...services],
        name,
        email,
        answers,
        message: String(fd.get("message") ?? "").trim(),
        lang,
        website: String(fd.get("website") ?? ""),
      });
      if (res.ok) setSent(true);
      else setProblem(res.error === "busy" ? t.errBusy : res.error === "rate" ? t.errRate : res.error === "validation" ? (res.detail ?? t.errServer) : t.errServer);
    } catch {
      setProblem(t.errServer);
    } finally {
      setSending(false);
    }
  };

  const fieldEl = (f: (typeof config.fields)[number]) => (
    <div key={f.key} className={`hm-field ${f.half ? "" : "sm:col-span-2"}`}>
      <label htmlFor={`bk-${f.key}`}>
        {f.label}
        {f.required ? "" : <span className="normal-case tracking-normal text-ink-soft/70"> ({t.optional})</span>}
      </label>
      {f.type === "textarea" ? (
        <textarea id={`bk-${f.key}`} name={`q-${f.key}`} placeholder={f.placeholder} maxLength={2000} />
      ) : f.type === "select" ? (
        <select id={`bk-${f.key}`} name={`q-${f.key}`}>
          {(f.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={`bk-${f.key}`}
          name={`q-${f.key}`}
          type={f.type}
          placeholder={f.placeholder}
          maxLength={300}
          autoComplete={f.type === "tel" ? "tel" : undefined}
          inputMode={f.type === "number" ? "numeric" : undefined}
        />
      )}
    </div>
  );

  if (sent) {
    return (
      <div className="view-in max-w-xl py-10" role="status">
        <p className="hm-eyebrow">{t.sentEyebrow}</p>
        <h2 ref={sentRef} tabIndex={-1} className="hm-h2 mt-2 focus:outline-none">
          {t.sentTitle}
        </h2>
        <p className="mt-3 text-ink-soft">{t.sentText(when)}</p>
      </div>
    );
  }

  const chip = (on: boolean) =>
    `inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm transition ${
      on ? "border-ink bg-ink text-page" : "border-ink-soft/50 text-ink-soft hover:border-ink hover:text-ink"
    }`;

  return (
    <div className="hm-book">
      <div ref={calRef} className="scroll-mt-28">
        <div className="hm-cal">
          <div className="hm-calhead">
            <b>
              {t.months[view.m]} {view.y}
            </b>
            <div className="hm-calnav">
              <button type="button" aria-label={t.prev} onClick={() => setView((v) => (v.m ? { y: v.y, m: v.m - 1 } : { y: v.y - 1, m: 11 }))}>
                ‹
              </button>
              <button type="button" aria-label={t.next} onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}>
                ›
              </button>
            </div>
          </div>
          <div className="hm-caldow">
            {t.dow.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="hm-calgrid">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="hm-cell off" />;
              const key = iso(view.y, view.m, d);
              if (key < today) return <div key={i} className="hm-cell off">{d}</div>;
              const st = dayStatus(key, busy);
              if (st === "full")
                return (
                  <div key={i} className={`hm-cell booked ${calNote?.day === key ? "flash" : ""}`} aria-label={`${date(key)} — ${t.fullyBooked}`}>
                    {d}
                  </div>
                );
              const isEdge = key === start || key === end;
              const inRange = Boolean(start && end && key > start && key < end);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(key)}
                  aria-pressed={isEdge || inRange}
                  aria-label={`${date(key)}${st === "partly" ? ` — ${t.someBooked}` : ""}`}
                  className={`hm-cell free ${st === "partly" ? "partly" : ""} ${isEdge ? "sel" : inRange ? "range" : ""}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div className="hm-callegend" style={{ alignItems: "center" }}>
          <span>
            <span className="hm-legend-cell" style={{ boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-ink-soft) 40%, transparent)" }} />
            {t.legend[0]}
          </span>
          <span>
            <span className="hm-legend-cell partly" />
            {t.legend[1]}
          </span>
          <span>
            <span className="hm-legend-cell full" />
            {t.legend[2]}
          </span>
          <span>
            <span className="hm-legend-cell pick" />
            {t.legend[3]}
          </span>
        </div>
        <p className="hm-selnote" aria-live="polite">
          {calNote ? (
            <span className="font-semibold text-danger">{calNote.text}</span>
          ) : !start ? (
            t.tapFirst
          ) : picking === "end" ? (
            t.selected(date(start))
          ) : (
            <>
              {short(start)} – {short(end ?? start)} · {t.days(range.length)}.{" "}
              <button type="button" onClick={onlyEnd} className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-2">
                {t.justThis(short(end ?? start))}
              </button>
            </>
          )}
        </p>

        {start ? (
          <div className="view-in mt-5 rounded-2xl border border-sand/60 p-4 md:p-5">
            <p className="text-sm font-semibold text-ink">{multi ? t.roughTimes : t.roughTime}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="hm-field" style={{ margin: 0 }}>
                <label htmlFor="bk-start">{multi ? t.startOn(date(start)) : t.from}</label>
                <select id="bk-start" value={startTime ?? ""} onChange={(e) => changeStartTime(e.target.value === "" ? null : Number(e.target.value))}>
                  <option value="">{t.notSure}</option>
                  {START_TIMES.map((m) => (
                    <option key={m} value={m}>
                      {hhmm(m)}
                      {bookedAt(start, m, false) ? t.booked : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hm-field" style={{ margin: 0 }}>
                <label htmlFor="bk-end">{multi ? t.endOn(date(end ?? start)) : t.until}</label>
                <select id="bk-end" value={endTime ?? ""} onChange={(e) => setEndTime(e.target.value === "" ? null : Number(e.target.value))}>
                  <option value="">{t.notSure}</option>
                  {END_TIMES.filter((m) => multi || startTime === null || m > startTime).map((m) => (
                    <option key={m} value={m}>
                      {clock(m)}
                      {bookedAt(end ?? start, m, true) ? t.booked : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {when ? <p className="mt-3 text-sm font-semibold text-ink">{when}</p> : null}
            {clashHours.length ? (
              <p className="mt-3 rounded-xl border border-[#c98a0a]/50 bg-[#c98a0a]/10 px-3 py-2 text-xs leading-relaxed text-ink" role="status">
                {t.overlap(clashHours.map((b) => span(b.from, b.until)).join(", "))}
              </p>
            ) : partly.length && (multi || startTime === null || endTime === null) ? (
              <p className="mt-3 rounded-xl bg-sand/25 px-3 py-2 text-xs leading-relaxed text-ink">
                {t.partly(partly.map((d) => `${date(d)} (${busyOn(d, busy).map((b) => span(b.from, b.until)).join(", ")})`).join("; "))}
              </p>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">{multi ? t.hintMulti : t.hintSingle}</p>
          </div>
        ) : null}
        {aside ? <div className="mt-8 hidden md:block">{aside}</div> : null}
      </div>

      <form ref={formRef} className="hm-form" onSubmit={submit} noValidate>
        {/* honeypot for bots — hidden from people and screen readers */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="hm-field">
          <label htmlFor="bk-type">{t.eventType}</label>
          <select id="bk-type" value={type} onChange={(e) => setType(e.target.value)}>
            {config.eventTypes.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
            <option value="__other">{t.other}</option>
          </select>
        </div>
        {type === "__other" ? (
          <div className="hm-field view-in">
            <label htmlFor="bk-other">{t.otherQ}</label>
            <input id="bk-other" value={other} onChange={(e) => setOther(e.target.value)} placeholder={t.otherPh} maxLength={120} />
          </div>
        ) : null}

        <div className="hm-field">
          <label htmlFor="bk-loc">{t.venue}</label>
          <input id="bk-loc" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={t.venuePh} aria-describedby="bk-loc-hint" maxLength={240} autoComplete="street-address" />
          <p id="bk-loc-hint" className="mt-1 text-[11px] text-ink-soft">
            {t.venueHint}
            {multi ? t.venueHintMulti : ""}.
          </p>
        </div>

        {config.services.length ? (
          <fieldset className="mb-5">
            <legend className="mb-2 font-sans text-[0.68rem] uppercase tracking-[0.14em] text-ink-soft">{t.services}</legend>
            <div className="flex flex-wrap gap-2">
              {config.services.map((s) => {
                const on = services.has(s.value);
                return (
                  <label key={s.value} className={chip(on)}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() =>
                        setServices((prev) => {
                          const n = new Set(prev);
                          if (n.has(s.value)) n.delete(s.value);
                          else n.add(s.value);
                          return n;
                        })
                      }
                    />
                    {s.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 [&_.hm-field]:mb-3">
          <div className="hm-field">
            <label htmlFor="bk-name">{t.name}</label>
            <input id="bk-name" name="name" autoComplete="name" maxLength={120} />
          </div>
          <div className="hm-field">
            <label htmlFor="bk-email">{t.email}</label>
            <input id="bk-email" name="email" type="email" autoComplete="email" maxLength={200} />
          </div>
          {required.map((f) => fieldEl(f))}
        </div>

        <div className="mb-4">
            <button
              type="button"
              onClick={() => setDetails((x) => !x)}
              aria-expanded={showDetails}
              aria-controls="bk-more"
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-sand/60 px-4 text-left text-sm text-ink transition hover:border-ink/40"
            >
              <span>
                {showDetails ? t.less : t.more} {showDetails ? null : <span className="text-ink-soft">— {t.moreHint}</span>}
              </span>
              <span aria-hidden className={`transition ${showDetails ? "rotate-45" : ""}`}>
                +
              </span>
            </button>
            {/* kept in the DOM (just hidden) so typed answers survive closing it */}
            <div id="bk-more" hidden={!showDetails} className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2 [&_.hm-field]:mb-3">
              {optional.map((f) => fieldEl(f))}
              <div className="hm-field sm:col-span-2">
                <label htmlFor="bk-message">
                  {t.message} <span className="normal-case tracking-normal text-ink-soft/70">({t.optional})</span>
                </label>
                <textarea id="bk-message" name="message" placeholder={t.messagePh} maxLength={6000} defaultValue={preset?.message} />
              </div>
            </div>
          </div>

        {problem ? (
          <p role="alert" className="mb-3 rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-ink">
            {problem}
          </p>
        ) : null}
        <button ref={submitRef} className="hm-btn dark" type="submit" disabled={sending} aria-busy={sending}>
          {sending ? t.sending : t.send}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          {t.legal}{" "}
          <Link href="/datenschutz" className="underline underline-offset-2 hover:text-ink">
            {t.privacy}
          </Link>
        </p>
      </form>
      {start && !submitVisible && !sending ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/60 bg-page/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{when}</p>
            <button type="button" onClick={() => formRef.current?.requestSubmit()} className="hm-btn dark shrink-0">
              {t.send}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
