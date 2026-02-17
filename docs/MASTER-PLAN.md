# Master Plan — Dev Checklist & Roadmap

**Purpose:** Single source of truth for development progress. Use as the dev checklist; update when completing work; reference from other docs. Feeds into later documentation.

**Last updated:** 2026-02-16 (CSV import as primary microsite sync)

---

## How to use this doc

- **Dev checklist:** Work through the [Implementation order](#implementation-order) below; check off items as done.
- **Progress:** When you complete an item, update its checkbox and the "Last updated" date at the top. Add a short "Done" note (e.g. PR or key files) if helpful.
- **References:** Other docs (e.g. [STEP-1-QR-SECURITY-PLAN.md](STEP-1-QR-SECURITY-PLAN.md)) implement specific items; this plan stays high-level and points to them.
- **Docs later:** This file can be used as the basis for release notes, onboarding, or public roadmap.

---

## Concern audit (current vs target)

| Concern | Status | Notes |
|--------|--------|-------|
| RSVP in DB | Done | `scripts/setup-tables.mjs`, `src/lib/db.ts` |
| Unique identifier | **Done** | UUID + short-lived token; see STEP-1. |
| QR gen + email | Done | `src/lib/email.ts`, RSVPForm |
| Scanner + validation | Done | CheckInScanner, `api/checkin` with 409 for duplicate |
| PII in QR | **Done** | QR is `id:qr_token` only; no email in payload. |
| Google login (staff / admin) | **Done** | Option B: middleware, auth-astro, /admin, /scanner, /login; STAFF_EMAILS/ADMIN_EMAILS allowlist. |
| Manual override (search by name) | Missing | Scanner has no "check in by name". |
| Traffic light UI (Green/Yellow/Red) | Partial | Green/red only; 409 not styled as yellow. |
| Audio / haptic feedback | Missing | No vibrate or beep on success. |
| Target overlay / distance hint | Partial | qrbox exists; no "6–10 inches" staff hint. |
| Flashlight / torch | Partial | `showTorchButtonIfSupported: true`; verify on device. |
| Hardware scanner (keyboard wedge) | Missing | No hidden input for laser scanners. |
| Stolen screenshot / scan count | Missing | No "duplicate use" visibility in admin/scanner. |
| Brightness / high-contrast QR | Partial | Email copy exists; QR config not explicit. |
| Offline capability | Missing | No cache/sync for scanner. |
| Multi-event / central hub | **Done** | Events table, event-scoped attendees; microsite sync = CSV import (primary); webhook optional. |
| Add to Wallet / Group / Capacity / Analytics | Not implemented | Optional; prioritize later. |

---

## Implementation order

Follow this order; check off and date as you complete each item.

### 1. UUID + no PII in QR — security and reliability

- [x] **Done.** UUID for attendee `id`; QR payload is `id:qr_token` only; rate limit + audit on check-in. See [STEP-1-QR-SECURITY-PLAN.md](STEP-1-QR-SECURITY-PLAN.md). Run `npm run migrate-qr` if you have existing data.

### 2. Google login (auth-astro) — staff-only Admin

- [x] **Done.** Option B: dedicated `/admin`, `/scanner`, `/login`; middleware protects routes and APIs; auth-astro + Google; role from env allowlist (STAFF_EMAILS, ADMIN_EMAILS, STAFF_DOMAINS). RSVP stays public on `/`. Env: `AUTH_SECRET`, `AUTH_TRUST_HOST`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Graceful handling when auth misconfigured (getSessionSafe in middleware; login page shows config hint).

### 3. Central Hub (multi-event)

- [x] **Done.** Schema: `events` table, `attendees` extended with `event_id`, `microsite_entry_id`, `source_data`; migration `npm run migrate-events` (with `--dry-run`); default event backfill.
- [x] **Done.** QR format: `eventId:entryId:token` (v2); encode/decode in `src/lib/qr.ts`; v1-legacy (2 parts) supported during transition.
- [x] **Done.** Webhook: `POST /api/webhooks/entry` with `MICROSITE_WEBHOOK_KEY`; idempotency by `event_id` + `microsite_entry_id`; optional QR refresh. Option B (per-event keys) doc’d in STEP-2.
- [x] **Done.** Admin: event selector, filter attendees/stats by event; `GET /api/events`, `GET /api/attendees?eventId=`; `/admin/events`, `/admin/events/new`.
- [x] **Done.** Scanner: event name shown in success result when present.
- [x] **Done.** CSV import: Admin → select event → Import CSV; map columns to attendees; dedupe by event+email; `source_data` for import metadata. See [STEP-2-CENTRAL-HUB.md](STEP-2-CENTRAL-HUB.md).

### 4. Manual check-in by name

- [ ] Add "Check in by name" (or "Manual check-in") on scanner page: search by name/email, call check-in API with attendee id. Reuse admin search or add `GET /api/attendees?q=...`.

### 5. Traffic light UI + audio/haptic + distance hint

- [ ] **Green** — success; **Yellow** — already checked in (409); **Red** — invalid/not found. Add vibrate + success beep; add "6–10 inches" hint for staff; verify torch visibility.

### 6. Hardware scanner (keyboard wedge)

- [ ] Hidden/minimal focused input on scanner page; on Enter, treat value as scanned code and call same check-in logic.

### 7. Stolen screenshot visibility

- [ ] Option A: Clear 409 copy ("If this is a new guest, ask for ID…"). Option B: `scan_attempt_count` (or similar) in DB; show "Duplicate scans: N" in admin and on scanner.

### 8. High-contrast QR + brightness copy

- [ ] Explicit black/white in QR config if needed; keep or strengthen email copy about brightness.

### 9. Offline capability

- [ ] Cache guest list (e.g. IndexedDB); offline check-in queue; sync when online; handle 409 as success.

### 10. Optional (later)

- [x] Protect admin API routes (attendees, send-email, checkin, refresh-qr) with session check — done in middleware.
- [ ] Capacity widget and/or no-show analytics.
- [ ] Add to Wallet, group check-in — if needed.

---

## Related docs

| Doc | Covers |
|-----|--------|
| [STEP-1-QR-SECURITY-PLAN.md](STEP-1-QR-SECURITY-PLAN.md) | Item 1: UUID, token-only QR, rate limit, audit, migration. |
| [STEP-2-CENTRAL-HUB.md](STEP-2-CENTRAL-HUB.md) | Item 3: Central hub, events, CSV import (primary), webhook optional. |
| (This implementation) | Item 2: auth-astro, middleware, login.astro, staff allowlist (src/lib/staff.ts). |

---

## Keeping this updated

1. When you **start** work on a checklist item: no change required (optional: add "In progress" in the item).
2. When you **complete** an item: set `[x]`, add a one-line "Done" note and key files/PR if useful, and update **Last updated** at the top.
3. If the **concern audit** table changes (new concern or status change): update the table and any new implementation row.
4. When adding **new docs** that implement an item: add them under [Related docs](#related-docs).
