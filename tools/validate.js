/* ==========================================================================
   Integrity check — run it before you publish, and CI runs it before it
   deploys. No dependencies, nothing to install.

       node tools/validate.js

   It exists because every number on the page is a promise: "45 checks",
   "27 prompts", "74 things to tick off". Those drifted three times while the
   data underneath them changed, and a stale count is the kind of thing a
   restaurant owner notices and a developer never does. So nothing here is
   hard-coded — each claim is checked against the data that produces it.

   It also guards the shape of the page (section order, numbering, the mount
   points the JS writes into, every in-page anchor resolving), the promises in
   the README, and a word budget, since "too wordy" is the note this page has
   had to answer more than once.
   ========================================================================== */
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = path.join(__dirname, '..');
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  FAIL ' + m); } };

const sandbox = { window: {}, document: { addEventListener(){} }, console, localStorage: { getItem(){return null}, setItem(){} } };
sandbox.window.window = sandbox.window;
const ctx = vm.createContext(sandbox);
const NAMES = ['PILLARS','BANDS','PROMPTS','CHECKLISTS','RESTAURANT_FIELDS',
  'PAGE_CHECKS','SAMPLE_REPORT','GMB_CHECKS','AEO_CHECKS','AI_CRAWLERS','PROMPT_CATEGORIES'];
const bundle = ['data.js','prompts.js','config.js','checklists.js','checker-spec.js','sample.js','gmb.js','aeo.js']
  .map(f => fs.readFileSync(path.join(R, 'assets/js', f), 'utf8')).join('\n;\n')
  // top-level const is not a window property, so hoist the names we test explicitly
  + '\n;' + NAMES.map(n => 'try { window.' + n + ' = window.' + n + ' || ' + n + '; } catch (e) {}').join('\n');
vm.runInContext(bundle, ctx, { filename: 'bundle.js' });
const W = sandbox.window;

console.log('\n-- window exports');
NAMES.forEach(k => ok(W[k], k + ' exported on window'));
ok(W.DINELINE_CONFIG, 'DINELINE_CONFIG exported on window');

console.log('\n-- data integrity');
ok(W.PILLARS.reduce((a,p)=>a+p.weight,0) === 100, 'pillar weights sum to 100');
ok(W.PROMPTS.length === 27, 'PROMPTS is 27, got ' + W.PROMPTS.length);
const pids = new Set();
W.PROMPTS.forEach(p => { ok(!pids.has(p.id), 'duplicate prompt id ' + p.id); pids.add(p.id);
  ok(p.title && p.prompt && p.cat, p.id + ' has title/prompt/cat');
  ok(W.PROMPT_CATEGORIES.some(c=>c.id===p.cat), p.id + ' has a real category'); });
const tracks = Object.keys(W.CHECKLISTS);
ok(tracks.length === 1 && tracks[0] === 'aeo', 'one checklist track, aeo');
const groups = W.CHECKLISTS.aeo.groups;
const items = groups.reduce((a,g)=>a+g.items.length,0);
ok(items === 74, 'checklist items is 74, got ' + items);
groups.forEach(g => g.items.forEach(i => {
  if (i.ai) ok(W.PROMPTS.some(p=>p.id===i.ai), 'checklist points at real prompt ' + i.ai); }));
ok(W.DINELINE_CONFIG.apiBase === '', 'config.js ships with an empty apiBase (got "' + W.DINELINE_CONFIG.apiBase + '")');
ok(!/AIza|AIzaSy/.test(fs.readFileSync(path.join(R,'assets/js/config.js'),'utf8')), 'no API key in config.js');
// Google-side checks come from gmb.js; site-side from the page checks, the AEO
// crawler/answerability checks and the schema fields the checker validates.
const gmbN  = W.GMB_CHECKS.length;
const siteN = W.PAGE_CHECKS.length + W.AEO_CHECKS.length + W.RESTAURANT_FIELDS.length;
const allChecks = gmbN + siteN;

console.log('\n-- index.html claims');
const H = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const say = (n, what) => ok(H.includes(n), 'page states ' + n + ' ' + what);
ok(H.includes(allChecks + ' answer-engine checks') || H.includes(allChecks + ' checks'),
   'page check count matches the data (' + allChecks + ')');
