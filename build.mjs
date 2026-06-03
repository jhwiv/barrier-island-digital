#!/usr/bin/env node
// Cache-proof deploy build.
// Cloudflare caches .css/.js by extension with a 4-hour minimum that _headers cannot lower.
// The reliable fix (per MDN + Cloudflare guidance) is CONTENT-HASHED FILENAMES: each change
// produces a brand-new filename the HTML points to, so no browser or edge can serve a stale copy.
//
// This script:
//   1. Reads styles.css + main.js, computes an 8-char content hash for each.
//   2. Writes hashed copies (e.g. styles.3f9a1c7b.css) into dist/.
//   3. Copies index.html into dist/ with references rewritten to the hashed names
//      (and strips the old ?v= query string, which is no longer needed).
//   4. Copies all other static files (content.json, assets/, manifest, _headers, etc.) into dist/.
// Cloudflare Pages then deploys dist/ as the output directory.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');

function hash(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

// Fresh dist
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// 1+2: hash the two cache-sensitive assets
const cssBuf = readFileSync(join(root, 'styles.css'));
const jsBuf = readFileSync(join(root, 'main.js'));
const cssName = `styles.${hash(cssBuf)}.css`;
const jsName = `main.${hash(jsBuf)}.js`;
writeFileSync(join(dist, cssName), cssBuf);
writeFileSync(join(dist, jsName), jsBuf);

// 3: rewrite HTML references (handle both ?v=... and plain forms)
let html = readFileSync(join(root, 'index.html'), 'utf8');
html = html.replace(/href="styles\.css(?:\?v=[^"]*)?"/g, `href="${cssName}"`);
html = html.replace(/src="main\.js(?:\?v=[^"]*)?"/g, `src="${jsName}"`);
writeFileSync(join(dist, 'index.html'), html);

// 4: copy remaining static files verbatim
for (const f of ['content.json', 'site.webmanifest', '_headers', 'robots.txt', 'README.md']) {
  if (existsSync(join(root, f))) cpSync(join(root, f), join(dist, f));
}
if (existsSync(join(root, 'assets'))) cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });

console.log(`Built dist/  →  ${cssName}, ${jsName}`);
