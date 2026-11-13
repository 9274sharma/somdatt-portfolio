export type Lang = "en" | "de";

export type LocaleField = { en?: string; de?: string } | null | undefined;

/** Pick a localized Sanity field with English fallback. */
export const pick = (f: LocaleField, lang: Lang): string =>
  (f?.[lang] ?? f?.en ?? "") as string;

/* UI copy (not in the CMS). German falls back to English per-key. */
const en = {
  "nav.work": "Work",
  "nav.services": "Services",
  "nav.about": "About",
  "nav.contact": "Contact",
  "common.home": "Home",

  "hero.eyebrow": "Photographer & Filmmaker — Hamburg",
  "hero.l1": "Weddings. Brands.",
  "hero.l2": "Nightlife.",
  "hero.sub":
    "Full-service photography, videography & editing — for every kind of moment across Hamburg.",
  "hero.cta1": "View Work",
  "hero.cta2": "Book a Shoot",

  "home.selectedWork": "Selected work",
  "home.workTitle": "Recent work",
  "home.recentFrames": "Recent frames",
  "home.framesTitle": "Straight from the shoots",
  "home.viewAll": "View all",
  "home.whatido": "What I do",
  "home.oneTeam": "One team, the full job",
  "home.seeServices": "See all services",
  "home.aboutTitle": "Behind the lens",
  "home.readMore": "Read more",
  "home.events": "Events",
  "home.bookEvent": "Book an event shoot",
  "home.seeEvents": "See events",

  "cta.getInTouch": "Get in touch",
  "cta.worthKeeping": "Let's make something worth keeping.",
  "cta.tellMe":
    "Tell me about your event, wedding or brand — I'll get back within 24 hours.",
  "cta.checkAvail": "Check availability",

  "book.label": "Book a call",
  "book.title": "Grab a free intro slot",
  "book.load": "Load booking calendar",
  "book.note": "This loads Cal.com, a third-party scheduling tool.",
  "book.or": "or",
  "cal.available": "Available",
  "cal.booked": "Booked",
  "cal.pickEnd": "pick an end date for a multi-day event",
  "cal.blocked": "That range includes a booked day — pick another.",

  "work.title": "Work",
  "work.lead":
    "Weddings, brands, nightlife and events — filter by category, open a project to see the full story.",
  "work.all": "All",
  "work.mix": "A mix from the set",
  "work.empty": "No projects in this category yet — added in the studio.",

  "services.lead":
    "From the first frame to the final cut — shot, directed and edited in-house.",
  "services.got": "Got something coming up?",
  "services.tell":
    "Tell me the date and the vibe — I'll put together the right coverage.",

  "about.label": "About",

  "contact.label": "Availability & enquiry",
  "contact.title": "Check a date, send a request",
  "contact.lead":
    "Pick a date and tell me what you need — I'll confirm within 24 hours.",
  "contact.eventType": "Event type",
  "contact.location": "Location",
  "contact.duration": "Coverage duration",
  "contact.services": "Services needed",
  "contact.name": "Name",
  "contact.email": "Email",
  "contact.else": "Anything else?",
  "contact.submit": "Check availability & request",
  "contact.sending": "Sending…",
  "contact.noDate": "No date selected yet — pick a free day.",
  "contact.selected": "Selected",
  "contact.prefer": "Prefer direct?",
  "contact.ok": "Request sent — I'll confirm within 24 hours.",
  "contact.err": "Something went wrong. Please try again or email me directly.",
  "contact.inval": "Please add your name, a valid email and a short message.",
  "contact.conf": "The form isn't live yet. Please email me directly for now.",

  "proj.year": "Year",
  "proj.location": "Location",
  "proj.category": "Category",
  "proj.book": "Book a similar shoot",
  "proj.back": "Back to work",
  "proj.watch": "Watch film",

  "foot.contact": "Contact",
  "foot.legal": "Legal",
  "foot.tagline":
    "Photographer & filmmaker — weddings, brands, nightlife and events. Hamburg / India.",
};

