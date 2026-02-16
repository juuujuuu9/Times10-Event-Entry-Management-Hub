# Step 1: QR Check-In Security — Implementation Plan

This document plans **Step 1** of the gap list: moving from weak, static QR identifiers to a production-ready model that addresses **guessability**, **replay**, and **shoulder-surfing**.

---

## Progress & next steps

**Status:** Phase 1 and Phase 2 are **implemented**.

- **If you have existing data:** Run `npm run migrate-qr` once to add token columns and backfill attendee `id` to UUIDs. After that, only QR codes in `id:qr_token` format work at check-in.
- **Fresh installs:** `npm run setup-db` already creates the new schema (UUID `id`, token columns).
- **Next steps (choose one or more):**
  - **Phase 3 (backlog):** Geolocation, anomaly detection, or encrypted QR payloads when you need them.
  - **Other gap list items:** Move on to the next step in your overall product/security roadmap (e.g. auth for admin, multi-event support).
  - **Optional hardening:** Add a `check_in_attempts` table and log there instead of (or in addition to) console; send `scannerDeviceId` from the scanner UI for better audit trails.

---

## Current State (Baseline — before Step 1)

| Area | Current implementation | Risk |
|------|------------------------|------|
| **ID generation** | `Math.random().toString(36).slice(2,15)` × 2 in `src/lib/db.ts` | Cryptographically weak, guessable |
| **QR payload** | `JSON.stringify({ id, email })` in AdminDashboard + RSVPForm | Encodes raw DB id; static forever |
| **Check-in API** | Parse JSON → lookup by id or email → `checkInAttendee(id)` in `src/pages/api/checkin.ts` | No token, no expiry, no replay protection |
| **Rate limiting** | None | Brute force / enumeration possible |
| **Audit** | None | No visibility into failed scans or replay attempts |

---

## Target Architecture — Option (b) Locked In

- **Single identifier:** `id` is the UUID (primary key). No separate `uuid` column. After migration, all attendee IDs are UUIDs (new and backfilled).
- **QR token:** Short-lived, single-use credential. Encoded in QR as `id:qr_token` (e.g. `550e8400-e29b-41d4-a716-446655440000:a3f7b2d8e9c1...`). Valid only until first use or expiry.
- **Schema:** Keep `id` as PK; add only `qr_token`, `qr_expires_at`, `qr_used_at`, `qr_used_by_device`. Legacy `JSON.stringify({ id, email })` format is **dropped** — check-in accepts only `id:token`.

---

## Phase 1 — Immediate (This Week)

**Goal:** Fix guessability and add basic hardening. After migration (Phase 2), all ids are UUIDs (new and backfilled).

### 1.1 Replace `Math.random()` with `crypto.randomUUID()`

- **Where:** `src/lib/db.ts` — `createAttendee()`.
- **Change:** Generate `id` with `crypto.randomUUID()` (Node 20+; no extra deps).
- **Note:** This makes `id` a UUID string. All existing code uses `id` as string PK; no type change. Existing rows keep current `id` values.

**Acceptance:** New attendees get UUID `id`; no `uuid` package; no new columns yet.

### 1.2 Add rate limiting on check-in

- **Where:** `src/pages/api/checkin.ts` (or a small middleware/helper used only by this route).
- **Rule:** Max 5 check-in attempts per IP per minute (configurable).
- **Implementation:** In-memory store is enough for a single instance (e.g. `Map<ip, { count, resetAt }>`). For multi-instance, use Redis or Vercel KV later; document as follow-up.
- **Response:** 429 with clear message when limit exceeded.

**Acceptance:** >5 requests/min from same IP → 429; success/failure both count.

### 1.3 Add audit logging for check-in attempts

- **Where:** `src/pages/api/checkin.ts` (and any shared helper).
- **Log:** Every scan attempt (success + failure) with: timestamp, IP (or `x-forwarded-for`), outcome (success / invalid_format / not_found / already_checked_in / rate_limited), and if success/conflict the attendee identifier (id or uuid, no PII in log if possible).
- **Storage:** Start with structured `console` (JSON lines) or a single `check_in_attempts` table; keep schema minimal (timestamp, ip, outcome, attendee_id/uuid nullable).

**Acceptance:** Every POST to check-in produces one log row; replay attempts visible as repeated same-identifier after success.

---

## Phase 2 — Short-Term (Next Sprint): Dynamic Tokens

**Goal:** QR encodes a short-lived, single-use credential. Prevents replay and limits shoulder-surfing window.

### 2.1 Schema migration (option b)

- **Where:** New migration script (e.g. `scripts/migrate-qr-security.mjs`) + `scripts/setup-tables.mjs` for fresh installs.
- **Add columns to `attendees`:** `qr_token`, `qr_expires_at`, `qr_used_at`, `qr_used_by_device` (all nullable). No `uuid` column.
- **Backfill `id` to UUID:** For each existing row, set `id = crypto.randomUUID()`. Run in a script that fetches all rows then updates each PK (no FKs reference `attendees`). Safest order: (1) add the four new columns, (2) then backfill `id` per row.

**Acceptance:** Migration runs without data loss; every attendee `id` is a UUID; token columns present.

### 2.2 QR payload format and generation

