# The site analyser

This small service is what makes the one-click check work: an owner types their web address and
gets a score without filling in anything.

## Why it needs to exist

Two things a browser cannot do on its own:

1. **Fetch someone else's website.** Cross-origin rules block it. The page can only read a site
   the owner pastes in by hand.
2. **Look up a Google Business Profile.** The Places API needs a key, and a key shipped in
   browser JavaScript is a public, billable key that anyone can drain.

Both have to happen server-side, so this endpoint does exactly those two things and nothing else.

**The playbook works without it.** With no analyser configured, the checker falls back to the
paste-your-page-source flow, which runs the identical page and schema checks. The only thing you
lose is fetching the site for the owner and the Google Business Profile half of the score.

## What it does

`POST /` with `{"url": "example.com"}` returns:

```json
{
  "ok": true,
  "finalUrl": "https://example.com/",
  "identity": { "name": "…", "address": "…", "phone": "…", "domain": "example.com" },
  "html": "<!doctype html>…",
  "gmb": { "displayName": {…}, "rating": 4.6, "userRatingCount": 512, … },
  "gmbConfigured": true,
  "gmbMatchedOn": "domain"
}
```

The browser does all the scoring. This service only gathers.

## Deploy it

### Cloudflare Workers (recommended — free tier is plenty)

```bash
cd api
npx wrangler deploy
npx wrangler secret put GOOGLE_PLACES_API_KEY     # paste the key when prompted
```

Then set the URL it prints in `assets/js/config.js`:

```js
window.DINELINE_CONFIG = {
  apiBase: 'https://dineline-site-checker.yourname.workers.dev',
  …
};
```

### Vercel

Copy `core.js` and `vercel.js` into your project (e.g. `app/api/analyze/route.js`), set
`GOOGLE_PLACES_API_KEY` in the project's environment variables, and point `apiBase` at
`https://yourproject.vercel.app/api/analyze`.

### Netlify

Copy `core.js` and `netlify.js` into `netlify/edge-functions/`, set `GOOGLE_PLACES_API_KEY` in the
site environment, and point `apiBase` at `https://yoursite.netlify.app/api/analyze`.

## The Google Places API key

1. Create a project in the [Google Cloud console](https://console.cloud.google.com/).
2. Enable **Places API (New)** — not the legacy Places API; the field names differ.
3. Create an API key and **restrict it**: API restriction to Places API only, and an application
   restriction if your platform gives the function a stable egress IP.
4. Store it as a secret in your host. Never put it in `config.js` or anywhere the browser sees.

Billing: the analyser makes one Text Search call per check, against the SKU that includes
Place Details fields. Google's monthly free allowance covers a low volume comfortably; set a
budget alert and a quota cap before you promote the tool anywhere.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_PLACES_API_KEY` | No | Turns on the Google Business Profile half of the check. Without it the service still returns the page, and the UI scores the website only. |
| `ALLOWED_ORIGIN` | No | Locks CORS to your own domain. Defaults to `*`. Set it once the endpoint is public. |

## Safety notes

The endpoint takes a URL from the public and fetches it, so it is an SSRF surface by nature.
`core.js` guards against the obvious abuse:

- only `http` and `https`
- localhost, `.local`, `.internal`, the cloud metadata host and every private IPv4/IPv6 range are
  rejected — **on every redirect hop**, not just the first
- redirects followed manually, capped at 4
- 12-second timeout per fetch
- response body capped at 2MB
- non-HTML content types rejected

Two things worth adding before you put this behind a public marketing page:

- **Rate limiting.** Cloudflare Workers can do this with a binding; on other hosts put it behind
  the platform's rate limiter. Without it, someone can use your key as a free crawler.
- **DNS rebinding.** The host checks are string-based. A determined attacker can point a public
  hostname at a private address between your check and your fetch. If that matters for the network
  the function runs in, resolve the hostname yourself and validate the resulting IP, or run the
  worker somewhere with no private network worth reaching — which is the usual reason Workers is
  the easy answer here.
