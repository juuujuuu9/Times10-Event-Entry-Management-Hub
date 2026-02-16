# QR Check-In

Event RSVP and check-in app: guests RSVP and receive a QR code; staff scan codes to check people in. **One repo**, **one deploy** (Vercel) — Astro for pages and API routes, no separate backend or CORS.

## Requirements

- **Node 20+**
- PostgreSQL (e.g. [Neon](https://neon.tech))
- [Resend](https://resend.com) account for optional QR email delivery

## Quick Start

1. **Copy env** and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`: `DATABASE_URL`, `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME`.

2. **Create the database table** (one-time):
   ```bash
   npm run setup-db
   ```
   Uses `DATABASE_URL` from `.env`. Idempotent; re-running drops and recreates the `attendees` table.

3. **Run locally**:
   ```bash
   npm run dev
   ```
   Open http://localhost:4321 (or the port in `PORT`).

4. **Deploy**: See [Deploy to Vercel](#deploy-to-vercel) below.

## Flow

1. **RSVP** — Guest submits form → attendee stored in DB → QR code generated and shown (and optionally emailed via Resend).
2. **Check-in** — Staff scans QR (camera or standalone `/scanner` page) → attendee marked checked-in.
3. **Admin** — List attendees, search, delete, export CSV, resend QR emails.

## Tech Stack

| Layer          | Choice                          |
|----------------|----------------------------------|
| Framework      | Astro 5 (pages + API routes)     |
| Styling        | Tailwind CSS 4                   |
| Interactivity  | React 19 (islands)               |
| QR generation  | `qrcode`                         |
| QR scanning    | `html5-qrcode`                   |
| Database       | Neon Postgres (`@neondatabase/serverless`) |
| Email          | Resend                           |
| UI primitives  | Radix UI, Lucide icons, Sonner toasts |

## Development & roadmap

The **dev checklist and progress** live in **[docs/MASTER-PLAN.md](docs/MASTER-PLAN.md)**. Use it to track what’s done and what’s next; update it when you complete items. It’s the single reference for the roadmap and for later documentation.

## Project Structure

```
src/
  components/     # React: AppShell, RSVPForm, CheckInScanner, AdminDashboard + ui/
  layouts/        # Layout.astro
  lib/            # db, email, utils
  pages/          # index.astro, scanner.astro, api/*.ts
  services/       # api.ts (client API helpers)
  styles/         # global.css
  types/          # attendee.ts
  config/         # qr.ts
scripts/
  setup-tables.mjs   # One-time DB table creation
```

## Environment Variables

| Variable         | Required | Description |
|------------------|----------|-------------|
| `DATABASE_URL`   | Yes      | PostgreSQL connection string (e.g. Neon) |
| `RESEND_API_KEY` | Yes      | Resend API key |
| `FROM_EMAIL`     | Yes      | Sender address (e.g. `onboarding@resend.dev` for testing) |
| `FROM_NAME`      | Yes      | Sender display name |
| `PORT`           | No       | Dev server port (default `4321`) |

No `VITE_API_URL` or CORS — frontend and API are same-origin.

## Scripts

| Command           | Action |
|-------------------|--------|
| `npm run dev`     | Start dev server |
| `npm run build`   | Production build |
| `npm run preview` | Preview production build locally |
| `npm run setup-db`| Create/reset `attendees` table (reads `.env`) |

## Routes

| Path              | Purpose |
|-------------------|--------|
| `/`               | Main app (RSVP, Check-in, Admin tabs) |
| `/scanner`        | Standalone check-in scanner |
| `GET/POST /api/attendees` | List and create attendees |
| `DELETE /api/attendees?id=...` | Delete attendee |
| `POST /api/checkin`       | Mark attendee checked-in (body: `{ id }`) |
| `GET/POST /api/send-email`| Send/resend QR email to attendee |

## Deploy to Vercel

1. **Connect the repo** in [Vercel](https://vercel.com): New Project → Import this repo. Astro and `vercel.json` are auto-detected.

2. **Set environment variables** in the project (Settings → Environment Variables). Add: `DATABASE_URL`, `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME`.

3. **Create the table** (one-time). After first deploy, run against your production DB:
   ```bash
   DATABASE_URL="your-production-url" npm run setup-db
   ```

4. **Deploy** via push or from the Vercel dashboard. Node 20+, `vercel.json`, and `.vercelignore` are already set.
