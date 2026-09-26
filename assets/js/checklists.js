/* ==========================================================================
   The AEO checklist — getting named when someone asks an assistant.
   One track. Ordered the way an assistant meets you: can it reach you, can
   it read you, does it trust you, will it quote you.

   t  = rough time    ai = matching prompt id in the library (optional)
   ========================================================================== */

const CHECKLISTS = {
  aeo: {
    title: 'The AEO checklist',
    intro: 'Ordered the way an assistant meets you. Work top to bottom — the first group is the one that makes all the others pointless if you skip it.',
    groups: [
      {
        id: 'aeo-reach', icon: '🚪', name: 'Let the assistants in',
        note: 'If a crawler is blocked you are not ranked low, you are absent. This happens by accident far more often than owners realise.',
        items: [
          { t: '5 min',  x: 'Open yourdomain.com/robots.txt and read it' },
          { t: '10 min', x: 'Allow OAI-SearchBot (ChatGPT), PerplexityBot and ClaudeBot' },
          { t: '5 min',  x: 'Decide on Google-Extended — it affects Gemini grounding, not normal Search' },
          { t: '20 min', x: 'Check your CDN or firewall is not challenging those crawlers regardless of robots.txt' },
          { t: '10 min', x: 'Remove any leftover site-wide "Disallow: /" from a staging build' },
          { t: '10 min', x: 'Check no page you care about carries a noindex tag' },
          { t: '10 min', x: 'Confirm your key facts are in the HTML, not drawn in by JavaScript afterwards' }
        ]
      },
      {
        id: 'aeo-facts', icon: '📍', name: 'Your Google listing',
        note: 'The single biggest source of the facts an assistant repeats about you. Free to fix, and most of it is a fifteen-minute job.',
        items: [
          { t: '30 min', x: 'Claim and verify your Google Business Profile' },
          { t: '15 min', x: 'Set the most specific accurate primary category', ai: 'p-category' },
          { t: '10 min', x: 'Set correct regular hours' },
          { t: '30 min', x: 'Add special hours for every holiday and closure in the next twelve months' },
          { t: '5 min',  x: 'Set your price range' },
          { t: '20 min', x: 'Complete every attribute: seating, service options, parking, payments' },
          { t: '10 min', x: 'Set accessibility attributes honestly' },
          { t: '10 min', x: 'Set dietary attributes — vegetarian, vegan, gluten-free, halal, kosher' },
          { t: '5 min',  x: 'Declare whether you take reservations, and add the booking link' },
          { t: '20 min', x: 'Write the 750-character description naming specific dishes', ai: 'p-description' },
          { t: '10 min', x: 'Point the website field at your own domain, not a delivery app' },
          { t: '1 hour', x: 'Upload 20+ real photos across the full shot list', ai: 'p-photos' },
          { t: '30 min', x: 'Seed and answer ten entries in the Q&A section', ai: 'p-qa' }
        ]
      },
      {
        id: 'aeo-read', icon: '📖', name: 'Make your site readable',
        note: 'Everything an assistant knows from your own site, it has to be able to parse. A menu in a PDF may as well not exist.',
        items: [
          { t: '2 hours',x: 'Rebuild the menu as real HTML text — not a PDF, not an image', ai: 'p-menu-html' },
          { t: '2 hours',x: 'Write a description with ingredients and method for every dish', ai: 'p-dish-desc' },
          { t: '45 min', x: 'Tag dishes for vegetarian, vegan, gluten-free and allergens — verified by the kitchen' },
          { t: '15 min', x: 'Put name, address, phone and hours as selectable text in the footer' },
          { t: '2 hours',x: 'Build a Visit page with parking, transit, landmarks and accessibility', ai: 'p-location' },
          { t: '30 min', x: 'Show prices on the menu page' },
          { t: 'ongoing',x: 'Update the site the same day the kitchen changes the menu' }
        ]
      },
      {
        id: 'aeo-state', icon: '📋', name: 'State what AI will never guess',
        note: 'Assistants do not infer. Anything you leave unsaid becomes "I am not sure", and the diner moves on to a place that said it.',
        items: [
          { t: '30 min', x: 'State your price range and typical spend per person in text' },
          { t: '20 min', x: 'State your reservation policy and the largest party you seat' },
          { t: '20 min', x: 'State private dining capacity and what it costs' },
          { t: '30 min', x: 'State dietary accommodation specifically — which dishes, how cross-contact is handled' },
          { t: '20 min', x: 'State parking, transit and accessibility in plain text' },
          { t: '15 min', x: 'State kids policy, dress code, noise level and dogs on the patio' },
          { t: '15 min', x: 'State last seating and kitchen close, which differ from posted hours' },
          { t: '30 min', x: 'Ask an AI what it would need to recommend you for six occasions, then fill every gap', ai: 'p-aeo-facts' }
        ]
      },
      {
        id: 'aeo-quote', icon: '✍️', name: 'Make yourself quotable',
        note: 'Assistants lift self-contained passages, not whole pages. Structure decides whether you get used or skipped.',
        items: [
          { t: '2 hours',x: 'Build a page of 15 to 25 real diner questions', ai: 'p-faq' },
          { t: '30 min', x: 'Make each question a heading, phrased the way a diner would ask it' },
          { t: '1 hour', x: 'Answer each question completely in the first 40 to 60 words' },
          { t: '30 min', x: 'Make every answer stand alone without the rest of the page' },
          { t: '1 hour', x: 'Rewrite your Visit and About pages answer-first', ai: 'p-aeo-rewrite' },
          { t: '20 min', x: 'Add a plain-text facts block to the homepage' }
        ]
      },
      {
        id: 'aeo-trust', icon: '🤝', name: 'Be consistent and credible',
        note: 'When sources disagree, assistants hedge or drop you. Consistency is the cheapest trust signal there is.',
        items: [
          { t: '45 min', x: 'Compare hours, price and offerings across your site, Google, Yelp and Apple, and reconcile every difference' },
          { t: '15 min', x: 'Pick your website as the single source of truth' },
          { t: '30 min', x: 'Ask an AI to list every contradiction it can find about you, then fix each at its source', ai: 'p-aeo-correct' },
          { t: '45 min', x: 'Claim Apple Business Connect' },
          { t: '30 min', x: 'Claim Bing Places — it feeds a share of Copilot' },
          { t: '1 hour', x: 'Find and report duplicate listings for merging' },
          { t: '1 hour', x: 'Name real people — owner, chef, their background and training' },
          { t: '20 min', x: 'Pair your name with your city everywhere so you are not confused with a similar name elsewhere' }
        ]
      },
      {
        id: 'aeo-reviews', icon: '⭐', name: 'Reviews, because AI paraphrases them',
        note: 'Ask an assistant whether you are any good and it summarises your reviews. They are your sales copy now, written by strangers.',
        items: [
          { t: '30 min', x: 'Write the review-ask messages for check drop, receipt email and follow-up', ai: 'p-rev-ask' },
          { t: '30 min', x: 'Put a Google review QR code on the check presenter' },
          { t: 'ongoing',x: 'Reply to every review, good and bad', ai: 'p-rev-reply' },
          { t: '1 hour', x: 'Run a theme analysis on your last 100 reviews', ai: 'p-rev-analysis' },
          { t: 'ongoing',x: 'Fix the operational issue your reviews complain about most' },
          { t: '30 min', x: 'Claim and monitor Yelp and TripAdvisor — assistants read them too' }
        ]
      },
      {
        id: 'aeo-schema', icon: '🏷️', name: 'Spell it out in code',
        note: 'Schema states your facts in the one format that cannot be misread. This is where AI genuinely writes the code for you.',
        items: [
          { t: '30 min', x: 'Generate Restaurant JSON-LD for the homepage', ai: 'p-schema-restaurant' },
          { t: '10 min', x: 'Validate it and fix every error', ai: 'p-schema-debug' },
          { t: '10 min', x: 'Add the validated block to the head of your homepage' },
          { t: '20 min', x: 'Use openingHoursSpecification, not free-text hours' },
          { t: '1 hour', x: 'Add Menu and MenuItem schema with prices and dietary tags' },
          { t: '30 min', x: 'Add FAQPage schema to your questions page' },
          { t: '20 min', x: 'Include a sameAs array listing every profile you own' },
          { t: '10 min', x: 'Confirm you are not marking up your own star rating — it is a policy violation' }
        ]
      },
      {
        id: 'aeo-cited', icon: '📣', name: 'Get onto the pages AI already cites',
        note: 'Assistants lean on local roundups and aggregators. Getting onto a page they already trust is faster than becoming trusted yourself.',
        items: [
          { t: '30 min', x: 'Ask an assistant for the best restaurants in your city and note its sources', ai: 'p-local-sources' },
          { t: '1 hour', x: 'Claim and complete your profile on every aggregator in those citations' },
          { t: '1 hour', x: 'Pitch two local publications with an actual story', ai: 'p-local-pitch' },
          { t: '30 min', x: 'Enter local awards, restaurant weeks and reader polls' },
          { t: '30 min', x: 'Get onto neighbourhood association and tourism board listings' }
        ]
      },
      {
        id: 'aeo-loop', icon: '🔁', name: 'Measure it monthly',
        note: 'There is no dashboard for this. You measure it by asking, on a schedule. Thirty minutes a month.',
        items: [
          { t: '20 min', x: 'Build a fixed set of 15 test questions to reuse every month', ai: 'p-aeo-questions' },
          { t: '20 min', x: 'Ask ChatGPT, Gemini, Perplexity and Copilot what they know about you', ai: 'p-baseline' },
          { t: '20 min', x: 'Ask each for restaurants like yours and note who it recommends instead', ai: 'p-competitors' },
          { t: '10 min', x: 'Log mentions, position, fact accuracy and cited sources' },
          { t: '15 min', x: 'Chase every wrong fact back to its source and correct it there' },
          { t: '15 min', x: 'Run the monthly review and pick next month\'s three priorities', ai: 'p-monthly' }
        ]
      }
    ]
  }
};
