import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BATCH, DEFAULT_SETTINGS, ITEMS, generateBatch, makePages, PAPER } from '../dist/core.js';
import { buildPdf } from '../dist/pdf.js';
import { dependency } from '../scripts/dependencies.mjs';
import { readFile } from 'node:fs/promises';
const lib = dependency('pdf-lib');
function validate(batch) {
  assert.equal(batch.cards.length, batch.settings.count);
  assert.equal(new Set(batch.cards.map(card => card.join('|'))).size, batch.cards.length);
  const used = new Set();
  batch.cards.forEach(card => {
    assert.equal(card.length, batch.settings.grid ** 2);
    assert.equal(new Set(card).size, card.length);
    if (batch.settings.grid === 5) assert.equal(card[12], 'free');
    else assert.ok(!card.includes('free'));
    card.filter(id => id !== 'free').forEach(id => used.add(id));
  });
  assert.deepEqual([...used].sort(), [...batch.calling].sort());
}
test('default 30-card set: unique layouts, unique items, complete calling deck', () => {
  validate(DEFAULT_BATCH);
  assert.equal(DEFAULT_BATCH.cards.length, 30);
  assert.equal(ITEMS.length, 36);
  assert.deepEqual(DEFAULT_BATCH, generateBatch(DEFAULT_SETTINGS, 10312026));
});
test('all grid, paper, color, and boundary count combinations', () => {
  for (const grid of [3, 4, 5]) for (const paper of ['letter', 'a4']) for (const color of ['color', 'ink']) for (const count of [1, 10, 20, 30, 50]) {
    for (let seed = 0; seed < 10; seed++) {
      const batch = generateBatch({ grid, paper, color, count }, seed);
      validate(batch);
      const pages = makePages(batch);
      assert.equal(pages.length, count + Math.ceil(batch.calling.length / 12) + 1);
      for (const page of pages) {
        assert.equal(page.width, PAPER[paper].width);
        assert.equal(page.height, PAPER[paper].height);
        for (const element of page.elements) {
          assert.ok(element.x >= 20 && element.y >= 20);
          assert.ok(element.x + (element.width || 0) <= page.width - 20);
          assert.ok(element.y + (element.height || 0) <= page.height - 20);
          if (color === 'ink' && element.type === 'rect') assert.equal(element.fill, '#ffffff');
        }
      }
    }
  }
});
test('invalid values are rejected; fresh seeds generate fresh layouts', () => {
  for (const count of [0, 51, -1, 1.5, NaN]) assert.throws(() => generateBatch({ ...DEFAULT_SETTINGS, count }));
  assert.throws(() => generateBatch({ ...DEFAULT_SETTINGS, grid: 6 }));
  assert.throws(() => generateBatch({ ...DEFAULT_SETTINGS, paper: 'invalid' }));
  assert.throws(() => generateBatch({ ...DEFAULT_SETTINGS, color: 'invalid' }));
  assert.notDeepEqual(generateBatch(DEFAULT_SETTINGS, 1).cards, generateBatch(DEFAULT_SETTINGS, 2).cards);
});
test('default PDF opens and has one page per card plus calling sheets and rules', async () => {
  const bytes = await readFile(new URL('../dist/downloads/halloween-bingo-30-cards.pdf', import.meta.url));
  const pdf = await lib.PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 34);
  pdf.getPages().forEach(page => assert.deepEqual(page.getSize(), { width: 612, height: 792 }));
});
test('A4 ink saver export opens with the right page size', async () => {
  const batch = generateBatch({ count: 50, grid: 4, color: 'ink', paper: 'a4' }, 128);
  const bytes = await buildPdf(batch, { lib, loadAsset: path => readFile(new URL(`../dist/${path}`, import.meta.url)) });
  const pdf = await lib.PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 54);
  pdf.getPages().forEach(page => assert.deepEqual(page.getSize(), { width: 595.28, height: 841.89 }));
});
