import { makePages, assetPath } from './core.js';
export async function buildPdf(batch, { lib = globalThis.PDFLib, loadAsset = async path => {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Could not load the artwork. Please try again.');
  return new Uint8Array(await response.arrayBuffer());
}, progress = () => {} } = {}) {
  const { PDFDocument, StandardFonts, rgb } = lib;
  const document = await PDFDocument.create();
  document.setTitle('Halloween Bingo - Pumpkin & Paper');
  document.setAuthor('Pumpkin & Paper');
  document.setSubject('Printable bingo cards, matching calling cards, and rules');
  const regular = await document.embedFont(StandardFonts.Helvetica), bold = await document.embedFont(StandardFonts.HelveticaBold);
  const images = new Map();
  for (const id of new Set([...batch.calling, 'free'])) images.set(id, await document.embedPng(await loadAsset(assetPath(id, batch.settings.color, 'png'))));
  const color = hex => rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
  const pages = makePages(batch);
  for (const [index, layout] of pages.entries()) {
    const page = document.addPage([layout.width, layout.height]);
    for (const el of layout.elements) {
      if (el.type === 'rect') {
        page.drawRectangle({ x: el.x, y: layout.height - el.y - el.height, width: el.width, height: el.height, color: color(el.fill), ...(el.stroke ? { borderColor: color(el.stroke), borderWidth: 0.7, borderDashArray: el.dashed ? [4, 3] : undefined } : {}) });
      } else if (el.type === 'image') {
        page.drawImage(images.get(el.id), { x: el.x, y: layout.height - el.y - el.height, width: el.width, height: el.height });
      } else {
        const font = el.bold ? bold : regular;
        const safe = el.value.replace(/’/g, "'").replace(/[“”]/g, '"');
        page.drawText(safe, { x: el.x - (el.align === 'center' ? font.widthOfTextAtSize(safe, el.size) / 2 : 0), y: layout.height - el.y, size: el.size, font, color: color(el.fill) });
      }
    }
    progress(index + 1, pages.length);
    // Give the browser a chance to paint progress and stay responsive.
    if (index % 4 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  return document.save();
}
