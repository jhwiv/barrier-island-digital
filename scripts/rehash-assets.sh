#!/usr/bin/env bash
# Rehash CSS/JS assets so every content change produces a new filename.
#
# Why this exists:
#   _headers caches /styles.*.css and /main.*.js as `immutable` for a year, and
#   sw.js cache-firsts them. If we ever edit styles.css or main.js WITHOUT
#   producing a new hashed filename, every cache layer (Cloudflare edge,
#   service worker, Chrome iOS HTTP cache) keeps serving the old bytes.
#   That's how Chrome iOS got stuck on a broken mobile-padding CSS for days
#   (see commit 3a9aadf, 2026-06-16).
#
# What it does, idempotently:
#   1. md5 the source files styles.css and main.js -> first 8 hex chars.
#   2. Copy to styles.<hash>.css / main.<hash>.js (delete any other hashed
#      copies of the same base name so stale assets don't ship).
#   3. Rewrite index.html so it references the new filenames.
#   4. Stamp the combined hash into sw.js's CACHE constant so the service
#      worker activates a fresh cache and discards old assets.
#   5. Stamp version.json with the git SHA + buildAt.
#
# Run locally with: bash scripts/rehash-assets.sh
# CI runs it on every push to master (.github/workflows/rehash.yml).

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f styles.css ]]; then echo "styles.css not found" >&2; exit 1; fi
if [[ ! -f main.js   ]]; then echo "main.js not found"   >&2; exit 1; fi
if [[ ! -f index.html ]]; then echo "index.html not found" >&2; exit 1; fi
if [[ ! -f sw.js     ]]; then echo "sw.js not found"     >&2; exit 1; fi

css_hash="$(md5sum styles.css | cut -c1-8)"
js_hash="$(md5sum main.js   | cut -c1-8)"
combined="${css_hash}${js_hash}"

new_css="styles.${css_hash}.css"
new_js="main.${js_hash}.js"

echo "css -> ${new_css}"
echo "js  -> ${new_js}"

# Remove old hashed copies (but keep the source files styles.css / main.js).
for f in styles.*.css; do
  [[ "$f" == "$new_css" || "$f" == "styles.css" ]] && continue
  echo "removing stale $f"
  rm -f -- "$f"
done
for f in main.*.js; do
  [[ "$f" == "$new_js" || "$f" == "main.js" ]] && continue
  echo "removing stale $f"
  rm -f -- "$f"
done

cp -f styles.css "$new_css"
cp -f main.js   "$new_js"

# Rewrite index.html. Use sed with a delimiter that won't appear in filenames.
sed -i -E "s|href=\"styles\\.[a-z0-9]+\\.css\"|href=\"${new_css}\"|g" index.html
sed -i -E "s|src=\"main\\.[a-z0-9]+\\.js\"|src=\"${new_js}\"|g"   index.html

# Stamp the SW cache name. Pattern: CACHE = 'bid-v<combined>';
sed -i -E "s|^const CACHE = '[^']*';|const CACHE = 'bid-v${combined}';|" sw.js

# Stamp version.json (the existing workflow does this too; doing it here as
# well makes the script self-contained for local runs).
sha="${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo local)}"
built_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '{"sha":"%s","builtAt":"%s","assets":{"css":"%s","js":"%s"}}\n' \
  "$sha" "$built_at" "$new_css" "$new_js" > version.json

echo
echo "Rehash complete:"
echo "  CSS: $new_css"
echo "  JS:  $new_js"
echo "  SW cache: bid-v${combined}"
