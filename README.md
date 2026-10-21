# Pumpkin & Paper — Halloween Bingo

A complete English, static Halloween bingo website. No accounts, server API, database, analytics, remote fonts, or CDN runtime dependencies.

## Run

Requires Node.js 20 or newer. The committed `dist/` folder already includes all artwork, the PDF library, and the downloadable default set.

```powershell
cd halloween-bingo
npm start
```

Open **http://localhost:4173**. No dependency installation is needed to serve the finished product. Use an HTTP server rather than opening the HTML with `file://`.

Deploy the **contents of `dist/`** to any static host (Cloudflare Pages, Netlify, GitHub Pages, or a standard web server). There is no application login gate. For Git-connected hosting, use the repository root as the project directory, leave the build command empty, and set the output directory to `dist`.

## What works

- Download the ready-made 30-card, full-color, 5 × 5 US Letter PDF immediately, even without JavaScript: `dist/downloads/halloween-bingo-30-cards.pdf`.
- Generate 1–50 cards locally, with 10 / 20 / 30 shortcuts, 3 × 3 / 4 × 4 / 5 × 5 grids, color / outline ink saver, and US Letter / A4.
- Only 5 × 5 cards have a FREE center. The FREE artwork is distinct from all 36 game elements.
- Shuffle and regenerate, browse every card, view all thumbnails, inspect calling sheets and the printable rules.
- Download a real PDF matching the current preview, or use the separately labeled **Print / Save as PDF** button.
- One game card per page; calling cards arranged 12 per page with cutting lines. Calling cards contain exactly the union of the current batch's game elements.
- Pending setting changes disable export until the user generates the new batch. Export locks prevent duplicate processing; progress and errors are announced.
- Static, indexable English copy, visible instructions and FAQs, a real card rendered in the HTML, keyboard focus, accessible form controls, and keyboard-operable tabs.

## Implementation

- `dist/core.js`: deterministic seeded Fisher–Yates generation, unique layout checks, shared page geometry.
- `dist/pdf.js`: PDF export with pdf-lib; vector text and rules, embedded high-resolution local artwork. The same page model drives SVG preview and print.
- `dist/app.js`: UI, validation, navigation, generation, downloads, and printing.
- `scripts/artwork.mjs`: original SVG illustrations, plus a dedicated FREE-space graphic. The ink saver uses white fills and dark outlines.
- `scripts/build.mjs`: regenerates SVG/300 px PNG assets, vendors pdf-lib with its license, creates the fixed default PDF, and embeds the default hero card.
- `tests/`: algorithm, browser, pagination, and PDF consistency checks.

The layout uniqueness guarantee applies **within a batch**, not across independent generations. Multiple players can win on the same draw.

## Rebuild and test

On a normal machine:

```sh
npm install
npm run build
npm test
# In another terminal, while npm start is running:
npx playwright install chromium
npm run test:browser
```

The browser test automatically uses installed Chrome/Edge on Windows; otherwise it uses Playwright Chromium. Set `BROWSER_PATH` to override. In this Codex workspace, build and test helpers can also use the bundled dependencies via `CODEX_NODE_MODULES`; this is not needed for end users.

Optional deeper PDF verification:

```sh
python -m pip install pypdf pdfplumber
python tests/verify_pdf.py
```

Visual test artifacts are saved under `test-output/`, which is excluded from publication. The full `dist/` directory is the ready-to-deploy product; no compilation is required on the hosting service.

## SEO and deployment configuration

The specified title, H1, description, and explanatory text are in `dist/index.html`. The production canonical is `https://halloween-bingo-bkg.pages.dev/`. `dist/sitemap.xml` lists that single page, and `dist/robots.txt` permits crawling and declares the sitemap. No year appears in the route.

The Google Search Console HTML verification file supplied by the site owner is published at `/google2d1dd99d57463bc5.html`. Use a URL-prefix property for the full production HTTPS address, choose HTML file verification, and keep the file deployed after verification. After verification, submit `/sitemap.xml`; the verified site can also be imported into Bing Webmaster Tools. See `STRUCTURE.md` for the URLs and domain migration notes.

## Artwork and licenses

All 36 game illustrations and the FREE illustration were created for this project using local SVG geometry; there are no system emoji in printable material. You may use, modify, print, and distribute the original artwork as part of this product. pdf-lib is MIT licensed; its full notice is included at `dist/vendor/pdf-lib.LICENSE.md`.

## Verification

The implementation is checked with:

- 600 seeded batches across all grid / paper / color choices and quantities 1, 10, 20, 30, 50.
- No repeated card layouts or game elements within a card, correct FREE placement, exact calling-card coverage.
- Real PDF downloads at 3 × 3, 4 × 4, and 5 × 5; default 34-page PDF and maximum 54-page PDF opening and page dimensions.
- Every exported text node compared to the corresponding preview, plus PDF text/artwork margin checks.
- Browser print-to-PDF on both paper sizes with matching page counts, without extra or split pages.
- Preview pagination, gallery, tabs, keyboard tab navigation, all settings, shuffle, shortcut buttons, download links, and print invocation.
- Responsive checks at 320, 375, 390, and 768 px, plus desktop/mobile screenshot review.

Physical printer output depends on the printer driver. Select matching paper, 100% / Actual size, and disable browser headers/footers.
