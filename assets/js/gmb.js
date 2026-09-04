/* ==========================================================================
   Google Business Profile checks
   Run against the Places API record the backend returns. Everything here is
   derived from data Google already publishes about the restaurant — the
   owner types nothing.

   Each check: test(place) returns null to pass, or a detail string to fail.
   ========================================================================== */

const GMB_CHECKS = [
  {
    id: 'status', sev: 'critical', label: 'Listing is marked open',
    why: 'A profile flagged closed is removed from most results and quietly ends your discovery traffic. It happens by accident more often than owners expect.',
    fix: 'Open your Google Business Profile and set the business status back to open. If Google closed it automatically, use the reinstatement flow and be ready to show proof of operation.',
    test: p => {
      const s = p.businessStatus;
      if (!s || s === 'OPERATIONAL') return null;
      return s === 'CLOSED_TEMPORARILY'
        ? 'Google currently lists you as temporarily closed.'
        : 'Google currently lists you as permanently closed.';
    }
  },
  {
    id: 'hours', sev: 'critical', label: 'Opening hours are published',
    why: 'Hours drive the "Open now" filter, which is how most hungry people narrow a list. No hours means you drop out of that filter entirely.',
    fix: 'Add your regular hours in the Google Business Profile, then add special hours for every holiday and closure over the next twelve months in one sitting.',
    test: p => (p.regularOpeningHours && p.regularOpeningHours.periods && p.regularOpeningHours.periods.length)
      ? null : 'No opening hours are published on your profile.'
  },
  {
    id: 'phone', sev: 'critical', label: 'Phone number is listed',
    why: 'Calls are the highest-intent action a restaurant profile produces, and the call button cannot appear without a number.',
    fix: 'Add your main phone number to the profile. Use the line that is actually answered during service.',
    test: p => (p.nationalPhoneNumber || p.internationalPhoneNumber) ? null : 'No phone number on the profile.'
  },
  {
    id: 'website', sev: 'critical', label: 'Website link is set',
    why: 'Without your own link, the profile sends traffic to aggregators and delivery apps — every tap becoming a commission on an order that was already yours.',
    fix: 'Add your website to the profile, and set your own ordering and reservation links as the preferred ones.',
    test: p => p.websiteUri ? null : 'No website link on the profile.'
  },
  {
    id: 'website-match', sev: 'important', label: 'Website link points at your own site',
    why: 'A profile pointing at a third-party page hands over both the traffic and the customer relationship.',
    fix: 'Change the website field to your own domain, and check the order and reserve buttons on a phone to see where they actually land.',
    test: (p, ctx) => {
      if (!p.websiteUri || !ctx || !ctx.domain) return null;
      const host = (() => { try { return new URL(p.websiteUri).hostname.replace(/^www\./, ''); } catch { return ''; } })();
      if (!host) return null;
      return host.toLowerCase() === ctx.domain.toLowerCase() ? null
        : 'Your profile links to ' + host + ' rather than ' + ctx.domain + '.';
    }
  },
  {
    id: 'rating', sev: 'important', label: 'Rating is competitive',
    why: 'Rating is heavily weighted in the local pack, and it is the first number an AI assistant quotes when asked whether a place is any good.',
    fix: 'Read your recent negatives for the recurring theme and fix that operational issue first. Then build a steady review-request habit so new ratings outweigh the old ones.',
    test: p => {
      if (typeof p.rating !== 'number') return 'No rating yet — you have too few reviews for Google to show one.';
      if (p.rating < 4.0) return 'Your rating is ' + p.rating.toFixed(1) + '. Below 4.0, a meaningful share of diners filter you out before reading anything.';
      return null;
    }
  },
  {
    id: 'review-volume', sev: 'important', label: 'Enough reviews to compete',
    why: 'Review count is both a ranking signal and a credibility signal. Thin counts get skipped even at a high rating.',
    fix: 'Build the ask into the shift: a QR code on the check presenter, a line in the receipt email, a link in the booking confirmation. Never gate by mood and never pay for reviews.',
    test: p => {
      const n = p.userRatingCount || 0;
      if (n === 0) return 'You have no reviews on Google.';
      if (n < 25) return 'You have ' + n + ' reviews. Most competitive independents sit in the hundreds.';
      if (n < 100) return 'You have ' + n + ' reviews — a reasonable base, but likely behind the restaurants ranking above you.';
      return null;
    }
  },
  {
    id: 'review-recency', sev: 'important', label: 'Reviews are still arriving',
    why: 'A steady trickle signals a live, busy restaurant. A profile whose newest review is months old reads as fading, to both Google and the person reading it.',
    fix: 'Make the review ask part of every shift rather than an occasional campaign. Five asks a shift is roughly 150 a month.',
    test: p => {
      const rs = p.reviews || [];
      if (!rs.length) return null;
      const newest = rs.map(r => new Date(r.publishTime || 0).getTime()).sort((a, b) => b - a)[0];
      if (!newest) return null;
      const days = Math.round((Date.now() - newest) / 86400000);
      if (days > 90) return 'Your most recent review is about ' + days + ' days old.';
      if (days > 45) return 'Your most recent review is about ' + days + ' days old — the flow has slowed.';
      return null;
    }
  },
  {
    id: 'photos', sev: 'important', label: 'Enough photos on the profile',
    why: 'Photo volume and freshness correlate strongly with clicks and direction requests. A profile with a handful of photos looks closed.',
    fix: 'Cover the full set — exterior with signage, entrance, dining room by day and night, bar, patio, parking, ten or more hero dishes, the team — and upload a few every week rather than forty at once.',
    test: p => {
      const n = (p.photos || []).length;
      if (n === 0) return 'No photos are visible on your profile.';
      if (n < 10) return 'Only ' + n + ' photo' + (n === 1 ? '' : 's') + ' visible through Google\'s API, which caps at 10 — so your real total is low.';
      return null;
    }
  },
  {
    id: 'category', sev: 'important', label: 'Category is specific',
    why: 'Primary category is one of the strongest local ranking levers. "Restaurant" competes with every restaurant in the city; "Neapolitan pizza restaurant" competes with four.',
    fix: 'Set the single most specific category that genuinely describes your main business, then add two to five secondaries for real secondary services.',
    test: p => {
      const t = p.primaryType || '';
      if (!t) return 'No primary category is set.';
      if (/^(restaurant|food|point_of_interest|establishment|store)$/i.test(t)) {
        return 'Your primary category is "' + (p.primaryTypeDisplayName?.text || t) + '", which is as broad as it gets.';
      }
      return null;
    }
  },
  {
    id: 'price', sev: 'important', label: 'Price level is set',
    why: 'Price is one of the first filters a diner applies, and an assistant will skip you rather than guess it.',
    fix: 'Set your price range in the profile so you appear in price-filtered results and AI answers that mention cost.',
    test: p => p.priceLevel ? null : 'No price level is set on your profile.'
  },
  {
    id: 'accessibility', sev: 'important', label: 'Accessibility is declared',
    why: 'Accessibility attributes power a filter that people who need it rely on completely — and leaving them blank makes you invisible to that search, not neutral.',
    fix: 'Fill in the accessibility attributes honestly: entrance, restroom, seating and parking.',
    test: p => {
      const a = p.accessibilityOptions;
      return (a && Object.keys(a).length) ? null : 'No accessibility attributes are set.';
    }
  },
  {
    id: 'dietary', sev: 'important', label: 'Dietary options are declared',
    why: 'Dietary searches are high-intent and low-competition. "Vegan" and "gluten free" plus a city is a search you can win outright — but only if the box is ticked.',
    fix: 'Set the dietary attributes that genuinely apply, and describe on your own menu page how the kitchen handles them.',
    test: p => (p.servesVegetarianFood === undefined || p.servesVegetarianFood === null)
      ? 'No dietary options are declared on your profile.' : null
  },
  {
    id: 'service-options', sev: 'nice', label: 'Service options are complete',
    why: 'Dine-in, takeout, delivery and curbside each drive their own filtered searches.',
    fix: 'Tick every service option you actually offer in the profile.',
    test: p => {
      const missing = ['dineIn', 'takeout', 'delivery'].filter(k => p[k] === undefined || p[k] === null);
      return missing.length ? 'Not declared: ' + missing.join(', ') + '.' : null;
    }
  },
  {
    id: 'reservable', sev: 'nice', label: 'Reservation status is declared',
    why: 'Assistants will not infer this. If nothing says you take bookings, "can I reserve a table there" gets answered with a shrug.',
    fix: 'Set whether you accept reservations, and add your booking link.',
    test: p => (p.reservable === undefined || p.reservable === null)
      ? 'Whether you take reservations is not declared.' : null
  },
  {
    id: 'summary', sev: 'nice', label: 'Profile description is written',
    why: 'Both Google and AI assistants read the description when summarizing what kind of place you are.',
    fix: 'Write 750 characters covering what you serve, the signature dishes, the neighborhood and who it suits. Name specific dishes rather than claiming quality.',
    test: p => (p.editorialSummary && p.editorialSummary.text) ? null : 'No description is published on your profile.'
  },
  {
    id: 'amenities', sev: 'nice', label: 'Amenities are filled in',
    why: 'Each amenity is a filter and an answerable question — outdoor seating, kids, dogs, restrooms, parking, payment methods.',
    fix: 'Work through every attribute tab in the profile and complete the ones that apply.',
    test: p => {
      const missing = [];
      if (p.outdoorSeating === undefined || p.outdoorSeating === null) missing.push('outdoor seating');
      if (p.goodForChildren === undefined || p.goodForChildren === null) missing.push('good for children');
      if (p.allowsDogs === undefined || p.allowsDogs === null) missing.push('dogs allowed');
      if (!p.paymentOptions || !Object.keys(p.paymentOptions).length) missing.push('payment methods');
      if (!p.parkingOptions || !Object.keys(p.parkingOptions).length) missing.push('parking');
      return missing.length >= 2 ? 'Not declared: ' + missing.join(', ') + '.' : null;
    }
  },
  {
    id: 'meals', sev: 'nice', label: 'Meal services are declared',
    why: 'Breakfast, brunch, lunch and dinner are each their own search, and "open for brunch near me" is a filter you can only win by ticking the box.',
    fix: 'Declare which meals you serve in the profile attributes.',
    test: p => {
      const keys = ['servesBreakfast', 'servesBrunch', 'servesLunch', 'servesDinner'];
      const set = keys.filter(k => p[k] !== undefined && p[k] !== null);
      return set.length === 0 ? 'No meal services are declared.' : null;
    }
  }
];

