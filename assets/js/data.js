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
    name: 'Google Business Profile',
    short: 'Google Profile',
    weight: 24,
    icon: '📍',
    blurb: 'Your free Google listing. For most restaurants this outranks the website itself and is the single biggest source of calls, direction requests and walk-ins.',
    ownerNote: 'This is the one thing to fix first. It is free, it takes an afternoon, and it is where hungry people 2 miles away actually find you.'
  },
  {
    id: 'site',
    name: 'Website Foundations',
    short: 'Website',
    weight: 14,
    icon: '🧱',
    blurb: 'Speed, mobile usability, crawlability and the basic pages Google needs to understand who you are and where you are.',
    ownerNote: 'Your site does not need to be beautiful. It needs to load fast on a phone, say where you are, and let someone order or book in two taps.'
  },
  {
    id: 'content',
    name: 'Menu & Content',
    short: 'Menu & Content',
    weight: 15,
    icon: '🍽️',
    blurb: 'A real HTML menu, dish pages, location pages and the questions-and-answers content that both Google and AI assistants read.',
    ownerNote: 'A menu trapped in a PDF or an image is invisible. Fixing that one thing is often the highest-return hour of work on this whole list.'
  },
  {
    id: 'reviews',
    name: 'Reviews & Reputation',
    short: 'Reviews',
    weight: 12,
    icon: '⭐',
    blurb: 'Review volume, velocity, rating, response rate, and the specific words diners use — which AI assistants quote back almost verbatim.',
    ownerNote: 'AI assistants summarize your reviews when someone asks "is it good?". Your reviews are now your sales copy, written by strangers.'
  },
  {
    id: 'citations',
    name: 'Listings & Consistency',
    short: 'Listings',
    weight: 8,
    icon: '🗂️',
    blurb: 'Your name, address, phone and hours matching everywhere they appear — Yelp, Apple Maps, TripAdvisor, delivery apps, the local paper.',
    ownerNote: 'Boring, but a wrong phone number on one big directory can quietly cost you covers every week.'
  },
  {
    id: 'schema',
    name: 'Structured Data',
    short: 'Schema',
    weight: 12,
    icon: '🏷️',
    blurb: 'Invisible labels in your page code that spell out your hours, menu, prices and reservation link in a format machines cannot misread.',
    ownerNote: 'This is the part where AI can genuinely do the work for you. You describe the restaurant in plain English, the AI writes the code, you paste it in.'
  },
  {
    id: 'aeo',
    name: 'AI Answer Readiness',
    short: 'AEO',
    weight: 15,
    icon: '🤖',
    blurb: 'Whether ChatGPT, Google AI Overviews, Gemini, Perplexity and Copilot can find, trust and correctly recommend you when someone asks for a place to eat.',
    ownerNote: 'A growing share of "where should we eat" now happens in a chat window. If the answer never names you, the ranking underneath it does not matter.'
  }
];

/* --------------------------------------------------------------------------
   AUDIT QUESTIONS
   Written to be answerable by an owner in under 10 minutes, without a
   developer and without opening an SEO tool.

   weight  : relative importance inside its pillar (1-5)
   effort  : minutes of real work, roughly  ('15 min', '1 hour', 'ongoing')
   impact  : 'high' | 'medium' | 'low'  — used to sort the action plan
   check   : how the owner verifies the answer themselves
   fix     : what to actually do
   ai      : how AI helps with this specific item ('' = AI does not help much)
   -------------------------------------------------------------------------- */
