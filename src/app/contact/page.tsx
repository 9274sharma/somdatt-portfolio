/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { getLang } from "@/i18n/server";
import { tr } from "@/i18n/messages";
import { BookingForm } from "@/components/booking/BookingForm";
import { resolveForm } from "@/lib/booking-config";
import { getAllBookings, getBookingSettings, publicBusy, todayHamburg } from "@/lib/bookings";
import { submitBookingRequest } from "./actions";
import { ProcessDiagram } from "@/components/about/ProcessDiagram";
import { fetchMaybeDraft } from "@/sanity/fetch";
import { cropUrl } from "@/sanity/media";
import type { SanityImage } from "@/sanity/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Check availability and request a date for your event, wedding or brand shoot in Hamburg.",
};

/** `?type=` from Work / project CTAs → pre-selected event type (English value, used only if it exists in Studio). */
const TYPE_FROM_LINK: Record<string, string> = {
  wedding: "Wedding",
  weddings: "Wedding",
  event: "DJ & Nightlife",
  events: "DJ & Nightlife",
  nightlife: "DJ & Nightlife",
  commercial: "Corporate / brand",
  brand: "Corporate / brand",
  corporate: "Corporate / brand",
  party: "Private party",
  portrait: "Portrait",
};
/** `?service=` / `?bundle=` from the Services page → pre-ticked services. */
const SERVICE_FROM_LINK: Record<string, string[]> = {
  photo: ["Photo"],
  photography: ["Photo"],
  film: ["Video"],
  video: ["Video"],
  videography: ["Video"],
  edit: ["Editing"],
  editing: ["Editing"],
  reels: ["Reels"],
  "photo-film": ["Photo", "Video"],
  "full-job": ["Photo", "Video", "Editing", "Reels"],
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string; service?: string; bundle?: string }> }) {
  const [raw, all, lang, sp, portrait] = await Promise.all([
    getBookingSettings(),
    getAllBookings(),
    getLang(),
    searchParams,
    fetchMaybeDraft<SanityImage>(`*[_id=="aboutPage"][0].portrait`).catch(() => null),
  ]);
  const de = lang === "de";
  const face = cropUrl(portrait, 160, 1);
  const steps = de
    ? [
        { title: "Anfrage", text: "Tag und ungefähre Zeit wählen — dauert eine Minute." },
        { title: "Ich melde mich", text: "Innerhalb von 24 Stunden. Die genauen Zeiten klären wir zusammen." },
        { title: "Bestätigung", text: "Du bekommst den finalen Ablauf per E-Mail — mit Kalender-Datei." },
        { title: "Der Tag", text: "Ich bin da. Erste Vorschau nach 48 Stunden." },
      ]
    : [
        { title: "You ask", text: "Pick the day and a rough time — takes a minute." },
        { title: "I reply", text: "Within 24 hours. We fix the exact times together." },
        { title: "Confirmed", text: "You get the final schedule by email — with a calendar file." },
        { title: "The day", text: "I'm there. Sneak peeks within 48 hours." },
      ];
  const busy = publicBusy(all);
  const configs = { en: resolveForm(raw, "en"), de: resolveForm(raw, "de") };
  const bundle = (sp.bundle ?? "").slice(0, 60);
  const preset = {
    type: TYPE_FROM_LINK[(sp.type ?? "").toLowerCase()],
    services: (SERVICE_FROM_LINK[(bundle || sp.service || "").toLowerCase()] ?? []).filter((v) => configs.en.services.some((s) => s.value === v)),
    message: bundle ? `${lang === "de" ? "Interesse an" : "Interested in"}: ${bundle.replace(/-/g, " + ")}\n\n` : undefined,
  };

  return (
    <div className="hm-wrap relative pb-20">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-24 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-[110px]" />
      <header className="hm-pagehead relative">
        <p className="hm-eyebrow">{tr("contact.label", lang)}</p>
        <h1>{tr("contact.title", lang)}</h1>
        <p className="lead">
          {lang === "de"
            ? "Wähle deinen Tag und ungefähr die Zeit — ich bestätige innerhalb von 24 Stunden."
            : "Pick your date and roughly when you need me — I'll confirm within 24 hours."}
        </p>
      </header>
      <div className="mt-8">
        <BookingForm
          configs={configs}
          busy={busy}
          today={todayHamburg()}
          preset={preset}
          action={submitBookingRequest}
          aside={
            <div className="rounded-3xl border border-sand/60 p-6">
              <p className="hm-eyebrow">{de ? "Wie es weitergeht" : "What happens next"}</p>
              <div className="mt-4">
                <ProcessDiagram steps={steps} />
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-sand/60 pt-5">
                {face ? <img src={face} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" /> : null}
                <p className="text-sm text-ink-soft">
                  {de ? "Ich antworte persönlich — meistens innerhalb weniger Stunden." : "I reply personally — usually within a few hours."}
                  <span className="block font-semibold text-ink">Somdatt</span>
                </p>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
