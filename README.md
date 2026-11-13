# Somdatt Sharma — portfolio (Next.js)

## Local

```bash
npm install
cp .env.example .env.local
# Edit .env.local — never commit it.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub

```bash
cd site   # this folder is the repo root
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Deploy (Vercel — free hobby tier)

1. Push this repo to GitHub (root of the repo = this `site` folder, or set **Root Directory** to `site` if the repo is the parent folder).
2. [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo.
3. **Environment variables** (Production + Preview): every key in `.env.example` — Sanity, admin, Resend, Google Calendar, OpenRouteService (CallMeBot optional).
4. Deploy, then **Settings → Domains** → add `somdattsharma.com` / `www` and update DNS at your registrar (replace any “website builder” A record with Vercel’s records).

Bookings: the form on `/contact` creates a private request in Sanity; Somdatt answers it in `/admin` (installable as an app — see `/admin/guide`). Website content is edited in `/studio`.
