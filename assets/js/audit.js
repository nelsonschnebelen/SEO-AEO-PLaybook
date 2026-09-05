/* ==========================================================================
   Audit engine
   Runs entirely client side. Nothing is sent anywhere; answers persist in
   localStorage so an owner can close the tab and come back to it.
   ========================================================================== */

const STORE_KEY = 'rsap.audit.v1';

/* Question steps, grouped so the wizard is four screens rather than seven. */
const STEP_GROUPS = [
  { id: 'g1', label: '1. Google Profile',   pillars: ['gbp'],
    lead: 'Your Google Business Profile is the storefront most of your customers actually see. Have it open in another tab while you answer these.' },
  { id: 'g2', label: '2. Website & Menu',   pillars: ['site', 'content'],
    lead: 'Open your own website on a phone while you go through these. That is how most people will see it.' },
  { id: 'g3', label: '3. Reviews & Listings', pillars: ['reviews', 'citations'],
    lead: 'Reviews rank you, persuade people, and are what AI assistants quote when asked whether you are any good.' },
  { id: 'g4', label: '4. Schema & AI',      pillars: ['schema', 'aeo'],
    lead: 'The technical and AI-readiness side. If you do not know an answer here, "Not sure" is a perfectly good response — it becomes a task.' }
];

const ANSWER_VALUES = { yes: 1, partly: 0.6, unsure: 0.25, no: 0 };
const ANSWER_LABELS = { yes: 'Yes', partly: 'Partly', no: 'No', unsure: 'Not sure' };
const IMPACT_RANK   = { high: 3, medium: 2, low: 1 };