const QUESTIONS = [

  /* ---------------------------- GOOGLE BUSINESS PROFILE ------------------ */
  {
    id: 'gbp-claimed', pillar: 'gbp', weight: 5, impact: 'high', effort: '30 min',
    q: 'Have you claimed and verified your Google Business Profile?',
    check: 'Search your restaurant name on Google. If you see "Own this business?" or "Claim this business", it is not claimed by you.',
    why: 'An unclaimed profile can be edited by the public and by competitors, and it cannot post, message, or show most of the features diners use.',
    fix: 'Go to google.com/business, search for your restaurant, and claim it. Verify by video, postcard or phone. Do not create a second listing if one already exists — claim the existing one, or you will end up with duplicates fighting each other.',
    ai: 'Ask AI to walk you through the video verification requirements and what to have on camera before you start, so you do not fail and wait another week.'
  },
  {
    id: 'gbp-category', pillar: 'gbp', weight: 5, impact: 'high', effort: '15 min',
    q: 'Is your primary category the most specific accurate one (e.g. "Neapolitan pizza restaurant", not just "Restaurant")?',
    check: 'Open your profile, click Edit profile, look at Business category. The first one listed is your primary.',
    why: 'Primary category is one of the strongest local ranking signals there is. "Restaurant" competes with everything; "Ramen restaurant" competes with ramen.',
    fix: 'Set the single most specific category that genuinely describes your main business. Add 2 to 5 secondary categories for real secondary services (Caterer, Bar, Breakfast restaurant, Takeout restaurant). Do not stuff categories you do not serve — it can suppress you.',
    ai: 'Paste your menu into an AI assistant and ask it to recommend the best primary Google category and up to five secondaries from the official Google category list, with reasoning for each.'
  },
  {
    id: 'gbp-hours', pillar: 'gbp', weight: 4, impact: 'high', effort: '20 min',
    q: 'Are your hours correct right now, including holiday hours set in advance?',
    check: 'Search yourself on your phone. Does it say Open now when you are open? Check next month for holidays.',
    why: 'Wrong hours are the fastest way to earn a one-star review and lose a customer permanently. Google also demotes profiles it detects as unreliable.',
    fix: 'Set regular hours, then add special hours for every holiday and closure for the next 12 months in one sitting. Add more-hours attributes for kitchen close, brunch, happy hour and delivery windows if they differ.',
    ai: 'Ask AI for the list of US holidays and observances that affect restaurant hours in the next 12 months, formatted as a table you can work down.'
  },
  {
    id: 'gbp-photos', pillar: 'gbp', weight: 4, impact: 'high', effort: 'ongoing',
    q: 'Have you added at least 20 real photos, with new ones in the last 30 days?',
    check: 'Profile > Photos. Look at the upload dates on your most recent additions.',
    why: 'Photo freshness and volume correlate strongly with clicks and direction requests. Profiles that go quiet look closed.',
    fix: 'Cover the set: exterior with signage, entrance, interior at night, interior in daylight, bar, 10+ hero dishes, staff, patio, parking. Shoot on a phone in real light. Upload a few every week rather than 40 at once.',
    ai: 'Use AI to build a shot list for your specific concept, and to write short filenames and captions for each photo before you upload them.'
  },
  {
    id: 'gbp-menu', pillar: 'gbp', weight: 4, impact: 'high', effort: '1 hour',
    q: 'Is your menu loaded directly into the Google profile (not just linked as a PDF)?',
    check: 'Profile > Edit profile > Menu. Are the actual dishes and prices in there?',
    why: 'Google shows dish-level results and lets people search for a dish nearby. A linked PDF gives Google nothing to index or quote.',
    fix: 'Add menu sections, dishes, descriptions and prices in the profile menu editor. Also set the Menu link to a real HTML page on your site, never a PDF.',
    ai: 'Photograph your printed menu, hand the image to an AI assistant, and ask it to output the items as structured sections with names, descriptions and prices ready to paste in.'
  },
  {
    id: 'gbp-attributes', pillar: 'gbp', weight: 3, impact: 'medium', effort: '20 min',
    q: 'Have you filled in the attributes — outdoor seating, takeout, delivery, wheelchair access, dog friendly, reservations, kid friendly?',
    check: 'Profile > Edit profile > More. Work through every tab.',
    why: 'Attributes power filters. "Restaurants with outdoor seating near me" and the equivalent AI question can only return you if the box is ticked.',
    fix: 'Complete every applicable attribute honestly. Pay special attention to accessibility, payment methods, parking, dietary options (vegan, halal, gluten-free) and service options.',
    ai: 'Describe your restaurant to an AI assistant and ask which Google attributes you are likely eligible for and commonly leave blank.'
  },
  {
    id: 'gbp-description', pillar: 'gbp', weight: 2, impact: 'medium', effort: '20 min',
    q: 'Is your 750-character business description written and specific (not generic filler)?',
    check: 'Profile > Edit profile > Description.',
    why: 'It rarely moves rankings directly, but AI assistants and Google both read it when summarizing what kind of place you are.',
    fix: 'Write 750 characters covering: what you serve, the signature dishes, the neighborhood, the setting, who it suits (date night, families, groups), and any credentials. No sales fluff, no keyword stuffing, no offers or URLs (Google strips them).',
    ai: 'Give an AI assistant your menu, your three best reviews and your neighborhood, then ask for a 750-character description in your voice that names specific dishes.'
  },
  {
    id: 'gbp-posts', pillar: 'gbp', weight: 3, impact: 'medium', effort: 'ongoing',
    q: 'Are you publishing Google Posts at least twice a month?',
    check: 'Profile > Promote / Add update. Check the date of your last post.',
    why: 'Posts surface specials and events directly in search, signal an active business, and give Google fresh text about you every week.',
    fix: 'Post specials, events, new menu items, holiday hours and seasonal changes. Always add a photo and a button (Order, Book, Call).',
    ai: 'Ask AI to draft a month of Google Posts from your specials calendar in one go, each under 1,500 characters with a clear call to action.'
  },
  {
    id: 'gbp-actions', pillar: 'gbp', weight: 3, impact: 'high', effort: '30 min',
    q: 'Are your order, reserve and menu links wired up and pointing to pages you control?',
    check: 'Look at your profile on a phone. Tap each button. Where does it land?',
    why: 'Third parties can attach their own ordering links to your profile. Every misrouted tap is a commission you did not need to pay.',
    fix: 'Set your preferred ordering and reservation links in the profile. Where Google lets you, mark your own link as primary and remove or deprioritize aggregator links you did not authorize.',
    ai: 'Ask AI to explain the current process for changing food-ordering providers on a Google Business Profile and what to do when an unauthorized link appears.'
  },
  {
    id: 'gbp-qa', pillar: 'gbp', weight: 2, impact: 'medium', effort: '30 min',
    q: 'Have you seeded and answered the Questions & Answers section on your profile?',
    check: 'Scroll to Questions & answers on your public listing.',
    why: 'Anyone can answer questions about your business, including people who are wrong. Owner answers are highlighted and get quoted by AI assistants.',
    fix: 'Post the 10 questions you get asked most (parking, reservations for large groups, gluten-free, corkage, kids, dress code, private events) and answer them yourself. Monitor weekly for new ones.',
    ai: 'Ask AI to generate the 15 questions diners most commonly ask a restaurant like yours, then draft your answers from your own facts.'
  },

  /* ---------------------------- WEBSITE FOUNDATIONS ---------------------- */
  {
    id: 'site-exists', pillar: 'site', weight: 5, impact: 'high', effort: 'varies',
    q: 'Do you own a real website on your own domain (not only a Facebook page or a delivery-app storefront)?',
    check: 'Type your domain into a browser. Does your own site load?',
    why: 'Rented platforms can change rules, add commissions or disappear. Search engines and AI assistants both treat an owned domain as the authoritative source about you.',
    fix: 'Register your own domain and put up a site, even a single fast page with menu, hours, location, phone, and order and book buttons.',
    ai: 'Have AI draft the full copy for a one-page restaurant site from your menu and story, then hand it to whoever builds the page.'
  },
  {
    id: 'site-mobile', pillar: 'site', weight: 5, impact: 'high', effort: 'varies',
    q: 'Does your site load in under 3 seconds on a phone on cellular data?',
    check: 'Run your URL through PageSpeed Insights (pagespeed.web.dev) and look at the mobile score, or just load it on your own phone with wifi off.',
    why: 'Most restaurant searches are on a phone, often hungry and in motion. Slow pages lose people before the menu renders, and speed is a confirmed ranking factor.',
    fix: 'Compress every image to under 200KB, remove unused plugins and sliders, avoid autoplay video on the landing page, and lazy-load anything below the fold.',
    ai: 'Paste your PageSpeed Insights report into an AI assistant and ask for the fixes ranked by impact, written as instructions your web person can act on.'
  },
  {
    id: 'site-nap', pillar: 'site', weight: 4, impact: 'high', effort: '15 min',
    q: 'Are your address, phone and hours in text on every page (usually the footer)?',
    check: 'Load your site, try to select the phone number with your cursor. If you cannot select it, it is an image.',
    why: 'Text can be read, indexed and quoted. An image of your address cannot, and neither engines nor AI assistants will guess.',
    fix: 'Put full name, street address, city, state, ZIP, phone as a clickable tel: link, and hours in the footer of every page as real text.',
    ai: 'Ask AI to write the exact footer HTML block with the correct tel: link format and an address marked up properly.'
  },
  {
    id: 'site-titles', pillar: 'site', weight: 3, impact: 'medium', effort: '45 min',
    q: 'Does every page have a unique title tag that includes your city or neighborhood?',
    check: 'Look at your browser tab text on three different pages. Are they different and descriptive?',
    why: 'The title tag is still the strongest on-page signal, and it is what shows as the blue clickable line in results.',
    fix: 'Pattern: Primary Dish or Cuisine in Neighborhood, City | Restaurant Name. Keep under about 60 characters. One unique title per page.',
    ai: 'Give AI your page list and location and ask for title tags and meta descriptions for every page, respecting character limits.'
  },
  {
    id: 'site-https', pillar: 'site', weight: 3, impact: 'medium', effort: '30 min',
    q: 'Is your site on HTTPS with no browser security warnings?',
    check: 'Look for the padlock in the address bar. Also try the non-www and www versions.',
    why: 'Insecure sites get warning screens that kill conversion, and HTTPS is a baseline ranking signal.',
    fix: 'Install an SSL certificate (free through most hosts and Let’s Encrypt) and force all traffic to a single canonical HTTPS version.',
    ai: 'Ask AI for the redirect rules for your specific host or platform to force HTTPS and one canonical domain.'
  },
  {
    id: 'site-indexed', pillar: 'site', weight: 4, impact: 'high', effort: '30 min',
    q: 'Is your site actually in Google’s index, and do you have Search Console set up?',
    check: 'Google site:yourdomain.com and count results. Then check whether you have access to search.google.com/search-console for the property.',
    why: 'You cannot fix what you cannot see. Search Console tells you what people searched before they clicked, and warns you when pages fall out of the index.',
    fix: 'Verify the domain in Google Search Console, submit an XML sitemap, and check the Pages report for anything excluded that should not be.',
    ai: 'Export your Search Console queries to CSV, hand them to an AI assistant, and ask which searches you rank on page two for — those are your cheapest wins.'
  },
  {
    id: 'site-booking', pillar: 'site', weight: 3, impact: 'high', effort: '30 min',
    q: 'Can someone order or book within two taps from your homepage on a phone?',
    check: 'Open your homepage on a phone and count the taps to a completed booking or a full cart.',
    why: 'Traffic that cannot convert is a cost, not an asset. Every extra tap loses a meaningful share of people.',
    fix: 'Put Order and Reserve buttons in the sticky header and above the fold. Make the phone number tap-to-call. Do not hide either behind a hamburger menu.',
    ai: 'Describe your current homepage to an AI assistant and ask it to map the tap path for the three top diner tasks and where people drop out.'
  },

  /* ---------------------------- MENU & CONTENT --------------------------- */
  {
    id: 'content-menu-html', pillar: 'content', weight: 5, impact: 'high', effort: '2 hours',
    q: 'Is your menu real text on a web page (not a PDF, image or JPEG)?',
    check: 'Open your menu page and try to select and copy a dish name. If you cannot, it is an image or PDF.',
    why: 'This is the most common and most expensive mistake in restaurant SEO. Dish names, prices and dietary notes trapped in a PDF are invisible to search and to every AI assistant.',
    fix: 'Rebuild the menu as an HTML page with headings per section, dish names as text, descriptions, prices and dietary tags. Keep the PDF as an optional download if you like, but the HTML page is the real one.',
    ai: 'Photograph each menu page, give the images to an AI assistant, and ask for clean HTML with sections, dish names, descriptions, prices and allergen tags. Proofread the prices yourself before publishing.'
  },
  {
    id: 'content-menu-desc', pillar: 'content', weight: 3, impact: 'medium', effort: '2 hours',
    q: 'Does every dish have a real description with ingredients and preparation?',
    check: 'Read your menu page. How many dishes are just a name and a price?',
    why: 'Descriptions are what match the long, specific searches and questions people actually ask — "cacio e pepe", "gluten free birthday cake", "wood fired".',
    fix: 'Write one to two sentences per dish: main ingredients, cooking method, origin or story, spice level, and dietary tags.',
    ai: 'Ask AI to draft descriptions for your dish list from the ingredients you supply. Then edit for truth — never publish an ingredient the kitchen does not use.'
  },
  {
    id: 'content-location-page', pillar: 'content', weight: 4, impact: 'high', effort: '2 hours',
    q: 'Do you have a page that names your neighborhood, nearby landmarks and how to find you?',
    check: 'Search your site for your neighborhood name. Is there a page about the location?',
    why: 'Local relevance is built from language on the page. Landmarks, cross streets and neighborhood names are exactly the terms locals and visitors search.',
    fix: 'Build a location page with the address, an embedded map, parking and transit details, nearby landmarks (theater, stadium, hotels, campus), and neighborhood context. For multi-location groups, one distinct page per location — never one page listing them all.',
    ai: 'Tell AI your address and ask for the landmarks, transit stops, hotels and venues within a mile that diners would use to describe your location. Verify each one before publishing.'
  },
  {
    id: 'content-faq', pillar: 'content', weight: 4, impact: 'high', effort: '2 hours',
    q: 'Do you have an FAQ page answering the real questions diners ask?',
    check: 'Look for a page answering parking, reservations, dietary needs, group size, dress code, kids, corkage.',
    why: 'Question-and-answer text is the format AI assistants and AI Overviews quote from most readily. This is the single most AEO-effective page you can build.',
    fix: 'Write 15 to 25 questions, each as a heading, with a direct 40-to-60-word answer immediately underneath. Answer the question in the first sentence, then add detail. Mark it up with FAQPage schema.',
    ai: 'Ask AI to list the questions diners ask a restaurant like yours, pulled from the themes in your own reviews and emails. Then write the answers from your facts.'
  },
  {
    id: 'content-about', pillar: 'content', weight: 2, impact: 'medium', effort: '1 hour',
    q: 'Do you have an About page with the chef, the story, the sourcing and real names?',
    check: 'Does your site name a human being anywhere?',
    why: 'Experience and credibility signals matter for how both Google and AI assistants judge whether to trust and recommend you.',
    fix: 'Name the owner and chef, describe their background and training, explain your sourcing and technique, and add press mentions and awards with links.',
    ai: 'Interview yourself with AI: ask it to ask you ten questions about your background, then have it turn your answers into an About page draft.'
  },
  {
    id: 'content-fresh', pillar: 'content', weight: 2, impact: 'medium', effort: 'ongoing',
    q: 'Has anything on your website been updated in the last 90 days?',
    check: 'When did you last change a page? Seasonal menu changes count only if they are on the site.',
    why: 'Stale sites drift down. More practically, an outdated menu or an expired event page actively misleads people.',
    fix: 'Set a recurring monthly task: update the menu, refresh the events page, add one new post, and check that everything time-sensitive is still true.',
    ai: 'Ask AI to build you a 12-month restaurant content calendar tied to your seasonal menu changes and local events.'
  },

  /* ---------------------------- REVIEWS ---------------------------------- */
  {
    id: 'rev-volume', pillar: 'reviews', weight: 4, impact: 'high', effort: 'ongoing',
    q: 'Do you have more Google reviews than the restaurants ranking above you?',
    check: 'Search your main dish plus your city. Note the review counts of the top three results and compare to yours.',
    why: 'Review count and rating are heavily weighted in the local pack, and they are the numbers AI assistants cite when asked whether a place is good.',
    fix: 'Build a repeatable ask: a QR code on the check presenter, a line in the receipt email, a link in your booking confirmation. Ask everyone, every day. Never gate the ask by rating and never pay for reviews.',
    ai: 'Ask AI to write the short review-request messages for your check drop, receipt email and post-visit text, in your voice and under 200 characters.'
  },
  {
    id: 'rev-velocity', pillar: 'reviews', weight: 3, impact: 'high', effort: 'ongoing',
    q: 'Are you getting new reviews every week, consistently?',
    check: 'Sort your Google reviews by newest. How many in the last 30 days?',
    why: 'A steady trickle beats a big burst. Bursts look manufactured; steady flow signals a busy, live restaurant.',
    fix: 'Make the ask part of the shift, not a campaign. Give servers a target of a handful of asks per shift and track it on the pre-shift board.',
    ai: 'Ask AI to design a simple weekly staff incentive around review asks that does not create pressure to solicit only happy diners.'
  },
  {
    id: 'rev-response', pillar: 'reviews', weight: 4, impact: 'high', effort: 'ongoing',
    q: 'Do you reply to reviews — good and bad — within a few days?',
    check: 'Look at your last 20 reviews. How many have an owner response?',
    why: 'Responses are public text about your restaurant that you fully control, and they demonstrably influence people reading a negative review.',
    fix: 'Reply to every review. For negatives: acknowledge, apologize without excuses, state the specific fix, offer to take it offline with a real contact. Never argue, never blame the diner.',
    ai: 'Paste a difficult review into an AI assistant and ask for three response drafts at different tones. Then rewrite in your own words — templated replies read as templated.'
  },
  {
    id: 'rev-themes', pillar: 'reviews', weight: 2, impact: 'medium', effort: '1 hour',
    q: 'Do you know the top three themes — good and bad — in your last 100 reviews?',
    check: 'Can you name them right now without looking?',
    why: 'Those themes are what an AI assistant will repeat when someone asks about you. They are also a free operational report you already paid for.',
    fix: 'Read the last 100 reviews quarterly, tally the recurring praise and complaints, fix the top complaint, and lean into the top praise in your marketing copy.',
    ai: 'Copy your last 100 reviews into an AI assistant and ask for a thematic analysis: top praise, top complaints, most-mentioned dishes, and how it would summarize your restaurant in two sentences. That summary is roughly what AI will tell diners.'
  },
  {
    id: 'rev-platforms', pillar: 'reviews', weight: 2, impact: 'medium', effort: '1 hour',
    q: 'Are you monitoring Yelp, TripAdvisor and delivery-app reviews, not just Google?',
    check: 'When did you last log into Yelp for Business?',
    why: 'AI assistants pull from multiple review sources. A four-star Google and a two-star Yelp produce a hedged, damaging summary.',
    fix: 'Claim every review profile. Check them weekly. Respond on each. Yelp forbids soliciting reviews, so improve there by responding and by fixing what people complain about.',
    ai: 'Ask an AI assistant to summarize what it can find about your restaurant across review sites and tell you which source it trusts most — that is a direct read on your reputation as machines see it.'
  },

  /* ---------------------------- CITATIONS -------------------------------- */
  {
    id: 'cit-consistency', pillar: 'citations', weight: 5, impact: 'high', effort: '2 hours',
    q: 'Is your name, address and phone identical everywhere online, character for character?',
    check: 'Google your phone number in quotes. Look at every listing that comes back for mismatches — old suites, old numbers, Ave vs Avenue.',
    why: 'Conflicting information makes engines less confident about your data, and gives AI assistants contradictory facts to reconcile — often by hedging or skipping you.',
    fix: 'Write down one canonical version of name, address and phone. Then update Yelp, Apple Maps (Apple Business Connect), Bing Places, TripAdvisor, Facebook, Instagram, delivery apps, chamber of commerce, and any local directory.',
    ai: 'Give AI your canonical details and ask for a checklist table of the directories a restaurant in your city should be on, so you can work down it.'
  },
  {
    id: 'cit-apple', pillar: 'citations', weight: 3, impact: 'medium', effort: '45 min',
    q: 'Have you claimed Apple Business Connect and Bing Places?',
    check: 'Search yourself in Apple Maps on an iPhone, and on bing.com/maps.',
    why: 'Apple Maps drives iPhone navigation and Siri. Bing data feeds a meaningful share of AI assistant answers, including some Copilot and ChatGPT results.',
    fix: 'Claim both, load photos, hours, menu links and attributes to the same standard as your Google profile.',
    ai: 'Ask AI to list which of your Google profile fields have direct equivalents in Apple Business Connect and Bing Places so you can copy them across efficiently.'
  },
  {
    id: 'cit-duplicates', pillar: 'citations', weight: 3, impact: 'medium', effort: '1 hour',
    q: 'Have you checked for and removed duplicate listings?',
    check: 'Search your restaurant name plus city on Google Maps. Do you appear more than once? Check old addresses too.',
    why: 'Duplicates split your reviews and ranking signals, and send some customers to a dead phone number or a former address.',
    fix: 'Report duplicates through the Google Business Profile support flow to merge or remove them. Do the same on Yelp and Apple. Prioritize any duplicate carrying reviews.',
    ai: 'Ask AI to explain the current Google process for merging duplicate listings and what evidence to have ready.'
  },
  {
    id: 'cit-links', pillar: 'citations', weight: 2, impact: 'medium', effort: 'ongoing',
    q: 'Do local sites link to you — press, food blogs, the neighborhood association, event partners?',
    check: 'Search your restaurant name in quotes and see who mentions you.',
    why: 'Local links are the main authority signal in local search, and they are also how AI assistants discover you through sources they already trust.',
    fix: 'Get listed by the chamber of commerce, tourism board, neighborhood association and BID. Host or sponsor something. Pitch local food writers with a real story, not a press release.',
    ai: 'Ask AI to build a list of local blogs, newsletters, tourism sites and community organizations in your city that cover restaurants, with a short pitch angle for each.'
  },

  /* ---------------------------- SCHEMA ----------------------------------- */
  {
    id: 'schema-restaurant', pillar: 'schema', weight: 5, impact: 'high', effort: '1 hour',
    q: 'Does your site have Restaurant schema markup with address, hours, phone and price range?',
    check: 'Run your homepage through the Rich Results Test at search.google.com/test/rich-results.',
    why: 'Schema removes all guesswork. It states your hours and location in a machine-readable format that cannot be misparsed, which is exactly what AI retrieval depends on.',
    fix: 'Add a JSON-LD Restaurant block to your homepage covering name, address, geo, phone, URL, openingHoursSpecification, servesCuisine, priceRange, acceptsReservations and sameAs profile links.',
    ai: 'This is the best AI task on the list. Describe your restaurant in plain English, ask for valid schema.org Restaurant JSON-LD, paste the result into the Rich Results Test, and paste any errors back for a fix. The generator on this site does the first pass for you.'
  },
  {
    id: 'schema-menu', pillar: 'schema', weight: 3, impact: 'medium', effort: '2 hours',
    q: 'Is your menu marked up with Menu / MenuItem schema?',
    check: 'Run your menu page through the Rich Results Test and look for Menu types.',
    why: 'Dish-level markup is how you become eligible for dish-level results and how assistants answer "does anywhere near me serve X".',
    fix: 'Add hasMenu with MenuSection and MenuItem entries including name, description, offers price and suitableForDiet where relevant.',
    ai: 'Give an AI assistant your HTML menu and ask it to generate the corresponding Menu JSON-LD, then validate it.'
  },
  {
    id: 'schema-faq', pillar: 'schema', weight: 3, impact: 'medium', effort: '45 min',
    q: 'Is your FAQ page marked up with FAQPage schema?',
    check: 'Run the FAQ page through the Rich Results Test.',
    why: 'It makes your question-and-answer pairs trivially extractable, which is precisely the format AI answer engines prefer.',
    fix: 'Add FAQPage JSON-LD with a Question and acceptedAnswer for every question. Only mark up questions and answers that are visible on the page.',
    ai: 'Paste your FAQ text and ask AI for the FAQPage JSON-LD, then validate it before publishing.'
  },
  {
    id: 'schema-sameas', pillar: 'schema', weight: 2, impact: 'medium', effort: '20 min',
    q: 'Does your schema include sameAs links to your social and review profiles?',
    check: 'Look for a sameAs array in your JSON-LD.',
    why: 'sameAs is how you tell machines that this website, that Instagram, that Yelp page and that Google profile are all one entity. Entity resolution is the foundation of AI recommendation.',
    fix: 'List your Google profile, Yelp, Instagram, Facebook, TripAdvisor, OpenTable or Resy, and any Wikipedia or Wikidata entry in a sameAs array.',
    ai: 'Ask AI to assemble the sameAs array from the profile URLs you paste in, formatted as valid JSON-LD.'
  },

  /* ---------------------------- AEO -------------------------------------- */
  {
    id: 'aeo-test', pillar: 'aeo', weight: 4, impact: 'high', effort: '30 min',
    q: 'Have you actually asked ChatGPT, Gemini and Perplexity for a restaurant like yours in your city and seen whether you appear?',
    check: 'Ask each: "best [your cuisine] in [your city]" and "where should I take a client to dinner in [your neighborhood]". Note whether you appear and what it says.',
    why: 'You cannot improve what you have never measured. This ten-minute test tells you more about your AI visibility than any tool will.',
    fix: 'Run 10 to 15 realistic diner questions across ChatGPT, Gemini, Perplexity, Copilot and Google AI Overviews. Record whether you appear, what facts it states, whether they are correct, and which sources it cites. Repeat monthly.',
    ai: 'This item is the AI task. Also ask each assistant directly: "What do you know about [restaurant] in [city]?" and correct whatever it gets wrong at the source.'
  },
  {
    id: 'aeo-answers', pillar: 'aeo', weight: 4, impact: 'high', effort: '2 hours',
    q: 'Is your content written to answer questions directly, with the answer in the first sentence?',
    check: 'Read your FAQ or menu page. Does the answer come first, or after two paragraphs of throat-clearing?',
    why: 'Answer engines extract passages. A self-contained 40-to-60-word answer under a clear question heading is far more extractable than a flowing paragraph.',
    fix: 'Use the question as the H2 or H3. Answer completely in the first 40 to 60 words. Add supporting detail underneath. Make every answer stand alone without needing the rest of the page.',
    ai: 'Paste a page and ask an AI assistant to rewrite it in answer-first structure, then ask it what question each section answers — if it cannot tell, neither can a retrieval system.'
  },
  {
    id: 'aeo-facts', pillar: 'aeo', weight: 4, impact: 'high', effort: '1 hour',
    q: 'Are the facts an AI needs — hours, price range, dietary options, reservations, parking, capacity — stated explicitly in text on your site?',
    check: 'Search your own site for the words "gluten free", "parking", "reservations", "private events". Do you get real answers?',
    why: 'Assistants will not infer. If your site never says you take reservations, the answer to "can I book a table there" becomes "I am not sure", and the diner moves on.',
    fix: 'Create a facts block or a Visit page stating plainly: price range, dress code, reservation policy, largest party size, private dining capacity, parking, transit, accessibility, kids policy, dietary accommodations, and payment methods.',
    ai: 'Ask an AI assistant what it would need to know to confidently recommend your restaurant for six different occasions, then make sure your site answers every single one.'
  },
  {
    id: 'aeo-consistency', pillar: 'aeo', weight: 3, impact: 'high', effort: '1 hour',
    q: 'Do your website, Google profile and major directories all agree on hours, price range and offerings?',
    check: 'Open your site, your Google profile and Yelp side by side. Compare hours and price range.',
    why: 'When sources conflict, assistants either hedge, pick the wrong one, or drop you from the answer. Consistency is the cheapest trust signal available.',
    fix: 'Pick your site as the source of truth, then reconcile every other surface to it. Re-check after every menu or hours change.',
    ai: 'Ask an AI assistant to compare what it finds about your restaurant across sources and list every contradiction it sees. Fix each one at its source.'
  },
  {
    id: 'aeo-crawl', pillar: 'aeo', weight: 3, impact: 'medium', effort: '30 min',
    q: 'Have you made a deliberate decision about whether AI crawlers can read your site?',
    check: 'Open yourdomain.com/robots.txt and look for GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended.',
    why: 'Some sites block these by default through a security plugin or CDN setting, and then wonder why assistants never mention them. Blocking a retrieval crawler removes you from that assistant’s answers.',
    fix: 'Decide consciously. To be found in AI answers, allow OAI-SearchBot, PerplexityBot and ClaudeBot at minimum. Check your CDN or firewall too — bot protection often blocks them regardless of robots.txt.',
    ai: 'Paste your robots.txt into an AI assistant and ask which AI crawlers are currently allowed or blocked and what each one actually does.'
  },
  {
    id: 'aeo-thirdparty', pillar: 'aeo', weight: 3, impact: 'medium', effort: 'ongoing',
    q: 'Do you appear on the "best of" lists and local roundups that AI assistants cite as sources?',
    check: 'Ask Perplexity for the best restaurants in your city and look at which sources it cites. Are you on those pages?',
    why: 'Assistants lean on third-party lists, local publications and aggregators. Being on the pages they already trust is often faster than becoming a trusted source yourself.',
    fix: 'Identify the top cited sources for your city and cuisine, then get included: pitch local publications, claim and complete aggregator profiles, enter local awards, and build a relationship with the writers who publish those roundups.',
    ai: 'Ask Perplexity or ChatGPT for the best restaurants in your city and ask it to list its sources. That list is your outreach target list.'
  },
  {
    id: 'aeo-entity', pillar: 'aeo', weight: 2, impact: 'medium', effort: '1 hour',
    q: 'Is it unambiguous which business you are — distinct name, one canonical domain, consistent branding everywhere?',
    check: 'Search your restaurant name. Do other businesses with similar names appear? Does anything look confusable?',
    why: 'If a machine cannot tell you apart from a similarly named place two states over, it will either merge your facts with theirs or leave you out.',
    fix: 'Always pair your name with your city in profiles and titles. Use one canonical domain. Keep logo, name spelling and handles consistent across every platform. Link everything together with sameAs.',
    ai: 'Ask several AI assistants "what do you know about [name] in [city]" and note every error or confusion with another business, then correct it at the source.'
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
window.QUESTIONS = QUESTIONS;
window.BANDS = BANDS;
