import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { GuideShot } from "@/components/admin/GuideShot";

export const metadata = { title: "Guide" };

const PARTS = [
  {
    label: "Part 1 · Booking desk",
    chapters: [
      ["install", "Put it on your phone"],
      ["dashboard", "Your dashboard"],
      ["requests", "A new request comes in"],
      ["accept", "Accept: set the final times"],
      ["decline", "Decline kindly"],
      ["calendar", "Calendar"],
      ["notes", "Booking page, notes & history"],
      ["add", "Add a booking by hand"],
      ["reviews", "Ask for a review"],
    ],
  },
  {
    label: "Part 2 · Website (Studio)",
    chapters: [
      ["studio", "Open the Studio"],
      ["publish", "Change something & publish"],
      ["photos", "Photos: upload & focus"],
      ["projects", "Add a project & photos"],
      ["services", "Services, prices & VAT"],
      ["emails", "Booking form & emails"],
      ["faq", "Questions"],
    ],
  },
] as const;

const PHONE: Record<string, string> = {
  dashboard: "phone-dashboard",
  accept: "phone-accept",
  "accept-bottom": "phone-accept-bottom",
  decline: "phone-decline",
  "calendar-month": "phone-calendar",
  booking: "phone-booking",
  add: "phone-add",
  reviews: "phone-reviews",
};
function Shot({ src, alt, phone = false }: { src: string; alt: string; phone?: boolean }) {
  return <GuideShot src={src} phoneSrc={phone ? undefined : PHONE[src]} alt={alt} phone={phone} />;
}

function Chapter({ id, n, title, lead, children, aside }: { id: string; n: number; title: string; lead: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-sand/60 py-12 first:border-0 first:pt-2 md:py-16">
      <p className="font-display text-sm font-extrabold tracking-[0.2em] text-accent">{String(n).padStart(2, "0")}</p>
      <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-ink-soft">{lead}</p>
      <div className={`mt-6 grid gap-8 ${aside ? "lg:grid-cols-[1fr_1.05fr] lg:items-start" : ""}`}>
        <div className="min-w-0 text-[0.95rem] leading-relaxed">{children}</div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </section>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="grid gap-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
          <span className="pt-0.5">{it}</span>
        </li>
      ))}
    </ol>
  );
}

