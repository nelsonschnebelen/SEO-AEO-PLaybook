# The Restaurant SEO &amp; AEO Playbook

A complete, plain-English playbook for getting a restaurant **found on Google** (SEO) and
**recommended by AI assistants** (AEO) — with a free self-audit, two checklists, 30 ready-to-use AI
prompts, and a schema markup generator.

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

Or host it anywhere that serves static files — GitHub Pages, Netlify, Cloudflare Pages, an S3
bucket. Nothing needs configuring.

---

## What is in it

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

---

## Privacy

Everything runs client-side. Audit answers, restaurant details and checklist ticks are stored in
`localStorage` in the visitor's own browser and never leave the device. There is no analytics, no
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
  js/audit.js               Wizard, scoring, action plan, Markdown export
  js/app.js                 Checklists, prompt library, schema generator
docs/                       Markdown editions (some generated — see below)
tools/build-docs.js         Regenerates the generated docs from assets/js/
```

### Editing content

The site is data-driven. To change what it says, edit the data — not the HTML:

- **Audit questions and pillar weights** → `assets/js/data.js`
- **AI prompts** → `assets/js/prompts.js`
- **Checklist items** → `assets/js/checklists.js`
- **Playbook chapters** → the `#playbook` section of `index.html`

`docs/02`, `03`, `04` and `05` are **generated** from those data files so the two cannot drift apart.
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