- **Format:** QR content = `id:qr_token` (attendee `id` is the UUID; no separate uuid column).
- **Token:** 16 bytes hex (e.g. `crypto.randomBytes(16).toString('hex')`); 128-bit entropy.
- **Generation:** Centralize in `src/lib/qr-token.ts`: `generateQRToken()`, and a function that returns `{ qrPayload, expiresAt }` given attendee `id` (writes new token/expiry to DB).
- **Consumers:** RSVPForm (after create), AdminDashboard (when loading “show QR”), and send-email flow use this so every displayed/sent QR gets a fresh token (e.g. 10–15 min). **Legacy JSON format is dropped** — check-in accepts only `id:token`.

**Acceptance:** New QRs contain `id:qr_token`; token and expiry stored in DB; same attendee gets new token each time they open “my QR” or get email.

### 2.3 Check-in validation logic

- **Where:** `src/pages/api/checkin.ts`.
- **Flow:** Accept **only** `id:token` (split on first `:`). No legacy JSON.
  1. Parse: `const [id, token] = qrData.split(':');` — if no `:` or missing parts → 400 “Invalid QR format”.
  2. Validate UUID format; if invalid → 400.
  3. Query attendee by `id` + `qr_token` where `qr_expires_at > NOW()` and `qr_used_at IS NULL`.
  4. If not found: check if that `id` has `qr_used_at` set → log as replay, return 409 “QR code already used”. Otherwise 401 “Invalid or expired QR code”.
  5. On success: atomic UPDATE set `qr_used_at = NOW()`, `qr_used_by_device = scannerDeviceId`, `checked_in = true`, `checked_in_at = NOW()`.
  6. Optional: if event allows re-entry, generate new token for next use.
- **Device id:** Request body may include `scannerDeviceId`; store in `qr_used_by_device` for audit.

**Acceptance:** Valid unexpired token checks in once; second use returns 409 and is logged; expired or invalid format returns 401/400.

### 2.4 QR refresh (attendee can regenerate)

- **Where:** New endpoint e.g. `POST /api/attendees/refresh-qr` with body `{ id }` (attendee UUID). Auth/proof TBD (e.g. same-session or magic link).
- **Action:** Generate new `qr_token`, set `qr_expires_at`; return `{ qrPayload, expiresAt }` so attendee can re-show or re-email.
- **Acceptance:** Caller can invalidate current QR and get a new payload without changing `id`.

---

## Phase 3 — Medium-Term (Backlog)

- **Geolocation:** Compare check-in location to expected venue (optional).
- **Anomaly detection:** Alerts on many failed scans or unusual patterns.
- **Encrypted QR payloads:** AES-encrypt `uuid:token` so only your scanners can decode (adds key management and scanner-side decryption).

---

## Implementation Order (Checklist)

### Phase 1 — Immediate (done)
- [x] **1.1** `src/lib/db.ts`: use `crypto.randomUUID()` for new attendee `id`.
- [x] **1.2** Rate limit: 5 attempts per IP per minute on `POST /api/checkin`; return 429 when exceeded.
- [x] **1.3** Audit log: every check-in attempt (success/failure) with timestamp, IP, outcome, identifier; structured console via `src/lib/audit.ts`.

### Phase 2 — Short-term option b (done)
- [x] **2.1** Migration: add `qr_token`, `qr_expires_at`, `qr_used_at`, `qr_used_by_device`; backfill existing `id` to UUID. Script: `scripts/migrate-qr-security.mjs` (`npm run migrate-qr`).
- [x] **2.2** `src/lib/qr-token.ts`: `generateQRToken()`, get/update attendee token and return `qrPayload` + `expiresAt`; wire RSVPForm, AdminDashboard, send-email; QR content = `id:qr_token`.
- [x] **2.3** `src/pages/api/checkin.ts`: only `id:token` parsing; UUID validation; atomic update; replay detection and logging.
- [x] **2.4** QR refresh endpoint: `POST /api/attendees/refresh-qr` with body `{ id }` returning `{ qrPayload, expiresAt }`.

### Phase 3 — Backlog (next)
- [ ] Document geolocation / anomaly / encryption as future work.

---

## Codebase Touchpoints (Quick Reference)

| Change | Files |
|--------|--------|
| UUID for new ids | `src/lib/db.ts` (createAttendee). After migration, `id` is UUID for all rows. |
| Rate limiting | `src/pages/api/checkin.ts` or `src/lib/rate-limit.ts` |
| Audit logging | `src/pages/api/checkin.ts`, optional `src/lib/audit.ts` |
| Schema / migration | `scripts/setup-tables.mjs`, `scripts/migrate-qr-security.mjs` |
| Token generation | `src/lib/qr-token.ts` |
| QR payload (`id:qr_token`) | `src/components/RSVPForm.tsx`, `src/components/AdminDashboard.tsx`, send-email flow |
| Check-in validation | `src/pages/api/checkin.ts` (only `id:token`; no legacy JSON) |
| Types | `src/types/attendee.ts` (optional qrExpiresAt, qrUsedAt, qrUsedByDevice for API/display) |

---

## Summary

- **Phase 1 (done):** UUID + rate limiting + audit logging — guessability fixed, visibility in place.
- **Phase 2 (done):** Dynamic, single-use tokens in QR + expiry + replay detection + refresh endpoint — shoulder-surfing and replay addressed.
- **Phase 3 (backlog):** Geolocation, anomaly detection, encrypted payloads — when you need stronger guarantees.

Step 1 of the gap list (“QR/check-in security”) is complete. Use the **Progress & next steps** section above for what to run and what to do next.
