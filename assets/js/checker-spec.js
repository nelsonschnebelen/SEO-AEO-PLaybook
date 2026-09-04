/* ==========================================================================
   Checker rules
   What a restaurant's structured data and page source should contain, why
   each item matters, and what to do when it is missing.

   sev: 'critical'  breaks something or is a policy risk
        'important' costs you visibility
        'nice'      worth having once the rest is done
   ========================================================================== */

/* Types Google treats as a food business. Anything else and you are leaving
   restaurant-specific features on the table. */
const FOOD_TYPES = [
  'Restaurant', 'FoodEstablishment', 'CafeOrCoffeeShop', 'BarOrPub',
  'FastFoodRestaurant', 'Bakery', 'IceCreamShop', 'Winery', 'Brewery', 'Distillery'
];

const RESTAURANT_FIELDS = [
  {
    k: 'name', sev: 'critical', label: 'Business name',
    why: 'Without a name there is no business entity for a machine to attach anything else to.',
    fix: 'Add "name" with your exact business name — the same spelling you use on your Google profile, with no city or keywords bolted on.'
  },
  {
    k: 'address', sev: 'critical', label: 'Postal address', obj: 'PostalAddress',
    why: 'Address is how you get connected to a place on a map. It is the single most important field for local search.',
    fix: 'Add "address" as a PostalAddress object with streetAddress, addressLocality, addressRegion, postalCode and addressCountry as separate fields.'
  },
  {
    k: 'telephone', sev: 'critical', label: 'Phone number',
    why: 'Calls are the highest-intent action a restaurant gets, and assistants read this field when someone asks how to book.',
    fix: 'Add "telephone" in international format, for example "+1-828-555-0142".'
  },
  {
    k: 'url', sev: 'critical', label: 'Website URL',
    why: 'This is what ties the markup to a canonical home you control, rather than to an aggregator page.',
    fix: 'Add "url" pointing at your homepage, using https.'
  },
  {
    k: 'openingHoursSpecification', sev: 'important', label: 'Opening hours',
    why: 'Wrong or absent hours is the most expensive small error in this industry. Stated as structured data, there is nothing left to misread.',
    fix: 'Add "openingHoursSpecification" as an array, one entry per distinct time block, with dayOfWeek, opens and closes. A split shift is two entries for the same day, not one entry with a gap.'
  },
  {
    k: 'servesCuisine', sev: 'important', label: 'Cuisine',
    why: 'This is what matches you to "best ramen near me" and to the equivalent question asked in a chat window.',
    fix: 'Add "servesCuisine" and be specific — "Neapolitan pizza" beats "Italian".'
  },
  {
    k: 'priceRange', sev: 'important', label: 'Price range',
    why: 'Price is one of the first filters a diner applies, and assistants will skip you rather than guess it.',
    fix: 'Add "priceRange" as "$", "$$", "$$$" or "$$$$".'
  },
  {
    k: 'image', sev: 'important', label: 'Image',
    why: 'Results with an image get materially more attention, and Google needs a declared image to build several rich result types.',
    fix: 'Add "image" with an absolute https URL to a good photo of the restaurant, ideally at least 1200px wide.'
  },
  {
    k: 'hasMenu', sev: 'important', label: 'Menu',
    why: 'The menu is what most people came for, and dish-level data is what lets you appear for dish-level searches.',
    fix: 'Add "hasMenu" pointing at your HTML menu page — never a PDF — or embed a full Menu object.'
  },
  {
    k: 'geo', sev: 'important', label: 'Coordinates',
    why: 'Coordinates remove any ambiguity about where you physically are, which matters for "near me" results.',
    fix: 'Add "geo" as a GeoCoordinates object. Right-click your restaurant in Google Maps and the latitude and longitude are at the top of the menu.'
  },
  {
    k: 'acceptsReservations', sev: 'nice', label: 'Reservations',
    why: 'Assistants will not infer this. If your markup does not say it, the answer to "can I book a table there" becomes "I am not sure".',
    fix: 'Add "acceptsReservations" as "True" or "False", and add a ReserveAction with your booking link if you take them.'
  },
  {
    k: 'sameAs', sev: 'nice', label: 'Linked profiles (sameAs)',
    why: 'sameAs is how you tell machines that this website, that Instagram and that Yelp page are all one business. Entity resolution is the foundation of AI recommendation.',
    fix: 'Add "sameAs" as an array listing your Google profile, Yelp, Instagram, Facebook, TripAdvisor and reservation platform URLs.'
  },
  {
    k: 'description', sev: 'nice', label: 'Description',
    why: 'A short factual description gives assistants something to quote when summarizing what kind of place you are.',
    fix: 'Add "description" — one or two sentences naming specific dishes and your neighborhood, not adjectives about quality.'
  },
  {
    k: 'paymentAccepted', sev: 'nice', label: 'Payment methods',
    why: 'Cash-only and card-only are both things diners get caught out by, and both are askable questions.',
    fix: 'Add "paymentAccepted", for example "Cash, Credit Card, Debit Card".'
  }
];

