export const ITEMS = [
  ['pumpkin', 'Pumpkin'], ['ghost', 'Ghost'], ['bat', 'Bat'], ['black-cat', 'Black cat'],
  ['witch-hat', 'Witch hat'], ['candy', 'Candy'], ['spider', 'Spider'], ['web', 'Web'],
  ['skeleton', 'Skeleton'], ['owl', 'Owl'], ['moon', 'Moon'], ['cauldron', 'Cauldron'],
  ['candy-corn', 'Candy corn'], ['broom', 'Broom'], ['potion', 'Potion'], ['mummy', 'Mummy'],
  ['haunted-house', 'Haunted house'], ['scarecrow', 'Scarecrow'], ['apple', 'Apple'], ['leaf', 'Leaf'],
  ['acorn', 'Acorn'], ['cupcake', 'Cupcake'], ['lollipop', 'Lollipop'], ['treat-bag', 'Treat bag'],
  ['lantern', 'Lantern'], ['witch-boot', 'Witch boot'], ['monster', 'Monster'], ['star', 'Star'],
  ['corn', 'Corn'], ['candle', 'Candle'], ['eyeball', 'Eyeball'], ['witch', 'Witch'],
  ['vampire', 'Vampire'], ['pumpkin-pie', 'Pumpkin pie'], ['raven', 'Raven'], ['bow-tie', 'Bow tie']
].map(([id, name]) => ({ id, name }));
export const ITEM_MAP = Object.fromEntries(ITEMS.map(item => [item.id, item]));
export const DEFAULT_SETTINGS = Object.freeze({ count: 30, grid: 5, color: 'color', paper: 'letter' });
export const PAPER = { letter: { width: 612, height: 792, label: 'US Letter' }, a4: { width: 595.28, height: 841.89, label: 'A4' } };
export function seededRandom(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function validateSettings(settings) {
  if (!Number.isInteger(settings.count) || settings.count < 1 || settings.count > 50) throw new Error('Choose a whole number from 1 to 50.');
  if (![3, 4, 5].includes(settings.grid)) throw new Error('Choose a 3, 4, or 5 square grid.');
  if (!['color', 'ink'].includes(settings.color) || !PAPER[settings.paper]) throw new Error('Choose a valid color and paper size.');
}
export function generateBatch(settings = DEFAULT_SETTINGS, seed = crypto.getRandomValues(new Uint32Array(1))[0]) {
  validateSettings(settings);
  const random = seededRandom(seed), seen = new Set(), cards = [];
  while (cards.length < settings.count) {
    const pool = ITEMS.map(item => item.id);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const card = pool.slice(0, settings.grid ** 2 - (settings.grid === 5 ? 1 : 0));
    if (settings.grid === 5) card.splice(12, 0, 'free');
    const key = card.join('|');
    if (seen.has(key)) continue;
    seen.add(key); cards.push(card);
  }
  const used = new Set(cards.flat());
  return { settings: { ...settings }, seed, cards, calling: ITEMS.filter(item => used.has(item.id)).map(item => item.id) };
}
export const DEFAULT_BATCH = generateBatch(DEFAULT_SETTINGS, 10312026);

// One layout model, in PDF points, is consumed by SVG previews and the PDF writer.
export function makePages(batch) {
  const { width: w, height: h } = PAPER[batch.settings.paper], ink = batch.settings.color === 'ink';
  const purple = ink ? '#222222' : '#49344e', orange = ink ? '#222222' : '#ce5827';
  const pale = ink ? '#ffffff' : '#fff5e8', line = ink ? '#777777' : '#dcc9b8';
  const pages = [];
  const text = (x, y, value, size = 12, extra = {}) => ({ type: 'text', x, y, value, size, fill: purple, ...extra });
  const rect = (x, y, width, height, fill, stroke = null, extra = {}) => ({ type: 'rect', x, y, width, height, fill, stroke, ...extra });
  const base = (kind, title, subtitle) => ({
    kind, width: w, height: h, elements: [
      text(w / 2, 42, 'PUMPKIN & PAPER', 9, { align: 'center', bold: true, fill: orange }),
      text(w / 2, 78, title, 30, { align: 'center', bold: true }),
      text(w / 2, 102, subtitle, 10, { align: 'center' }),
      text(w / 2, h - 27, 'Free Halloween fun. Made for little monsters.', 9, { align: 'center' })
    ]
  });
  batch.cards.forEach((card, index) => {
    const page = base('card', 'HALLOWEEN BINGO', `Card ${String(index + 1).padStart(2, '0')}  |  ${batch.settings.grid} x ${batch.settings.grid}  |  ${PAPER[batch.settings.paper].label}`);
    const side = w - 72, cell = side / batch.settings.grid, top = 152;
    page.elements.push(text(36, 130, 'Name: __________________________________', 10));
    card.forEach((id, i) => {
      const x = 36 + i % batch.settings.grid * cell, y = top + Math.floor(i / batch.settings.grid) * cell;
      page.elements.push(rect(x, y, cell, cell, id === 'free' ? pale : '#ffffff', line));
      const imageSize = cell * 0.62;
      page.elements.push({ type: 'image', id, x: x + (cell - imageSize) / 2, y: y + cell * 0.07, width: imageSize, height: imageSize });
      page.elements.push(text(x + cell / 2, y + cell * 0.85, id === 'free' ? 'FREE' : ITEM_MAP[id].name, batch.settings.grid === 5 ? 10 : 13, { align: 'center', bold: id === 'free' }));
    });
    page.elements.push(text(w / 2, top + side + 27, 'Mark a row, column, or diagonal. Call out "Bingo!"', 11, { align: 'center', bold: true }));
    if (batch.settings.grid === 5) page.elements.push(text(w / 2, top + side + 45, 'The FREE center is yours to mark before you begin.', 10, { align: 'center' }));
    pages.push(page);
  });
  const perPage = 12;
  for (let start = 0; start < batch.calling.length; start += perPage) {
    const page = base('calling', 'CALLING CARDS', `Cut along the lines. Shuffle, draw, and show one card at a time.  |  Sheet ${start / perPage + 1}`);
    const cw = (w - 72) / 3, ch = (h - 210) / 4;
    batch.calling.slice(start, start + perPage).forEach((id, i) => {
      const x = 36 + i % 3 * cw, y = 135 + Math.floor(i / 3) * ch, size = Math.min(cw, ch) * 0.62;
      page.elements.push(rect(x, y, cw, ch, '#ffffff', line, { dashed: true }));
      page.elements.push({ type: 'image', id, x: x + (cw - size) / 2, y: y + 9, width: size, height: size });
      page.elements.push(text(x + cw / 2, y + ch - 17, ITEM_MAP[id].name, 12, { align: 'center', bold: true }));
    });
    pages.push(page);
  }
  const rules = base('rules', 'LET’S PLAY BINGO!', `${batch.cards.length === 1 ? '1 bingo card' : `${batch.cards.length} different cards`}. A little Halloween magic.`);
  const steps = [
    ['1. Print your set', ['Print one game card per player at 100% / Actual size.', `Use ${PAPER[batch.settings.paper].label} paper. Cut out the calling cards along the lines.`]],
    ['2. Get everyone ready', ['Hand out a different card and some pencils or counters.', batch.settings.grid === 5 ? 'Everyone can mark the FREE center before the game begins.' : 'Every square has a picture. There is no FREE space on this grid.']],
    ['3. Draw, show, and mark', ['Shuffle the calling cards in a bowl or bag. Draw one at a time.', 'Say its name and show the picture. Players mark a match.', 'Keep drawn cards aside so you can check a winning card.']],
    ['4. Call out “Bingo!”', ['A complete row, column, or diagonal wins.', 'Check the marked pictures against the cards you have drawn.', 'More than one player may win on the same draw. Celebrate together!']]
  ];
  let y = 159;
  for (const [title, lines] of steps) {
    rules.elements.push(text(46, y, title, 18, { bold: true, fill: orange }));
    lines.forEach((value, i) => rules.elements.push(text(46, y + 28 + i * 20, value, 11)));
    y += lines.length * 20 + 68;
  }
  rules.elements.push(rect(36, h - 127, w - 72, 64, pale, line));
  rules.elements.push(text(51, h - 103, 'Play it again', 12, { bold: true }));
  rules.elements.push(text(51, h - 83, 'Clear your markers, reshuffle the calling cards, and start a fresh round.', 10));
  pages.push(rules);
  return pages;
}
export const assetPath = (id, color, ext = 'svg') => `assets/icons/${color}/${id}.${ext}`;
const escapeXml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export function pageSvg(page, color = 'color') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.width} ${page.height}" role="img" aria-label="${escapeXml(page.kind === 'card' ? 'Halloween bingo card' : page.kind === 'calling' ? 'Calling cards to cut out' : 'Bingo game rules')}"><rect width="100%" height="100%" fill="white"/>${page.elements.map(el => {
    if (el.type === 'rect') return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill}" stroke="${el.stroke || 'none'}" stroke-width="0.7" ${el.dashed ? 'stroke-dasharray="4 3"' : ''}/>`;
    if (el.type === 'image') return `<image href="${assetPath(el.id, color)}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"/>`;
    return `<text x="${el.x}" y="${el.y}" fill="${el.fill}" font-family="Arial, Helvetica, sans-serif" font-size="${el.size}" font-weight="${el.bold ? 700 : 400}" text-anchor="${el.align === 'center' ? 'middle' : 'start'}">${escapeXml(el.value)}</text>`;
  }).join('')}</svg>`;
}