const Chip = ({ tone, children }: { tone: "ok" | "tight" | "bad" | "unknown"; children: ReactNode }) => (
  <span
    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
      tone === "ok" ? "border-[#2f9e6f]/45 bg-[#2f9e6f]/12 text-[#2f9e6f]" : tone === "tight" ? "border-[#c98a0a]/50 bg-[#c98a0a]/12 text-[#c98a0a]" : tone === "bad" ? "border-danger/50 bg-danger/10 text-danger" : "border-ink-soft/40 text-ink-soft"
    }`}
  >
    {children}
  </span>
);
const B = ({ children }: { children: ReactNode }) => <b className="font-semibold text-ink">{children}</b>;

export default async function GuidePage() {
  if (!(await auth())) return null;
  return (
    <div className="relative overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-48 h-[30rem] w-[30rem] rounded-full bg-accent/15 blur-[120px]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-10">
        <header className="adm-rise max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Guide</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight md:text-6xl">How everything works.</h1>
          <p className="mt-4 text-lg text-ink-soft">
            <B>Part 1 — bookings:</B> a client asks for a date on the website → you set the real times here → they get a confirmation email and the job lands in your Google Calendar.{" "}
            <B>Part 2 — the website:</B> change any word or photo in the Studio, then press Publish.
          </p>
        </header>

        {/* start here */}
        <section className="adm-rise mt-8 grid gap-3 rounded-3xl border border-accent/40 bg-accent/[0.07] p-5 sm:grid-cols-2 md:p-6 xl:grid-cols-4" style={{ "--i": 1 } as React.CSSProperties}>
          <p className="text-xs uppercase tracking-[0.2em] text-accent sm:col-span-2 xl:col-span-4">Start here — the 4 things you do most</p>
          {[
            ["A request comes in", "Open it in Requests → Set times & accept (or Decline).", "#accept"],
            ["Something to remember", "Open the booking → Add note. Only you see it.", "#notes"],
            ["Someone booked by phone", "Tap + Booking → fill in → Add booking.", "#add"],
            ["Change the website", "Studio → pick the page → edit → Publish.", "#publish"],
          ].map(([t, d, h], i) => (
            <a key={t} href={h} className="flex min-h-11 gap-3 rounded-2xl bg-page/60 p-3.5 transition hover:-translate-y-0.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
              <span>
                <span className="block font-semibold">{t}</span>
                <span className="block text-sm text-ink-soft">{d}</span>
              </span>
            </a>
          ))}
        </section>

        {/* contents */}
        <nav aria-label="Chapters" className="mt-8 grid gap-4">
          {PARTS.map((part, pi) => {
            const offset = PARTS.slice(0, pi).reduce((n, x) => n + x.chapters.length, 0);
            return (
              <div key={part.label}>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-ink-soft">{part.label}</p>
                <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
                  {part.chapters.map(([id, t], i) => (
                    <a key={id} href={`#${id}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-sand/60 px-4 text-sm text-ink-soft transition hover:border-accent/50 hover:text-ink">
                      <span className="font-display text-xs font-extrabold text-accent">{String(offset + i + 1).padStart(2, "0")}</span> {t}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-8">
          <Chapter id="install" n={1} title="Put it on your phone" lead="Use the booking desk like an app — its own icon on your home screen, full screen, no browser bars." aside={<Shot phone src="phone-dashboard" alt="The dashboard on a phone" />}>
            <h3 className="font-display text-lg font-bold">iPhone (Safari)</h3>
            <div className="mt-3">
              <Steps
                items={[
                  <>Open <B>somdattsharma.com/admin</B> in <B>Safari</B> and sign in.</>,
                  <>Tap the <B>Share</B> button (square with an arrow ↑).</>,
                  <>Scroll down and tap <B>Add to Home Screen</B> → <B>Add</B>.</>,
                ]}
              />
            </div>
            <h3 className="mt-8 font-display text-lg font-bold">Android (Chrome)</h3>
            <div className="mt-3">
              <Steps items={[<>Open <B>somdattsharma.com/admin</B> in <B>Chrome</B> and sign in.</>, <>Tap <B>⋮</B> (top right) → <B>Install app</B> (or <B>Add to Home screen</B>).</>]} />
            </div>
            <p className="mt-6 rounded-2xl bg-sand/20 px-4 py-3 text-sm text-ink-soft">
              The icon says <B>S·D</B>. You stay signed in, so it opens straight on the dashboard. The bar at the bottom has Home, Requests, Calendar and Reviews; <B>More</B> has this guide, the Studio, light/dark and Sign out.
            </p>
          </Chapter>

          <Chapter id="dashboard" n={2} title="Your dashboard" lead="Everything that matters right now, on one screen." aside={<Shot src="dashboard" alt="Dashboard with numbers, next shoot and coming up" />}>
            <ul className="grid gap-3">
              <li>
                <B>The big numbers</B> — new requests, shoots in the next 7 days, booked days this month, reviews to approve. Tap one to jump there.
              </li>
              <li>
                <B>Next up</B> — your next shoot with a countdown, the venue (tap for the route) and your latest note.
              </li>
              <li>
                <B>Needs you</B> — requests waiting for an answer, requests for dates that are coming soon, bookings with no venue.
              </li>
              <li>
                <B>Coming up</B> — the next bookings, soonest first.
              </li>
            </ul>
          </Chapter>

          <Chapter id="requests" n={3} title="A new request comes in" lead="You get an email straight away (and a WhatsApp message, if that's switched on). The request waits in Requests until you answer." aside={<Shot phone src="phone-requests" alt="Requests list on a phone" />}>
            <Steps
              items={[
                <>Open <B>Requests</B>. Sort by <B>Newest</B>, <B>Waiting longest</B> or <B>Event date</B>, or search a name.</>,
                <>Each card shows the date and rough time they asked for, the venue, services and their message.</>,
                <>
                  The coloured label checks your calendar for you: <Chip tone="ok">✓ Fits</Chip> <Chip tone="tight">⚠ Tight travel time</Chip> <Chip tone="bad">✗ Overlaps a booking</Chip>{" "}
                  <Chip tone="unknown">? Time not set</Chip>
                </>,
                <>
                  <B>Details & notes →</B> opens the full booking page (call / WhatsApp / notes). <B>Reply</B> opens an email to them.
                </>,
              ]}
            />
            <p className="mt-6 text-sm text-ink-soft">Nothing is blocked on the website until you accept — other people can still ask for the same day.</p>
          </Chapter>

          <Chapter
            id="accept"
            n={4}
            title="Accept: set the final times"
            lead="The client gave rough times. Here you decide the real ones — that's what gets blocked and what they see in their email."
            aside={
              <div className="grid gap-4">
                <Shot src="accept" alt="Set the times and accept" />
                <Shot src="accept-bottom" alt="Email preview and Accept & block" />
              </div>
            }
          >
            <Steps
              items={[
                <>Tap <B>Set times & accept</B>.</>,
                <>
                  Pick how the days look: <B>One block</B> (start → end), <B>Same hours daily</B> (e.g. 16:00–17:00 every day) or <B>Per day</B> (different times each day — weddings).
                </>,
                <>Look at the cards below the times: what you have before and after, the gap, and the travel time by car. Red means it doesn&apos;t fit.</>,
                <>Optional: add a note for yourself (it&apos;s copied into your Google Calendar event).</>,
                <>
                  Choose the email (e.g. <B>Standard confirmation</B>) and tap <B>Preview</B> to see exactly what they get.
                </>,
                <>
                  Tap <B>Accept & block</B>.
                </>,
              ]}
            />
            <div className="mt-6 rounded-2xl border border-[#2f9e6f]/40 bg-[#2f9e6f]/10 px-4 py-3 text-sm">
              <B>What happens:</B> the time is blocked on the website, the event appears in your Google Calendar, and the client gets the confirmation with an “Add to my calendar” file.
            </div>
          </Chapter>

          <Chapter id="decline" n={5} title="Decline kindly" lead="Say no without writing an email yourself." aside={<Shot src="decline" alt="Decline with a reason" />}>
            <Steps
              items={[
                <>
                  Tap <B>Decline…</B>
                </>,
                <>
                  Pick the reason — <B>Already booked</B> (adds a “See free dates” button), <B>Too far</B>, <B>Not the right fit</B> — or <B>Don&apos;t email</B> for spam.
                </>,
                <>
                  <B>Preview the email</B> if you like, then <B>Decline</B>.
                </>,
              ]}
            />
            <p className="mt-6 text-sm text-ink-soft">The email goes out in the client&apos;s language (English or German).</p>
          </Chapter>

          <Chapter
            id="calendar"
            n={6}
            title="Calendar"
            lead="All bookings by month, week or as a list."
            aside={
              <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
                <Shot src="calendar-month" alt="Month view" />
                <div className="hidden sm:block sm:w-44">
                  <Shot phone src="phone-calendar" alt="Month view on a phone" />
                </div>
              </div>
            }
          >
            <ul className="grid gap-3">
              <li>
                <B>Month</B> — solid = booked, dashed = request (not booked yet). On the phone you see dots; tap a day to see what&apos;s on it.
              </li>
              <li>
                <B>Week</B> — a time grid from 06:00 to 02:00, so you see the gaps between jobs.
              </li>
              <li>
                <B>List</B> — everything coming up, soonest first. Turn on <B>Past</B> to see old jobs.
              </li>
              <li>
                Use <B>Requests</B> and <B>All types</B> to filter. Tap any booking to open it.
              </li>
            </ul>
          </Chapter>

          <Chapter id="notes" n={7} title="Booking page, notes & history" lead="One page per booking: contact, times, details, actions — and a timeline." aside={<Shot src="booking" alt="Booking page with notes and history" />}>
            <ul className="grid gap-3">
              <li>
                <B>Call, WhatsApp, Email, Route</B> — one tap.
              </li>
              <li>
                <B>Add note</B> (top of the page) — write as many as you like (deposit paid, second shooter, best man&apos;s number…). Only you see them; they&apos;re copied into your Google Calendar event. Deleted one by mistake? Tap <B>Undo</B>.
              </li>
              <li>
                <B>History</B> fills itself: request received, accepted, emails sent, added to Google Calendar, cancelled.
              </li>
              <li>
                <B>Send email</B> — send a ready text, e.g. <B>Deposit reminder</B> or <B>Gallery is ready</B>.
              </li>
              <li>
                <B>Cancel booking</B> frees the time on the website and removes it from your Google Calendar. <B>Restore</B> puts it back. <B>Delete booking…</B> (at the very bottom) removes it for good.
              </li>
            </ul>
          </Chapter>

          <Chapter id="add" n={8} title="Add a booking by hand" lead="Someone booked by phone or WhatsApp? Put it in so the website blocks that time." aside={<Shot src="add" alt="New booking form" />}>
            <Steps
              items={[
                <>
                  Tap <B>+ New booking</B> (or the orange <B>+</B> on the phone).
                </>,
                <>Name, first and last day, times (leave empty for whole days), type, venue.</>,
                <>If it overlaps something you already have, you&apos;ll see what — then decide: change the times or <B>Book anyway</B>.</>,
                <>
                  <B>Add booking</B> — it&apos;s confirmed straight away. No email goes to the client.
                </>,
              ]}
            />
          </Chapter>

          <Chapter id="reviews" n={9} title="Ask for a review" lead="Real reviews from real clients — shown on the website after you approve them." aside={<Shot src="reviews" alt="Reviews" />}>
            <Steps
              items={[
                <>Pick the booking → copy the personal link, show the QR code, or share it.</>,
                <>The client writes the review; it waits in Reviews.</>,
                <>
                  <B>Publish</B> it to show it on the website — or reject it with a reason.
                </>,
              ]}
            />
          </Chapter>

          {/* ───────── Part 2: the website ───────── */}
          <section id="website" className="scroll-mt-24 my-4 rounded-3xl border border-sand/60 bg-sand/10 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">Part 2</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-5xl">The website — in the Studio</h2>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Every word and photo on somdattsharma.com is changed in the Studio. You can&apos;t break the design: you change the content, the layout stays the same.
            </p>
            <Link href="/studio" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:brightness-110">
              Open the Studio ↗
            </Link>
          </section>

          <Chapter
            id="studio"
            n={10}
            title="Open the Studio"
            lead="Where the website's words, photos, prices and emails live."
            aside={
              <div className="grid gap-4">
                <Shot src="studio-start" alt="Studio sidebar with Home opened" />
                <Shot src="studio-settings" alt="Site settings: email, phone, social links" />
              </div>
            }
          >
            <Steps
              items={[
                <>
                  Open <B>somdattsharma.com/studio</B> (or <B>More → Studio</B> in this app) and sign in with your Sanity account (Google).
                </>,
                <>Pick what you want to change on the left:</>,
              ]}
            />
            <dl className="mt-4 grid gap-3 rounded-2xl bg-sand/20 p-4 text-sm">
              {[
                ["Home", "Main frame (big photos + headline), Selected work, What I do, Short about, What clients say, Get in touch."],
                ["Work", "The Work page text, the category chips, and one folder per category with its projects."],
                ["Services", "The Services page (bundles, booking steps, FAQ, VAT) and each service box."],
                ["About", "Your story, portrait, numbers, clients, behind-the-lens photos."],
                ["Reviews", "The same reviews you see in this app."],
                ["Site settings", "Email, phone, WhatsApp, Instagram / LinkedIn, footer text, font."],
                ["Bookings", "The booking form and the emails clients get (chapter 15). The bookings themselves are easier here in the desk."],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-0.5 sm:grid-cols-[7.5rem_1fr] sm:gap-3">
                  <dt className="font-semibold text-ink">{k}</dt>
                  <dd className="text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
          </Chapter>

          <Chapter
            id="publish"
            n={11}
            title="Change something & publish"
            lead="Edit on the left, watch the page change on the right, then Publish."
            aside={<Shot src="studio-edit" alt="Short about: the form on the left, the live page on the right" />}
          >
            <Steps
              items={[
                <>
                  Open the part you want, e.g. <B>Home → Short about</B>. The form is on the left, the live page on the right. Don&apos;t see the page? Click the split icon <B>⧉</B> at the top. <B>Mobile</B> above it shows
                  the phone version.
                </>,
                <>
                  Type in <B>English</B>. The <B>German</B> fills itself a moment later (<B>✓ German auto-translated</B>). Want different German? Just type it — your version is kept until the English changes.
                </>,
                <>
                  Everything saves by itself as a <B>Draft</B>. Nobody sees a draft yet — only you, in the preview.
                </>,
                <>
                  Happy with it? Click <B>Publish</B> (bottom right). The website shows it within about a minute.
                </>,
              ]}
            />
            <div className="mt-6 rounded-2xl border border-sand/60 px-4 py-3 text-sm text-ink-soft">
              <B>Changed your mind?</B> Before publishing: <B>⋯</B> next to Publish → <B>Discard changes</B>. After publishing: <B>⋯</B> at the top of the document → <B>History</B> → pick the older version →{" "}
              <B>Restore</B>.
            </div>
          </Chapter>

          <Chapter
            id="photos"
            n={12}
            title="Photos: upload & focus"
            lead="The website crops each photo differently on phones and big screens. Tell it what must always stay in view."
            aside={<Shot src="studio-hotspot" alt="Edit hotspot and crop: the circle marks what stays visible" />}
          >
            <Steps
              items={[
                <>
                  Drag a photo onto the photo box, or click <B>Upload</B> (or <B>Select</B> to reuse one you uploaded before).
                </>,
                <>
                  Click the <B>crop icon</B> on the photo → <B>Edit hotspot and crop</B>.
                </>,
                <>
                  Drag the <B>circle</B> onto the face or the important part — it always stays visible. Drag the <B>corners</B> to cut edges off for good. The small previews underneath show phone and
                  wide crops.
                </>,
                <>
                  Close the box, check the preview, <B>Publish</B>.
                </>,
              ]}
            />
            <p className="mt-6 text-sm text-ink-soft">Big files are fine — the website makes small, fast versions by itself. Best: JPG, 2000–4000 px on the long side.</p>
          </Chapter>

          <Chapter
            id="projects"
            n={13}
            title="Add a project & photos"
            lead="A project is one shoot: a cover, a short story and its gallery."
            aside={<Shot src="studio-project" alt="A project's Photos tab with the gallery grid" />}
          >
            <Steps
              items={[
                <>
                  <B>Work →</B> the category (e.g. <B>Events</B>) <B>→ Projects →</B> the <B>+</B> button.
                </>,
                <>
                  <B>Basics:</B> title, cover photo (mark the face with the circle), short description, date, place.
                </>,
                <>
                  <B>Story</B> (optional): headline, the story, quick facts (Venue, Guests…), what made it unique.
                </>,
                <>
                  <B>Photos:</B> drag many photos at once onto the box. Drag to reorder. Click a photo to tick <B>Show on Home</B> (Selected work on the Home page) or <B>Show in Work → Recent frames</B>.
                </>,
                <>
                  <B>Videos</B> (optional): a YouTube / Vimeo / Instagram link or an MP4. Tick <B>Vertical reel</B> for 9:16.
                </>,
                <>
                  <B>Publish.</B>
                </>,
              ]}
            />
            <p className="mt-6 text-sm text-ink-soft">
              New kind of work? <B>Work → Categories (chips)</B> → <B>+</B>. It gets its own chip on the Work page and its own folder here.
            </p>
          </Chapter>

          <Chapter
            id="services"
            n={14}
            title="Services, prices & VAT"
            lead="The service boxes on Home and the Services page come from the same place."
            aside={<Shot src="studio-service" alt="A service: title in English and German, with the Services page preview" />}
          >
            <ul className="grid gap-3">
              <li>
                <B>Services → a service</B> — title, short description (the Home box), intro, photo (or a short looping clip), What&apos;s included, You get, Delivery time and <B>Price</B> (e.g. “From €890”;
                empty shows “On request · quote in 24 h”). <B>Show on Home</B> puts the box on the Home page.
              </li>
              <li>
                <B>Services → Services page</B> — the header, bundles (packages), booking steps and FAQ.
              </li>
              <li>
                <B>VAT</B> (on the Services page) — pick <B>Prices include 19 % VAT</B> or <B>Small business — no VAT charged (§19 UStG)</B>. The line shows under the prices on Home and Services. Not sure
                which applies? Ask your tax adviser.
              </li>
              <li>
                <B>Home → What I do</B> — only the heading and the link; the boxes are the services above.
              </li>
            </ul>
          </Chapter>

          <Chapter
            id="emails"
            n={15}
            title="Booking form & emails"
            lead="All words are yours to change — the design stays the same."
            aside={<Shot src="studio-emails" alt="Booking settings: the Accept emails tab with its templates" />}
          >
            <Steps
              items={[
                <>
                  Open the{" "}
                  <Link href="/studio/structure/bookings" className="font-semibold text-accent underline underline-offset-4">
                    Studio → Bookings → Booking settings
                  </Link>
                  .
                </>,
                <>
                  Tabs: <B>Contact form</B> (event types, services, extra questions), <B>Auto reply</B>, <B>Accept emails</B>, <B>Decline emails</B>, <B>Other emails</B>.
                </>,
                <>
                  Click a template: edit the text — a <B>live preview</B> sits right under it (EN / DE, light / dark).
                </>,
                <>
                  Write <B>{"{name}"}</B>, <B>{"{dates}"}</B> or <B>{"{type}"}</B> anywhere — they&apos;re filled in for each client. German translates itself.
                </>,
                <>
                  <B>Add item</B> makes a new template. When you&apos;re done, press <B>Publish</B>.
                </>,
              ]}
            />
          </Chapter>

          <section id="faq" className="scroll-mt-24 border-t border-sand/60 py-12 md:py-16">
            <p className="font-display text-sm font-extrabold tracking-[0.2em] text-accent">16</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Questions</h2>
            <dl className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
              {[
                ["Does the client ever see my notes?", "No. Notes stay here and in your own Google Calendar event. Emails never include them."],
                ["Do my personal Google Calendar events show on the website?", "No. The website only adds and removes its own bookings in your calendar — it never reads your other events."],
                ["I accepted by mistake.", "Open the booking → Cancel booking. The time is free again and the calendar event is removed. Then write to the client."],
                ["Where do client replies go?", "To your normal inbox (somdattaatre@gmail.com). Emails to booking@ or hello@somdattsharma.com are forwarded there too."],
                ["The travel time says “unknown”.", "The venue was too vague to find. Tap Route by car ↗ to check it in Google Maps."],
                ["Can two people use it?", "Yes — anyone with the admin password. Sign out on shared devices."],
                ["I changed something in the Studio, but the website didn’t change.", "Did you press Publish? Then wait about a minute and reload the page."],
                ["The German translation is wrong.", "Type the right German into the Deutsch box. Your version is kept until you change the English again."],
                ["It says “Auto-translation is switched off”.", "Then type the German yourself — everything else works as normal."],
                ["I deleted or changed something by mistake.", "Not published yet: ⋯ next to Publish → Discard changes. Already published: ⋯ at the top of the document → History → pick the older version → Restore."],
                ["Can I break the design?", "No. The Studio changes words and photos — the layout, fonts and colours stay the same."],
                ["Where do I change my phone, email or Instagram?", "Studio → Site settings. It updates the footer and the contact page."],
              ].map(([q, a]) => (
                <div key={q}>
                  <dt className="font-semibold">{q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
