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

    if (!this.apiBase()) this.showUnconfigured();
  },

  apiBase() {
    const c = window.DINELINE_CONFIG || {};
    return (c.apiBase || '').replace(/\/+$/, '');
  },

  /* No analyser deployed yet — say so plainly and open the paste flow,
     rather than letting the button fail silently. */
  showUnconfigured() {
    document.getElementById('url-note').innerHTML =
      '<b>The automatic check is not switched on for this copy of the playbook yet.</b> ' +
      'Everything else works — use <a href="#paste-fallback" id="open-paste">paste your page source</a> ' +
      'below, which runs the same page and schema checks. Setting up the one-click version takes ' +
      'about ten minutes and is documented in <code>api/README.md</code>.';
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

  render(data) {
    const site = Checker.analyze(data.html || '');
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

    const counts = {
      critical: all.filter(f => f.sev === 'critical').length,
      important: all.filter(f => f.sev === 'important').length,
      nice: all.filter(f => f.sev === 'nice').length
    };
    out.innerHTML =
      this.headerHtml(id, data, overall, band, gmbScore, siteScore, counts, wins.length) +
      this.gmbNoticeHtml(data, gmb) +
      this.breakdownHtml(all, wins) +
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

    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              gmbScore === null ? 'No listing found.' : 'Where most customers find you. 55% of the score.') +
        meter('Your website', siteScore, 'What Google and AI can actually read. 45%.') +
      '</div>' +
    '</div>' +
    '<div class="kpi-row">' +
      kpi('critical', counts.critical, 'Fix now', 'Costing you covers today.') +
      kpi('important', counts.important, 'Fix next', 'Visibility you are leaving behind.') +
      kpi('nice', counts.nice, 'Nice to have', 'Once the rest is done.') +
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

  /* Where the points actually went — sequential magnitude, one hue, every
     bar labelled so nothing rests on colour alone. */
  breakdownHtml(all, wins) {
    const AREAS = [
      { key: 'gmb', label: 'Google listing' },
      { key: 'site', label: 'Website & markup' }
    ];
    const rows = AREAS.map(a => {
      const lost = all.filter(f => (f.source === 'gmb') === (a.key === 'gmb')).length;
      const won = wins.filter(w => (w.source === 'gmb') === (a.key === 'gmb')).length;
      const total = lost + won;
      return { label: a.label, lost, total, pct: total ? Math.round((lost / total) * 100) : 0 };
    }).sort((x, y) => y.pct - x.pct);

    const max = Math.max(1, ...rows.map(r => r.pct));
    return '<div class="chart"><p class="chart-title">Where the problems are</p>' +
      '<p class="chart-sub">Share of checks you are failing in each area. Longer bar = more to gain.</p>' +
      '<div class="hbars">' + rows.map((r, i) =>
        '<div class="hbar"><span class="hl">' + r.label + '</span>' +
        '<span class="ht"><span class="hf' + (i === 0 ? '' : ' dim') + '" data-w="' +
          Math.round((r.pct / max) * 100) + '"></span></span>' +
        '<span class="hv">' + r.lost + ' of ' + r.total + '</span></div>'
      ).join('') + '</div></div>';
  },

  findingsHtml(all) {
    if (!all.length) {
      return '<div class="callout tip" style="margin-top:26px"><strong>Nothing outstanding</strong>' +
        '<p>Your site and your Google listing pass every check. Take the <a href="#audit">full ' +
        'audit</a> next &mdash; it covers what no automatic check can see.</p></div>';
    }
    const ICON = { critical: '!', important: '&#9650;', nice: '+' };
    const titles = { critical: 'Fix now', important: 'Fix next', nice: 'Nice to have' };
    let html = '';
    ['critical', 'important', 'nice'].forEach(sev => {
      const list = all.filter(f => f.sev === sev);
      if (!list.length) return;
      const cards = list.map(f =>
        '<div class="finding ' + sev + '">' +
          '<h4><span class="sev ' + sev + '"><span aria-hidden="true">' + ICON[sev] + '</span> ' + sev + '</span> ' +
          this.esc(f.title) +
          '<span class="src ' + (f.source === 'gmb' ? 'g' : 's') + '">' +
          (f.source === 'gmb' ? 'Google' : 'Website') + '</span></h4>' +
          '<p>' + this.esc(f.detail) + '</p>' +
          '<p class="do"><b>Do this:</b> ' + this.esc(this.firstSentence(f.fix)) + '</p>' +
        '</div>').join('');

      const heading = titles[sev] + ' <span class="count-note">(' + list.length + ')</span>';
      html += (sev === 'nice')
        ? '<details class="fallback" style="margin-top:26px"><summary>' + heading +
          '</summary><div class="fallback-body" style="padding-top:16px">' + cards + '</div></details>'
        : '<h3 style="margin-top:32px">' + heading + '</h3>' + cards;
    });
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

    ['critical', 'important', 'nice'].forEach(sev => {
      const list = r.all.filter(f => f.sev === sev);
      if (!list.length) return;
      md += '## ' + sev[0].toUpperCase() + sev.slice(1) + nl + nl;
      list.forEach((f, i) => {
        md += '### ' + (i + 1) + '. ' + f.title + ' (' + (f.source === 'gmb' ? 'Google listing' : 'Website') + ')' + nl + nl;
        md += f.detail + nl + nl;
        if (f.why) md += '_Why it matters:_ ' + f.why + nl + nl;
        md += '**What to do:** ' + f.fix + nl + nl;
      });
    });

    if (r.wins.length) {
      md += '## Already in place' + nl + nl;
      r.wins.forEach(w => { md += '- **' + w.title + '** — ' + w.detail + nl; });
      md += nl;
    }
    md += '---' + nl + nl + 'Done-for-you restaurant marketing, tracked to the dollar. https://dineline.co/' + nl;

    const slug = (id.name || id.domain || 'restaurant').toLowerCase()
      .replace(/['’"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = slug + '-dineline-check.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },

  esc(s) {
    return String(s == null ? '' : s)
      .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
};

window.Analyzer = Analyzer;
document.addEventListener('DOMContentLoaded', () => Analyzer.init());
