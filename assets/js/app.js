/* ==========================================================================
   App layer — everything outside the audit wizard:
   pillar cards, the two checklists, the prompt library, the schema generator.
   ========================================================================== */

const CHECK_KEY = 'rsap.checks.v1';
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const App = {
  track: 'seo',
  promptFilter: 'all',
  checks: {},

  init() {
    this.loadChecks();
    this.renderPillars();
    this.renderChecklist();
    this.renderPromptFilters();
    this.renderPrompts();
    this.renderHoursFields();
    this.bind();
    this.chrome();
  },

  /* Page chrome: mobile nav, sticky header state, reading progress and the
     scroll-reveal pass. All of it degrades to "everything visible" if
     IntersectionObserver is unavailable or motion is reduced. */
  chrome() {
    const header = document.getElementById('site-header');
    const rail = document.getElementById('read-progress');
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('nav-toggle');

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? '✕' : '☰';
      });
      nav.addEventListener('click', e => {
        if (e.target.tagName === 'A') {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.textContent = '☰';
        }
      });
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (header) header.classList.toggle('stuck', y > 8);
        if (rail) {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          rail.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll(
      '.section-head, .card, .split, .callout, .table-scroll, .answer-card, ' +
      '.kpi-row, .weight-stack, .timeline, .rows');

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('in'));
      return;
    }
    targets.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(el => io.observe(el));
  },

  /* -------------------------------------------------------------- pillars
     One weighted stack instead of seven paragraphs. Sequential ramp — the
     job is magnitude, not identity — so weight reads off lightness, and
     every segment is labelled rather than relying on colour. */
  renderPillars() {
    const stack = document.getElementById('weight-stack');
    const key = document.getElementById('weight-key');
    if (!stack || !key) return;

    const sorted = [...PILLARS].sort((a, b) => b.weight - a.weight);
    const shade = i => {
      const t = i / Math.max(1, sorted.length - 1);          // 0 = heaviest
      return 'color-mix(in srgb, var(--brand) ' + Math.round(100 - t * 62) + '%, var(--ink-4))';
    };

    stack.innerHTML = sorted.map((p, i) =>
      '<div class="weight-seg" style="flex:' + p.weight + ';background:' + shade(i) + '" ' +
      'title="' + p.name + ' — ' + p.weight + '% of your score">' +
      (p.weight >= 12 ? p.weight + '%' : '') + '</div>'
    ).join('');

    key.innerHTML = sorted.map((p, i) =>
      '<div><span class="sw" style="background:' + shade(i) + '"></span>' +
      '<b>' + p.weight + '%</b>&nbsp;' + p.short + '</div>'
    ).join('');
  },

  /* ------------------------------------------------------------ checklist */
  loadChecks() {
    try { this.checks = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}'); }
    catch (e) { this.checks = {}; }
  },
  saveChecks() {
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(this.checks)); } catch (e) {}
  },

  renderChecklist() {
    const list = CHECKLISTS[this.track];
    const out = document.getElementById('checklist-out');

    let html = '<p class="muted" style="font-size:.95rem;max-width:660px;margin-bottom:26px">' +
               list.intro + '</p>';

    list.groups.forEach(g => {
      html += '<div class="check-group">' +
                '<h3>' + g.icon + ' ' + g.name + '</h3>' +
                '<p>' + g.note + '</p>';
      g.items.forEach((item, i) => {
        const key = g.id + ':' + i;
        const done = !!this.checks[key];
        const promptLink = item.ai
          ? ' &middot; <a class="ai" href="#prompts" data-open-prompt="' + item.ai + '">🤖 AI prompt</a>'
          : '';
        html += '<label class="check-item' + (done ? ' done' : '') + '" data-key="' + key + '">' +
                  '<input type="checkbox"' + (done ? ' checked' : '') + '>' +
                  '<span class="ci-body">' +
                    '<span class="ci-text">' + item.x + '</span>' +
                    '<span class="ci-meta">⏱ ' + item.t + promptLink + '</span>' +
                  '</span>' +
                '</label>';
      });
      html += '</div>';
    });

    out.innerHTML = html;
    this.updateCheckProgress();
  },

  updateCheckProgress() {
    const list = CHECKLISTS[this.track];
    let total = 0, done = 0;
    list.groups.forEach(g => g.items.forEach((_, i) => {
      total++;
      if (this.checks[g.id + ':' + i]) done++;
    }));
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('check-progress').textContent =
      done + ' of ' + total + ' done (' + pct + '%)';
  },

  /* -------------------------------------------------------------- prompts */
  renderPromptFilters() {
    const cats = [{ id: 'all', name: 'All ' + PROMPTS.length + ' prompts' }, ...PROMPT_CATEGORIES];
    document.getElementById('prompt-filters').innerHTML = cats.map(c =>
      '<button type="button" class="chip' + (c.id === this.promptFilter ? ' on' : '') +
      '" data-cat="' + c.id + '">' + c.name + '</button>'
    ).join('');
  },

  /* Fill {{placeholders}} from the audit profile, leaving an obvious
     bracketed hint where the owner has not told us yet. */
  fill(text) {
    const p = (window.Audit && Audit.state.profile) || {};
    const map = {
      name:    p.name    || '[YOUR RESTAURANT NAME]',
      cuisine: p.cuisine || '[YOUR CUISINE]',
      city:    p.city    || '[YOUR CITY]',
      address: p.address || '[YOUR STREET ADDRESS]',
      phone:   p.phone   || '[YOUR PHONE]',
      url:     p.url     || '[YOUR WEBSITE URL]',
      price:   p.price   || '[YOUR PRICE RANGE]',
      tone:    p.tone    || 'warm and straightforward'
    };
    return text.replace(/\{\{(\w+)\}\}/g, (m, k) => map[k] !== undefined ? map[k] : m);
  },

  renderPrompts() {
    const shown = this.promptFilter === 'all'
      ? PROMPTS
      : PROMPTS.filter(p => p.cat === this.promptFilter);

    const catName = id => (PROMPT_CATEGORIES.find(c => c.id === id) || {}).name || '';

    document.getElementById('prompt-out').innerHTML = shown.map(p =>
      '<div class="prompt-card" data-prompt="' + p.id + '">' +
        '<div class="prompt-head">' +
          '<div>' +
            '<h4>' + p.title + '</h4>' +
            '<p class="when"><b>When:</b> ' + p.when + '</p>' +
          '</div>' +
          '<span class="caret">▸</span>' +
        '</div>' +
        '<div class="prompt-body">' +
          '<p class="prompt-why">' + p.why + '</p>' +
          '<pre class="prompt-text">' + this.esc(this.fill(p.prompt)) + '</pre>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-copy="' + p.id + '">📋 Copy prompt</button>' +
          '<span class="tag" style="margin-left:8px">' + catName(p.cat) + '</span>' +
          '<span class="copied hidden">Copied ✓</span>' +
        '</div>' +
      '</div>'
    ).join('');

    this.onProfileChange();
  },

  onProfileChange() {
    const p = (window.Audit && Audit.state.profile) || {};
    const box = document.getElementById('prompt-personalized');
    if (!box) return;
    if (p.name) {
      box.classList.remove('hidden');
      const bits = [p.name, p.cuisine, p.city].filter(Boolean).join(' · ');
      document.getElementById('pp-detail').textContent = bits;
    } else {
      box.classList.add('hidden');
    }
  },

  /* --------------------------------------------------------------- schema */
  renderHoursFields() {
    document.getElementById('hours-fields').innerHTML = DAYS.map(d =>
      '<div class="field" style="display:grid;grid-template-columns:110px 1fr;gap:10px;align-items:center;margin-bottom:8px">' +
        '<label for="h-' + d + '" style="margin:0">' + d + '</label>' +
        '<input type="text" id="h-' + d + '" data-day="' + d + '" placeholder="17:00-22:00">' +
      '</div>'
    ).join('');
  },

  parseHours() {
    const spec = [];
    DAYS.forEach(d => {
      const raw = (document.getElementById('h-' + d).value || '').trim();
      if (!raw) return;
      raw.split(',').forEach(part => {
        const m = part.trim().match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
        if (m) {
          spec.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'https://schema.org/' + d,
            opens: m[1].padStart(5, '0'),
            closes: m[2].padStart(5, '0')
          });
        }
      });
    });
    return spec;
  },

  generateSchema() {
    const p = (window.Audit && Audit.state.profile) || {};
    const FILL = 'FILL_IN';

    // "Asheville, NC 28801" -> locality / region / postal code
    const cityRaw = (p.city || '').trim();
    let locality = FILL, region = FILL, postal = FILL;
    if (cityRaw) {
      const m = cityRaw.match(/^(.*?),\s*([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?$/);
      if (m) {
        locality = m[1].trim();
        region = m[2].toUpperCase();
        postal = m[3] || FILL;
      } else {
        locality = cityRaw;
      }
    }

    const obj = {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: p.name || FILL,
      address: {
        '@type': 'PostalAddress',
        streetAddress: p.address || FILL,
        addressLocality: locality,
        addressRegion: region,
        postalCode: postal,
        addressCountry: 'US'
      },
      telephone: p.phone || FILL,
      url: p.url || FILL
    };

    if (p.cuisine) obj.servesCuisine = p.cuisine;
    if (p.price)   obj.priceRange = p.price;

    const geo = (document.getElementById('s-geo').value || '').trim();
    const gm = geo.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (gm) {
      obj.geo = { '@type': 'GeoCoordinates', latitude: +gm[1], longitude: +gm[2] };
    }

    const hours = this.parseHours();
    if (hours.length) obj.openingHoursSpecification = hours;

    const menu = (document.getElementById('s-menu').value || '').trim();
    if (menu) obj.hasMenu = menu;

    const book = (document.getElementById('s-book').value || '').trim();
    obj.acceptsReservations = book ? 'True' : 'False';
    if (book) {
      obj.potentialAction = {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: book,
          inLanguage: 'en-US',
          actionPlatform: [
            'https://schema.org/DesktopWebPlatform',
            'https://schema.org/IOSPlatform',
            'https://schema.org/AndroidPlatform'
          ]
        },
        result: { '@type': 'FoodEstablishmentReservation', name: 'Reserve a table' }
      };
    }

    const same = (document.getElementById('s-same').value || '')
      .split('\n').map(s => s.trim()).filter(Boolean);
    if (same.length) obj.sameAs = same;

    const json = JSON.stringify(obj, null, 2);
    const block = '<script type="application/ld+json">\n' + json + '\n</' + 'script>';

    const missing = [];
    const walk = o => {
      Object.values(o).forEach(v => {
        if (v === FILL) missing.push(true);
        else if (v && typeof v === 'object') walk(v);
      });
    };
    walk(obj);
    if (!hours.length) missing.push(true);

    const warn = missing.length
      ? '<div class="callout warn" style="margin:0 0 14px"><strong>Before you publish</strong>' +
        '<p>There are still <b>' + missing.length + '</b> placeholder or missing values. ' +
        'Fill in the form above, or replace every <code>FILL_IN</code> by hand — never publish ' +
        'schema containing a placeholder.</p></div>'
      : '<div class="callout tip" style="margin:0 0 14px"><strong>Looks complete</strong>' +
        '<p>No placeholders left. Validate it in the Rich Results Test, then paste it into the ' +
        '<code>&lt;head&gt;</code> of your homepage.</p></div>';

    document.getElementById('schema-out-wrap').innerHTML =
      warn +
      '<div class="code-out" id="schema-code">' + this.esc(block) + '</div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-copy-schema">📋 Copy code</button>' +
        '<a class="btn btn-ghost btn-sm" href="https://search.google.com/test/rich-results" ' +
        'target="_blank" rel="noopener">Open Rich Results Test ↗</a>' +
      '</div>';

    document.getElementById('btn-copy-schema').addEventListener('click', e => {
      this.copy(block, e.target);
    });
  },

  /* --------------------------------------------------------------- events */
  bind() {
    // checklist track switch
    document.querySelectorAll('[data-track]').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-track]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        this.track = b.dataset.track;
        this.renderChecklist();
      });
    });

    // ticking items
    document.getElementById('checklist-out').addEventListener('change', e => {
      if (e.target.type !== 'checkbox') return;
      const label = e.target.closest('.check-item');
      const key = label.dataset.key;
      if (e.target.checked) this.checks[key] = 1; else delete this.checks[key];
      label.classList.toggle('done', e.target.checked);
      this.saveChecks();
      this.updateCheckProgress();
    });

    // "AI prompt" links inside the checklist jump to and open that prompt
    document.getElementById('checklist-out').addEventListener('click', e => {
      const link = e.target.closest('[data-open-prompt]');
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      this.openPrompt(link.dataset.openPrompt);
    });

    document.getElementById('btn-clear-check').addEventListener('click', () => {
      if (!confirm('Clear every tick on both checklists?')) return;
      this.checks = {};
      this.saveChecks();
      this.renderChecklist();
    });
    document.getElementById('btn-print-check').addEventListener('click', () => window.print());

    // prompt filters
    document.getElementById('prompt-filters').addEventListener('click', e => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      this.promptFilter = b.dataset.cat;
      this.renderPromptFilters();
      this.renderPrompts();
    });

    // prompt expand + copy
    document.getElementById('prompt-out').addEventListener('click', e => {
      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        const p = PROMPTS.find(x => x.id === copyBtn.dataset.copy);
        this.copy(this.fill(p.prompt), copyBtn);
        const flag = copyBtn.parentElement.querySelector('.copied');
        flag.classList.remove('hidden');
        setTimeout(() => flag.classList.add('hidden'), 2000);
        return;
      }
      const head = e.target.closest('.prompt-head');
      if (head) head.parentElement.classList.toggle('open');
    });

    document.getElementById('btn-gen-schema').addEventListener('click', () => this.generateSchema());
  },

  openPrompt(id) {
    // make sure the prompt is visible under the current filter
    const p = PROMPTS.find(x => x.id === id);
    if (!p) return;
    if (this.promptFilter !== 'all' && this.promptFilter !== p.cat) {
      this.promptFilter = 'all';
      this.renderPromptFilters();
      this.renderPrompts();
    }
    const card = document.querySelector('[data-prompt="' + id + '"]');
    if (!card) return;
    card.classList.add('open');
    const y = card.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
    card.style.transition = 'box-shadow .4s';
    card.style.boxShadow = '0 0 0 3px var(--brand)';
    setTimeout(() => { card.style.boxShadow = ''; }, 1600);
  },

  copy(text, btn) {
    const done = () => {
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = old; }, 1800);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text, done));
    } else {
      this.fallbackCopy(text, done);
    }
  },

  fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:absolute;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  },

  esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
};

/* Expose for cross-file access: a top-level const is not a window property. */
window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  Audit.init();
  App.init();
  if (window.CheckerUI) CheckerUI.init();
});
