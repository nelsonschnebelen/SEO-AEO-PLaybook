# Schema recipes — copy, paste, validate

Schema markup is a block of code in your page that spells out your facts in a format machines cannot
misinterpret. Your page says "Open 5pm till late, Tues–Sun" and a human understands it. Schema says
`opensAt 17:00, closesAt 23:00, dayOfWeek Tuesday` and there is nothing left to interpret.

For AEO this matters more than it ever did for SEO. Retrieval systems favour facts they can extract
with confidence, and schema is the highest-confidence format available.

> The generator at `index.html#schema` writes the first block below for you from a form. These
> recipes are here for the ones it does not cover, and for anyone who prefers to edit code directly.

---

## How to use these

1. Copy the recipe.
2. Replace every `FILL_IN` and every placeholder value with your own details.
3. Paste it into the [Rich Results Test](https://search.google.com/test/rich-results).
4. Fix any errors — paste the code and the error text into an AI assistant and ask for a correction.
5. Add the validated block to the `<head>` of the relevant page.

Most website platforms have a "custom code", "header injection" or "embed" field for this. On
WordPress, a schema plugin or your theme's header hook will do it.

### Two rules that keep you out of trouble

- **Only mark up what is visible on the page.** Schema describing content a visitor cannot see is a
  policy violation.
- **Never mark up your own aggregate review rating.** Self-serving review markup on your own site is
  against Google's guidelines and a common cause of manual penalties. Your Google Business Profile
  handles ratings for you.

---

## 1. Restaurant — homepage

The essential one. Everything else is optional until this exists.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Rosa's Trattoria",
  "description": "Wood-fired Neapolitan pizza and handmade pasta in downtown Asheville.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "412 Main Street",
    "addressLocality": "Asheville",
    "addressRegion": "NC",
    "postalCode": "28801",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 35.5951,
    "longitude": -82.5515
  },
  "telephone": "+1-828-555-0142",
  "url": "https://rosastrattoria.com",
  "image": "https://rosastrattoria.com/images/exterior.jpg",
  "servesCuisine": "Neapolitan pizza",
  "priceRange": "$$",
  "acceptsReservations": "True",
  "hasMenu": "https://rosastrattoria.com/menu",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["https://schema.org/Tuesday", "https://schema.org/Wednesday", "https://schema.org/Thursday"],
      "opens": "17:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["https://schema.org/Friday", "https://schema.org/Saturday"],
      "opens": "11:00",
      "closes": "14:30"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["https://schema.org/Friday", "https://schema.org/Saturday"],
      "opens": "17:00",
      "closes": "23:00"
    }
  ],
  "sameAs": [
    "https://www.instagram.com/rosastrattoria",
    "https://www.facebook.com/rosastrattoria",
    "https://www.yelp.com/biz/rosas-trattoria-asheville",
    "https://maps.app.goo.gl/example"
  ]
}
</script>
```

**Notes**

- A **split shift** is two separate `OpeningHoursSpecification` entries for the same day, not one
  entry with a gap.
- **`sameAs`** is how you tell machines that this website, that Instagram, that Yelp page and that
  Google profile are all one business. Entity resolution is the foundation of AI recommendation —
  do not skip it.
- Get **coordinates** by right-clicking your restaurant in Google Maps; they are at the top of the
  menu that appears.
- Use the **international phone format** (`+1-828-555-0142`).

---

## 2. Holiday and special hours

Add these inside the same `openingHoursSpecification` array. `validFrom` and `validThrough` override
your regular hours for that period.

```json
{
  "@type": "OpeningHoursSpecification",
  "opens": "00:00",
  "closes": "00:00",
  "validFrom": "2026-12-25",
  "validThrough": "2026-12-25"
}
```

Opening and closing at `00:00` marks a closed day. For shortened hours, use the real times:

```json
{
  "@type": "OpeningHoursSpecification",
  "dayOfWeek": "https://schema.org/Thursday",
  "opens": "11:00",
  "closes": "15:00",
  "validFrom": "2026-11-26",
  "validThrough": "2026-11-26"
}
```

---

## 3. Menu — menu page

Dish-level markup is how you become eligible for dish-level results, and how assistants answer
"does anywhere near me serve X".

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Menu",
  "name": "Dinner menu",
  "url": "https://rosastrattoria.com/menu",
  "inLanguage": "en-US",
  "hasMenuSection": [
    {
      "@type": "MenuSection",
      "name": "Wood-fired pizza",
      "hasMenuItem": [
        {
          "@type": "MenuItem",
          "name": "Margherita",
          "description": "San Marzano tomato, fior di latte, basil, extra virgin olive oil.",
          "offers": { "@type": "Offer", "price": "16.00", "priceCurrency": "USD" },
          "suitableForDiet": "https://schema.org/VegetarianDiet"
        },
        {
          "@type": "MenuItem",
          "name": "Diavola",
          "description": "Spicy soppressata, tomato, fior di latte, chili honey.",
          "offers": { "@type": "Offer", "price": "19.00", "priceCurrency": "USD" }
        }
      ]
    }
  ]
}
</script>
```

