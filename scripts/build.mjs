import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dependency } from './dependencies.mjs';
import { iconSvg } from './artwork.mjs';
import { ITEMS, DEFAULT_BATCH, makePages, pageSvg } from '../dist/core.js';
import { buildPdf } from '../dist/pdf.js';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const sharp = dependency('sharp');
for (const color of ['color', 'ink']) {
  await mkdir(`${root}/assets/icons/${color}`, { recursive: true });
  for (const item of [...ITEMS, { id: 'free' }]) {
    const svg = iconSvg(item.id, color === 'ink');
    await writeFile(`${root}/assets/icons/${color}/${item.id}.svg`, svg);
    await sharp(Buffer.from(svg)).resize(300, 300).png().toFile(`${root}/assets/icons/${color}/${item.id}.png`);
  }
}
await mkdir(`${root}/vendor`, { recursive: true });
await mkdir(`${root}/downloads`, { recursive: true });
const lib = dependency('pdf-lib');
// Locate the exact installed pdf-lib distribution through the dependency resolver.
const { createRequire } = await import('node:module');
let require = createRequire(import.meta.url);
try { require.resolve('pdf-lib'); } catch {
  require = createRequire(`${process.env.CODEX_NODE_MODULES || 'C:/Users/Lucky/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'}/package.json`);
}
await writeFile(`${root}/vendor/pdf-lib.min.js`, await readFile(require.resolve('pdf-lib/dist/pdf-lib.min.js')));
await writeFile(`${root}/vendor/pdf-lib.LICENSE.md`, await readFile(require.resolve('pdf-lib/LICENSE.md')));
const bytes = await buildPdf(DEFAULT_BATCH, { lib, loadAsset: path => readFile(`${root}/${path}`) });
await writeFile(`${root}/downloads/halloween-bingo-30-cards.pdf`, bytes);
await writeFile(`${root}/downloads/default-batch.json`, JSON.stringify(DEFAULT_BATCH, null, 2));
// Inline a real default card in the HTML so the first preview works before JS starts.
const indexPath = `${root}/index.html`;
let html = await readFile(indexPath, 'utf8');
html = html.replace(/<!-- HERO_CARD_START -->[\s\S]*?<!-- HERO_CARD_END -->/, `<!-- HERO_CARD_START -->${pageSvg(makePages(DEFAULT_BATCH)[0])}<!-- HERO_CARD_END -->`);
await writeFile(indexPath, html);
console.log(`Built 36 original illustrations in two styles and a ${makePages(DEFAULT_BATCH).length}-page default PDF (${Math.round(bytes.length / 1024)} KB).`);
