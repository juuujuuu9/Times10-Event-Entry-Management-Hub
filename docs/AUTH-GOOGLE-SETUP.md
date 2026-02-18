# Google OAuth (auth-astro) setup and troubleshooting

## 1. redirect_uri_mismatch (local or production)

**Error:** `Error 400: redirect_uri_mismatch` — "This app doesn't comply with Google's OAuth 2.0 policy" / "Register the redirect URI in the Google Cloud Console."

**Cause:** The redirect URI your app sends is not in the OAuth client’s **Authorized redirect URIs** list.

**Fix:**

1. **Set `AUTH_URL` in production (Vercel):** `AUTH_URL=https://qrsuite.times10.net` — this project uses it to force the correct redirect_uri when Vercel infers the wrong URL (e.g. https://localhost).
2. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
3. Open your **OAuth 2.0 Client ID** (Web application).
4. Under **Authorized redirect URIs**, add **exactly**:
   - **Local:** `http://localhost:4321/api/auth/callback/google`
   - **Production:** `https://qrsuite.times10.net/api/auth/callback/google` (or your real production origin)
5. Save. Redeploy so `AUTH_URL` is picked up. Changes can take a few minutes to apply.

Use the same protocol, host, port, and path as your app (no trailing slash). Default dev port for this app is **4321**.

---

## 2. 403 and "Cross-site"... is not valid JSON (local or production)

**Symptoms:** `POST .../api/auth/signin/google` returns **403 (Forbidden)**; client shows `SyntaxError: Unexpected token 'C', "Cross-site"... is not valid JSON`.

**Cause:** Auth.js rejects the request (CSRF / origin check) and returns a plain-text error starting with "Cross-site...". The client expects JSON, so it throws. This happens when the app's canonical URL doesn't match the URL you're actually using (wrong host, port, or missing `AUTH_URL`).

**Fixes:**

1. **Set `AUTH_URL`**  
   Set it to the **exact** origin you use in the browser (no path, no trailing slash).
   - **Local:** `AUTH_URL=http://localhost:4321` (open the app at `http://localhost:4321`, not 127.0.0.1 or another port).
   - **Production:** `AUTH_URL=https://qrsuite.times10.net` (or your real domain).

2. **Keep `AUTH_TRUST_HOST=true`**  
   Required when the host is inferred from headers (e.g. behind Vercel).

3. **Confirm redirect URI in Google**  
   **Authorized redirect URIs** must include the same origin + path, e.g.  
   `http://localhost:4321/api/auth/callback/google` (local) or  
   `https://qrsuite.times10.net/api/auth/callback/google` (production).  
   See section 1.

4. **Vercel production only:** Astro's `security.checkOrigin` can block auth POSTs due to a serverless URL/origin mismatch. This project disables it in `astro.config.mjs`; Auth.js provides its own CSRF protection for OAuth.

Restart the dev server (or redeploy) after changing env vars.

---

## 3. Sign out redirects to localhost (production only)

**Symptoms:** Clicking "Sign out" redirects to `http://localhost:4321/api/auth/signout?callbackUrl=%2F` or the page hangs.

**Cause:** Auth.js infers the wrong base URL on Vercel (Astro.url.origin can be localhost in serverless).

**Fixes:**

1. **Set `AUTH_URL` in production (recommended):**  
   In Vercel → Project → Settings → Environment Variables, add `AUTH_URL=https://your-domain.com` (or `https://your-app.vercel.app` if no custom domain). Redeploy.

2. **Fallback:** This project also uses `VERCEL_URL` when `AUTH_URL` is not set (Vercel exposes it automatically). If you use a custom domain, prefer `AUTH_URL` so redirects go to your domain, not `*.vercel.app`.