**Diet values:** `VegetarianDiet`, `VeganDiet`, `GlutenFreeDiet`, `HalalDiet`, `KosherDiet`,
`LowLactoseDiet`, `DiabeticDiet`, `LowCalorieDiet`, `LowFatDiet`, `LowSaltDiet`.

> Never publish an AI-generated `suitableForDiet` value without your kitchen confirming it. An
> assistant will label a dish gluten-free from the name alone.

---

## 4. FAQPage — FAQ page

The highest-leverage AEO markup you can add, because question-and-answer pairs are exactly the
format answer engines prefer to extract.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you take reservations for large groups?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. We seat groups up to 12 in the main dining room and up to 30 in the private room downstairs. Book online or call at least 48 hours ahead. Groups of 8 or more order from a set menu."
      }
    },
    {
      "@type": "Question",
      "name": "Is there parking?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "There is a free lot with 20 spaces behind the building, entered from Oak Street. Street parking on Main is free after 6pm. The Civic Center garage is a three-minute walk and costs $2 an hour."
      }
    }
  ]
}
</script>
```

**Rules:** every question and answer here must also be visible on the page. Answer completely in the
first 40 to 60 words. Do not mark up questions a visitor cannot see.

---

## 5. Event — events page

For ticketed dinners, live music, wine nights and anything recurring.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Truffle Season Tasting Menu",
  "startDate": "2026-11-14T19:00:00-05:00",
  "endDate": "2026-11-14T22:00:00-05:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Rosa's Trattoria",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "412 Main Street",
      "addressLocality": "Asheville",
      "addressRegion": "NC",
      "postalCode": "28801",
      "addressCountry": "US"
    }
  },
  "description": "A six-course menu built around fresh Alba white truffle, with optional wine pairing.",
  "offers": {
    "@type": "Offer",
    "price": "125.00",
    "priceCurrency": "USD",
    "url": "https://rosastrattoria.com/events/truffle-dinner",
    "availability": "https://schema.org/InStock",
    "validFrom": "2026-10-01T09:00:00-04:00"
  },
  "organizer": { "@type": "Organization", "name": "Rosa's Trattoria", "url": "https://rosastrattoria.com" }
}
</script>
```

Always include the timezone offset in `startDate`. Remove the event block once the date has passed.

---

## 6. Multiple locations

One block per location, on that location's own page — never one block listing several addresses.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Rosa's Trattoria — Riverside",
  "branchOf": { "@type": "Restaurant", "name": "Rosa's Trattoria", "url": "https://rosastrattoria.com" },
  "url": "https://rosastrattoria.com/locations/riverside",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "88 River Arts Place",
    "addressLocality": "Asheville",
    "addressRegion": "NC",
    "postalCode": "28801",
    "addressCountry": "US"
  },
  "telephone": "+1-828-555-0199"
}
```

Give each location its own hours, phone, geo coordinates and `sameAs` list. Near-duplicate location
pages get filtered out of results, so make the surrounding page content genuinely different too —
different photos, different parking, different landmarks, the actual manager's name.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Rich Results Test finds nothing | The block is not in the HTML source — check it is not being injected by JavaScript after load |
| "Invalid object type for field" | A nested type is wrong — for example a plain string where `PostalAddress` is expected |
| "Missing field" warnings | Usually safe to ignore if the field genuinely does not apply; fix it if it does |
| Hours look wrong in results | Split shifts merged into one entry, or a missing timezone |
| Schema is valid but nothing shows in search | Normal — rich results are never guaranteed, and can take weeks to appear |

When stuck, paste both your code and the error text into an AI assistant and ask for a corrected
block. There is a prompt for exactly this in
[the library](04-ai-prompt-library.md#fix-schema-validation-errors).
