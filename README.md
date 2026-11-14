<p align="center">
  <a href="https://www.somdattsharma.com"><img src="docs/readme/banner.webp" alt="SOM·DATT — Photography & film, Hamburg. Portfolio, booking system and studio back-office in one Next.js app." width="100%"></a>
</p>

<p align="center">
  <a href="https://www.somdattsharma.com"><img alt="Live site" src="https://img.shields.io/badge/live-somdattsharma.com-E0683F?style=for-the-badge"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img alt="Sanity" src="https://img.shields.io/badge/Sanity-Studio-F03E2F?style=for-the-badge&logo=sanity&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-hosted-000000?style=for-the-badge&logo=vercel&logoColor=white">
</p>

<p align="center">
  <a href="#website"><b>Website</b></a> ·
  <a href="#bookings"><b>Bookings</b></a> ·
  <a href="#booking-desk"><b>Booking desk</b></a> ·
  <a href="#studio"><b>Studio</b></a> ·
  <a href="#architecture"><b>Architecture</b></a> ·
  <a href="#getting-started"><b>Getting started</b></a>
</p>

<br>

**Somdatt Sharma** is a photographer and filmmaker in Hamburg. This repository is his whole studio online. It includes a bilingual portfolio, a booking system clients use to request dates, a phone-friendly back-office for answering those requests, and a content studio where every word and photo can be changed without touching code.

<p align="center">
  <img src="docs/readme/showcase.webp" alt="The website on a laptop and a phone" width="100%">
</p>

## ✨ At a glance

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>🌐 Portfolio</h3>
      English & German, light & dark. Work by category, project stories with galleries and films, services with prices.
    </td>
    <td width="33%" valign="top">
      <h3>📅 Booking requests</h3>
      Clients pick a date range on a live availability calendar, then get emails in their language.
    </td>
    <td width="33%" valign="top">
      <h3>📱 Booking desk</h3>
      An installable app with a dashboard, requests, calendar, notes and history. Accept, decline or add bookings in a few taps.
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>✍️ Content studio</h3>
      Sanity Studio with live page preview and EN → DE auto-translation. Draft, then publish.
    </td>
    <td width="33%" valign="top">
      <h3>🗓️ Calendar & travel</h3>
      Accepted jobs land in Google Calendar (write-only). Car travel times between jobs come from OpenRouteService.
    </td>
    <td width="33%" valign="top">
      <h3>💬 WhatsApp</h3>
      A chat bubble on every page, plus an instant WhatsApp ping to the owner for each new request.
    </td>
  </tr>
</table>

---

<a id="website"></a>

## 🌐 The website

<p align="center">
  <img src="docs/readme/website.webp" alt="Home, Work, Project, Services, About and Contact on a phone" width="100%">
</p>

| Page | What's on it |
|---|---|
| **Home** | Full-bleed hero, recent-work spotlight, service cards with prices, About teaser with counters, clients, reviews |
| **Work** `/portfolio` | Categories (Weddings, Events, Commercial…), project cards, a justified gallery with lightbox, videos and reels |
| **Services** | What's included, delivery time, starting price, bundles, booking steps, FAQ, the German VAT note |
| **About** | Story, portrait, numbers, clients, behind-the-lens gallery, working process |
| **Contact** | The booking form: date range, rough times, event type, venue, services |
| **Reviews** `/review` | Clients write a review. Reviews from personal links are marked *Verified client*, and every review is approved first |

Also on the website: scroll-reveal motion that switches off under *reduced motion*, 44 px tap targets, no sideways scrolling on phones, self-hosted fonts, sitemap, robots.txt and Open Graph images.

---

<a id="bookings"></a>

## 📅 How a booking works

```mermaid
sequenceDiagram
  autonumber
  actor C as Client
  participant W as Website · /contact
  participant S as Sanity (private)
  participant M as Resend
  actor O as Somdatt · /admin
  participant G as Google Calendar
  C->>W: Picks dates + rough times, sends a request
  W->>S: Saves it as a private document
  W-->>M: "Request received" email (in the client's language)
  W-->>O: Email + WhatsApp ping
  O->>O: Checks fit, travel time and clashes
  alt Accept
    O->>S: Final schedule — one block, same hours daily, or per day
    O->>G: Adds the event (write-only)
    O-->>M: Confirmation with an .ics file
    M-->>C: "You're in my calendar!"
  else Decline
    O-->>M: Kind decline email (e.g. with "see free dates")
    M-->>C: Decline email
  end
```