/* Page-source checks — only run when the pasted input is actual HTML. */
const PAGE_CHECKS = [
  {
    id: 'title', sev: 'critical', label: 'Title tag',
    why: 'The strongest single on-page signal, and the blue line people decide whether to click.',
    fix: 'Add one unique <title> per page, under about 60 characters, leading with what people search and ending with your restaurant name.'
  },
  {
    id: 'title-len', sev: 'nice', label: 'Title tag length',
    why: 'Long titles get cut off mid-sentence in results.',
    fix: 'Keep the title between 15 and 65 characters.'
  },
  {
    id: 'title-city', sev: 'important', label: 'City or neighborhood in the title',
    why: 'Local relevance is built from the words on the page. A title with no place in it competes everywhere and wins nowhere.',
    fix: 'Work your city or neighborhood into the title tag once, naturally.'
  },
  {
    id: 'meta-desc', sev: 'important', label: 'Meta description',
    why: 'It does not rank you directly, but it is the sales pitch under your link and it changes click-through rate.',
    fix: 'Add a meta description of 140 to 155 characters giving a reason to choose you and a clear next step.'
  },
  {
    id: 'h1', sev: 'important', label: 'A single H1',
    why: 'The H1 tells both readers and machines what this page is actually about.',
    fix: 'Use exactly one <h1> per page describing that page — not your logo alt text and not a slogan.'
  },
  {
    id: 'viewport', sev: 'critical', label: 'Mobile viewport tag',
    why: 'Without it, phones render your site at desktop width and zoom out. Most of your traffic is on a phone.',
    fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the head.'
  },
  {
    id: 'lang', sev: 'nice', label: 'Language attribute',
    why: 'Tells machines and screen readers what language the page is in.',
    fix: 'Add lang="en" (or your language) to the <html> tag.'
  },
  {
    id: 'tel-link', sev: 'important', label: 'Tap-to-call phone link',
    why: 'A phone number that is not a link costs you calls from people standing on the sidewalk.',
    fix: 'Wrap your phone number in <a href="tel:+18285550142">.'
  },
  {
    id: 'address-text', sev: 'important', label: 'Address as selectable text',
    why: 'An address baked into an image cannot be read by a search engine or an AI assistant. Neither will guess.',
    fix: 'Put your full street address, city, state and ZIP in the footer as real text on every page.'
  },
  {
    id: 'pdf-menu', sev: 'critical', label: 'Menu trapped in a PDF',
    why: 'The most common and most expensive mistake in restaurant SEO. Every dish name, price and allergen note in a PDF is invisible to search and to every AI assistant.',
    fix: 'Rebuild the menu as an HTML page with headings per section and dish names, descriptions and prices as text. Keep the PDF as an optional download if you like.'
  },
  {
    id: 'img-alt', sev: 'nice', label: 'Image alt text',
    why: 'Alt text is how a machine knows what your food photos show, and it is an accessibility requirement.',
    fix: 'Add descriptive alt text to every food and interior photo. Decorative images should have alt="".'
  },
  {
    id: 'noindex', sev: 'critical', label: 'Page blocked from indexing',
    why: 'A noindex tag removes the page from search entirely. This is usually left over from a site build and nobody notices for months.',
    fix: 'Remove the noindex robots meta tag from any page you want found.'
  },
  {
    id: 'jsonld', sev: 'critical', label: 'Structured data present',
    why: 'Schema is the highest-confidence format available for stating your facts, and it is what AI retrieval leans on.',
    fix: 'Add a Restaurant JSON-LD block to the head of your homepage. The generator further down this page writes it for you.'
  },
  {
    id: 'https-assets', sev: 'important', label: 'Everything loads over HTTPS',
    why: 'Mixed content triggers browser warnings that kill conversion, and some assets simply fail to load.',
    fix: 'Change every http:// reference in your page to https://.'
  },
  {
    id: 'faq-content', sev: 'nice', label: 'Question-and-answer content',
    why: 'Question-and-answer text is the format answer engines quote from most readily. It is the highest-leverage AEO content you can publish.',
    fix: 'Build an FAQ page with 15 to 25 real diner questions, each as a heading with a direct 40-to-60-word answer underneath.'
  }
];
