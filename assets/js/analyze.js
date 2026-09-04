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

    out.innerHTML =
      this.headerHtml(id, data, overall, band, gmbScore, siteScore) +
      this.gmbNoticeHtml(data, gmb) +
      this.findingsHtml(all) +
      this.winsHtml(wins) +
      this.ctaHtml(all);

    const dl = document.getElementById('btn-dl-analyze');
    if (dl) dl.addEventListener('click', () => this.download());

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = () => {
      out.querySelectorAll('.bar-fill[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
      const ring = out.querySelector('.ring[data-off]');
      if (ring) ring.style.strokeDashoffset = ring.dataset.off;
    };
    if (reduced) paint(); else requestAnimationFrame(() => requestAnimationFrame(paint));

    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  headerHtml(id, data, overall, band, gmbScore, siteScore) {
    const R = 74, C = 2 * Math.PI * R;
    const off = C - (overall / 100) * C;
    const tone = overall >= 70 ? 'good' : overall >= 45 ? 'warn' : 'bad';
    const name = id.name || 'Your restaurant';

    const sub = (label, val, note) => {
      if (val === null) {
        return '<div class="subscore"><div class="sl">' + label + '</div>' +
               '<div class="sv muted" style="font-size:1rem">Not checked</div>' +
               '<div class="sn">' + note + '</div></div>';
      }
      const cls = val >= 75 ? 'good' : val >= 45 ? 'warn' : 'bad';
      return '<div class="subscore"><div class="sl">' + label + '</div>' +
        '<div class="sv ' + cls + '">' + val + '<span>/100</span></div>' +
        '<div class="bar-track"><div class="bar-fill ' + cls + '" data-w="' + val + '"></div></div>' +
        '<div class="sn">' + note + '</div></div>';
    };

    return '<div class="result-head">' +
      '<div class="score-hero tone-' + tone + '">' +
        '<div class="score-dial">' +
          '<svg width="172" height="172" viewBox="0 0 172 172" aria-hidden="true">' +
            '<circle class="track" cx="86" cy="86" r="' + R + '" fill="none" stroke-width="11"/>' +
            '<circle class="ring" cx="86" cy="86" r="' + R + '" fill="none" stroke-width="11" ' +
              'stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" ' +
              'stroke-dashoffset="' + C.toFixed(1) + '" data-off="' + off.toFixed(1) + '"/>' +
          '</svg>' +
          '<div class="val"><div class="num">' + overall + '</div>' +
          '<div class="grade">Grade ' + band.grade + '<br>' + band.label + '</div></div>' +
        '</div>' +
        '<div class="score-copy">' +
          '<h3>' + this.esc(name) + '</h3>' +
          '<p class="found">' +
            this.esc((data.identity || {}).domain || '') +
            ((data.identity || {}).address ? ' &middot; ' + this.esc(data.identity.address) : '') +
          '</p>' +
          '<p>' + band.summary + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="subscores">' +
        sub('Google Business Profile', gmbScore,
            gmbScore === null ? 'We could not match a Google listing.' : 'Where most of your customers actually find you.') +
        sub('Website &amp; structured data', siteScore, 'What search engines and AI assistants can read.') +
      '</div>' +
    '</div>';
  },

  gmbNoticeHtml(data, gmb) {
    if (gmb.present) {
      return data.gmbMatchedOn === 'name'
        ? '<div class="callout note"><strong>Check we found the right listing</strong><p>We matched your ' +
          'Google listing by name rather than by website link, so it is worth a glance. If it is the ' +
          'wrong one, that usually means your profile is missing your website — which is item one on ' +
          'the list below.</p></div>'
        : '';
    }
    if (!data.gmbConfigured) {
      return '<div class="callout note"><strong>Google listing not checked</strong><p>' +
        'The Google lookup is not switched on for this copy of the playbook, so the score above ' +
        'covers your website only. See <code>api/README.md</code>.</p></div>';
    }
    if (data.gmbReason === 'not-found') {
      return '<div class="callout warn"><strong>We could not find you on Google</strong><p>' +
        'No Google Business Profile matched your restaurant name and address. Either it does not ' +
        'exist yet, or the name and address on your website do not match the listing. This is the ' +
        'single most valuable thing on this page to fix — it is free, it takes an afternoon, and it ' +
        'is where hungry people two miles away actually find you. Start at ' +
        '<a href="https://www.google.com/business/" target="_blank" rel="noopener">google.com/business</a>.' +
        '</p></div>';
    }
    return '<div class="callout note"><strong>Google listing not checked</strong><p>' +
      'The Google lookup did not complete this time (' + this.esc(data.gmbReason || 'unknown') +
      '), so the score above covers your website only.</p></div>';
  },

  findingsHtml(all) {
    if (!all.length) {
      return '<div class="callout tip" style="margin-top:30px"><strong>Nothing outstanding</strong>' +
        '<p>Both your site and your Google listing pass every check we run. Move on to the ' +
        '<a href="#audit">full audit</a> for the things no automated check can see — your reviews ' +
        'process, your listings elsewhere, and what AI assistants currently say about you.</p></div>';
    }
    const titles = { critical: 'Fix these first', important: 'Worth doing next', nice: 'When you have time' };
    let html = '';
    ['critical', 'important', 'nice'].forEach(sev => {
      const list = all.filter(f => f.sev === sev);
      if (!list.length) return;
      const cards = [];
      list.forEach(f => {
        cards.push('<div class="finding ' + sev + '">' +
          '<h4><span class="sev ' + sev + '">' + sev + '</span> ' + this.esc(f.title) +
          '<span class="src ' + (f.source === 'gmb' ? 'g' : 's') + '">' +
          (f.source === 'gmb' ? 'Google listing' : 'Website') + '</span></h4>' +
          '<p>' + this.esc(f.detail) + '</p>' +
          (f.why ? '<p class="why-line">' + this.esc(f.why) + '</p>' : '') +
          '<p class="do"><b>What to do:</b> ' + this.esc(f.fix) + '</p>' +
        '</div>');
      });

      const heading = titles[sev] + ' <span class="count-note">(' + list.length + ')</span>';
      /* The nice-to-haves are genuinely long; keep them out of the way
         until the owner has dealt with what actually matters. */
      html += (sev === 'nice' && list.length > 4)
        ? '<details class="fallback" style="margin-top:30px"><summary>' + heading +
          '</summary><div class="fallback-body" style="padding-top:18px">' + cards.join('') + '</div></details>'
        : '<h3 style="margin-top:36px">' + heading + '</h3>' + cards.join('');
    });
    return html;
  },

  winsHtml(wins) {
    if (!wins.length) return '';
    return '<h3 style="margin-top:38px">Already in place <span class="count-note">(' + wins.length + ')</span></h3>' +
      '<div class="wins-grid">' + wins.map(w =>
        '<div class="win"><span class="tick">&#10003;</span><span><b>' + this.esc(w.title) +
        '</b><span>' + this.esc(w.detail) + '</span></span></div>').join('') + '</div>';
  },

  ctaHtml(all) {
    const crit = all.filter(f => f.sev === 'critical').length;
    const cfg = window.DINELINE_CONFIG || {};
    return '<div class="next-block">' +
      '<div>' +
        '<h3 style="margin-top:0">What to do with this</h3>' +
        '<p>' + (crit
          ? 'Start with the ' + crit + ' critical item' + (crit === 1 ? '' : 's') + ' above — those are the ones actively costing you covers. '
          : 'The foundations are in place. ') +
        'The <a href="#playbook">playbook</a> below explains every one of these in full, the ' +
        '<a href="#checklists">checklists</a> break them into tasks you can tick off, and the ' +
        '<a href="#prompts">AI prompts</a> do the writing for you.</p>' +
        '<p style="margin-bottom:0">This check cannot see everything. Run the ' +
        '<a href="#audit">full audit</a> for your reviews process, your listings elsewhere, and ' +
        'what AI assistants actually say about you today.</p>' +
      '</div>' +
      '<div class="next-actions">' +
        '<button type="button" class="btn btn-ghost" id="btn-dl-analyze">Download this report</button>' +
        '<a class="btn btn-ghost" href="#audit">Run the full audit</a>' +
        '<a class="btn btn-primary" href="' + (cfg.bookUrl || 'https://dineline.co/discovery/') +
          '" target="_blank" rel="noopener">Have Dineline do it</a>' +
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