**Booking status**

```mermaid
stateDiagram-v2
  direction LR
  [*] --> Request: form on /contact
  [*] --> Confirmed: added by hand
  Request --> Confirmed: Accept & block
  Request --> Declined: Decline
  Confirmed --> Cancelled: Cancel
  Cancelled --> Confirmed: Restore
```

- **Language:** emails go out in the language the client used on the site (EN / DE).
- **Days:** a booking day runs 06:00 → 06:00, so night jobs stay on one date. A request can cover up to 7 days.
- **Privacy:** requests are private Sanity documents, and notes are never emailed.
- **Spam:** the form has a honeypot field and a per-IP rate limit.

---

<a id="booking-desk"></a>

## 🗂️ The booking desk · `/admin`

<p align="center">
  <img src="docs/readme/admin.webp" alt="Booking desk dashboard on desktop with the accept sheet and a booking page on a phone" width="100%">
</p>

<p align="center">
  <img src="docs/readme/admin-phones.webp" alt="Dashboard, requests, accept sheet, calendar and booking page on a phone" width="100%">
</p>

- **Installable app (PWA):** an S·D icon on the home screen that opens full screen and stays signed in.
- **Dashboard:** new requests, the next shoot with a countdown and route link, and what needs attention.
- **Requests:** sort, search, and an automatic *fits / tight travel time / overlaps* check against confirmed jobs.
- **Accept:** set the final times as a single block, the same hours daily, or different times per day. Choose an email template, preview it, then confirm.
- **Calendar:** month, week time-grid and list views, with filters.
- **Booking page:** call, WhatsApp, email and route in one tap; private notes with a timeline; automatic history; ready-made emails (deposit reminder, gallery ready).
- **Reviews:** personal review links and QR codes, plus approve or reject.
- **Built-in guide:** an illustrated handbook for the booking desk and the Studio.

---

<a id="studio"></a>

## ✍️ Content studio & emails

<p align="center">
  <img src="docs/readme/studio.webp" alt="Sanity Studio with live preview, next to the confirmation email a client receives" width="100%">
</p>

- **Sanity Studio** is embedded at `/studio`, with a sidebar that mirrors the site: Home · Work · Services · About · Reviews · Site settings · Bookings.
- **Live preview** of the page sits next to the form, on desktop and phone.
- **EN → DE auto-translation** works on every field. German edited by hand is kept until the English changes.
- **Booking settings** hold the form (event types, services, extra questions) and every email template, each with a live email preview.
- **Emails** are table-based, work in dark mode, go out from `booking@` with replies going to the owner's inbox, and come with an `.ics` file for any calendar app.

---

<a id="architecture"></a>

## 🏗️ Architecture

<p align="center">
  <img src="docs/readme/architecture.webp" alt="Architecture: visitors and the owner use one Next.js app on Vercel, which talks to Sanity, Resend, Google Calendar, OpenRouteService, CallMeBot and the Vercel AI Gateway" width="100%">
</p>

| Service | Role | Without it |
|---|---|---|
| **Sanity** | Content, private bookings, image CDN, Studio | required |
| **Resend** | Client and owner emails | no emails are sent |
| **Google Calendar** | Accepted jobs are added to the owner's calendar | no calendar sync |
| **OpenRouteService** | Car travel time between jobs | the travel check shows "unknown" |
| **CallMeBot** | WhatsApp ping on new requests | email notification only |
| **Vercel AI Gateway** | Studio translation EN → DE | German is typed by hand |

Content changes go live within about a minute (ISR, 60 s) without a deploy.

### 📊 Codebase

```mermaid
%%{init: {"theme": "base", "themeVariables": {"pie1": "#E0683F", "pie2": "#F2A65A", "pie3": "#7AC36A", "pie4": "#4F8DF5", "pie5": "#B48CF2", "pieSectionTextColor": "#14110E", "pieSectionTextSize": "15px", "pieTitleTextColor": "#8B949E", "pieTitleTextSize": "18px", "pieLegendTextColor": "#8B949E", "pieLegendTextSize": "15px", "pieStrokeColor": "#00000000", "pieOuterStrokeColor": "#00000000", "pieOpacity": "1"}}}%%
pie showData
  title Lines of code by area (src/)
  "Website" : 5277
  "Admin app" : 4305
  "CMS & Studio" : 2440
  "Booking" : 1982
  "Shared & i18n" : 1921
```

