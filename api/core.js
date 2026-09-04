/* ==========================================================================
   Dineline site analyser — core handler
   Runtime-agnostic: takes a URL, returns everything the browser needs to
   score a restaurant. No dependencies, uses only fetch/URL/AbortController.

   Why this exists at all: a browser cannot fetch an arbitrary third-party
   site (CORS) and cannot call the Places API without exposing a billable
   key. Both have to happen server-side.

   Adapters live alongside this file — see api/README.md.
   ========================================================================== */

const MAX_BYTES = 2_000_000;      // stop reading a page after 2MB
const FETCH_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 4;

/* Hosts we refuse to fetch. Without this the endpoint is an open SSRF
   proxy into whatever private network it happens to run in. */
const BLOCKED_HOST = /^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i;
const BLOCKED_IP = new RegExp([
  '^127\\.', '^10\\.', '^169\\.254\\.', '^0\\.', '^255\\.',
  '^192\\.168\\.', '^172\\.(1[6-9]|2\\d|3[01])\\.',
  '^\\[?::1\\]?$', '^\\[?f[cd]', '^\\[?fe80'
].join('|'), 'i');

function normaliseUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) throw new HttpError(400, 'Enter your website address.');
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;

  let u;
  try { u = new URL(s); }
  catch { throw new HttpError(400, 'That does not look like a web address.'); }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new HttpError(400, 'Only http and https addresses can be checked.');
  }
  if (BLOCKED_HOST.test(u.hostname) || BLOCKED_IP.test(u.hostname)) {
    throw new HttpError(400, 'That address cannot be checked.');
  }
  if (!u.hostname.includes('.')) {
    throw new HttpError(400, 'That does not look like a full web address.');
  }
  return u;
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/* Fetch a page, following redirects by hand so every hop is re-validated
   against the block list. */
