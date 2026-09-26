/* ==========================================================================
   One-click restaurant check
   Owner types a web address. We fetch the site and their Google Business
   Profile through the Dineline analyser, run both rule sets, and return a
   single score with a ranked list of fixes.

   With no backend configured this degrades to the paste flow, which runs
   the same page checks minus the Google lookup.
   ========================================================================== */

/* Checks are weighted by severity, and the score is the share of weight
   passed. A flat deduction per finding bottoms out at zero on any weak
   site, which tells the owner nothing about whether they are improving. */
const WEIGHT = { critical: 5, important: 3, nice: 1 };

const Analyzer = {
  last: null,

  init() {
    const form = document.getElementById('url-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      this.run(document.getElementById('url-input').value);
    });

    const sampleBtn = document.getElementById('btn-sample-report');
    if (sampleBtn) sampleBtn.addEventListener('click', () => this.runSample());

    if (!this.apiBase()) this.showUnconfigured();

    /* Single-file builds open on the example so the page shows what it
       does rather than an empty shell. */
    const cfg = window.DINELINE_CONFIG || {};
    if (cfg.autoSample && window.SAMPLE_REPORT) this.runSample(true);
  },

  apiBase() {
    const c = window.DINELINE_CONFIG || {};
    return (c.apiBase || '').replace(/\/+$/, '');
  },

  /* No analyser deployed yet — say so plainly and open the paste flow,
     rather than letting the button fail silently. */
  showUnconfigured() {
    document.getElementById('url-note').innerHTML =
      '<b>Live scoring is not switched on for this copy yet</b> &mdash; see the sample report below ' +
      'for what you get, or <a href="#paste-fallback" id="open-paste">paste your page source</a> ' +
      'to run the website checks right now. Turning on the one-click version takes about ten ' +
      'minutes (<code>api/README.md</code>).';
    const open = document.getElementById('open-paste');
    if (open) open.addEventListener('click', e => {
      e.preventDefault();
      const d = document.getElementById('paste-fallback');
      d.open = true;
      d.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  },

  status(html, tone) {
    const el = document.getElementById('analyze-status');
    el.className = 'analyze-status ' + (tone || '');
    el.innerHTML = html;
    el.classList.remove('hidden');
  },

  /* Render the bundled example. Marked as a sample in the UI so it can
     never be mistaken for the visitor's own restaurant. */
  runSample(quiet) {
    if (!window.SAMPLE_REPORT) return;
    document.getElementById('analyze-status').classList.add('hidden');
    const preview = document.getElementById('checker-preview');
    if (preview) preview.classList.add('hidden');
    this.render(window.SAMPLE_REPORT, quiet);
  },

  async run(rawUrl) {
    const url = String(rawUrl || '').trim();
    if (!url) {
      this.status('<p>Enter your restaurant&rsquo;s web address first.</p>', 'bad');
      return;
    }
    if (!this.apiBase()) { this.showUnconfigured(); return; }

    const btn = document.getElementById('btn-analyze');
    btn.disabled = true;
    document.getElementById('analyze-results').innerHTML = '';
    this.status(
      '<div class="spin" aria-hidden="true"></div>' +
      '<div><b>Checking ' + this.esc(url.replace(/^https?:\/\//, '')) + '</b>' +
      '<p>Reading your pages, then looking up your Google Business Profile…</p></div>', 'working');

    let data;
    try {
      const res = await fetch(this.apiBase() + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data && data.error ? data.error : 'That check did not complete.');
    } catch (e) {
      btn.disabled = false;
      this.status(
        '<div><b>We could not check that address</b><p>' + this.esc(e.message) + '</p>' +
        '<p style="margin:8px 0 0">You can still <a href="#paste-fallback">paste your page source</a> ' +
        'below — it runs the same page checks.</p></div>', 'bad');
      return;
    }

    btn.disabled = false;
    document.getElementById('analyze-status').classList.add('hidden');
    const preview = document.getElementById('checker-preview');
    if (preview) preview.classList.add('hidden');
    this.render(data);
  },

  /* -------------------------------------------------------------- scoring */
  scoreOf(findings, wins) {
    const lost = findings.reduce((n, f) => n + (WEIGHT[f.sev] || 1), 0);
    const kept = (wins || []).reduce((n, w) => n + (WEIGHT[w.sev] || 2), 0);
    const total = lost + kept;
    if (!total) return 100;
    return Math.max(0, Math.min(100, Math.round((kept / total) * 100)));
  },

  render(data, quiet) {
    const markup = Checker.analyze(data.html || '');
    const aeo = window.analyzeAeo
      ? analyzeAeo(data.html || '', data.robots)
      : { findings: [], wins: [] };
    /* Markup and answer-readiness are both "what an assistant finds on
       your site", so they score and report as one side. */
    const site = {
      findings: [...aeo.findings, ...markup.findings],
      wins: [...aeo.wins, ...markup.wins]
    };
    const gmb = window.analyzeGmb
      ? analyzeGmb(data.gmb, { domain: (data.identity || {}).domain })
      : { findings: [], wins: [], present: false };

    const siteScore = this.scoreOf(site.findings, site.wins);
    const gmbScore = gmb.present ? this.scoreOf(gmb.findings, gmb.wins) : null;

    /* The profile outranks the site for a restaurant, so it carries more
       weight — but only when we actually found one. */
    const overall = gmbScore === null
      ? siteScore
      : Math.round(gmbScore * 0.55 + siteScore * 0.45);

    const band = (window.BANDS || []).find(b => overall >= b.min) || { grade: '—', label: '', summary: '', tone: 'warn' };

    const all = [...gmb.findings, ...site.findings].sort((a, b) => {
      const order = { critical: 0, important: 1, nice: 2 };
      return order[a.sev] - order[b.sev];
    });
    const wins = [...gmb.wins, ...site.wins];

    this.last = { data, site, gmb, siteScore, gmbScore, overall, all, wins };

    const id = data.identity || {};
    const out = document.getElementById('analyze-results');

    const ranked = this.rank(all);
    const counts = {
      critical: all.filter(f => f.sev === 'critical').length,
      important: all.filter(f => f.sev === 'important').length,
      nice: all.filter(f => f.sev === 'nice').length,
      diy: all.filter(f => f.doIn === 'google' || f.doIn === 'site').length,
      top10Quick: ranked.slice(0, 10).filter(f => f.mins && f.mins <= 15).length
    };
    out.innerHTML =
      (data.isSample
        ? '<div class="sample-flag"><b>This is a sample.</b> Rosa&rsquo;s Trattoria is a made-up ' +
          'restaurant, shown so you can see what the report looks like. Type your own address ' +
          'above for your real score.</div>'
        : '') +
      this.headerHtml(id, data, overall, band, gmbScore, siteScore, counts, wins.length) +
      this.gmbNoticeHtml(data, gmb) +
      this.findingsHtml(all) +
      this.winsHtml(wins) +
      this.ctaHtml(all);

    const dl = document.getElementById('btn-dl-analyze');
    if (dl) dl.addEventListener('click', () => this.download());

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = () => {
      out.querySelectorAll('[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
    };
    if (reduced) paint(); else requestAnimationFrame(() => requestAnimationFrame(paint));

    /* Auto-loaded samples must not scroll: the top of the page is what a
       shared link and a thumbnail show. */
    if (!quiet) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  headerHtml(id, data, overall, band, gmbScore, siteScore, counts, passing) {
    const tone = overall >= 70 ? 'good' : overall >= 45 ? 'warn' : 'bad';
    const name = id.name || 'Your restaurant';
    const verdict = overall >= 85 ? "You're ahead of nearly everyone."
                  : overall >= 70 ? "Solid. A few gaps worth closing."
                  : overall >= 45 ? "Half built. The wins below are quick."
                  : overall >= 25 ? "You're losing customers right now."
                  : "Right now, you're close to invisible.";

    const meter = (label, val, note) => {
      if (val === null) {
        return '<div class="meter"><div class="meter-top"><span class="ml">' + label + '</span>' +
               '<span class="mv muted">&mdash;</span></div>' +
               '<div class="meter-track"></div><div class="meter-note">' + note + '</div></div>';
      }
      const cls = val >= 75 ? 'good' : val >= 45 ? 'warn' : 'bad';
      return '<div class="meter"><div class="meter-top"><span class="ml">' + label + '</span>' +
        '<span class="mv">' + val + '<span style="color:var(--ink-4);font-size:.8rem">/100</span></span></div>' +
        '<div class="meter-track"><div class="meter-fill ' + cls + '" data-w="' + val + '"></div></div>' +
        '<div class="meter-note">' + note + '</div></div>';
    };

    const kpi = (cls, n, label, note) =>
      '<div class="kpi"><div class="kl"><span class="dot ' + cls + '"></span>' + label + '</div>' +
      '<div class="kv">' + n + '</div><div class="kn">' + note + '</div></div>';

    const diy = counts.diy || 0;
    return '<div class="result-head">' +
      '<div class="score-hero tone-' + tone + '">' +
        '<div class="hero-figure">' +
          '<span class="hf-val">' + overall + '<span class="hf-of">/100</span></span>' +
          '<div class="hf-label">Grade ' + band.grade + '</div>' +
        '</div>' +
        '<div class="score-copy">' +
          '<h3>' + this.esc(name) + '</h3>' +
          '<p class="found">' + this.esc((id.domain || '')) +
            (id.address ? ' &middot; ' + this.esc(id.address) : '') + '</p>' +
          '<p style="font-size:1.06rem;font-weight:600;color:var(--ink)">' + verdict + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="subscores">' +
        meter('Your Google listing', gmbScore,
              gmbScore === null ? 'No listing found.' : 'Where assistants get your facts. 55% of the score.') +
        meter('Your site', siteScore, 'What assistants can read and quote. 45%.') +
      '</div>' +
    '</div>' +
    '<div class="kpi-row">' +
      kpi('critical', counts.critical, 'Urgent', 'Costing you covers today.') +
      kpi('important', counts.top10Quick, 'Under 15 min', 'Of your top ten, done in a coffee break.') +
      kpi('nice', counts.diy, 'You can do yourself', 'No developer needed.') +
      kpi('good', passing, 'Already right', 'Keep it that way.') +
    '</div>';
  },

  gmbNoticeHtml(data, gmb) {
    if (gmb.present) {
      return data.gmbMatchedOn === 'name'
        ? '<div class="callout note"><strong>Double-check this is you</strong><p>We matched by name, ' +
          'not by website link &mdash; because your profile is missing your website. That is on the ' +
          'list below.</p></div>'
        : '';
    }
    if (!data.gmbConfigured) {
      return '<div class="callout note"><strong>Google listing not checked</strong><p>' +
        'The lookup is not switched on here, so this score covers your website only.</p></div>';
    }
    if (data.gmbReason === 'not-found') {
      return '<div class="callout warn"><strong>We could not find you on Google</strong><p>' +
        'This is the most valuable thing on the page. It is free, it takes an afternoon, and it is ' +
        'where hungry people two miles away find you. Start at ' +
        '<a href="https://www.google.com/business/" target="_blank" rel="noopener">google.com/business</a>.' +
        '</p></div>';
    }
    return '<div class="callout note"><strong>Google listing not checked</strong><p>' +
      'The lookup did not complete this time, so this score covers your website only.</p></div>';
  },

  /* Ten things, ranked by what they are worth divided by how hard they
     are. An owner with a shift starting in an hour needs a short list they
     can actually work, not forty-four findings. */
  rank(all) {
    /* Severity leads; ease lifts the work an owner can do today over the
       same-value work that needs booking a developer. Weighting ease any
       harder puts trivia above real money. */
    const SEV = { critical: 6, important: 3, nice: 1 };
    const EASE = { google: 2, site: 1.6, ops: 1.2, code: 1 };
    const ranked = [...all]
      .map(f => ({ ...f, weight: (SEV[f.sev] || 1) * (EASE[f.doIn] || 1) }))
      /* A blocked crawler is not one item among many — while it stands,
         every other fix is invisible to that assistant. It leads. */
      .sort((a, b) => (b.blocker ? 1 : 0) - (a.blocker ? 1 : 0) ||
                      b.weight - a.weight ||
                      (a.mins || 99) - (b.mins || 99));

    /* Two detectors can raise the same issue from different angles — the
       menu PDF shows up in both the markup and the page itself. Keep the
       strongest and drop the echo, so ten slots hold ten problems. */
    const seen = new Set();
    return ranked.filter(f => {
      if (!f.topic) return true;
      if (seen.has(f.topic)) return false;
      seen.add(f.topic);
      return true;
    });
  },

  WHERE: {
    google: { label: 'Google profile', hint: 'Edit it yourself' },
    site:   { label: 'Your website',   hint: 'Edit it yourself' },
    ops:    { label: 'In the shift',   hint: 'A habit, not an edit' },
    code:   { label: 'Web person',     hint: 'Send them the line' }
  },

  time(m) {
    if (!m) return 'ongoing';
    if (m < 60) return m + ' min';
    return (m / 60) + (m === 60 ? ' hour' : ' hours');
  },

  findingsHtml(all) {
    if (!all.length) {
      return '<div class="callout tip" style="margin-top:26px"><strong>Nothing outstanding</strong>' +
        '<p>Your site and your Google listing pass every check. Take the <a href="#audit">full ' +
        'audit</a> next &mdash; it covers what no automatic check can see.</p></div>';
    }

    const ranked = this.rank(all);
    const top = ranked.slice(0, 10);
    const rest = ranked.slice(10);
    const quick = top.filter(f => f.mins && f.mins <= 15).length;

    let html = '<div class="top-head">' +
      '<div>' +
        '<h3>Your top ' + top.length + '</h3>' +
        '<p>Ranked by payoff against how hard it is. ' +
        (quick ? '<b>' + quick + ' of them take under 15 minutes.</b>' : '') + '</p>' +
      '</div>' +
      '<div class="top-legend">' +
        '<span><span class="wdot google"></span>You can edit</span>' +
        '<span><span class="wdot code"></span>Needs your web person</span>' +
      '</div>' +
    '</div>';

    html += '<ol class="fixlist">' + top.map((f, i) => {
      const w = this.WHERE[f.doIn] || this.WHERE.code;
      const diy = f.doIn === 'google' || f.doIn === 'site';
      return '<li class="fix">' +
        '<span class="fix-n">' + (i + 1) + '</span>' +
        '<div class="fix-body">' +
          '<div class="fix-top">' +
            '<h4>' + this.esc(f.title) + '</h4>' +
            '<span class="chip where ' + f.doIn + '">' + w.label + '</span>' +
            '<span class="chip time">' + this.time(f.mins) + '</span>' +
            (f.sev === 'critical' ? '<span class="chip urgent">Costing you covers</span>' : '') +
          '</div>' +
          '<p class="fix-what">' + this.esc(f.detail) + '</p>' +
          '<p class="fix-do"><b>' + (diy ? 'Do this:' : 'Send them this:') + '</b> ' +
            this.esc(this.firstSentence(f.fix)) + '</p>' +
        '</div>' +
      '</li>';
    }).join('') + '</ol>';

    if (rest.length) {
      const cards = rest.map(f => {
        const w = this.WHERE[f.doIn] || this.WHERE.code;
        return '<div class="finding ' + f.sev + '">' +
          '<h4>' + this.esc(f.title) +
          '<span class="chip where ' + f.doIn + '">' + w.label + '</span></h4>' +
          '<p>' + this.esc(f.detail) + '</p>' +
          '<p class="do"><b>Do this:</b> ' + this.esc(this.firstSentence(f.fix)) + '</p>' +
        '</div>';
      }).join('');
      /* Say what is actually down there — criticals can fall below the cut
         when they need a developer, and claiming otherwise is a lie. */
      const restCrit = rest.filter(f => f.sev === 'critical').length;
      const tail = restCrit
        ? ' &mdash; ' + restCrit + ' still worth doing, just slower'
        : ' &mdash; none of them urgent';
      html += '<details class="fallback" style="margin-top:24px"><summary>' +
        'We found ' + rest.length + ' more' + tail +
        '</summary><div class="fallback-body" style="padding-top:16px">' + cards + '</div></details>';
    }
    return html;
  },

  /* The fix text is written long for the docs; on screen one sentence is
     enough to act on. The full wording stays in the download. */
  firstSentence(t) {
    const m = String(t || '').match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : t;
  },

  winsHtml(wins) {
    if (!wins.length) return '';
    return '<details class="fallback" style="margin-top:26px"><summary>Already right ' +
      '<span class="count-note">(' + wins.length + ')</span></summary>' +
      '<div class="fallback-body" style="padding-top:16px"><div class="wins-grid">' + wins.map(w =>
        '<div class="win"><span class="tick">&#10003;</span><span><b>' + this.esc(w.title) +
        '</b><span>' + this.esc(w.detail) + '</span></span></div>').join('') + '</div></div></details>';
  },

  ctaHtml(all) {
    const crit = all.filter(f => f.sev === 'critical').length;
    const cfg = window.DINELINE_CONFIG || {};
    return '<div class="next-block">' +
      '<div>' +
        '<h3 style="margin-top:0">' + (crit ? 'Start at the top.' : 'Nice work.') + '</h3>' +
        '<p style="margin-bottom:0">' + (crit
          ? 'Those ' + crit + ' red item' + (crit === 1 ? '' : 's') + ' are costing you covers this week. '
          : 'The foundations are there. ') +
        'The <a href="#playbook">playbook</a> explains each one, the ' +
        '<a href="#checklists">checklists</a> break them into tasks, and the ' +
        '<a href="#prompts">AI prompts</a> do the writing.</p>' +
      '</div>' +
      '<div class="next-actions">' +
        '<button type="button" class="btn btn-ghost" id="btn-dl-analyze">Download the list</button>' +
        '<a class="btn btn-ghost" href="#audit">Full audit</a>' +
        '<a class="btn btn-primary" href="' + (cfg.bookUrl || 'https://dineline.co/discovery/') +
          '" target="_blank" rel="noopener">Have us do it</a>' +
      '</div>' +
    '</div>';
  },

  download() {
    const r = this.last;
    if (!r) return;
    const id = r.data.identity || {};
    const nl = '\n';
    let md = '# Restaurant check — ' + (id.name || id.domain || 'your restaurant') + nl + nl;
    md += '_Generated ' + new Date().toLocaleDateString() + ' by the Dineline SEO & AEO Playbook_' + nl + nl;
    md += '- **Site checked:** ' + (r.data.finalUrl || '') + nl;
    if (id.address) md += '- **Address found:** ' + id.address + nl;
    md += '- **Overall score:** ' + r.overall + '/100' + nl;
    if (r.gmbScore !== null) md += '- **Google Business Profile:** ' + r.gmbScore + '/100' + nl;
    md += '- **Website & structured data:** ' + r.siteScore + '/100' + nl + nl;

    const ranked = this.rank(r.all);
    md += '## Your top 10' + nl + nl;
    ranked.slice(0, 10).forEach((f, i) => {
      const w = this.WHERE[f.doIn] || this.WHERE.code;
      md += '### ' + (i + 1) + '. ' + f.title + nl + nl;
      md += '- **Where:** ' + w.label + '  |  **Time:** ' + this.time(f.mins) +
            '  |  **Source:** ' + (f.source === 'gmb' ? 'Google listing' : 'Website') + nl;
      md += '- **What is wrong:** ' + f.detail + nl;
      md += '- **Do this:** ' + f.fix + nl + nl;
    });

    const rest = ranked.slice(10);
    if (rest.length) {
      md += '## Everything else we found (' + rest.length + ')' + nl + nl;
      rest.forEach(f => {
        const w = this.WHERE[f.doIn] || this.WHERE.code;
        md += '- **' + f.title + '** (' + w.label + ') — ' + f.detail + nl;
      });
      md += nl;
    }

    if (r.wins.length) {
      md += '## Already in place' + nl + nl;
      r.wins.forEach(w => { md += '- **' + w.title + '** — ' + w.detail + nl; });
      md += nl;
    }
    md += '---' + nl + nl + 'Done-for-you restaurant marketing, tracked to the dollar. https://dineline.co/' + nl;

    const slug = (id.name || id.domain || 'restaurant').toLowerCase()
      .replace(/['’"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    saveTextFile(slug + '-dineline-check.md', md);
  },

  esc(s) {
    return String(s == null ? '' : s)
      .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
};

window.Analyzer = Analyzer;
document.addEventListener('DOMContentLoaded', () => Analyzer.init());