/* Run the checks and collect what is already right. */
function analyzeGmb(place, ctx) {
  const findings = [], wins = [];
  if (!place) return { findings, wins, present: false };

  GMB_CHECKS.forEach(c => {
    let detail = null;
    try { detail = c.test(place, ctx || {}); }
    catch { detail = null; }
    if (detail) findings.push({ sev: c.sev, title: c.label.replace(/^([A-Z])/, m => m), detail, fix: c.fix, why: c.why, source: 'gmb' });
    else wins.push({ title: c.label, detail: describe(c.id, place), sev: c.sev, source: 'gmb' });
  });

  return {
    findings, wins, present: true,
    counts: {
      critical: findings.filter(f => f.sev === 'critical').length,
      important: findings.filter(f => f.sev === 'important').length,
      nice: findings.filter(f => f.sev === 'nice').length
    }
  };
}

/* A short human-readable value for the "already good" column. */
function describe(id, p) {
  switch (id) {
    case 'rating': return p.rating.toFixed(1) + ' stars';
    case 'review-volume': return (p.userRatingCount || 0).toLocaleString() + ' reviews';
    case 'photos': return (p.photos || []).length + '+ photos visible';
    case 'category': return (p.primaryTypeDisplayName && p.primaryTypeDisplayName.text) || p.primaryType;
    case 'price': return String(p.priceLevel).replace('PRICE_LEVEL_', '').toLowerCase().replace(/_/g, ' ');
    case 'website': try { return new URL(p.websiteUri).hostname; } catch { return p.websiteUri; }
    case 'phone': return p.nationalPhoneNumber || p.internationalPhoneNumber;
    case 'hours': return 'Published for the week';
    case 'status': return 'Open';
    case 'review-recency': return 'Recent reviews arriving';
    default: return 'Declared';
  }
}

window.GMB_CHECKS = GMB_CHECKS;
window.analyzeGmb = analyzeGmb;