<sub>125 TypeScript / CSS files · about 16k lines</sub>

---

## 🧰 Tech stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Actions, Turbopack) · React 19 · TypeScript |
| **Styling & motion** | Tailwind CSS 4 · Framer Motion · Lenis · self-hosted variable fonts |
| **Content** | Sanity (embedded Studio, `next-sanity`, draft mode / visual editing) |
| **Auth** | Auth.js (NextAuth v5): password login for the booking desk |
| **Email** | Resend |
| **Integrations** | Google Calendar API (service account) · OpenRouteService · CallMeBot |
| **AI** | AI SDK via Vercel AI Gateway |
| **Hosting** | Vercel, connected to this repo |

---

<a id="getting-started"></a>

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values — never commit this file
npm run dev
```

| URL | What |
|---|---|
| `http://localhost:3000` | Website |
| `http://localhost:3000/studio` | Content studio (Sanity login) |
| `http://localhost:3000/admin` | Booking desk (`ADMIN_PASSWORD`) |

<details>
<summary><b>Environment variables</b></summary>
<br>

Every key is explained in [`.env.example`](.env.example).

| Group | Keys |
|---|---|
| Sanity | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_WRITE_TOKEN` |
| Booking desk | `ADMIN_PASSWORD`, `AUTH_SECRET` |
| Email | `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO_EMAIL` (optional `BOOKING_FROM`, `SITE_URL`) |
| Google Calendar | `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` |
| Travel times | `ORS_API_KEY` |
| WhatsApp ping (optional) | `CALLMEBOT_API_KEY`, `CALLMEBOT_PHONE` |
| Translation (optional) | `AI_TRANSLATE_MODEL` (auth through Vercel OIDC) |

</details>

<details>
<summary><b>Project structure</b></summary>
<br>

```
src/
├── app/
│   ├── page.tsx              Home
│   ├── portfolio/            Work overview (categories)
│   ├── projects/[slug]/      Project pages
│   ├── services/ about/ contact/ review/
│   ├── impressum/ datenschutz/
│   ├── admin/                Booking desk (dashboard, requests, calendar, bookings, reviews, guide)
│   ├── studio/               Embedded Sanity Studio
│   ├── api/                  auth, booking .ics, draft mode, translate
│   └── fonts/                Self-hosted woff2 files
├── components/               UI by area: admin, booking, work, sections, about, services, reviews, layout
├── lib/                      Bookings, time model, emails, mailer, Google Calendar, travel times, reviews
├── sanity/                   Schemas, desk structure, queries, Studio components
└── i18n/                     EN / DE strings
public/
├── admin-guide/              Screenshots used in the in-app guide
└── admin-icons/              PWA icons
docs/readme/                  Images in this README
```

</details>

<details>
<summary><b>Scripts</b></summary>
<br>

| Command | |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

</details>

---

## 🚢 Deploy

The Vercel project is connected to this repository:

| Push to | Result |
|---|---|
| **`main`** | **Production** — [somdattsharma.com](https://www.somdattsharma.com) |
| any other branch | **Preview deployment** (private `*.vercel.app` URL) |

Environment variables live in Vercel (Production + Preview), with the same keys as `.env.example`.

---

## 🔐 Privacy & security

- Booking requests are **private Sanity documents**, readable only with the server token. They are never in the public dataset or on the CDN.
- Notes are **never** included in emails to clients.
- Google Calendar access is **write-only**: the site adds and removes its own events and never reads personal ones.
- The WhatsApp bubble is a plain link. No WhatsApp script is loaded on the site.
- Secrets live in `.env.local` and Vercel only. `.env*` files are git- and deploy-ignored.

---

<p align="center">
  <img src="public/admin-icons/icon-192.png" width="56" alt="S·D"><br>
  <sub>Design & development for <b>Somdatt Sharma</b> · Hamburg</sub><br>
  <sub>All photographs, videos and texts © Somdatt Sharma — all rights reserved, not for reuse.<br>
  Fonts: Hanken Grotesk, Bricolage Grotesque, Archivo, Fraunces (SIL Open Font License).</sub>
</p>
