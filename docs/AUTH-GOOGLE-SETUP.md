# Google OAuth (auth-astro) setup and troubleshooting

## 1. redirect_uri_mismatch (local or production)

**Error:** `Error 400: redirect_uri_mismatch` — "This app doesn't comply with Google's OAuth 2.0 policy" / "Register the redirect URI in the Google Cloud Console."

**Cause:** The redirect URI your app sends is not in the OAuth client’s **Authorized redirect URIs** list.

**Fix:**

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized redirect URIs**, add **exactly**:
   - **Local:** `http://localhost:4321/api/auth/callback/google`
   - **Production:** `https://qrsuite.times10.net/api/auth/callback/google` (or your real production origin)
4. Save. Changes can take a few minutes to apply.

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
