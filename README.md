# The 2027 Restaurant AI Playbook

**By [Dineline](https://dineline.co/)** — done-for-you restaurant marketing, tracked to the dollar.

A short, plain-English walk-through of what AI assistants have already started doing to restaurant
discovery, and what an owner should do about it before 2027. Seven sections: a one-button score,
the shift, the dated receipts for it, the four surfaces a diner now meets them on, the six-job
stack to install, and where Dineline fits — ending in a conversation.

ChatGPT has booked restaurant tables through OpenTable, Resy and Yelp since August 2026, and Google
AI Mode answers some dining questions with a single recommendation instead of a list. The point of
the page is that **being bookable and being readable are now the same project**.

**Answer engines, not search rankings.** Title-tag lengths, meta descriptions and page-one
positioning are out of scope. The Google Business Profile very much is *in* scope: when an
assistant says "they take reservations and there's parking behind the building", that is where it
came from.

Built for independent restaurant owners, not for marketers. No jargon, no account, no upload.

---

## Try it

Open `index.html` in a browser. That is the whole install — it is a static site with no build step,
no dependencies and no server.

```bash
git clone https://github.com/nelsonschnebelen/The-2027-Restaurant-AI-Playbook-Dineline.git
cd The-2027-Restaurant-AI-Playbook-Dineline
open index.html          # macOS  ·  xdg-open on Linux  ·  start on Windows
```

To switch on the one-click check, deploy [`api/`](api/README.md) and put its URL in
`assets/js/config.js`.

Need a single file to email or drop on any host? `node tools/build-single-file.js` inlines the CSS,
JS and logo into one self-contained `dist/playbook.html` that opens on a labelled sample report.

### Host it on GitHub Pages

A workflow is already here. One switch to flip:

> **Settings → Pages → Build and deployment → Source: *GitHub Actions***

That is the whole setup. Every push to the default branch republishes, and the site lands at
`https://nelsonschnebelen.github.io/The-2027-Restaurant-AI-Playbook-Dineline/`, with the
one-file copy alongside it at
`/playbook.html`.

The deploy is gated: it runs `tools/validate.js` and refuses to publish if any number on the page
has drifted from the data behind it, if an in-page anchor is dead, or if `docs/` is stale against
`assets/js/`. Paths in the page are all relative, so the project subpath works untouched.

**The hosted copy has no analyser behind it**, so the one-click check degrades to the sample report
and the paste flow, and says so. To switch it on, deploy [`api/`](api/README.md) and set a
repository variable — *Settings → Secrets and variables → Actions → Variables* —
named `AEO_API_BASE` to the service URL. That is a plain endpoint, not a credential; the Places
API key stays server-side in the worker, and `assets/js/config.js` ships empty either way.

Or host it anywhere else that serves static files — Netlify, Cloudflare Pages, an S3 bucket.
Nothing needs configuring.

---

## What is in it

### "Check my restaurant" — type a web address, get a score

The main entry point. An owner types `theirrestaurant.com` and presses one button. Nothing to fill
in, no signup. The analyser fetches their site and finds their Google Business Profile, and the
browser scores both together:

- **Google Business Profile (55% of the score)** — 18 checks over the listing Google already
  publishes: open/closed status, hours, phone, whether the website link points at their own domain
  or a third-party ordering page, rating, review volume, review recency, photo count, how specific
  the primary category is, price level, accessibility, dietary options, service options,
  reservations, description, amenities and meal services.
- **Website and structured data (45%)** — everything in the site checker below.

Every finding says what is wrong, why it costs them customers, and what to do about it. Scores are
proportional — the share of weighted checks passed — so a weak site gets a meaningful number rather
than bottoming out at zero, and improvement actually shows.

This is the one part that needs a server: a browser cannot fetch another site (CORS) or hold a
Places API key safely. The service is in [`api/`](api/README.md) and deploys to Cloudflare Workers,
Vercel or Netlify in about ten minutes. **Without it the playbook still works** — the checker falls
back to the paste flow below, which runs the identical page checks.

### "Paste your source" — the same checks, no backend required

Paste your page source (or a JSON-LD block, or drag in an `.html` file) and the checker reports
back on both layers at once:

- **Your structured data** — every missing field, ranked critical / important / nice-to-have, plus
  the shape and policy problems that look fine until something actually reads them: an address
  written as one string, hours as free text, a `hasMenu` link pointing at a PDF, placeholder values
  still live, invalid JSON, duplicate blocks, and self-serving `aggregateRating` markup (a Google
  guideline violation and a common cause of manual penalties).
- **Your on-page fundamentals** — title tag, meta description, a single H1, mobile viewport,
  tap-to-call link, address as selectable text, alt attributes, a stray `noindex`, mixed content,
  and whether there is any question-and-answer content for answer engines to quote.

It is deliberately forgiving about input: it repairs smart quotes, trailing commas and byte-order
marks (and tells you it had to), walks `@graph` containers, and works from a bare JSON block or a
whole page. Press **Check** with the box empty and you get the list of what to build from scratch.

Then **Build my corrected markup** merges what you already have with your restaurant details,
strips the policy violations, upgrades the wrong shapes — a string address becomes a
`PostalAddress`, a PDF menu link gets replaced, a keyword-stuffed name is swapped for your real
one — and hands back a clean block to paste in. Anything still unknown appears as `FILL_IN` rather
than being invented.

The full rule set is documented in [What the site checker looks for](docs/08-site-checker.md).

### Your details — read off your own site

There is no questionnaire. The site check already reads the restaurant's name, address and phone
off its own markup, so those flow straight into the schema generator and the AI prompts. The six
fields in the generator exist only as a fallback for a site that is not live yet, and so anything
the check got wrong can be corrected. They are stored in `localStorage` and nowhere else.

### The narrative sections

The 2027 story the page walks a client through, in order:

- **01 · The shift** — what changed between the search era, now and 2027, as a three-column chart
- **02 · Not a prediction** — a dated timeline of what has already shipped, each row labelled
  *Live*, *Beta* or *Unreleased* so direction is never dressed up as fact
- **04 · The four doors** — ChatGPT, Google AI Mode and Maps, Gemini/Siri, and the pages AI quotes,
  each with what it reads, what it can do, and the single thing that gets you in
- **05 · Features & plugins** — the six jobs that make a site agent-readable, what does each on
  WordPress, Shopify, Squarespace/Wix, a custom build or a provider-hosted site, five things to
  skip (including an honest read on `llms.txt`), and the schema generator
- **06 · Where we come in** — what the owner runs themselves versus what Dishio and Dineline do

### The checklist

**74 tickable tasks**, ordered the way an assistant meets you: can it reach you, read you, trust you, quote you.
Collapsed under the stack section, since it is the six jobs broken all the way down. Progress saves
to the browser. Items with a 🤖 tag link straight to a matching AI prompt.

### AI prompt library

**27 prompts** for the work restaurants actually need doing — turning a photographed menu into HTML,
writing dish descriptions, generating schema, drafting review replies, mining 100 reviews for
themes, testing what AI already says about you. They auto-fill with the restaurant's own details
once the audit form is completed.

Each one is written the way that gets useful output: role, real context, a specific task, a required
format, and an explicit instruction not to invent facts.

### Schema markup generator

Fills in a `Restaurant` JSON-LD block from the form plus a hours table. Handles split shifts, parses
"Asheville, NC 28801" into its address parts, builds the `sameAs` array and the reservation action,
and flags anything still missing as `FILL_IN` rather than inventing it.

---

## What it weighs

|  | Source | Weight | What it decides |
|---|---|---|---|
| **Your Google listing** | Places API | 55% | The facts an assistant repeats — hours, category, price, dietary, accessibility, reservations, and the review themes it paraphrases |
| **Your own site** | Fetched page + robots.txt | 45% | Whether crawlers are allowed in at all, whether your menu and facts are readable, and whether your pages answer questions in a form that can be lifted |

Deliberately out of scope: title-tag lengths, meta descriptions, page speed, rankings. Those are
search-performance concerns and none of them change whether an assistant names you.

## Read it as documents instead

Everything is also available as Markdown, for printing, sharing, or reading on a phone in the
walk-in:

| Document | What it is |
|---|---|
| [Quick start](docs/01-quick-start.md) | The five things to do this afternoon |
| [The checklist](docs/02-checklist.md) | 74 tasks, in the order an assistant meets you |
| [AI prompt library](docs/04-ai-prompt-library.md) | All 27 prompts, with when and why to use each |
| [Schema recipes](docs/06-schema-recipes.md) | Copy-paste JSON-LD for restaurant, menu, FAQ, events, multi-location |
| [Measurement](docs/07-measurement.md) | The monthly loop and how to measure AI visibility |
| [Site checker rules](docs/08-site-checker.md) | Every check the site checker runs, and why |
| [The playbook in full](docs/09-the-playbook.md) | All twelve chapters, long form — the reference layer behind the page |

---

## Privacy

Restaurant details and checklist ticks are stored in `localStorage` in the visitor's own browser
and never leave the device. Anything pasted or uploaded into the checker is parsed in
the page and never transmitted.

The one-click check is the single exception, and it is deliberately narrow: the browser sends the
web address the owner typed to the analyser, which fetches that public page and queries the Places
API. It stores nothing. There is no analytics, no tracking and no account anywhere in the project.

---

## Project structure

```
index.html                  The whole site — one page, seven anchored sections
assets/
  css/styles.css            Design system; light and dark, print stylesheet
  js/data.js                6 pillars and score bands
  js/prompts.js             27 AI prompts across 8 categories
  js/checklists.js          74 checklist items, one AEO track
  js/profile.js             Restaurant details, filled in from the site check
  js/config.js              Where the analyser lives; empty = paste-only mode
  js/checker-spec.js        What the site checker looks for, and why
  js/checker.js             Checker engine (parse, analyse, rebuild) + its UI
  js/gmb.js                 18 Google Business Profile checks
  js/aeo.js                 Crawler access + answer-readiness checks
  js/analyze.js             One-click flow: combined scoring and report
  img/dineline.svg          Wordmark (light + dark variants)
  js/app.js                 Page chrome, checklists, prompt library, schema generator
api/                        The analyser service — see api/README.md
tools/validate.js           Integrity check — CI will not deploy if it fails
tools/build-single-file.js  Bundles everything into one shareable .html
docs/                       Markdown editions (some generated — see below)
tools/build-docs.js         Regenerates the generated docs from assets/js/
```

### Editing content

The site is data-driven. To change what it says, edit the data — not the HTML:

- **Audit questions and pillar weights** → `assets/js/data.js`
- **AI prompts** → `assets/js/prompts.js`
- **Checklist items** → `assets/js/checklists.js`
- **Site checker rules** → `assets/js/checker-spec.js`
- **Google Business Profile checks** → `assets/js/gmb.js`
- **Analyser endpoint** → `assets/js/config.js`
- **Playbook chapters** → the `#playbook` section of `index.html`

`docs/02`, `03`, `04`, `05` and `08` are **generated** from those data files so the two cannot
drift apart. `docs/09` holds the long-form chapters; the site shows a short version of each.
After editing data, regenerate them:

```bash
node tools/build-docs.js
```

`docs/01`, `06` and `07` are written by hand and are not overwritten.

---

## A note on accuracy

Search platforms change their features and policies regularly. Verify anything platform-specific
against the official documentation before acting on it.

And treat every AI output as a draft to check, never a fact to publish. The playbook is explicit
about where AI helps and where it will confidently get you into trouble — particularly allergen and
dietary information, which must never be published without the kitchen checking it line by line.

---

© 2026 Dineline. Everything here is free to use. When you would rather hand the whole thing over — ads, tracking and a dedicated account manager — that is [what we do](https://dineline.co/).