const Audit = {
  state: { profile: {}, answers: {}, step: 0 },
  totalSteps: STEP_GROUPS.length + 2, // intake + groups + results

  /* ---------------------------------------------------------------- init */
  init() {
    this.load();
    this.renderSteps();
    this.renderQuestions();
    this.bind();
    this.go(this.state.step || 0, true);
  },

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) Object.assign(this.state, JSON.parse(raw));
    } catch (e) { /* private browsing, corrupted value — start fresh */ }
  },

  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); }
    catch (e) { /* storage unavailable; the audit still works in-session */ }
  },

  /* --------------------------------------------------------- step chrome */
  renderSteps() {
    const bar = document.getElementById('audit-steps');
    const labels = ['Your restaurant', ...STEP_GROUPS.map(g => g.label), 'Your results'];
    bar.innerHTML = labels.map((l, i) =>
      '<button type="button" role="tab" data-goto="' + i + '" aria-selected="false">' + l + '</button>'
    ).join('');
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-goto]');
      if (b) this.go(+b.dataset.goto);
    });
  },

  /* Build one .step panel per question group. */
  renderQuestions() {
    const form = document.getElementById('audit-form');
    const resultsPanel = form.querySelector('[data-step="results"]');

    STEP_GROUPS.forEach((group, gi) => {
      const panel = document.createElement('div');
      panel.className = 'step';
      panel.dataset.step = String(gi + 1);

      let html = '<p class="muted" style="font-size:.94rem;margin-bottom:4px">' + group.lead + '</p>';

      group.pillars.forEach(pid => {
        const pillar = PILLARS.find(p => p.id === pid);
        const qs = QUESTIONS.filter(q => q.pillar === pid);
        html += '<div class="q-pillar-head">' +
                  '<h3>' + pillar.icon + ' ' + pillar.name + '</h3>' +
                  '<span class="count">' + qs.length + ' questions &middot; ' + pillar.weight + '% of score</span>' +
                '</div>';
        qs.forEach(q => { html += this.questionHtml(q); });
      });

      html += '<div class="callout note" style="margin-top:22px"><p style="margin:0">' +
              'Answers save automatically. You can leave and come back.</p></div>';

      panel.innerHTML = html;
      form.insertBefore(panel, resultsPanel);
    });
  },

  questionHtml(q) {
    const cur = this.state.answers[q.id];
    const opts = ['yes', 'partly', 'no', 'unsure'].map(v =>
      '<label><input type="radio" name="' + q.id + '" value="' + v + '"' +
      (cur === v ? ' checked' : '') + '><span>' + ANSWER_LABELS[v] + '</span></label>'
    ).join('');
    return '<div class="q' + (cur ? ' answered' : '') + '" data-q="' + q.id + '">' +
             '<div class="q-text">' + q.q + '</div>' +
             '<div class="q-check"><b>How to check:</b> ' + q.check + '</div>' +
             '<div class="opts">' + opts + '</div>' +
           '</div>';
  },

  /* -------------------------------------------------------------- events */
  bind() {
    const form = document.getElementById('audit-form');

    form.addEventListener('change', e => {
      const t = e.target;
      if (t.type === 'radio') {
        this.state.answers[t.name] = t.value;
        const box = t.closest('.q');
        if (box) box.classList.add('answered');
        this.save();
        this.updateProgress();
      } else if (t.name) {
        this.state.profile[t.name] = t.value.trim();
        this.save();
        if (window.App) App.onProfileChange();
      }
    });

    form.addEventListener('input', e => {
      if (e.target.name && e.target.type !== 'radio') {
        this.state.profile[e.target.name] = e.target.value.trim();
      }
    });

    document.getElementById('btn-next').addEventListener('click', () => this.go(this.state.step + 1));
    document.getElementById('btn-back').addEventListener('click', () => this.go(this.state.step - 1));
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (!confirm('Clear your restaurant details and every answer? This cannot be undone.')) return;
      this.state = { profile: {}, answers: {}, step: 0 };
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      form.reset();
      form.querySelectorAll('.q').forEach(q => q.classList.remove('answered'));
      if (window.App) App.onProfileChange();
      this.go(0);
    });

    // restore saved profile values into the intake fields
    Object.entries(this.state.profile).forEach(([k, v]) => {
      const el = form.querySelector('[name="' + k + '"]');
      if (el) el.value = v;
    });
  },

  /* ------------------------------------------------------------ navigate */
  go(i, silent) {
    const last = this.totalSteps - 1;
    this.state.step = Math.max(0, Math.min(last, i));
    this.save();

    document.querySelectorAll('#audit-form .step').forEach(p => {
      const key = p.dataset.step === 'results' ? String(last) : p.dataset.step;
      p.classList.toggle('hidden', +key !== this.state.step);
    });
    document.querySelectorAll('#audit-steps button').forEach(b => {
      b.setAttribute('aria-selected', +b.dataset.goto === this.state.step ? 'true' : 'false');
    });

    document.getElementById('btn-back').disabled = this.state.step === 0;
    const next = document.getElementById('btn-next');
    next.textContent = this.state.step === last - 1 ? 'See my results →'
                     : this.state.step === last ? 'Done'
                     : 'Next →';
    next.disabled = this.state.step === last;

    if (this.state.step === last) this.renderResults();
    this.updateProgress();

    if (!silent) {
      const y = document.getElementById('audit').getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  },

  updateProgress() {
    const done = QUESTIONS.filter(q => this.state.answers[q.id]).length;
    document.getElementById('progress-note').textContent =
      done + ' of ' + QUESTIONS.length + ' answered';
    const bar = document.getElementById('audit-bar');
    if (bar) bar.style.width = Math.round((done / QUESTIONS.length) * 100) + '%';
  },

  /* --------------------------------------------------------------- score
     Pillars with no answers at all are excluded and the remaining weights
     are renormalized, so a partly-completed audit still scores honestly.  */
  score() {
    const pillars = PILLARS.map(p => {
      const qs = QUESTIONS.filter(q => q.pillar === p.id);
      let got = 0, max = 0, answered = 0;
      qs.forEach(q => {
        const a = this.state.answers[q.id];
        if (!a) return;
        answered++;
        max += q.weight;
        got += q.weight * ANSWER_VALUES[a];
      });
      return {
        ...p,
        answered,
        total: qs.length,
        pct: max > 0 ? Math.round((got / max) * 100) : null
      };
    });

    const scored = pillars.filter(p => p.pct !== null);
    const wsum = scored.reduce((s, p) => s + p.weight, 0);
    const overall = wsum > 0
      ? Math.round(scored.reduce((s, p) => s + p.pct * p.weight, 0) / wsum)
      : 0;

    const answered = QUESTIONS.filter(q => this.state.answers[q.id]).length;
    return {
      overall,
      pillars,
      answered,
      total: QUESTIONS.length,
      completion: Math.round((answered / QUESTIONS.length) * 100),
      band: BANDS.find(b => overall >= b.min) || BANDS[BANDS.length - 1]
    };
  },

  /* Everything the owner has not fully solved, ranked by what to do first. */
  gaps() {
    return QUESTIONS
      .filter(q => {
        const a = this.state.answers[q.id];
        return a && a !== 'yes';
      })
      .map(q => {
        const a = this.state.answers[q.id];
        const pillar = PILLARS.find(p => p.id === q.pillar);
        // Priority blends: how bad the gap is, how much the pillar counts,
        // how much the item counts inside it, and the item's own impact.
        const severity = a === 'no' ? 1 : a === 'partly' ? 0.55 : 0.8;
        const priority = severity * pillar.weight * q.weight * IMPACT_RANK[q.impact];
        return { ...q, answer: a, pillarName: pillar.name, pillarIcon: pillar.icon, priority };
      })
      .sort((a, b) => b.priority - a.priority);
  },

  /* -------------------------------------------------------------- render */
  renderResults() {
    const out = document.getElementById('results-out');
    const answered = QUESTIONS.filter(q => this.state.answers[q.id]).length;

    if (answered === 0) {
      out.innerHTML =
        '<div class="callout warn"><strong>Nothing to score yet</strong>' +
        '<p>Answer some questions in the previous steps and your results will appear here. ' +
        'You do not have to answer all of them — the score adjusts to what you have completed.</p></div>';
      return;
    }

    const s = this.score();
    const gaps = this.gaps();
    const name = this.state.profile.name || 'your restaurant';

    out.innerHTML =
      this.scoreHeroHtml(s, name) +
      this.barsHtml(s) +
      this.actionsHtml(gaps) +
      this.phasesHtml(gaps) +
      this.nextStepsHtml(gaps) +
      '<div class="audit-nav no-print" style="border-top:0;padding-top:8px">' +
        '<button type="button" class="btn btn-primary" id="btn-dl">⬇ Download report (Markdown)</button>' +
        '<button type="button" class="btn btn-ghost" id="btn-print-report">🖨 Print / save as PDF</button>' +
      '</div>';

    document.getElementById('btn-dl').addEventListener('click', () => this.download(s, gaps));
    document.getElementById('btn-print-report').addEventListener('click', () => window.print());
    this.animate(out);
  },

  /* Inline widths set at render time never transition, so paint the final
     values on the next frame instead. */
  animate(out) {
    const reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = () => {
      out.querySelectorAll('.bar-fill[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
      const ring = out.querySelector('.ring[data-off]');
      if (ring) ring.style.strokeDashoffset = ring.dataset.off;
    };
    if (reduced) paint();
    else requestAnimationFrame(() => requestAnimationFrame(paint));
  },

  scoreHeroHtml(s, name) {
    const R = 74, C = 2 * Math.PI * R;
    const off = C - (s.overall / 100) * C;
    return '' +
    '<div class="score-hero tone-' + s.band.tone + '">' +
      '<div class="score-dial">' +
        '<svg width="172" height="172" viewBox="0 0 172 172" aria-hidden="true">' +
          '<circle class="track" cx="86" cy="86" r="' + R + '" fill="none" stroke-width="11"/>' +
          '<circle class="ring" cx="86" cy="86" r="' + R + '" fill="none" stroke-width="11" ' +
            'stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" ' +
            'stroke-dashoffset="' + C.toFixed(1) + '" data-off="' + off.toFixed(1) + '"/>' +
        '</svg>' +
        '<div class="val"><div class="num">' + s.overall + '</div>' +
        '<div class="grade">Grade ' + s.band.grade + '<br>' + s.band.label + '</div></div>' +
      '</div>' +
      '<div class="score-copy">' +
        '<h3>' + this.esc(name) + ' scores ' + s.overall + ' out of 100</h3>' +
        '<p>' + s.band.summary + '</p>' +
        '<p style="margin-top:10px"><small>Based on ' + s.answered + ' of ' + s.total +
        ' questions answered (' + s.completion + '% complete). ' +
        (s.completion < 100 ? 'Answer the rest for a fuller picture.' : 'Full audit complete.') +
        '</small></p>' +
      '</div>' +
    '</div>';
  },

  barsHtml(s) {
    const rows = s.pillars.map(p => {
      if (p.pct === null) {
        return '<div class="bar-row"><div class="bar-top">' +
          '<span class="nm">' + p.icon + ' ' + p.name + '</span>' +
          '<span class="wt">' + p.weight + '% of score</span>' +
          '<span class="pc muted" style="font-weight:500;font-size:.84rem">not answered</span>' +
          '</div><div class="bar-track"></div></div>';
      }
      const cls = p.pct >= 75 ? 'good' : p.pct >= 45 ? 'warn' : 'bad';
      return '<div class="bar-row"><div class="bar-top">' +
        '<span class="nm">' + p.icon + ' ' + p.name + '</span>' +
        '<span class="wt">' + p.weight + '% of score &middot; ' + p.answered + '/' + p.total + ' answered</span>' +
        '<span class="pc">' + p.pct + '%</span>' +
        '</div><div class="bar-track"><div class="bar-fill ' + cls + '" data-w="' + p.pct + '"></div></div></div>';
    }).join('');

    return '<h3 style="margin-top:36px">Where you stand, pillar by pillar</h3>' +
           '<div class="bars">' + rows + '</div>';
  },

  actionsHtml(gaps) {
    if (!gaps.length) {
      return '<h3 style="margin-top:40px">Your priority fixes</h3>' +
        '<div class="callout tip"><strong>Nothing outstanding</strong>' +
        '<p>You answered yes to everything you completed. Move on to the ' +
        '<a href="#checklists">checklists</a> for the finer-grained tasks, and set up the monthly ' +
        'measurement loop so this does not drift.</p></div>';
    }

    const top = gaps.slice(0, 12);
    const items = top.map((g, i) => {
      const p = g.priority > 45 ? 'high' : g.priority > 20 ? 'med' : 'low';
      return '<div class="action p-' + p + '">' +
        '<div class="action-head">' +
          '<span class="action-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<h4>' + g.q.replace(/\?$/, '') + '</h4>' +
        '</div>' +
        '<p class="why"><b>Why it matters:</b> ' + g.why + '</p>' +
        '<p class="fix"><b>What to do:</b> ' + g.fix + '</p>' +
        (g.ai ? '<p class="ai-note"><b>🤖 How AI helps:</b> ' + g.ai + '</p>' : '') +
        '<div class="tags">' +
          '<span class="tag">' + g.pillarIcon + ' ' + g.pillarName + '</span>' +
          '<span class="tag impact-' + g.impact + '">' + g.impact + ' impact</span>' +
          '<span class="tag">⏱ ' + g.effort + '</span>' +
          '<span class="tag">You answered: ' + ANSWER_LABELS[g.answer] + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    const more = gaps.length > 12
      ? '<p class="muted" style="font-size:.9rem">Plus ' + (gaps.length - 12) +
        ' more items — they are all covered in the <a href="#checklists">checklists</a>.</p>'
      : '';

    return '<h3 style="margin-top:40px">Your priority fixes</h3>' +
      '<p class="muted" style="font-size:.94rem;max-width:640px">Ranked by how much each one is ' +
      'likely to move the needle for you specifically, weighing how big the gap is, how much that ' +
      'pillar counts, and how much work it takes. Start at the top.</p>' +
      items + more;
  },

  phasesHtml(gaps) {
    if (!gaps.length) return '';
    const quick = gaps.filter(g => /min$/.test(g.effort));
    const rest  = gaps.filter(g => !/min$/.test(g.effort));
    const ordered = [...quick.slice(0, 6), ...rest, ...quick.slice(6)];

    const phases = [
      { pill: 'Days 1–30',  goal: 'Stop the leaks. Quick, high-impact fixes that mostly live inside your Google profile.', items: ordered.slice(0, 8) },
      { pill: 'Days 31–60', goal: 'Build the pages and markup that give machines something specific to work with.',        items: ordered.slice(8, 16) },
      { pill: 'Days 61–90', goal: 'Authority and measurement — the slower compounding work.',                              items: ordered.slice(16, 24) }
    ].filter(p => p.items.length);

    const html = phases.map(p =>
      '<div class="phase">' +
        '<h4><span class="pill">' + p.pill + '</span></h4>' +
        '<p class="goal">' + p.goal + '</p>' +
        '<ol>' + p.items.map(g =>
          '<li>' + g.q.replace(/\?$/, '') + ' <span class="muted">— ' + g.effort + '</span></li>'
        ).join('') + '</ol>' +
      '</div>'
    ).join('');

    return '<h3 style="margin-top:40px">Your 90-day plan</h3>' +
      '<p class="muted" style="font-size:.94rem;max-width:640px">The same fixes, sequenced. ' +
      'Quick wins first so you get movement early, then the building work, then the slow ' +
      'compounding work.</p>' + html;
  },

  nextStepsHtml(gaps) {
    const aiCount = gaps.filter(g => g.ai).length;
    return '<div class="callout ai" style="margin-top:34px">' +
      '<strong>🤖 What to hand to AI right now</strong>' +
      '<p>' + (aiCount
        ? aiCount + ' of your outstanding items have an AI shortcut. The ' +
          '<a href="#prompts">prompt library</a> is already filled in with your restaurant details — ' +
          'start with <b>Find out what AI already says about you</b> to see your baseline, then work ' +
          'down your priority list.'
        : 'Head to the <a href="#prompts">prompt library</a> — the prompts are filled in with your ' +
          'restaurant details and ready to paste.') +
      '</p></div>' +
      '<div class="callout note"><strong>Keep going</strong><p>Work the ' +
      '<a href="#checklists">checklists</a> for the task-level detail, generate your ' +
      '<a href="#schema">schema markup</a>, and re-run this audit in 90 days to see what moved.</p></div>';
  },

  /* -------------------------------------------------------------- export */
  download(s, gaps) {
    const p = this.state.profile;
    const nl = '\n';
    let md = '# SEO & AEO audit — ' + (p.name || 'Your restaurant') + nl + nl;
    md += 'Generated ' + new Date().toLocaleDateString() + nl + nl;

    const facts = [
      ['Restaurant', p.name], ['Cuisine', p.cuisine],
      ['Address', [p.address, p.city].filter(Boolean).join(', ')],
      ['Phone', p.phone], ['Website', p.url],
      ['Price range', p.price], ['Service style', p.service], ['Locations', p.locations]
    ].filter(r => r[1]);
    if (facts.length) {
      md += '## Restaurant' + nl + nl;
      facts.forEach(r => { md += '- **' + r[0] + ':** ' + r[1] + nl; });
      md += nl;
    }

    md += '## Score' + nl + nl;
    md += '**' + s.overall + '/100 — Grade ' + s.band.grade + ' (' + s.band.label + ')**' + nl + nl;
    md += s.band.summary + nl + nl;
    md += 'Based on ' + s.answered + ' of ' + s.total + ' questions (' + s.completion + '% complete).' + nl + nl;

    md += '## By pillar' + nl + nl;
    md += '| Pillar | Weight | Score | Answered |' + nl + '| --- | --- | --- | --- |' + nl;
    s.pillars.forEach(x => {
      md += '| ' + x.name + ' | ' + x.weight + '% | ' +
            (x.pct === null ? 'not answered' : x.pct + '%') + ' | ' +
            x.answered + '/' + x.total + ' |' + nl;
    });
    md += nl;

    if (gaps.length) {
      md += '## Priority fixes' + nl + nl;
      gaps.slice(0, 15).forEach((g, i) => {
        md += '### ' + (i + 1) + '. ' + g.q.replace(/\?$/, '') + nl + nl;
        md += '- **Pillar:** ' + g.pillarName + nl;
        md += '- **Impact:** ' + g.impact + '  |  **Effort:** ' + g.effort +
              '  |  **You answered:** ' + ANSWER_LABELS[g.answer] + nl;
        md += '- **Why it matters:** ' + g.why + nl;
        md += '- **What to do:** ' + g.fix + nl;
        if (g.ai) md += '- **How AI helps:** ' + g.ai + nl;
        md += nl;
      });

      md += '## Everything else outstanding' + nl + nl;
      gaps.slice(15).forEach(g => { md += '- ' + g.q + ' (' + g.pillarName + ', ' + g.effort + ')' + nl; });
      md += nl;
    }

    md += '## Strengths — already in place' + nl + nl;
    const wins = QUESTIONS.filter(q => this.state.answers[q.id] === 'yes');
    if (wins.length) wins.forEach(q => { md += '- ' + q.q.replace(/\?$/, '') + nl; });
    else md += '_Nothing marked yes yet._' + nl;
    md += nl + '---' + nl + nl;
    md += 'Re-run this audit in 90 days and compare. Track your AI visibility monthly by asking ' +
          'ChatGPT, Gemini, Perplexity and Copilot the same 15 diner questions and logging whether ' +
          'you were mentioned and whether the facts were right.' + nl;

    const slug = (p.name || 'restaurant').toLowerCase()
      .replace(/['\u2019"]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    saveTextFile(slug + '-seo-aeo-audit.md', md);
  },

  esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
};

/* Expose for cross-file access: a top-level const is not a window property. */
window.Audit = Audit;
