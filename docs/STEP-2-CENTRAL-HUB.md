# Step 2: Central Hub (Multi-Event)

This doc describes the **Central Hub** architecture: one app and database to manage multiple events and optional landing-page (microsite) integrations.

**Master plan:** [docs/MASTER-PLAN.md](MASTER-PLAN.md) — Central Hub = item 3 there.

---

## Architecture

```
Landing Page (Microsite)  ----webhook---->  Central Hub (this project)  <----  Scanner App
         |                                            |
         |                                    Central DB
         |                                    - events
         |                                    - attendees (event-scoped)
         +------------------------------------  (entries from microsites)
```

- **Events** are first-class; each attendee belongs to one event.
- **QR payload (v2):** `eventId:entryId:token` — no PII; event-scoped check-in.
- **Webhook:** Microsites POST to `POST /api/webhooks/entry` with `eventSlug`, `micrositeEntryId`, `name`, `email`, etc.; hub creates attendee and optionally generates QR and sends email.
- **Default event:** In-app RSVP and legacy (v1) QRs use the event identified by `DEFAULT_EVENT_SLUG` (e.g. `default`). No `DEFAULT_EVENT_ID` to avoid circular config.

---

## Schema summary

- **events:** `id` (UUID), `name`, `slug` (UNIQUE), `microsite_url`, `settings` (JSONB: e.g. `qr_enabled`, `qr_send_email`, optional `webhook_secret` for per-event keys), `created_at`.
- **attendees:** Existing columns plus `event_id` (FK to events), `microsite_entry_id`, `source_data` (JSONB), `created_at`. Unique index on `(event_id, microsite_entry_id)` where `microsite_entry_id IS NOT NULL` for idempotency.

---

## Webhook

- **Route:** `POST /api/webhooks/entry`. Not protected by session; handler validates `Authorization: Bearer <key>`.
- **Option A (Phase 1):** Single key. Env: `MICROSITE_WEBHOOK_KEY`. Body includes `eventSlug`; hub looks up event by slug.
- **Option B (Phase 2):** Per-event keys. Either env `MICROSITE_KEYS` (slug → key) or `events.settings.webhook_secret`. Handler tries global key first, then event’s `settings.webhook_secret`; event is determined by key (ignore or verify `eventSlug` in body). Prevents one microsite from writing to another’s event.

**Idempotency:** If `event_id` + `microsite_entry_id` already exist, return existing entry; if `generateQR` and current token is expired, refresh token and return `refreshed: true`.

---

## Default event and v1 QR

- **Default event:** Resolved by `DEFAULT_EVENT_SLUG` (e.g. `default`). Cached in memory (e.g. 1h) to avoid repeated DB lookups. Used for in-app RSVP (no `eventId` in body) and for decoding v1-legacy QR (two-part `entryId:token`).
- **v1-legacy QR:** During transition, check-in accepts two-part payload; `decodeQR` resolves event via `getDefaultEventId()` and logs legacy usage so you can drop v1 when safe.

---

## Retroactive import (Phase 2)

For existing landing pages that don’t use the webhook:

1. Export CSV from the microsite (name, email, created_at, etc.).
2. Admin: select event → Upload CSV.
3. System creates attendee rows with `source_data = { imported: true, originalCreatedAt: ... }`; optionally generate QRs and send emails.
4. Deduplication: match on email within event; show preview before import.

---

## Quick start

```bash
echo "MICROSITE_WEBHOOK_KEY=$(openssl rand -hex 32)" >> .env
echo "DEFAULT_EVENT_SLUG=default" >> .env
node scripts/migrate-events.mjs --dry-run
node scripts/migrate-events.mjs
npm run dev
```
