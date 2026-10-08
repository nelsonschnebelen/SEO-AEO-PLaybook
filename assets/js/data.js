/* ==========================================================================
   Restaurant SEO + AEO Playbook — data model
   Everything the audit, checklists and prompt library read from.
   Plain data only. No DOM, no side effects.
   ========================================================================== */

/* --------------------------------------------------------------------------
   PILLARS
   Weights sum to 100. They are deliberately lopsided: for an independent
   restaurant, the Google Business Profile and the answer-readiness of your
   site move the needle far more than anything else on this list.
   -------------------------------------------------------------------------- */
const PILLARS = [
  {
    id: 'gbp',
    name: 'Your Google listing',
    short: 'Google listing',
    weight: 26,
    icon: '📍',
    blurb: 'Your free Google listing. For most restaurants this outranks the website itself and is the single biggest source of calls, direction requests and walk-ins.',
    ownerNote: 'This is the one thing to fix first. It is free, it takes an afternoon, and it is where hungry people 2 miles away actually find you.'
  },
  {
    id: 'content',
    name: 'What AI can read',
    short: 'Readable',
    weight: 20,
    icon: '🍽️',
    blurb: 'A real HTML menu, dish pages, location pages and the questions-and-answers content that both Google and AI assistants read.',
    ownerNote: 'A menu trapped in a PDF or an image is invisible. Fixing that one thing is often the highest-return hour of work on this whole list.'
  },
  {
    id: 'reviews',
    name: 'Reviews AI paraphrases',
    short: 'Reviews',
    weight: 14,
    icon: '⭐',
    blurb: 'Review volume, velocity, rating, response rate, and the specific words diners use — which AI assistants quote back almost verbatim.',
    ownerNote: 'AI assistants summarize your reviews when someone asks "is it good?". Your reviews are now your sales copy, written by strangers.'
  },
  {
    id: 'citations',
    name: 'Sources that agree',
    short: 'Consistency',
    weight: 10,
    icon: '🗂️',
    blurb: 'Your name, address, phone and hours matching everywhere they appear — Yelp, Apple Maps, TripAdvisor, delivery apps, the local paper.',
    ownerNote: 'Boring, but a wrong phone number on one big directory can quietly cost you covers every week.'
  },
  {
    id: 'schema',
    name: 'Facts in code',
    short: 'Schema',
    weight: 12,
    icon: '🏷️',
    blurb: 'Invisible labels in your page code that spell out your hours, menu, prices and reservation link in a format machines cannot misread.',
    ownerNote: 'This is the part where AI can genuinely do the work for you. You describe the restaurant in plain English, the AI writes the code, you paste it in.'
  },
  {
    id: 'aeo',
    name: 'Answer readiness',
    short: 'Quotable',
    weight: 18,
    icon: '🤖',
    blurb: 'Whether ChatGPT, Google AI Overviews, Gemini, Perplexity and Copilot can find, trust and correctly recommend you when someone asks for a place to eat.',
    ownerNote: 'A growing share of "where should we eat" now happens in a chat window. If the answer never names you, the ranking underneath it does not matter.'
  }
];

/* --------------------------------------------------------------------------
   SCORE BANDS
   -------------------------------------------------------------------------- */
const BANDS = [
  { min: 85, grade: 'A', label: 'Strong', tone: 'good',
    summary: 'You are ahead of the large majority of independent restaurants. Your remaining work is maintenance and the AEO edge — the items below are refinements, not emergencies.' },
  { min: 70, grade: 'B', label: 'Solid, with gaps', tone: 'good',
    summary: 'The foundations are in place. A handful of specific gaps are costing you visibility, and most of them are an afternoon of work each.' },
  { min: 50, grade: 'C', label: 'Half built', tone: 'warn',
    summary: 'You have the basics but the profile and the site are not doing the work they could. The fixes below are ordinary tasks, not projects — start at the top and go down.' },
  { min: 30, grade: 'D', label: 'Losing customers', tone: 'warn',
    summary: 'There is real money leaking here. Diners searching for exactly what you serve are being shown someone else. The good news is that the top few fixes typically move things within weeks.' },
  { min: 0, grade: 'F', label: 'Effectively invisible', tone: 'bad',
    summary: 'Right now search engines and AI assistants have very little to go on. This is common and very fixable — do the first three items on the plan below and you will be past most of your competition.' }
];

/* Expose for cross-file access: a top-level const is not a window property. */
window.PILLARS = PILLARS;
window.BANDS = BANDS;
