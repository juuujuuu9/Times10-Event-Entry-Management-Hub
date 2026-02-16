# QR Check-In — One Repo (Astro + Tailwind + React)

Single-repo event RSVP & check-in app: Astro as the shell, Tailwind for styling, React for interactive UI. **One deploy** (Vercel), **no separate API server**, **no CORS** — frontend and API share the same origin.

## Quick Start

1. **Copy env** from your existing app (or `.env.example`):
   ```bash
   cp .env.example .env
   # Edit .env with DATABASE_URL, RESEND_API_KEY, FROM_EMAIL, FROM_NAME
   ```

2. **Setup database** (one-time):
   ```bash
   npm run setup-db
   ```

3. **Run locally**:
   ```bash
   npm run dev
   ```
   Open http://localhost:4321

4. **Deploy to Vercel**: See [Deploy to Vercel](#deploy-to-vercel) below.

## Flow

1. **RSVP** — Guests submit form; attendee created in DB; QR code generated.
2. **QR code** — Shown on screen and optionally emailed via Resend.
3. **Check-in** — Staff scans QR with camera; attendee marked checked-in.
4. **Admin** — List attendees, search, delete, export CSV, resend QR emails.

## Tech Stack

| Layer        | Choice              |
|-------------|----------------------|
| Framework   | Astro (pages + API routes) |
| Styling     | Tailwind CSS        |
| Interactivity | React (islands)   |
| QR generate | qrcode              |
| QR scan     | html5-qrcode        |
| DB          | Neon Postgres       |
| Email       | Resend              |

## Environment Variables

Same as your original app:

- `DATABASE_URL` — Neon (or Postgres) connection string
- `RESEND_API_KEY` — Resend API key
- `FROM_EMAIL` — Sender email (e.g. onboarding@resend.dev for testing)
- `FROM_NAME` — Sender name
- `PORT` — Optional (default 4321)

No `VITE_API_URL` or `CORS_ORIGIN` — everything is same-origin.

## Scripts

| Command       | Action                              |
|---------------|-------------------------------------|
| `npm run dev` | Start dev server (localhost:4321)   |
| `npm run build` | Build for production             |
| `npm run preview` | Preview production build        |
| `npm run setup-db` | Create attendees table (one-time) |

## Deploy to Vercel

1. **Connect the repo** in [Vercel](https://vercel.com): New Project → Import this Git repo. Vercel will detect Astro and use the existing `vercel.json` and `@astrojs/vercel` adapter.

2. **Set environment variables** in the project’s Vercel dashboard (Settings → Environment Variables). Add the same vars as in `.env.example`:
   - `DATABASE_URL` — Neon (or Postgres) connection string
   - `RESEND_API_KEY` — Resend API key
   - `FROM_EMAIL` — Sender email (e.g. `onboarding@resend.dev` for testing)
   - `FROM_NAME` — Sender name (e.g. `Event Check-In`)

3. **Create the database table** (one-time): After the first deploy, run the setup script against your production DB (e.g. from your machine with `DATABASE_URL` pointing at your Neon DB):
   ```bash
   DATABASE_URL="your-production-database-url" npm run setup-db
   ```

4. **Deploy**: Push to the connected branch or trigger a deploy from the Vercel dashboard.

The project is configured with Node 20+, `vercel.json`, and `.vercelignore`; no extra build settings are required.

## Routes

- `/` — Main app (RSVP, Check-in, Admin tabs)
- `/scanner` — Standalone check-in scanner page
- `/api/attendees` — GET/POST/DELETE
- `/api/checkin` — POST
- `/api/send-email` — GET/POST