say(W.PROMPTS.length + ' prompts', 'for the library');
say(items + ' things to tick off', 'for the checklist');
ok(H.includes(gmbN + ' checks'), 'Google listing check count (' + gmbN + ')');
ok(H.includes(siteN + ' checks'), 'site check count (' + siteN + ')');

console.log('\n-- structure');
const sections = [...H.matchAll(/<section class="band[^"]*" id="([a-z-]+)">/g)].map(m=>m[1]);
ok(JSON.stringify(sections) === JSON.stringify(
   ['shift','shipped','checker','doors','stack','dineline','plan']),
   'seven sections in narrative order, got ' + sections.join(','));
const kickers = [...H.matchAll(/class="kicker">(\d\d) /g)].map(m=>m[1]);
ok(JSON.stringify(kickers) === JSON.stringify(['01','02','03','04','05','06','07']),
   'kickers numbered 01-07 with no gaps, got ' + kickers.join(','));
for (const id of ['analyze-status','analyze-results','check-results','weight-stack','weight-key',
                  'profile-form','checklist-out','prompt-out','prompt-filters','hours-fields',
                  'schema-out-wrap','url-form','check-input','prompts','checklists','schema'])
  ok((H.match(new RegExp('id="' + id + '"','g'))||[]).length === 1, 'exactly one #' + id);
// every in-page anchor resolves
const anchors = new Set([...H.matchAll(/href="#([a-zA-Z0-9-]+)"/g)].map(m=>m[1]));
for (const a of anchors) ok(H.includes('id="' + a + '"'), 'anchor #' + a + ' has a target');

console.log('\n-- 2027 framing');
ok(/2027/.test(H), 'page is framed on 2027');
ok(!/\bSEO playbook\b/i.test(H), 'no "SEO playbook" framing left');
ok(/OpenTable/.test(H) && /Resy/.test(H), 'names the booking providers that matter');
ok(/Dishio/.test(H), 'explains Dishio');
ok(/llms\.txt/.test(H), 'takes a position on llms.txt');
ok((H.match(/pill-live|pill-test|pill-soon/g)||[]).length >= 7, 'shipped items carry a status pill');
// the stack section must not claim Dineline does AEO services it does not sell
ok(!/we (?:do|handle|run) your (?:schema|AEO|answer-engine)/i.test(H),
   'does not claim Dineline AEO services');

console.log('\n-- README');
const RM = fs.readFileSync(path.join(R, 'README.md'), 'utf8');
ok(RM.includes('**' + W.PROMPTS.length + ' prompts**'), 'README prompt count');
ok(RM.includes(W.PROMPTS.length + ' AI prompts'), 'README project-tree prompt count');
ok(RM.includes('**' + items + ' tickable tasks**'), 'README checklist count');
ok(RM.includes(items + ' checklist items'), 'README project-tree checklist count');
ok(RM.includes(W.PILLARS.length + ' pillars'), 'README pillar count');
ok(RM.includes(gmbN + ' Google Business Profile checks'), 'README gmb check count');
ok(RM.includes('2027'), 'README carries the 2027 framing');
// the privacy note must not claim no network request now that the checker makes one
ok(!/no network request of any kind/.test(RM), 'README privacy note is not self-contradicting');
ok(!/Two checklists|two tracks/.test(RM), 'README does not still claim two checklist tracks');

console.log('\n-- the audit is gone');
ok(!fs.existsSync(path.join(R, 'assets/js/audit.js')), 'audit.js deleted');
ok(!fs.existsSync(path.join(R, 'docs/05-audit-questions.md')), 'audit questions doc deleted');
ok(!/QUESTIONS/.test(fs.readFileSync(path.join(R,'assets/js/data.js'),'utf8')), 'QUESTIONS data removed');
ok(!/audit\.js/.test(H), 'index.html does not load audit.js');
ok(!/id="audit"|audit-shell|audit-form|audit-steps/.test(H), 'no audit markup left in the page');
for (const f of ['assets/js/app.js','assets/js/checker.js','assets/js/analyze.js'])
  ok(!/window\.Audit|Audit\.state/.test(fs.readFileSync(path.join(R,f),'utf8')), f + ' no longer reaches for Audit');
ok(/window\.Profile = Profile/.test(fs.readFileSync(path.join(R,'assets/js/profile.js'),'utf8')),
   'profile.js exports Profile on window');
ok(!/QUESTIONS/.test(fs.readFileSync(path.join(R,'tools/build-docs.js'),'utf8')), 'build-docs drops QUESTIONS');
ok(!/05-audit-questions/.test(fs.readFileSync(path.join(R,'tools/build-docs.js'),'utf8')), 'build-docs drops the audit doc');
const docRefs = fs.readdirSync(path.join(R,'docs')).map(f => fs.readFileSync(path.join(R,'docs',f),'utf8')).join('\n');
ok(!/05-audit-questions/.test(docRefs), 'no doc links to the deleted audit doc');
ok(!/05-audit-questions/.test(RM), 'README does not link to the deleted audit doc');

console.log('\n-- hosting');
const WF = path.join(R, '.github/workflows/pages.yml');
ok(fs.existsSync(WF), 'the Pages workflow exists');
const wf = fs.existsSync(WF) ? fs.readFileSync(WF, 'utf8') : '';
ok(/node tools\/validate\.js/.test(wf), 'the deploy is gated on this validator');
ok(/upload-pages-artifact|deploy-pages/.test(wf), 'the workflow actually deploys Pages');
ok(/\.nojekyll/.test(wf), 'the published site turns Jekyll off');
// A project page lives at /<repo>/, so a leading-slash path 404s there.
const rooted = [...H.matchAll(/(?:href|src)="(\/[^\/"][^"]*)"/g)].map(m => m[1]);
ok(rooted.length === 0, 'no root-absolute paths (they break a project page): ' + rooted.join(', '));
// Everything the page asks for must be in the repo to be published.
const localRefs = [...H.matchAll(/(?:href|src)="((?!https?:|data:|tel:|mailto:|#)[^"]+)"/g)].map(m => m[1]);
localRefs.forEach(f => ok(fs.existsSync(path.join(R, f.split('#')[0])), 'page references a file that exists: ' + f));

console.log('\n-- concision');
// Count what a reader actually faces on load, and the whole thing. Collapsed
// <details> is reference material, not something they have to wade through.
const strip = t => t.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<[^>]+>/g,' ')
                     .replace(/&[a-z]+;/g,' ').split(/\s+/).filter(Boolean).length;
