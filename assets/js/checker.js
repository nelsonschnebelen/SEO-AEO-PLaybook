/* ==========================================================================
   Page & schema checker
   Takes whatever the owner has — a JSON-LD block, their whole page source,
   or an uploaded file — and reports what is missing, what is wrong, and
   what is a policy risk. Then rebuilds a corrected block.

   Runs entirely in the browser. Nothing is uploaded anywhere.
   ========================================================================== */

const Checker = {
  last: null,

  /* ------------------------------------------------------------- parsing */

  /* Pull every JSON-LD block out of a page source. Falls back to treating
     the whole input as raw JSON when there are no script tags. */
  extractBlocks(text) {
    const blocks = [];
    const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
    let m;
    while ((m = re.exec(text)) !== null) blocks.push(m[1].trim());

    if (!blocks.length) {
      const t = text.trim();
      if (t.startsWith('{') || t.startsWith('[')) blocks.push(t);
    }
    return blocks;
  },

  /* CMSs and copy-paste routinely produce JSON that is nearly valid.
     Try strict first, then repair the usual suspects, and say which. */
  parseBlock(raw) {
    try { return { ok: true, data: JSON.parse(raw), repaired: false }; }
    catch (e) {
      const repaired = raw
        .replace(/[“”]/g, '"')      // smart double quotes
        .replace(/[‘’]/g, "'")      // smart single quotes
        .replace(/,\s*([}\]])/g, '$1')        // trailing commas
        .replace(/^﻿/, '')               // byte order mark
        .replace(/<!--[\s\S]*?-->/g, '');     // stray HTML comments
      try { return { ok: true, data: JSON.parse(repaired), repaired: true, error: e.message }; }
      catch (e2) { return { ok: false, error: e2.message, raw }; }
    }
  },

  /* Flatten arrays and @graph containers into a flat list of nodes. */
  flatten(data, out) {
    out = out || [];
    if (Array.isArray(data)) { data.forEach(d => this.flatten(d, out)); return out; }
    if (!data || typeof data !== 'object') return out;
    out.push(data);
    if (Array.isArray(data['@graph'])) data['@graph'].forEach(d => this.flatten(d, out));
    return out;
  },

  typesOf(node) {
    const t = node['@type'];
    if (!t) return [];
    return (Array.isArray(t) ? t : [t]).map(x => String(x).replace(/^https?:\/\/schema\.org\//, ''));
  },

  isType(node, list) {
    return this.typesOf(node).some(t => list.indexOf(t) !== -1);
  },

  /* --------------------------------------------------------- main entry */
  analyze(input) {
    const findings = [];
    const wins = [];
    const add = (sev, title, detail, fix) => findings.push({ sev, title, detail, fix });
    const win = (title, detail) => wins.push({ title, detail });

    const looksLikeHtml = /<\s*(html|head|body|meta|title|div|script)\b/i.test(input);
    const blocks = this.extractBlocks(input);

    /* ---- parse every block ---- */
    const nodes = [];
    let parseFailures = 0;
    blocks.forEach((raw, i) => {
      const r = this.parseBlock(raw);
      if (!r.ok) {
        parseFailures++;
        add('critical', 'Structured data block ' + (i + 1) + ' is not valid JSON',
          'This block cannot be read by anything — search engines skip it silently, so it looks fine until you check. The parser said: ' + r.error,
          'Paste the block and that error message into an AI assistant and ask for a corrected version, then re-validate it in the Rich Results Test.');
        return;
      }
      if (r.repaired) {
        add('important', 'Structured data block ' + (i + 1) + ' only parses after cleanup',
          'It contains smart quotes, trailing commas or a stray byte-order mark. Some parsers cope and some do not, which makes this the kind of bug that works in testing and fails in production.',
          'Re-save the block as plain text with straight quotes and no trailing commas. This usually comes from pasting through a word processor or a rich-text CMS field.');
      }
      this.flatten(r.data, nodes);
      if (!r.data['@context'] && !Array.isArray(r.data)) {
        add('important', 'Block ' + (i + 1) + ' is missing @context',
          'Without "@context": "https://schema.org" the vocabulary is undefined and the block may be ignored entirely.',
          'Add "@context": "https://schema.org" as the first line of the block.');
      }
    });

    /* ---- find the restaurant node ---- */
    const foodNodes = nodes.filter(n => this.isType(n, FOOD_TYPES));
    const localOnly = nodes.filter(n =>
      this.isType(n, ['LocalBusiness', 'Organization']) && !this.isType(n, FOOD_TYPES));
    const restaurant = foodNodes[0] || localOnly[0] || null;

    if (!blocks.length) {
      add('critical', 'No structured data found at all',
        'There is no JSON-LD in what you pasted. This is the most common state for an independent restaurant, and it means engines and AI assistants are working entirely from guesswork about your hours, location and offering.',
        'Use the generator below to produce a Restaurant block, validate it in the Rich Results Test, and paste it into the <head> of your homepage.');
    } else if (!restaurant) {
      add('critical', 'Structured data exists, but nothing identifies you as a restaurant',
        'Found ' + nodes.length + ' structured data ' + (nodes.length === 1 ? 'item' : 'items') +
        ' (' + [...new Set(nodes.flatMap(n => this.typesOf(n)))].join(', ') +
        ') but no Restaurant or food-business type among them.',
        'Add a Restaurant block. Most of what you need is probably already on the page — it just is not labelled in a way a machine can use.');
    } else if (!this.isType(restaurant, FOOD_TYPES)) {
      add('important', 'You are marked up as a generic business, not a restaurant',
        'The type is "' + this.typesOf(restaurant).join(', ') + '". Google supports restaurant-specific fields — menu, cuisine, reservations, price range — and none of them apply to a generic LocalBusiness.',
        'Change "@type" to "Restaurant" (or CafeOrCoffeeShop, BarOrPub, Bakery, FastFoodRestaurant — whichever fits) and add the restaurant fields.');
    }

    if (foodNodes.length > 1) {
      add('important', 'More than one restaurant block on the page',
        'Found ' + foodNodes.length + '. Duplicate or conflicting blocks make it ambiguous which set of facts is authoritative, and machines resolve that ambiguity by hedging or ignoring both.',
        'Keep exactly one Restaurant block per page. If you have several locations, give each one its own page and its own block.');
    }

    /* ---- field-by-field audit ---- */
    if (restaurant) {
      RESTAURANT_FIELDS.forEach(f => {
        const v = restaurant[f.k];
        const empty = v === undefined || v === null || v === '' ||
                      (Array.isArray(v) && v.length === 0) ||
                      (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
        if (empty) {
          add(f.sev, 'Missing: ' + f.label, f.why, f.fix);
        } else {
          win(f.label, this.summarize(v));
        }
      });

      this.checkAddress(restaurant, add, win);
      this.checkHours(restaurant, add, win);
      this.checkValues(restaurant, add);
      this.checkPolicy(restaurant, nodes, add);
    }

    /* ---- other useful types ---- */
    this.checkOtherTypes(nodes, add, win);

    /* ---- page source checks ---- */
    if (looksLikeHtml) this.checkPage(input, blocks, add, win);

    /* ---- microdata note ---- */
    if (/itemtype\s*=\s*["'][^"']*schema\.org/i.test(input) && !blocks.length) {
      add('important', 'You are using microdata rather than JSON-LD',
        'Microdata works, but it is tangled into your HTML, which makes it easy to break during a redesign and hard to check.',
        'Move to a JSON-LD block in the <head>. It is self-contained, easy to validate and the format Google recommends.');
    }

    const result = {
      findings, wins, nodes, restaurant, blocks: blocks.length, parseFailures,
      isHtml: looksLikeHtml,
      counts: {
        critical: findings.filter(f => f.sev === 'critical').length,
        important: findings.filter(f => f.sev === 'important').length,
        nice: findings.filter(f => f.sev === 'nice').length
      }
    };
    this.last = result;
    return result;
  },

  /* ------------------------------------------------------- detail checks */
  checkAddress(r, add, win) {
    const a = r.address;
    if (!a) return;
    if (typeof a === 'string') {
      add('critical', 'Address is a single line of text, not a structured object',
        'Written as one string, a machine has to guess where the street ends and the city begins. That guess is how you end up on the wrong side of a map.',
        'Replace it with a PostalAddress object: streetAddress, addressLocality, addressRegion, postalCode and addressCountry as separate fields.');
      return;
    }
    const need = [
      ['streetAddress', 'street address'], ['addressLocality', 'city'],
      ['addressRegion', 'state or region'], ['postalCode', 'postal code'],
      ['addressCountry', 'country']
    ];
    const missing = need.filter(([k]) => !a[k]).map(([, l]) => l);
    if (missing.length) {
      add('important', 'Address is incomplete',
        'Missing: ' + missing.join(', ') + '. Partial addresses are a common cause of a business being placed imprecisely or matched to the wrong area.',
        'Fill in every part of the PostalAddress object, including addressCountry.');
    } else {
      win('Complete postal address', [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean).join(', '));
    }
  },

  checkHours(r, add, win) {
    if (typeof r.openingHours === 'string' || Array.isArray(r.openingHours)) {
      add('important', 'Hours are written as free text',
        'The older "openingHours" shorthand ("Mo-Fr 17:00-22:00") is far easier to get subtly wrong than the structured form, and it cannot express split shifts or holiday exceptions.',
        'Replace it with "openingHoursSpecification", one entry per distinct block of time.');
    }

    const spec = r.openingHoursSpecification;
    if (!spec) return;
    const arr = Array.isArray(spec) ? spec : [spec];
    const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const seen = new Set();
    let badTime = 0;

    arr.forEach(s => {
      const d = s.dayOfWeek;
      const days = (Array.isArray(d) ? d : [d]).filter(Boolean)
        .map(x => String(x).replace(/^https?:\/\/schema\.org\//, ''));
      days.forEach(x => seen.add(x));
      [s.opens, s.closes].forEach(t => {
        if (t !== undefined && !/^\d{2}:\d{2}(:\d{2})?$/.test(String(t))) badTime++;
      });
    });

    if (badTime) {
      add('important', 'Some opening times are not in HH:MM format',
        badTime + ' ' + (badTime === 1 ? 'value is' : 'values are') + ' malformed. "5pm" or "17.00" will not parse; it has to be "17:00".',
        'Write every opens and closes value as 24-hour HH:MM, zero-padded — "09:00", not "9:00".');
    }

    const missingDays = DAYS.filter(d => !seen.has(d));
    if (missingDays.length && missingDays.length < 7) {
      add('nice', 'Some days are absent from your hours',
        'No entry for: ' + missingDays.join(', ') + '. If you are closed those days that is fine, but an absent day is ambiguous — it can read as "unknown" rather than "closed".',
        'Either add an entry for each closed day with opens and closes both set to "00:00", or confirm you are happy leaving them undeclared.');
    } else if (!missingDays.length) {
      win('Opening hours', 'All seven days declared, ' + arr.length + ' time ' + (arr.length === 1 ? 'block' : 'blocks'));
    }

    const hasSpecial = arr.some(s => s.validFrom || s.validThrough);
    if (!hasSpecial) {
      add('nice', 'No holiday or special hours declared',
        'Regular hours are set, but nothing covers holidays and closures. A wasted trip on a public holiday is the fastest route to a one-star review.',
        'Add openingHoursSpecification entries with validFrom and validThrough for each holiday and planned closure over the next twelve months.');
    }
  },

  checkValues(r, add) {
    /* Walk string values only. Scanning the stringified object would match
       structural brackets and fire on every valid array. */
    const PLACEHOLDER = /FILL_IN|YOUR_[A-Z_]+|lorem ipsum|\bTODO\b|\bXXX+\b|example\.(com|org)/i;
    const BRACKETED = /^\s*[\[<{].*[\]>}]\s*$/;
    const hits = [];
    const walk = v => {
      if (typeof v === 'string') {
        if (PLACEHOLDER.test(v) || BRACKETED.test(v)) hits.push(v.slice(0, 40));
      } else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(r);
    if (hits.length) {
      const uniq = [...new Set(hits)].slice(0, 5);
      add('critical', 'Placeholder values are still in your markup',
        'Found: ' + uniq.map(h => '"' + h + '"').join(', ') +
        '. This is live, machine-readable text telling the world your details are unfinished.',
        'Replace every placeholder with a real value, or remove the field entirely. An absent field is much better than a fake one.');
    }

    if (r.telephone && !/^\+?[\d\s\-().]{7,}$/.test(String(r.telephone))) {
      add('nice', 'Phone number format looks unusual',
        'Got "' + r.telephone + '". Non-standard formatting can prevent tap-to-call from working in some results.',
        'Use international format: "+1-828-555-0142".');
    } else if (r.telephone && !/^\+/.test(String(r.telephone).trim())) {
      add('nice', 'Phone number has no country code',
        'International format is more reliably parsed, and it matters if you get any out-of-country traffic.',
        'Prefix the number with your country code, for example "+1".');
    }

    ['url', 'image', 'hasMenu'].forEach(k => {
      const v = r[k];
      const s = typeof v === 'string' ? v : (v && v.url);
      if (s && /^http:\/\//i.test(s)) {
        add('important', 'Insecure URL in "' + k + '"',
          '"' + s + '" uses http rather than https. Browsers flag insecure pages, and that warning screen costs you customers before they see the menu.',
          'Switch the URL to https, and make sure your whole site redirects to the secure version.');
      }
    });

    const menu = typeof r.hasMenu === 'string' ? r.hasMenu : (r.hasMenu && r.hasMenu.url);
    if (menu && /\.pdf(\?|$)/i.test(menu)) {
      add('critical', 'Your menu link points at a PDF',
        'Every dish name, price and allergen note in that PDF is invisible. Someone searching for the exact dish you are known for will not find you, because as far as the machines are concerned you do not serve it. This is the single most expensive mistake in restaurant SEO.',
        'Rebuild the menu as an HTML page and point hasMenu at that. Keep the PDF as an optional download if your regulars like it.');
    }

    if (r.priceRange && !/^\${1,4}$|^\$?\d+\s*[-–]\s*\$?\d+$/.test(String(r.priceRange).trim())) {
      add('nice', 'Price range is in an unusual format',
        'Got "' + r.priceRange + '". Google expects either dollar signs or a numeric range.',
        'Use "$", "$$", "$$$" or "$$$$", or a range like "$15-$30".');
    }

    if (r.sameAs) {
      const list = Array.isArray(r.sameAs) ? r.sameAs : [r.sameAs];
      if (list.length < 3) {
        add('nice', 'Only ' + list.length + ' linked profile' + (list.length === 1 ? '' : 's') + ' in sameAs',
          'sameAs is how machines work out that your website, Instagram, Yelp page and Google profile are all one business. The more of them you connect, the more confident that resolution is.',
          'List every profile you own: Google, Yelp, Instagram, Facebook, TripAdvisor, and your reservation platform.');
      }
    }
  },

  /* Policy risks — the ones that get people penalized. */
  checkPolicy(r, nodes, add) {
    if (r.aggregateRating || r.review) {
      add('critical', 'You are marking up your own review rating',
        'Self-serving review markup — your own rating, on your own site, about yourself — is against Google\'s structured data guidelines and is a well-known cause of manual penalties. Your Google Business Profile already handles ratings for you.',
        'Remove "aggregateRating" and "review" from your own Restaurant markup entirely.');
    }

    const name = String(r.name || '');
    if (/\b(best|top|#1|number one|cheapest|award[- ]winning)\b/i.test(name)) {
      add('important', 'Your business name contains marketing language',
        '"' + name + '" is not a plain business name. Keyword-stuffed names violate Google Business Profile policy, get reported by competitors, and cause mismatches between your markup and your listing.',
        'Use your real registered business name, exactly as it appears on your Google profile and your signage.');
    }
  },

  checkOtherTypes(nodes, add, win) {
    const has = t => nodes.some(n => this.isType(n, [t]));

    if (has('FAQPage')) {
      const faq = nodes.find(n => this.isType(n, ['FAQPage']));
      const qs = [].concat(faq.mainEntity || []);
      const noAnswer = qs.filter(q => !q.acceptedAnswer || !(q.acceptedAnswer.text || '').trim());
      const shortAnswer = qs.filter(q => {
        const t = (q.acceptedAnswer && q.acceptedAnswer.text || '').trim();
        return t && t.length < 40;
      });
      win('FAQ markup', qs.length + ' question' + (qs.length === 1 ? '' : 's'));
      if (noAnswer.length) {
        add('important', noAnswer.length + ' FAQ question' + (noAnswer.length === 1 ? ' has' : 's have') + ' no answer',
          'A Question with no acceptedAnswer is invalid and will be ignored, taking the rest of the block with it in some parsers.',
          'Give every Question an acceptedAnswer with real text — and make sure that text is also visible on the page.');
      }
      if (shortAnswer.length) {
        add('nice', shortAnswer.length + ' FAQ answer' + (shortAnswer.length === 1 ? ' is' : 's are') + ' very short',
          'Answer engines extract self-contained passages. An answer under about 40 characters rarely carries enough to be quoted usefully.',
          'Aim for 40 to 60 words per answer, complete enough to stand alone without the rest of the page.');
      }
    } else {
      add('nice', 'No FAQ markup found',
        'Question-and-answer content is the format AI assistants quote from most readily — it is the highest-leverage AEO content a restaurant can publish.',
        'Build an FAQ page with 15 to 25 real diner questions, then mark it up with FAQPage schema.');
    }

    if (has('Menu')) {
      const menu = nodes.find(n => this.isType(n, ['Menu']));
      const items = [];
      [].concat(menu.hasMenuSection || []).forEach(s => {
        [].concat(s.hasMenuItem || []).forEach(i => items.push(i));
      });
      [].concat(menu.hasMenuItem || []).forEach(i => items.push(i));
      win('Menu markup', items.length + ' dish' + (items.length === 1 ? '' : 'es') + ' described');

      const noPrice = items.filter(i => !i.offers);
      const noDesc = items.filter(i => !i.description);
      if (noPrice.length) {
        add('nice', noPrice.length + ' menu item' + (noPrice.length === 1 ? '' : 's') + ' with no price',
          'Prices in structured data feed price-range signals and let you appear for cost-qualified searches.',
          'Add an Offer with price and priceCurrency to every MenuItem.');
      }
      if (noDesc.length) {
        add('nice', noDesc.length + ' menu item' + (noDesc.length === 1 ? '' : 's') + ' with no description',
          'Descriptions are what match the long specific searches — "cacio e pepe", "wood fired", "gluten free birthday cake".',
          'Add a one-sentence description covering the main ingredients and the cooking method.');
      }
    }

    nodes.filter(n => this.isType(n, ['Event'])).forEach(ev => {
      if (ev.startDate && !/[Z+]|-\d{2}:\d{2}$/.test(String(ev.startDate).slice(10))) {
        add('nice', 'Event "' + (ev.name || 'untitled') + '" has no timezone',
          'A start time without a timezone offset gets interpreted differently depending on where the reader is.',
          'Write startDate with the offset, for example "2026-11-14T19:00:00-05:00".');
      }
    });
  },

  /* -------------------------------------------------------- page source */
  checkPage(html, blocks, add, win) {
    const get = (id) => PAGE_CHECKS.find(c => c.id === id);
    const fail = (id, detail) => { const c = get(id); add(c.sev, c.label, detail || c.why, c.fix); };

    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
    if (!title || !title.trim()) fail('title');
    else {
      const t = title.trim();
      win('Title tag', t);
      if (t.length > 65 || t.length < 15) {
        const c = get('title-len');
        add(c.sev, c.label, 'Yours is ' + t.length + ' characters. ' + c.why, c.fix);
      }
    }

    const desc = (html.match(/<meta[^>]+name\s*=\s*["']description["'][^>]*>/i) || [])[0];
    const descContent = desc && (desc.match(/content\s*=\s*["']([^"']*)["']/i) || [])[1];
    if (!descContent || !descContent.trim()) fail('meta-desc');
    else win('Meta description', descContent.trim().slice(0, 80) + (descContent.length > 80 ? '…' : ''));

    const h1s = html.match(/<h1\b[^>]*>/gi) || [];
    if (h1s.length === 0) fail('h1', 'This page has no H1 at all. ' + get('h1').why);
    else if (h1s.length > 1) fail('h1', 'This page has ' + h1s.length + ' H1 tags. ' + get('h1').why);
    else win('Heading structure', 'Exactly one H1');

    if (!/<meta[^>]+name\s*=\s*["']viewport["']/i.test(html)) fail('viewport');
    else win('Mobile viewport', 'Declared');

    if (!/<html[^>]+lang\s*=/i.test(html)) fail('lang');

    if (!/href\s*=\s*["']tel:/i.test(html)) fail('tel-link');
    else win('Tap-to-call link', 'Present');

    const hasZip = /\b\d{5}(-\d{4})?\b/.test(html.replace(/<script[\s\S]*?<\/script>/gi, ''));
    const hasAddrTag = /<address\b/i.test(html);
    if (!hasZip && !hasAddrTag) fail('address-text');
    else win('Address in page text', 'Found');

    const pdfMenu = html.match(/href\s*=\s*["']([^"']*(menu|carte|speisekarte)[^"']*\.pdf[^"']*)["']/i);
    if (pdfMenu) fail('pdf-menu', 'Found a link to "' + pdfMenu[1].slice(0, 60) + '". ' + get('pdf-menu').why);

    const imgs = html.match(/<img\b[^>]*>/gi) || [];
    const noAlt = imgs.filter(i => !/\balt\s*=/i.test(i));
    if (noAlt.length) {
      const c = get('img-alt');
      add(c.sev, c.label, noAlt.length + ' of ' + imgs.length + ' images have no alt attribute. ' + c.why, c.fix);
    } else if (imgs.length) win('Image alt text', 'All ' + imgs.length + ' images have alt attributes');

    if (/<meta[^>]+name\s*=\s*["']robots["'][^>]*content\s*=\s*["'][^"']*noindex/i.test(html)) fail('noindex');

    if (!blocks.length) fail('jsonld');
    else win('Structured data', blocks.length + ' JSON-LD block' + (blocks.length === 1 ? '' : 's') + ' found');

    const insecure = (html.match(/(?:src|href)\s*=\s*["']http:\/\/(?!localhost|127\.)/gi) || []);
    if (insecure.length) {
      const c = get('https-assets');
      add(c.sev, c.label, insecure.length + ' resource' + (insecure.length === 1 ? '' : 's') +
        ' still load over http. ' + c.why, c.fix);
    }

    const text = html.replace(/<[^>]+>/g, ' ');
    const questions = (text.match(/\?/g) || []).length;
    if (questions < 3) fail('faq-content');
    else win('Question-and-answer content', questions + ' questions on the page');
  },

  /* ---------------------------------------------------------- rebuilding
     Merge what they already have with what the audit form knows, drop the
     policy violations, and upgrade the shapes that were wrong.           */
  buildFixed(result, profile, extras) {
    const r = result.restaurant ? JSON.parse(JSON.stringify(result.restaurant)) : {};
    const F = 'FILL_IN';
    const out = { '@context': 'https://schema.org', '@type': 'Restaurant' };

    // never carry these forward
    delete r.aggregateRating;
    delete r.review;
    delete r['@context'];
    delete r['@type'];

    /* Do not carry forward a name we just flagged as keyword-stuffed —
       handing back the violation inside the "corrected" block is worse
       than useless. Prefer the plain name from the audit form. */
    const stuffed = /\b(best|top|#1|number one|cheapest|award[- ]winning)\b/i;
    out.name = (r.name && !stuffed.test(String(r.name)))
      ? r.name
      : (profile.name || r.name || F);
    if (r.description || profile.description) out.description = r.description || profile.description;

    // address: upgrade a string into a structured object where we can
    let addr = r.address;
    if (typeof addr === 'string') {
      const m = addr.match(/^(.*?),\s*(.*?),\s*([A-Za-z]{2})\.?\s*(\d{5}(?:-\d{4})?)?/);
      addr = m
        ? { '@type': 'PostalAddress', streetAddress: m[1].trim(), addressLocality: m[2].trim(),
            addressRegion: m[3].toUpperCase(), postalCode: m[4] || F, addressCountry: 'US' }
        : null;
    }
    if (!addr || typeof addr !== 'object') {
      const cityRaw = (profile.city || '').trim();
      let loc = F, reg = F, zip = F;
      const cm = cityRaw.match(/^(.*?),\s*([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?$/);
      if (cm) { loc = cm[1].trim(); reg = cm[2].toUpperCase(); zip = cm[3] || F; }
      else if (cityRaw) loc = cityRaw;
      addr = { '@type': 'PostalAddress', streetAddress: profile.address || F,
               addressLocality: loc, addressRegion: reg, postalCode: zip, addressCountry: 'US' };
    } else {
      addr['@type'] = 'PostalAddress';
      if (!addr.addressCountry) addr.addressCountry = 'US';
    }
    out.address = addr;

    out.telephone = r.telephone || profile.phone || F;
    out.url = r.url || profile.url || F;
    if (r.image) out.image = r.image;

    const geo = r.geo || (extras.geo || null);
    if (geo) out.geo = geo;

    out.servesCuisine = r.servesCuisine || profile.cuisine || F;
    out.priceRange = r.priceRange || profile.price || F;

    const hours = (extras.hours && extras.hours.length) ? extras.hours
                : (r.openingHoursSpecification || null);
    if (hours) out.openingHoursSpecification = hours;

    const menu = extras.menu || (typeof r.hasMenu === 'string' ? r.hasMenu : (r.hasMenu && r.hasMenu.url));
    out.hasMenu = menu && !/\.pdf(\?|$)/i.test(menu) ? menu : F;

    const book = extras.book;
    out.acceptsReservations = book ? 'True' : (r.acceptsReservations || 'False');
    if (book) {
      out.potentialAction = {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint', urlTemplate: book, inLanguage: 'en-US',
          actionPlatform: ['https://schema.org/DesktopWebPlatform',
                           'https://schema.org/IOSPlatform', 'https://schema.org/AndroidPlatform']
        },
        result: { '@type': 'FoodEstablishmentReservation', name: 'Reserve a table' }
      };
    }

    const same = new Set([...(extras.sameAs || []),
      ...[].concat(r.sameAs || []).filter(Boolean)]);
    out.sameAs = same.size ? [...same] : [F];

    return out;
  },

  /* Human-readable one-liner for a field value. */
  summarize(v) {
    if (typeof v === 'string') return v.length > 70 ? v.slice(0, 70) + '…' : v;
    if (Array.isArray(v)) return v.length + ' ' + (v.length === 1 ? 'entry' : 'entries');
    if (v && typeof v === 'object') {
      if (v.latitude !== undefined) return v.latitude + ', ' + v.longitude;
      return (v['@type'] || 'object');
    }
    return String(v);
  }
};

window.Checker = Checker;

/* ==========================================================================
   Checker UI — paste box, drag-and-drop, file upload, results rendering.
   ========================================================================== */

const CheckerUI = {
  MAX_BYTES: 4 * 1024 * 1024,

  init() {
    const box = document.getElementById('check-input');
    const zone = document.getElementById('dropzone');
    if (!box || !zone) return;

    document.getElementById('btn-check').addEventListener('click', () => this.run());
    document.getElementById('btn-upload').addEventListener('click',
      () => document.getElementById('check-file').click());
    document.getElementById('check-file').addEventListener('change', e => {
      if (e.target.files[0]) this.readFile(e.target.files[0]);
    });
    document.getElementById('btn-sample').addEventListener('click', () => this.loadSample());
    document.getElementById('btn-clear-check-input').addEventListener('click', () => {
      box.value = '';
      document.getElementById('check-fname').textContent = '';
      document.getElementById('check-results').innerHTML = '';
      box.focus();
    });

    ['dragenter', 'dragover'].forEach(ev =>
      zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev =>
      zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag'); }));
    zone.addEventListener('drop', e => {
      const f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) this.readFile(f);
    });
  },

  readFile(file) {
    const note = document.getElementById('check-fname');
    if (file.size > this.MAX_BYTES) {
      note.textContent = 'That file is ' + Math.round(file.size / 1048576) +
        'MB — too big. Paste just the page source instead.';
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      document.getElementById('check-input').value = fr.result;
      note.textContent = file.name + ' loaded';
      this.run();
    };
    fr.onerror = () => { note.textContent = 'Could not read that file.'; };
    fr.readAsText(file);
  },

  loadSample() {
    document.getElementById('check-input').value = this.SAMPLE;
    document.getElementById('check-fname').textContent = 'Sample: a typical restaurant homepage';
    this.run();
  },

  run() {
    const input = document.getElementById('check-input').value;
    const res = Checker.analyze(input);
    this.render(res);
    const out = document.getElementById('check-results');
    const y = out.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  },

  render(r) {
    const out = document.getElementById('check-results');
    const c = r.counts;
    const tone = c.critical > 0 ? 'bad' : c.important > 0 ? 'warn' : 'good';

    const headline = c.critical > 0
      ? c.critical + ' thing' + (c.critical === 1 ? '' : 's') + ' to fix first'
      : c.important > 0
        ? 'Foundations are there, ' + c.important + ' gap' + (c.important === 1 ? '' : 's') + ' to close'
        : 'This is in good shape';

    const sub = c.critical > 0
      ? 'The critical items below are the ones actively costing you customers. Each one is ordinary work, not a project — start at the top.'
      : c.important > 0
        ? 'Nothing is broken. The items below are visibility you are leaving on the table.'
        : r.blocks
          ? 'No critical or important problems found. Work the nice-to-haves when you have time, then move on to the audit.'
          : 'Nothing was found to check. Paste your page source above to get a real report.';

    let html =
      '<div class="verdict v-' + tone + '">' +
        '<div><h3>' + headline + '</h3><p>' + sub + '</p></div>' +
        '<div class="tally">' +
          this.chip('c', c.critical, 'Critical') +
          this.chip('i', c.important, 'Important') +
          this.chip('n', c.nice, 'Nice to have') +
          this.chip('w', r.wins.length, 'Already good') +
        '</div>' +
      '</div>';

    html += '<p class="muted" style="font-size:.9rem;margin-bottom:22px">' +
      (r.blocks ? 'Read ' + r.blocks + ' structured data block' + (r.blocks === 1 ? '' : 's') : 'No structured data blocks found') +
      (r.isHtml ? ', plus the on-page fundamentals from your HTML.' : '. Paste your full page source for the on-page checks too.') +
      '</p>';

    const order = ['critical', 'important', 'nice'];
    const titles = {
      critical: 'Fix these first',
      important: 'Worth doing next',
      nice: 'When you have time'
    };
    order.forEach(sev => {
      const list = r.findings.filter(f => f.sev === sev);
      if (!list.length) return;
      html += '<h3 style="margin-top:34px">' + titles[sev] +
              ' <span class="muted" style="font-family:var(--sans);font-size:.8rem;font-weight:500">(' +
              list.length + ')</span></h3>';
      list.forEach(f => {
        html += '<div class="finding ' + sev + '">' +
          '<h4><span class="sev ' + sev + '">' + sev + '</span> ' + this.esc(f.title) + '</h4>' +
          '<p>' + this.esc(f.detail) + '</p>' +
          '<p class="do"><b>What to do:</b> ' + this.esc(f.fix) + '</p>' +
        '</div>';
      });
    });

    if (r.wins.length) {
      html += '<h3 style="margin-top:38px">Already in place ' +
              '<span class="muted" style="font-family:var(--sans);font-size:.8rem;font-weight:500">(' +
              r.wins.length + ')</span></h3>' +
              '<div class="wins-grid">' +
        r.wins.map(w => '<div class="win"><span class="tick">✓</span><span><b>' +
          this.esc(w.title) + '</b><span>' + this.esc(w.detail) + '</span></span></div>').join('') +
      '</div>';
    }

    html += '<div class="callout ai" style="margin-top:34px">' +
      '<strong>🤖 Next step</strong><p>' +
      'Press <b>Build my corrected markup</b> to merge what you already have with your restaurant ' +
      'details, drop anything that breaks the rules, and produce a clean block you can paste in. ' +
      'Then run the <a href="#audit">full audit</a> for everything this check cannot see — your ' +
      'Google profile, your reviews and your listings.' +
      '</p></div>' +
      '<div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">' +
        '<button type="button" class="btn btn-primary" id="btn-build-fixed">Build my corrected markup →</button>' +
        '<a class="btn btn-ghost" href="#audit">Run the full audit</a>' +
        '<button type="button" class="btn btn-ghost" id="btn-dl-check">⬇ Download this report</button>' +
      '</div>' +
      '<div id="fixed-out" style="margin-top:22px"></div>';

    out.innerHTML = html;
    document.getElementById('btn-build-fixed').addEventListener('click', () => this.buildFixed(r));
    document.getElementById('btn-dl-check').addEventListener('click', () => this.download(r));
  },

  chip(cls, n, label) {
    return '<div class="tally-chip ' + cls + '"><span class="tn">' + n +
           '</span><span class="tl">' + label + '</span></div>';
  },

  /* Pull whatever the schema-generator form and the audit already know. */
  gatherExtras() {
    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const geoRaw = val('s-geo');
    const gm = geoRaw.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    return {
      hours: (window.App && App.parseHours) ? App.parseHours() : [],
      menu: val('s-menu'),
      book: val('s-book'),
      sameAs: val('s-same').split('\n').map(x => x.trim()).filter(Boolean),
      geo: gm ? { '@type': 'GeoCoordinates', latitude: +gm[1], longitude: +gm[2] } : null
    };
  },

  buildFixed(r) {
    const profile = (window.Audit && Audit.state.profile) || {};
    const obj = Checker.buildFixed(r, profile, this.gatherExtras());
    const json = JSON.stringify(obj, null, 2);
    const block = '<script type="application/ld+json">\n' + json + '\n</' + 'script>';

    const holes = (json.match(/FILL_IN/g) || []).length;
    const warn = holes
      ? '<div class="callout warn" style="margin:0 0 14px"><strong>' + holes +
        ' value' + (holes === 1 ? '' : 's') + ' still missing</strong><p>' +
        'Fill in the <a href="#audit">Add your restaurant</a> form and the hours in the ' +
        '<a href="#schema">generator</a> below, then press this button again — or replace each ' +
        '<code>FILL_IN</code> by hand. Never publish markup containing a placeholder.</p></div>'
      : '<div class="callout tip" style="margin:0 0 14px"><strong>Complete</strong><p>' +
        'No placeholders left. Validate it in the Rich Results Test, then paste it into the ' +
        '<code>&lt;head&gt;</code> of your homepage.</p></div>';

    document.getElementById('fixed-out').innerHTML =
      '<h3>Your corrected markup</h3>' +
      '<p class="muted" style="font-size:.92rem">Built from what you pasted, topped up with your ' +
      'restaurant details, with policy violations removed and the wrong shapes upgraded.</p>' +
      warn +
      '<div class="code-out" id="fixed-code">' + this.esc(block) + '</div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-copy-fixed">📋 Copy code</button>' +
        '<a class="btn btn-ghost btn-sm" href="https://search.google.com/test/rich-results" ' +
          'target="_blank" rel="noopener">Validate it ↗</a>' +
      '</div>';

    document.getElementById('btn-copy-fixed').addEventListener('click', e => {
      if (window.App) App.copy(block, e.target);
    });
    const el = document.getElementById('fixed-out');
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  },

  download(r) {
    const p = (window.Audit && Audit.state.profile) || {};
    const nl = '\n';
    let md = '# Site & schema check' + (p.name ? ' — ' + p.name : '') + nl + nl;
    md += 'Generated ' + new Date().toLocaleDateString() + nl + nl;
    md += '- Structured data blocks read: ' + r.blocks + nl;
    md += '- Critical: ' + r.counts.critical + '  ·  Important: ' + r.counts.important +
          '  ·  Nice to have: ' + r.counts.nice + '  ·  Already good: ' + r.wins.length + nl + nl;

    ['critical', 'important', 'nice'].forEach(sev => {
      const list = r.findings.filter(f => f.sev === sev);
      if (!list.length) return;
      md += '## ' + sev[0].toUpperCase() + sev.slice(1) + nl + nl;
      list.forEach((f, i) => {
        md += '### ' + (i + 1) + '. ' + f.title + nl + nl;
        md += f.detail + nl + nl;
        md += '**What to do:** ' + f.fix + nl + nl;
      });
    });

    if (r.wins.length) {
      md += '## Already in place' + nl + nl;
      r.wins.forEach(w => { md += '- **' + w.title + '** — ' + w.detail + nl; });
      md += nl;
    }

    const slug = (p.name || 'restaurant').toLowerCase()
      .replace(/['\u2019"]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = slug + '-site-check.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },

  esc(s) {
    return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  },

  /* A deliberately mediocre page — roughly what a real independent
     restaurant site looks like before any of this work. */
  SAMPLE: [
    '<!doctype html>',
    '<html>',
    '<head>',
    '  <title>Home</title>',
    '  <script type="application/ld+json">',
    '  {',
    '    "@context": "https://schema.org",',
    '    "@type": "LocalBusiness",',
    '    "name": "Rosa\'s Trattoria - Best Italian Restaurant Asheville",',
    '    "address": "412 Main Street, Asheville, NC 28801",',
    '    "telephone": "8285550142",',
    '    "openingHours": "Tu-Su 17:00-22:00",',
    '    "hasMenu": "http://rosastrattoria.com/menu-spring-2024.pdf",',
    '    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "212" }',
    '  }',
    '  </' + 'script>',
    '</head>',
    '<body>',
    '  <h1>Rosa\'s Trattoria</h1>',
    '  <h1>Welcome!</h1>',
    '  <img src="http://rosastrattoria.com/img/hero.jpg">',
    '  <p>Call us on (828) 555-0142 to book a table.</p>',
    '  <a href="/menu-spring-2024.pdf">View our menu</a>',
    '</body>',
    '</html>'
  ].join('\n')
};

window.CheckerUI = CheckerUI;
