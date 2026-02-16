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

## 2. Production 403 and "Cross-site"... is not valid JSON

**Symptoms:** `POST .../api/auth/signin/google` returns **403 (Forbidden)**; client shows `SyntaxError: Unexpected token 'C', "Cross-site"... is not valid JSON`.

**Cause:** The auth server returns a non-JSON response (e.g. a CSRF or error page starting with "Cross-site..."), and the client expects JSON. This often happens when the app’s canonical URL is wrong in production (e.g. behind a proxy or wrong host).

**Fixes:**

1. **Set `AUTH_URL` in production**  
   In your production env (e.g. Vercel), set:
   ```bash
   AUTH_URL=https://qrsuite.times10.net
   ```
   Use your real production origin (no path, no trailing slash). This makes Auth.js use the correct origin for callbacks and CSRF.

2. **Keep `AUTH_TRUST_HOST=true`**  
   Already in `.env.example`; required when the host is inferred from `X-Forwarded-Host` (e.g. Vercel).

3. **Confirm redirect URI in Google**  
   Production 403 can also appear if the redirect URI is missing or wrong. Ensure **Authorized redirect URIs** includes:
   `https://qrsuite.times10.net/api/auth/callback/google`
   (see section 1).

After changing env vars, redeploy so the new `AUTH_URL` is used.
