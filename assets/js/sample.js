/* ==========================================================================
   Sample report
   A made-up restaurant with a realistically neglected profile, so the
   results screen can be seen without deploying the analyser. Always
   labelled as a sample — never presented as the visitor's own data.
   ========================================================================== */

const SAMPLE_REPORT = {
  ok: true,
  isSample: true,
  finalUrl: 'https://rosastrattoria.example',
  identity: {
    name: "Rosa's Trattoria",
    address: '412 Main Street, Asheville, NC 28801',
    phone: '(828) 555-0142',
    locality: 'Asheville', region: 'NC', postal: '28801',
    domain: 'rosastrattoria.example'
  },
  gmbConfigured: true,
  gmbMatchedOn: 'name',
  /* The kind of markup a restaurant site actually ships with: a generic
     business type, a string address, free-text hours, a PDF menu link and
     a self-serving rating. */
  html: [
    '<!doctype html><html><head>',
    '<title>Home</title>',
    '<script type="application/ld+json">',
    '{"@context":"https://schema.org","@type":"LocalBusiness",',
    '"name":"Rosa\'s Trattoria - Best Italian Restaurant Asheville",',
    '"address":"412 Main Street, Asheville, NC 28801",',
    '"telephone":"8285550142",',
    '"openingHours":"Tu-Su 17:00-22:00",',
    '"hasMenu":"http://rosastrattoria.example/menu-spring.pdf",',
    '"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.9","reviewCount":"212"}}',
    '</' + 'script>',
    '</head><body>',
    '<h1>Rosa\'s Trattoria</h1><h1>Welcome!</h1>',
    '<img src="http://rosastrattoria.example/img/hero.jpg">',
    '<p>Call (828) 555-0142 to book a table.</p>',
    '<a href="/menu-spring.pdf">View our menu</a>',
    '</body></html>'
  ].join('\n'),
  gmb: {
    businessStatus: 'OPERATIONAL',
    rating: 3.9,
    userRatingCount: 41,
    primaryType: 'restaurant',
    primaryTypeDisplayName: { text: 'Restaurant' },
    nationalPhoneNumber: '(828) 555-0142',
    websiteUri: 'https://order-partner.example/rosas',
    regularOpeningHours: { periods: [1, 2, 3, 4, 5] },
    photos: [{}, {}, {}, {}],
    reviews: [{ publishTime: new Date(Date.now() - 74 * 86400000).toISOString() }],
    dineIn: true,
    takeout: true
  }
};

window.SAMPLE_REPORT = SAMPLE_REPORT;