async function fetchPage(url) {
  let current = url;
  let redirects = 0;

  while (true) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(current.toString(), {
        redirect: 'manual',
        signal: ctl.signal,
        headers: {
          'User-Agent': 'DinelineSiteChecker/1.0 (+https://dineline.co)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
    } catch (e) {
      clearTimeout(timer);
      throw new HttpError(502, e.name === 'AbortError'
        ? 'Your site took too long to respond. It may be slow or temporarily down.'
        : 'We could not reach that address. Check the spelling and that the site is online.');
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      if (++redirects > MAX_REDIRECTS) throw new HttpError(502, 'That address redirects too many times.');
      current = normaliseUrl(new URL(res.headers.get('location'), current).toString());
      continue;
    }
    if (res.status === 403 || res.status === 401) {
      throw new HttpError(502, 'Your site refused the request. Some hosts block automated checks — paste your page source instead.');
    }
    if (!res.ok) throw new HttpError(502, 'Your site returned an error (HTTP ' + res.status + ').');

    const type = res.headers.get('content-type') || '';
    if (type && !/text\/html|application\/xhtml/i.test(type)) {
      throw new HttpError(415, 'That address is not a web page.');
    }

    return { html: await readCapped(res), finalUrl: current.toString() };
  }
}

/* Read at most MAX_BYTES so one enormous page cannot exhaust memory. */
async function readCapped(res) {
  if (!res.body || !res.body.getReader) {
    const t = await res.text();
    return t.slice(0, MAX_BYTES);
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    chunks.push(value);
    if (total >= MAX_BYTES) { try { await reader.cancel(); } catch {} break; }
  }
  const buf = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { buf.set(c.subarray(0, Math.min(c.length, total - at)), at); at += c.length; }
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
}

/* ---------------------------------------------------------------- identity
   Work out who this restaurant is, so we can find them on Google without
   asking the owner to type anything. Schema first, then meta, then title. */
function identify(html, finalUrl) {
  const out = { name: '', address: '', phone: '', locality: '', region: '', postal: '' };

  for (const m of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const stack = Array.isArray(data) ? [...data] : [data];
    while (stack.length) {
      const node = stack.shift();
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node['@graph'])) stack.push(...node['@graph']);
      const types = [].concat(node['@type'] || []).map(String);
      if (!types.some(t => /Restaurant|FoodEstablishment|LocalBusiness|Organization|Cafe|Bar|Bakery/i.test(t))) continue;
      if (!out.name && typeof node.name === 'string') out.name = node.name;
      if (!out.phone && typeof node.telephone === 'string') out.phone = node.telephone;
      const a = node.address;
      if (a && typeof a === 'object' && !out.address) {
        out.address = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode]
          .filter(Boolean).join(', ');
        out.locality = a.addressLocality || '';
        out.region = a.addressRegion || '';
        out.postal = a.postalCode || '';
      } else if (typeof a === 'string' && !out.address) out.address = a;
    }
  }

  if (!out.name) {
    const og = html.match(/<meta[^>]+property\s*=\s*["']og:site_name["'][^>]*content\s*=\s*["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:site_name["']/i);
    if (og) out.name = og[1];
  }
  if (!out.name) {
    const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t) out.name = t[1].replace(/\s+/g, ' ').split(/[|–—\-·]/)[0].trim();
  }
  if (!out.phone) {
    const tel = html.match(/href\s*=\s*["']tel:([^"']+)["']/i);
    if (tel) out.phone = decodeURIComponent(tel[1]).trim();
  }
  if (!out.address) {
    const ad = html.match(/<address\b[^>]*>([\s\S]{0,300}?)<\/address>/i);
    if (ad) out.address = ad[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (!out.postal) {
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    const zip = body.match(/\b\d{5}(?:-\d{4})?\b/);
    if (zip) out.postal = zip[0];
  }

  try { out.domain = new URL(finalUrl).hostname.replace(/^www\./, ''); } catch { out.domain = ''; }
  out.name = (out.name || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  return out;
}

/* ------------------------------------------------------------------- places
   Google Places API (v1). Text search to find them, then details for the
   full attribute set. Returns null when no key is configured, so the whole
   thing still works as a page-only check. */
async function lookupPlace(identity, key) {
  if (!key) return { configured: false, place: null };

  const query = [identity.name, identity.address || identity.postal || identity.locality]
    .filter(Boolean).join(' ').trim();
  if (!query) return { configured: true, place: null, reason: 'no-identity' };

  const fields = [
    'places.id', 'places.displayName', 'places.formattedAddress', 'places.location',
    'places.nationalPhoneNumber', 'places.internationalPhoneNumber', 'places.websiteUri',
    'places.rating', 'places.userRatingCount', 'places.priceLevel', 'places.businessStatus',
    'places.primaryType', 'places.primaryTypeDisplayName', 'places.types',
    'places.regularOpeningHours', 'places.editorialSummary', 'places.googleMapsUri',
    'places.reservable', 'places.delivery', 'places.takeout', 'places.dineIn', 'places.curbsidePickup',
    'places.servesVegetarianFood', 'places.servesBreakfast', 'places.servesLunch',
    'places.servesDinner', 'places.servesBeer', 'places.servesWine', 'places.servesBrunch',
    'places.outdoorSeating', 'places.goodForChildren', 'places.allowsDogs', 'places.restroom',
    'places.accessibilityOptions', 'places.paymentOptions', 'places.parkingOptions',
    'places.photos', 'places.reviews'
  ].join(',');

  let res;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
    res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      signal: ctl.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fields
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 3, languageCode: 'en' })
    });
    clearTimeout(timer);
  } catch {
    return { configured: true, place: null, reason: 'places-unreachable' };
  }

  if (!res.ok) {
    return { configured: true, place: null, reason: 'places-error-' + res.status };
  }
  const data = await res.json();
  const places = data.places || [];
  if (!places.length) return { configured: true, place: null, reason: 'not-found' };

  /* Prefer the result whose website matches the domain we just crawled —
     name matching alone picks the wrong branch of a chain. */
  const byDomain = identity.domain
    ? places.find(p => (p.websiteUri || '').toLowerCase().includes(identity.domain.toLowerCase()))
    : null;

  return { configured: true, place: byDomain || places[0], matchedOn: byDomain ? 'domain' : 'name' };
}

/* ------------------------------------------------------------------ handler */
async function analyze(rawUrl, env) {
  const url = normaliseUrl(rawUrl);
  const { html, finalUrl } = await fetchPage(url);
  const identity = identify(html, finalUrl);
  const places = await lookupPlace(identity, env && env.GOOGLE_PLACES_API_KEY);

  return {
    ok: true,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    identity,
    html,
    gmb: places.place || null,
    gmbConfigured: places.configured,
    gmbReason: places.reason || null,
    gmbMatchedOn: places.matchedOn || null
  };
}

/* Shared request handling — every adapter funnels through this. */
async function handleRequest(request, env) {
  const cors = {
    'Access-Control-Allow-Origin': (env && env.ALLOWED_ORIGIN) || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Use POST.' }), { status: 405, headers: cors });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  try {
    const result = await analyze(body.url, env);
    return new Response(JSON.stringify(result), { status: 200, headers: cors });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    const message = e instanceof HttpError ? e.message : 'Something went wrong checking that site.';
    return new Response(JSON.stringify({ ok: false, error: message }), { status, headers: cors });
  }
}

export { analyze, handleRequest, identify, normaliseUrl, HttpError };
export default { fetch: handleRequest };
