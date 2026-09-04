/* ==========================================================================
   The checklists — two tracks, SEO and AEO.
   Every item is a concrete task an owner can finish and tick off.
   t  = rough time      ai = matching prompt id in the library (optional)
   ========================================================================== */

const CHECKLISTS = {

  /* ============================== SEO TRACK ============================== */
  seo: {
    title: 'SEO checklist — getting found',
    intro: 'Work top to bottom. The groups are ordered by return on effort for an independent restaurant.',
    groups: [
      {
        id: 'seo-gbp', icon: '📍', name: 'Google Business Profile',
        note: 'Free, fast, and the highest-return work available to a restaurant. Do this group first even if you do nothing else.',
        items: [
          { t: '30 min', x: 'Claim and verify your Google Business Profile' },
          { t: '5 min',  x: 'Confirm there is only one profile for this location — search Maps for old addresses too' },
          { t: '15 min', x: 'Set the most specific accurate primary category', ai: 'p-category' },
          { t: '10 min', x: 'Add two to five secondary categories for genuine secondary services' },
          { t: '10 min', x: 'Set correct regular hours' },
          { t: '30 min', x: 'Add special hours for every holiday and closure in the next twelve months' },
          { t: '10 min', x: 'Add more-hours entries for kitchen close, brunch, happy hour, delivery' },
          { t: '20 min', x: 'Complete every applicable attribute: seating, service options, parking, payments, accessibility' },
          { t: '10 min', x: 'Set dietary attributes — vegetarian, vegan, gluten-free, halal, kosher' },
          { t: '20 min', x: 'Write the 750-character business description', ai: 'p-description' },
          { t: '2 hours',x: 'Upload 20+ photos covering exterior, interior, bar, patio, 10 dishes, team' },
          { t: '1 hour', x: 'Load your full menu into the profile with sections, descriptions and prices' },
          { t: '10 min', x: 'Set menu, order and reservation links to pages you control' },
          { t: '10 min', x: 'Tap every button on your live profile from a phone and confirm where it lands' },
          { t: '30 min', x: 'Seed and answer ten entries in the Q&A section', ai: 'p-qa' },
          { t: '20 min', x: 'Add your opening date and, if you have one, a short video' },
          { t: 'ongoing',x: 'Publish Google Posts at least twice a month', ai: 'p-posts' },
          { t: 'ongoing',x: 'Add new photos every week' }
        ]
      },
      {
        id: 'seo-site', icon: '🧱', name: 'Website foundations',
        note: 'It does not need to be beautiful. It needs to be fast, readable by machines, and easy to act on.',
        items: [
          { t: 'varies', x: 'Own a website on your own domain, not only a social page or delivery storefront' },
          { t: '30 min', x: 'Install SSL and force all traffic to one canonical HTTPS version' },
          { t: '1 hour', x: 'Get mobile load time under three seconds', ai: 'p-speed' },
          { t: '1 hour', x: 'Compress every image under 200KB and remove autoplay video from the landing page' },
          { t: '15 min', x: 'Put name, address, phone and hours as selectable text in the footer of every page' },
          { t: '10 min', x: 'Make the phone number a tap-to-call link' },
          { t: '30 min', x: 'Put Order and Reserve buttons above the fold and in a sticky header' },
          { t: '45 min', x: 'Write a unique title tag for every page, including your city or neighborhood' },
          { t: '30 min', x: 'Write a meta description for every page' },
          { t: '30 min', x: 'Verify the site in Google Search Console and submit a sitemap' },
          { t: '15 min', x: 'Check the Search Console Pages report for anything wrongly excluded' },
          { t: '15 min', x: 'Confirm the site is indexed with a site: search' },
          { t: '20 min', x: 'Add descriptive alt text to every food and interior photo' }
        ]
      },
      {
        id: 'seo-menu', icon: '🍽️', name: 'Menu and content',
        note: 'If your menu is a PDF, the first item here is the most valuable hour in this entire document.',
        items: [
          { t: '2 hours',x: 'Rebuild the menu as real HTML text — not a PDF, not an image', ai: 'p-menu-html' },
          { t: '2 hours',x: 'Write a description with ingredients and method for every dish', ai: 'p-dish-desc' },
          { t: '30 min', x: 'Show prices on the menu page' },
          { t: '45 min', x: 'Tag dishes for vegetarian, vegan, gluten-free and allergens — verified by the kitchen' },
          { t: '2 hours',x: 'Build a Visit page with parking, transit, landmarks and accessibility', ai: 'p-location' },
          { t: '1 hour', x: 'Write an About page naming the owner, the chef and your sourcing' },
          { t: '1 hour', x: 'Build a private events or catering page if you offer either' },
          { t: '30 min', x: 'Add a specials or events page and keep it current' },
          { t: '1 hour', x: 'Build a twelve-month content calendar', ai: 'p-calendar' },
          { t: 'ongoing',x: 'Update the website the same day the kitchen changes the menu' }
        ]
      },
      {
        id: 'seo-rev', icon: '⭐', name: 'Reviews',
        note: 'Volume, velocity and responses. Build the ask into the shift rather than running campaigns.',
        items: [
          { t: '30 min', x: 'Write the review-ask messages for check drop, receipt email and follow-up text', ai: 'p-rev-ask' },
          { t: '30 min', x: 'Put a Google review QR code on the check presenter' },
          { t: '15 min', x: 'Add a review link to your booking and order confirmation messages' },
          { t: '15 min', x: 'Brief the team on how and when to ask — and never to gate by mood' },
          { t: 'ongoing',x: 'Reply to every review, positive and negative, within a few days', ai: 'p-rev-reply' },
          { t: '30 min', x: 'Claim your Yelp, TripAdvisor and Facebook review profiles' },
          { t: '15 min', x: 'Set up alerts for new reviews across all platforms' },
          { t: '1 hour', x: 'Run a theme analysis on your last 100 reviews', ai: 'p-rev-analysis' },
          { t: 'ongoing',x: 'Fix the operational issue your reviews complain about most' }
        ]
      },
      {
        id: 'seo-cit', icon: '🗂️', name: 'Listings and consistency',
        note: 'Boring but load-bearing. One wrong phone number on a big directory costs covers every week.',
        items: [
          { t: '10 min', x: 'Write down one canonical version of your name, address and phone', ai: 'p-local-dirs' },
          { t: '45 min', x: 'Claim Apple Business Connect' },
          { t: '30 min', x: 'Claim Bing Places' },
          { t: '30 min', x: 'Update Yelp, TripAdvisor and Facebook to the canonical details' },
          { t: '30 min', x: 'Update every delivery and reservation platform you use' },
          { t: '45 min', x: 'Search your phone number in quotes and fix every mismatch you find' },
          { t: '1 hour', x: 'Find and report duplicate listings for merging' },
          { t: '30 min', x: 'Get listed by the chamber of commerce and local tourism board' },
          { t: 'ongoing',x: 'Pitch local food writers and neighborhood publications', ai: 'p-local-pitch' }
        ]
      },
      {
        id: 'seo-schema', icon: '🏷️', name: 'Structured data',
        note: 'The part where AI genuinely writes the code for you. Validate everything before publishing.',
        items: [
          { t: '30 min', x: 'Generate Restaurant JSON-LD for the homepage', ai: 'p-schema-restaurant' },
          { t: '10 min', x: 'Validate it in the Rich Results Test and fix every error', ai: 'p-schema-debug' },
          { t: '10 min', x: 'Add the validated block to the head of your homepage' },
          { t: '1 hour', x: 'Add Menu and MenuItem schema to the menu page' },
          { t: '30 min', x: 'Add FAQPage schema to the FAQ page' },
          { t: '20 min', x: 'Include a sameAs array listing every profile you own' },
          { t: '20 min', x: 'Add openingHoursSpecification rather than free-text hours' },
          { t: '10 min', x: 'Confirm you are not marking up your own aggregate review rating' },
          { t: '20 min', x: 'Add Event schema if you host ticketed or recurring events' }
        ]
      }
    ]
  },

  /* ============================== AEO TRACK ============================== */
  aeo: {
    title: 'AEO checklist — getting recommended',
    intro: 'Do the SEO checklist first — most of it feeds this. These items are what tips you from findable to recommendable.',
    groups: [
      {
        id: 'aeo-base', icon: '🧪', name: 'Establish your baseline',
        note: 'You cannot improve what you have never measured, and there is no dashboard for this. You measure it by asking.',
        items: [
          { t: '20 min', x: 'Ask ChatGPT, Gemini, Perplexity and Copilot what they know about your restaurant', ai: 'p-baseline' },
          { t: '15 min', x: 'Write down every fact they get wrong, and where each wrong fact likely came from' },
          { t: '20 min', x: 'Ask each assistant for restaurants like yours and note who it recommends instead', ai: 'p-competitors' },
          { t: '15 min', x: 'Build a fixed set of 15 test questions to reuse every month', ai: 'p-aeo-questions' },
          { t: '20 min', x: 'Record the baseline in a tracker: mentioned, position, facts correct, sources cited' },
          { t: '15 min', x: 'Note which sources each assistant cited — that is your outreach target list', ai: 'p-local-sources' }
        ]
      },
      {
        id: 'aeo-read', icon: '👁️', name: 'Make sure AI can reach and read you',
        note: 'A surprising number of restaurants are invisible to assistants because something is quietly blocking the crawler.',
        items: [
          { t: '10 min', x: 'Open yourdomain.com/robots.txt and see which AI crawlers are allowed' },
          { t: '15 min', x: 'Decide deliberately: allow OAI-SearchBot, PerplexityBot and ClaudeBot to be found in AI answers' },
          { t: '20 min', x: 'Check that your CDN or firewall bot protection is not blocking those crawlers regardless of robots.txt' },
          { t: '10 min', x: 'Confirm your key facts are in HTML, not rendered only by JavaScript' },
          { t: '10 min', x: 'Confirm your menu is selectable text, not a PDF or image' },
          { t: '15 min', x: 'Make sure nothing important sits behind a popup, a cookie wall or an age gate' }
        ]
      },
      {
        id: 'aeo-facts', icon: '📋', name: 'State the facts machines will not guess',
        note: 'Assistants do not infer. Anything you leave unstated becomes "I am not sure", and the diner moves on.',
        items: [
          { t: '30 min', x: 'State your price range and typical spend per person in text' },
          { t: '20 min', x: 'State your reservation policy, how far ahead, and the largest party you seat' },
          { t: '20 min', x: 'State private dining capacity and what it costs' },
          { t: '30 min', x: 'State dietary accommodation specifically — which dishes, how the kitchen handles cross-contact' },
          { t: '20 min', x: 'State parking, transit and accessibility in plain text' },
          { t: '15 min', x: 'State kids policy, dress code, noise level and whether dogs are allowed on the patio' },
          { t: '15 min', x: 'State last seating and kitchen close, which differ from posted hours' },
          { t: '15 min', x: 'State whether you do takeout, delivery and catering, and through whom' },
          { t: '30 min', x: 'Ask an AI what it would need to recommend you for six occasions, then fill every gap', ai: 'p-aeo-facts' }
        ]
      },
      {
        id: 'aeo-struct', icon: '✍️', name: 'Structure content to be quoted',
        note: 'Retrieval systems work with passages, not pages. Structure decides whether you get lifted into an answer.',
        items: [
          { t: '2 hours',x: 'Build an FAQ page with 15 to 25 real diner questions', ai: 'p-faq' },
          { t: '30 min', x: 'Make each question a heading, phrased the way a diner would ask it' },
          { t: '1 hour', x: 'Answer each question completely in the first 40 to 60 words' },
          { t: '30 min', x: 'Make every answer stand alone without needing the rest of the page' },
          { t: '1 hour', x: 'Rewrite your Visit and About pages in answer-first structure', ai: 'p-aeo-rewrite' },
          { t: '30 min', x: 'Add FAQPage schema to the FAQ page and validate it' },
          { t: '20 min', x: 'Add a plain-text facts block or "good to know" section to the homepage' }
        ]
      },
      {
        id: 'aeo-trust', icon: '🤝', name: 'Be consistent and credible',
        note: 'When sources disagree, assistants hedge or drop you. Consistency is the cheapest trust signal there is.',
        items: [
          { t: '45 min', x: 'Compare hours, price range and offerings across your site, Google, Yelp and Apple, and reconcile every difference' },
          { t: '15 min', x: 'Pick your website as the single source of truth and note it as the thing you update first' },
          { t: '30 min', x: 'Ask an AI to list every contradiction it can find about you, then fix each at its source', ai: 'p-aeo-correct' },
          { t: '1 hour', x: 'Name real people on the site — owner, chef, their background and training' },
          { t: '30 min', x: 'Link to press, awards and coverage from your About page' },
          { t: '20 min', x: 'Use one canonical domain and consistent name spelling everywhere' },
          { t: '20 min', x: 'Pair your restaurant name with your city in titles and profiles so you are not confused with a similar name elsewhere' },
          { t: '20 min', x: 'Link all your profiles together with a sameAs array in your schema' }
        ]
      },
      {
        id: 'aeo-cited', icon: '📣', name: 'Get onto the pages AI already cites',
        note: 'Usually faster than becoming a trusted source yourself. Go where the trust already is.',
        items: [
          { t: '30 min', x: 'Identify the top cited sources for your city and cuisine', ai: 'p-local-sources' },
          { t: '1 hour', x: 'Claim and fully complete your profile on every aggregator that appears in those citations' },
          { t: '1 hour', x: 'Pitch two local publications with an actual story', ai: 'p-local-pitch' },
          { t: '30 min', x: 'Enter local awards, restaurant weeks and "best of" reader polls' },
          { t: '30 min', x: 'Get onto neighborhood association, BID and tourism board listings' },
          { t: 'ongoing',x: 'Host or sponsor something local that generates coverage' },
          { t: 'ongoing',x: 'Build relationships with the writers who publish the roundups in your city' }
        ]
      },
      {
        id: 'aeo-loop', icon: '🔁', name: 'Keep measuring',
        note: 'Monthly, same day, same questions. Thirty minutes. This is the entire methodology.',
        items: [
          { t: '15 min', x: 'Re-run your 15 test questions across every assistant' },
          { t: '10 min', x: 'Log mentions, position, fact accuracy and cited sources' },
          { t: '15 min', x: 'Chase every wrong fact back to the source that produced it and correct it there' },
          { t: '10 min', x: 'Check whether new sources have started appearing in citations' },
          { t: '15 min', x: 'Review Google profile performance and Search Console', ai: 'p-gbp-insights' },
          { t: '15 min', x: 'Pull your position 8–20 queries and pick one to fix', ai: 'p-gsc' },
          { t: '15 min', x: 'Run the monthly review prompt and pick next month\'s three priorities', ai: 'p-monthly' }
        ]
      }
    ]
  }
};
