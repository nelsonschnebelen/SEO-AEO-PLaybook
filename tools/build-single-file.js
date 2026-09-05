#!/usr/bin/env node
/* ==========================================================================
   Bundles the site into one self-contained HTML file.

   Used for sharing a live preview (Claude Artifacts, a paste into any host)
   where the separate CSS/JS/SVG files would not resolve. Output opens on the
   sample report so the page shows what it does straight away.

   Usage:  node tools/build-single-file.js [outfile]
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'dist', 'playbook.html');

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
let html = read('index.html');

/* ---- inline the stylesheet ---- */
html = html.replace(
  /<link rel="stylesheet" href="assets\/css\/styles\.css">/,
  '<style>\n' + read('assets/css/styles.css') + '\n</style>'
);

/* ---- inline the scripts, in their original order ---- */
const scripts = [...html.matchAll(/<script src="(assets\/js\/[^"]+)"><\/script>\s*/g)];
if (!scripts.length) throw new Error('no local scripts found in index.html');

let bundle = scripts.map(m => {
  let src = read(m[1]);
  if (m[1].endsWith('config.js')) {
    // No analyser in a shared preview: open on the sample instead.
    src = src.replace(/apiBase: '[^']*'/, "apiBase: ''")
             .replace('window.DINELINE_CONFIG = {', 'window.DINELINE_CONFIG = {\n  autoSample: true,');
  }
  return '/* ===== ' + m[1] + ' ===== */\n' + src;
}).join('\n\n');

html = html.replace(scripts[0][0], '@@BUNDLE@@\n');
scripts.slice(1).forEach(m => { html = html.replace(m[0], ''); });
html = html.replace('@@BUNDLE@@', '<script>\n' + bundle + '\n</' + 'script>');

/* ---- inline the logo: currentColor resolves in an inline SVG, so one
        copy serves both themes and the <picture> pair is not needed ---- */
const logo = read('assets/img/dineline.svg')
  .replace(/fill="black"/g, 'fill="currentColor"')
  .replace('<svg ', '<svg class="wordmark" role="img" aria-label="Dineline" ');
html = html.replace(
  /<picture>\s*<source[^>]*>\s*<img src="assets\/img\/dineline\.svg"[^>]*>\s*<\/picture>/g,
  logo
);

/* ---- strip the document scaffolding: the artifact host supplies it ---- */
const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'Restaurant Playbook';
const fontLink = (html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>/) || [''])[0];
const style = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));

let out = '<title>' + title + '</title>\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  fontLink + '\n' +
  style + '\n' +
  '<style>\n.wordmark { display:block; width:132px; height:auto; }\n</style>\n' +
  body.trim() + '\n';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);

const leftovers = out.match(/(src|href)="assets\//g);
console.log('wrote ' + path.relative(ROOT, OUT) + '  (' + (out.length / 1024).toFixed(0) + ' KB)');
console.log('  scripts inlined : ' + scripts.length);
console.log('  logo inlined    : ' + (out.includes('class="wordmark"') ? 'yes' : 'NO'));
console.log('  local refs left : ' + (leftovers ? leftovers.length + ' — ' + [...new Set(leftovers)].join(', ') : 'none'));
if (leftovers) process.exitCode = 1;
