# The Restaurant SEO &amp; AEO Playbook

**By [Dineline](https://dineline.co/)** — done-for-you restaurant marketing, tracked to the dollar.

A complete, plain-English playbook for getting a restaurant **found on Google** (SEO) and
**recommended by AI assistants** (AEO). An owner types their web address and gets a score for both
their site and their Google Business Profile, with a ranked list of what to fix — then a full
self-audit, two checklists, 30 ready-to-use AI prompts, and a schema markup generator.

Built for independent restaurant owners, not for marketers. No jargon, no account, no upload.

---

## Try it

Open `index.html` in a browser. That is the whole install — it is a static site with no build step,
no dependencies and no server.

```bash
git clone https://github.com/nelsonschnebelen/SEO-AEO-PLaybook.git
cd SEO-AEO-PLaybook
open index.html          # macOS  ·  xdg-open on Linux  ·  start on Windows
```

To switch on the one-click check, deploy [`api/`](api/README.md) and put its URL in
`assets/js/config.js`.

Need a single file to email or drop on any host? `node tools/build-single-file.js` inlines the CSS,
JS and logo into one self-contained `dist/playbook.html` that opens on a labelled sample report.

Or host it anywhere that serves static files — GitHub Pages, Netlify, Cloudflare Pages, an S3
bucket. Nothing needs configuring.

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

### "Add your restaurant" — the self-audit

The centrepiece. An owner enters their restaurant details, answers 43 plain-English questions across
six short screens, and gets back:

- **A score out of 100** with a grade band and an honest read on what it means
- **A breakdown by pillar** showing exactly where the gaps are
- **A ranked list of priority fixes**, each with why it matters, what to do, and how AI helps
- **A 90-day plan** built from their own gaps, sequenced quick-wins first
- **A downloadable Markdown report** they can print or hand to whoever maintains the site

Every question includes a **how to check** line, so answers are verified rather than guessed. "Not
sure" is a valid answer — it scores cautiously and becomes a "verify this first" task, which is a
real thing worth having on the list.

Scoring is weighted for an independent restaurant: pillars carry different weights, questions carry
different weights inside them, and pillars left unanswered are excluded with the remaining weights
renormalized — so a half-finished audit still scores honestly.

### The playbook

Twelve chapters, ordered by return on effort: the first afternoon, Google Business Profile, the
menu problem, website foundations, local content, reviews as a system, structured data without a
developer, how AI actually picks a restaurant, working with AI without getting burned, multiple
locations, what to ignore, and what to measure.

### Two checklists

**118 tickable tasks** across an SEO track (getting found) and an AEO track (getting recommended).
Progress saves to the browser. Items with a 🤖 tag link straight to a matching AI prompt.

### AI prompt library

**30 prompts** for the work restaurants actually need doing — turning a photographed menu into HTML,
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

## How SEO and AEO differ here

|  | SEO — being *findable* | AEO — being *recommended* |
|---|---|---|
| The question | "Which of these should I click?" | "Where should I go?" |
| Competing for | A position on a page | A mention inside the answer |
| What wins | Complete Google profile, proximity, reviews, fast site, real menu text | Facts stated clearly, agreement across sources, review themes, being cited elsewhere |
| You get | A click | A recommendation |
| Visible in | Rankings, Search Console, profile views | Only by asking the assistants yourself |

Roughly 80% of good AEO *is* good local SEO. The extra 20% is **structure** (answering questions
directly, in self-contained passages) and **completeness** (stating facts a machine will never
guess). The playbook covers both together rather than treating them as separate projects.

---

## Read it as documents instead

Everything is also available as Markdown, for printing, sharing, or reading on a phone in the
walk-in:

| Document | What it is |
|---|---|
| [Quick start](docs/01-quick-start.md) | The five things to do this afternoon |
| [SEO checklist](docs/02-seo-checklist.md) | 68 tasks for getting found |
| [AEO checklist](docs/03-aeo-checklist.md) | 50 tasks for getting recommended |
| [AI prompt library](docs/04-ai-prompt-library.md) | All 30 prompts, with when and why to use each |
| [Audit questions](docs/05-audit-questions.md) | The full question set, with how to check each one |
| [Schema recipes](docs/06-schema-recipes.md) | Copy-paste JSON-LD for restaurant, menu, FAQ, events, multi-location |
| [Measurement](docs/07-measurement.md) | The monthly loop and how to measure AI visibility |
| [Site checker rules](docs/08-site-checker.md) | Every check the site checker runs, and why |
| [The playbook in full](docs/09-the-playbook.md) | All twelve chapters, long form |

---

## Privacy

Audit answers, restaurant details and checklist ticks are stored in `localStorage` in the visitor's
own browser and never leave the device. Anything pasted or uploaded into the checker is parsed in
the page and never transmitted.

The one-click check is the single exception, and it is deliberately narrow: the browser sends the
web address the owner typed to the analyser, which fetches that public page and queries the Places
API. It stores nothing. There is no analytics, no tracking and no account anywhere in the project. There is no analytics, no
tracking, no network request of any kind, and no backend to send anything to.

---

## Project structure

```
index.html                  The whole site — one page, anchored sections
assets/
  css/styles.css            Design system; light and dark, print stylesheet
  js/data.js                7 pillars, 43 audit questions, score bands
  js/prompts.js             30 AI prompts + categories
  js/checklists.js          118 checklist items across two tracks
  js/config.js              Where the analyser lives; empty = paste-only mode
  js/checker-spec.js        What the site checker looks for, and why
  js/checker.js             Checker engine (parse, analyse, rebuild) + its UI
  js/gmb.js                 18 Google Business Profile checks
  js/analyze.js             One-click flow: combined scoring and report
  img/dineline.svg          Wordmark (light + dark variants)
  js/audit.js               Wizard, scoring, action plan, Markdown export
  js/app.js                 Page chrome, checklists, prompt library, schema generator
api/                        The analyser service — see api/README.md
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