const de: Partial<Record<keyof typeof en, string>> = {
  "nav.work": "Arbeiten",
  "nav.services": "Leistungen",
  "nav.about": "Über mich",
  "nav.contact": "Kontakt",
  "common.home": "Start",

  "hero.eyebrow": "Fotograf & Filmemacher — Hamburg",
  "hero.l1": "Hochzeiten. Marken.",
  "hero.l2": "Nightlife.",
  "hero.sub":
    "Full-Service-Fotografie, Videografie & Schnitt — für jeden Moment in Hamburg.",
  "hero.cta1": "Arbeiten ansehen",
  "hero.cta2": "Shooting buchen",

  "home.selectedWork": "Ausgewählte Arbeiten",
  "home.workTitle": "Aktuelle Arbeiten",
  "home.recentFrames": "Aktuelle Aufnahmen",
  "home.framesTitle": "Frisch aus den Shootings",
  "home.viewAll": "Alle ansehen",
  "home.whatido": "Was ich mache",
  "home.oneTeam": "Ein Team, der ganze Job",
  "home.seeServices": "Alle Leistungen",
  "home.aboutTitle": "Hinter der Kamera",
  "home.readMore": "Mehr erfahren",
  "home.events": "Events",
  "home.bookEvent": "Event-Shooting buchen",
  "home.seeEvents": "Events ansehen",

  "cta.getInTouch": "Kontakt",
  "cta.worthKeeping": "Lass uns etwas Bleibendes schaffen.",
  "cta.tellMe":
    "Erzähl mir von deinem Event, deiner Hochzeit oder Marke — ich melde mich innerhalb von 24 Stunden.",
  "cta.checkAvail": "Verfügbarkeit prüfen",

  "book.label": "Anruf buchen",
  "book.title": "Sichere dir ein kostenloses Erstgespräch",
  "book.load": "Buchungskalender laden",
  "book.note": "Lädt Cal.com, ein externes Planungstool.",
  "book.or": "oder",
  "cal.available": "Frei",
  "cal.booked": "Belegt",
  "cal.pickEnd": "Enddatum für mehrere Tage wählen",
  "cal.blocked": "Dieser Zeitraum enthält einen belegten Tag — bitte anderen wählen.",

  "work.title": "Arbeiten",
  "work.lead":
    "Hochzeiten, Marken, Nightlife und Events — nach Kategorie filtern, ein Projekt öffnen für die ganze Geschichte.",
  "work.all": "Alle",
  "work.mix": "Ein Mix aus der Serie",
  "work.empty":
    "Noch keine Projekte in dieser Kategorie — werden im Studio hinzugefügt.",

  "services.lead":
    "Vom ersten Bild bis zum finalen Schnitt — aufgenommen, inszeniert und geschnitten aus einer Hand.",
  "services.got": "Steht etwas an?",
  "services.tell":
    "Nenn mir Datum und Stimmung — ich stelle die passende Betreuung zusammen.",

  "about.label": "Über mich",

  "contact.label": "Verfügbarkeit & Anfrage",
  "contact.title": "Datum prüfen, Anfrage senden",
  "contact.lead":
    "Wähle ein Datum und sag mir, was du brauchst — ich bestätige innerhalb von 24 Stunden.",
  "contact.eventType": "Eventart",
  "contact.location": "Ort",
  "contact.duration": "Dauer",
  "contact.services": "Leistungen",
  "contact.name": "Name",
  "contact.email": "E-Mail",
  "contact.else": "Sonst noch etwas?",
  "contact.submit": "Verfügbarkeit prüfen & anfragen",
  "contact.sending": "Wird gesendet…",
  "contact.noDate": "Noch kein Datum gewählt — wähle einen freien Tag.",
  "contact.selected": "Gewählt",
  "contact.prefer": "Lieber direkt?",
  "contact.ok": "Anfrage gesendet — ich bestätige innerhalb von 24 Stunden.",
  "contact.err":
    "Etwas ist schiefgelaufen. Bitte versuch es erneut oder schreib mir direkt.",
  "contact.inval":
    "Bitte Namen, eine gültige E-Mail und eine kurze Nachricht angeben.",
  "contact.conf":
    "Das Formular ist noch nicht live. Bitte schreib mir vorerst direkt.",

  "proj.year": "Jahr",
  "proj.location": "Ort",
  "proj.category": "Kategorie",
  "proj.book": "Ähnliches Shooting buchen",
  "proj.back": "Zurück zu den Arbeiten",
  "proj.watch": "Film ansehen",

  "foot.contact": "Kontakt",
  "foot.legal": "Rechtliches",
  "foot.tagline":
    "Fotograf & Filmemacher — Hochzeiten, Marken, Nightlife und Events. Hamburg / Indien.",
};

export type MsgKey = keyof typeof en;

export function tr(key: MsgKey, lang: Lang): string {
  if (lang === "de" && de[key]) return de[key] as string;
  return en[key];
}
