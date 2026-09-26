/* ==========================================================================
   AI answer-readiness checks
   The questions that are specifically about being named by an assistant,
   rather than ranked by a search engine.

   Two groups:
     crawler access — can an assistant reach the site at all
     answerability  — once it is there, can it lift a usable answer out
   ========================================================================== */

/* The crawlers that decide whether you appear in AI answers. Training-only
   bots are deliberately not in this list: blocking those costs you nothing
   in visibility, and telling an owner otherwise would be wrong. */
const AI_CRAWLERS = [
  { ua: 'OAI-SearchBot', who: 'ChatGPT search results and citations' },
  { ua: 'PerplexityBot', who: 'Perplexity answers' },
  { ua: 'ClaudeBot', who: 'Claude' },
  { ua: 'Google-Extended', who: 'Gemini grounding' },
  { ua: 'Bingbot', who: 'Bing, which feeds a share of Copilot' }
];

/* Does robots.txt block `ua` from the site root? Group blocks are matched
   case-insensitively, with the most specific matching group winning, as
   the robots convention requires. */
function blockedByRobots(text, ua) {
  if (!text || !text.trim()) return false;

  const lines = text.split(/\r?\n/).map(l => l.replace(/#.*$/, '').trim()).filter(Boolean);
  const groups = [];
  let current = null;
  let expectingAgents = false;

  lines.forEach(line => {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) return;
    const field = m[1].trim().toLowerCase();
    const value = m[2].trim();

    if (field === 'user-agent') {
      if (!current || !expectingAgents) {
        current = { agents: [], rules: [] };
        groups.push(current);
        expectingAgents = true;
      }
      current.agents.push(value.toLowerCase());
    } else if (field === 'disallow' || field === 'allow') {
      if (!current) return;
      expectingAgents = false;
      current.rules.push({ allow: field === 'allow', path: value });
    }
  });

  const needle = ua.toLowerCase();
  const named = groups.filter(g => g.agents.includes(needle));
  const wildcard = groups.filter(g => g.agents.includes('*'));
  const applies = named.length ? named : wildcard;
  if (!applies.length) return false;

  /* Longest matching rule wins; a tie goes to allow. We only care about the
     site root, which is what an assistant fetches first. */
  let best = null;
  applies.forEach(g => g.rules.forEach(r => {
    const p = r.path;
    if (p === '') return;                       // "Disallow:" alone means allow all
    const matchesRoot = p === '/' || p === '/*';
    if (!matchesRoot) return;
    if (!best || p.length > best.path.length || (p.length === best.path.length && r.allow)) {
      best = r;
    }
  }));
  return best ? !best.allow : false;
}

const AEO_CHECKS = [
  {
    id: 'crawlers', todo: 'Let AI assistants read your site', doIn: 'code', mins: 10, sev: 'critical', blocker: true,
    why: 'If a crawler is blocked, you are not ranked low in that assistant — you are absent from it. A security plugin or CDN rule does this by default more often than owners realise.',
    fix: 'Allow OAI-SearchBot, PerplexityBot and ClaudeBot in robots.txt, and check your CDN or firewall is not challenging them separately.',
    test: (page) => {
      const r = page.robots;
      if (!r || !r.found) return null;
      const blocked = AI_CRAWLERS.filter(c => blockedByRobots(r.text, c.ua));
      if (!blocked.length) return null;
      return 'Your robots.txt blocks ' + blocked.map(c => c.ua).join(', ') +
        ' — so you cannot appear in ' + blocked.map(c => c.who).join(', ') + '.';
    }
  },
  {
    id: 'blanket-block', todo: 'Stop blocking every crawler', doIn: 'code', mins: 10, sev: 'critical', blocker: true,
    why: 'A blanket disallow takes you out of search and every AI answer at once. It is almost always left over from a staging site.',
    fix: 'Remove the site-wide "Disallow: /" from robots.txt, or scope it to the pages you genuinely want hidden.',
    test: (page) => {
      const r = page.robots;
      if (!r || !r.found) return null;
      return blockedByRobots(r.text, 'SomeUnknownBot')
        ? 'Your robots.txt disallows the whole site for every crawler that is not named explicitly.'
        : null;
    }
  },
  {
    id: 'answerable', todo: 'Answer the questions diners actually ask', doIn: 'site', mins: 90, sev: 'critical',
    topic: 'faq',
    why: 'Assistants lift self-contained passages. A page of real questions with a direct answer under each is the single most quotable thing a restaurant can publish.',
    fix: 'Add a page of 15 to 25 real diner questions — parking, reservations, dietary, group size, kids — each answered completely in the first 40 to 60 words.',
    test: (page) => {
      const text = page.text;
      const questions = (text.match(/\?/g) || []).length;
      const headingQs = (page.html.match(/<h[2-4][^>]*>[^<]*\?/gi) || []).length;
      if (headingQs >= 5) return null;
      if (questions < 3) return 'We found almost no questions-and-answers on the page.';
      return 'We found ' + questions + ' question marks but only ' + headingQs +
        ' question headings — assistants look for a question they can match, then the answer under it.';
    }
  },
  {
    id: 'facts', todo: 'State the facts AI will never guess', doIn: 'site', mins: 30, sev: 'important',
    why: 'An assistant will not infer that you take reservations or that parking exists. Anything your site does not say becomes "I am not sure", and the diner moves on.',
    fix: 'Say plainly, in text: your price range, whether you take reservations and the biggest party you seat, parking, accessibility, and how the kitchen handles dietary requests.',
    test: (page) => {
      const t = page.text.toLowerCase();
      const want = [
        ['reservations', /reserv|book a table|booking/],
        ['parking', /parking|car park|valet/],
        ['dietary options', /vegan|vegetarian|gluten|allerg/],
        ['accessibility', /wheelchair|accessible|step-free/]
      ];
      const missing = want.filter(([, re]) => !re.test(t)).map(([n]) => n);
      return missing.length ? 'Your page never mentions: ' + missing.join(', ') + '.' : null;
    }
  },
  {
    id: 'named-people', todo: 'Put a real name on the place', doIn: 'site', mins: 20, sev: 'nice',
    why: 'Assistants weigh signals of a real operation with real people behind it. A site with no named chef or owner reads as thinner than one that has them.',
    fix: 'Name the owner or chef on an About page, with a sentence on their background and where you source from.',
    test: (page) => /chef|owner|founder|family|since \d{4}/i.test(page.text)
      ? null : 'We could not find a chef, owner or founder named anywhere on the page.'
  }
];

/* Run the AEO checks over the fetched page plus its robots.txt. */
function analyzeAeo(html, robots) {
  const page = {
    html: html || '',
    text: (html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ')
                      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' '),
    robots: robots || null
  };

  const findings = [], wins = [];
  AEO_CHECKS.forEach(c => {
    let detail = null;
    try { detail = c.test(page); } catch (e) { detail = null; }
    if (detail) {
      findings.push({
        sev: c.sev, title: c.todo, detail, fix: c.fix, why: c.why,
        doIn: c.doIn, mins: c.mins, topic: c.topic || null, blocker: !!c.blocker, source: 'aeo'
      });
    } else {
      wins.push({ title: c.todo.replace(/^\w/, m => m.toUpperCase()), detail: 'Looks good', sev: c.sev, source: 'aeo' });
    }
  });

  /* Crawler access is worth reporting even when it passes — it is the one
     thing owners never think to check. */
  const robotsNote = (!robots || !robots.found)
    ? 'No robots.txt, so nothing is blocked.'
    : 'robots.txt read.';

  return { findings, wins, robotsNote };
}

window.AI_CRAWLERS = AI_CRAWLERS;
window.AEO_CHECKS = AEO_CHECKS;
window.analyzeAeo = analyzeAeo;
window.blockedByRobots = blockedByRobots;