const total = strip(H);
const visible = strip(H.replace(/<script[\s\S]*?<\/script>/g,' ')
                       .replace(/<details[\s\S]*?<\/details>/g,' '));
ok(visible < 2500, 'visible body under 2500 words (got ' + visible + ')');
ok(total < 2900, 'whole body under 2900 words (got ' + total + ')');
console.log('   (visible ' + visible + ' words · total ' + total + ')');
// per-section budget, so no one section can quietly swell again
const secWords = [...H.matchAll(/<section class="band[^"]*" id="([a-z-]+)">([\s\S]*?)<\/section>/g)]
  .map(m => [m[1], strip(m[2].replace(/<details[\s\S]*?<\/details>/g,' '))]);
secWords.forEach(([id, n]) => ok(n <= 700, id + ' section under 700 visible words (got ' + n + ')'));

console.log('\n-- css');
const C = fs.readFileSync(path.join(R, 'assets/css/styles.css'), 'utf8');
for (const cls of ['.ships','.ship-when','.pill-live','.pill-test','.pill-soon','.win.no',
                   '.cta-close','.ac-action','.ac-btn','.split > div.hi'])
  ok(C.includes(cls + ' ') || C.includes(cls + ','), 'css defines ' + cls);
// every class used in the new sections is styled somewhere
for (const cls of ['explain','ex-ico','ex-eg','split','kpi-row','fixlist','fix-n','fix-top',
                   'fix-what','fix-do','chip','rows','row-item','wins-grid','win','timeline',
                   'tl-phase','callout','section-head','kicker'])
  ok(C.includes('.' + cls), 'css defines .' + cls);

console.log('\n' + (fails ? 'FAILED ' + fails + ' of ' + checks + ' checks'
                     : 'PASS — ' + checks + ' checks'));
process.exit(fails ? 1 : 0);
