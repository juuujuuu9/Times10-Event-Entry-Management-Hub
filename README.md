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

4. **Deploy to Vercel**: Connect repo, add env vars, deploy.

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

## Routes

- `/` — Main app (RSVP, Check-in, Admin tabs)
- `/scanner` — Standalone check-in scanner page
- `/api/attendees` — GET/POST/DELETE
- `/api/checkin` — POST
- `/api/send-email` — GET/POST
