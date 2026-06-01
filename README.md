# Barrier Island Digital

Marketing site for **Barrier Island Digital, LLC** — a software studio crafting bespoke,
mobile-first travel companions and digital products.

Static site (HTML / CSS / vanilla JS). No build step required.

## Local preview
Open `index.html` in a browser, or serve the folder:
```bash
npx serve .
```

## Deploy — Cloudflare Pages
Git-connected (recommended): in the Cloudflare dashboard → Workers & Pages → Create →
Pages → Connect to Git → select this repo. Build settings:
- **Framework preset:** None
- **Build command:** *(leave empty)*
- **Build output directory:** `/`

Or via Wrangler:
```bash
npx wrangler pages deploy . --project-name=barrier-island-digital
```

## Structure
- `index.html` — single-page site (hero, services, work, about, contact)
- `styles.css` — design tokens, light/dark themes, responsive layout
- `main.js` — theme toggle, nav, scroll reveal, canvas project visuals
- `assets/` — hero image + logo SVG
