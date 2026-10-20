import { DEFAULT_BATCH, generateBatch, makePages, pageSvg, PAPER, assetPath } from './core.js';
import { buildPdf } from './pdf.js';
const $ = selector => document.querySelector(selector);
const form = $('#settings-form');
let batch = DEFAULT_BATCH, pages = makePages(batch), currentTab = 'card', pageIndex = 0, busy = false, dirty = false, galleryOpen = false;
const status = message => { $('#status').textContent = message; };
const group = () => pages.filter(page => page.kind === currentTab);
const settings = () => ({ count: Number(form.elements.count.value), grid: Number(form.elements.grid.value), color: form.elements.color.value, paper: form.elements.paper.value });
function lock(value) {
  busy = value;
  form.querySelectorAll('input,button').forEach(control => { control.disabled = value; });
  $('#download-pdf').disabled = value || dirty;
  $('#print').disabled = value || dirty;
  $('#generate-label').textContent = value ? 'Preparing your set…' : dirty ? 'Generate my cards' : 'Shuffle & regenerate';
}
function renderGallery() {
  const container = $('#all-pages');
  container.hidden = !galleryOpen;
  $('#view-all').setAttribute('aria-expanded', String(galleryOpen));
  $('#view-all').textContent = galleryOpen ? 'Hide all pages' : currentTab === 'card' ? 'View all cards' : 'View all pages';
  if (!galleryOpen) { container.replaceChildren(); return; }
  container.innerHTML = group().map((page, i) => `<button class="thumbnail" type="button" data-page="${i}" aria-label="Preview ${currentTab === 'card' ? 'card' : 'page'} ${i + 1}" aria-current="${i === pageIndex}">${pageSvg(page, batch.settings.color)}<span>${currentTab === 'card' ? 'Card' : 'Page'} ${i + 1}</span></button>`).join('');
}
function renderPreview() {
  const list = group();
  pageIndex = Math.min(pageIndex, list.length - 1);
  $('#preview-paper').innerHTML = pageSvg(list[pageIndex], batch.settings.color);
  $('#page-select').innerHTML = list.map((_, i) => `<option value="${i}" ${i === pageIndex ? 'selected' : ''}>${currentTab === 'card' ? 'Card' : currentTab === 'calling' ? 'Sheet' : 'Rules'} ${i + 1} of ${list.length}</option>`).join('');
  $('#previous').disabled = pageIndex === 0;
  $('#next').disabled = pageIndex === list.length - 1;
  $('#view-all').hidden = list.length < 2;
  renderGallery();
}
function renderBatch() {
  pages = makePages(batch);
  $('#cards-badge').textContent = batch.cards.length;
  $('#batch-summary').textContent = `${batch.cards.length} ${batch.cards.length === 1 ? 'card' : 'cards'} + calling cards + rules`;
  $('#batch-details').textContent = `${batch.settings.grid} × ${batch.settings.grid} · ${batch.settings.color === 'ink' ? 'Ink saver' : 'Full color'} · ${PAPER[batch.settings.paper].label} · ${pages.length} pages`;
  renderPreview();
  preparePrint();
}
function preparePrint() {
  let style = $('#print-page-size');
  if (!style) { style = document.createElement('style'); style.id = 'print-page-size'; document.head.append(style); }
  style.textContent = `@media print { @page { size: ${batch.settings.paper === 'a4' ? 'A4' : 'letter'} portrait; margin: 0; } }`;
  $('#print-root').innerHTML = pages.map(page => `<div class="print-sheet" style="width:${page.width}pt;height:${page.height}pt">${pageSvg(page, batch.settings.color)}</div>`).join('');
}
function markDirty() {
  dirty = JSON.stringify(settings()) !== JSON.stringify(batch.settings);
  $('#ready-label').textContent = dirty ? 'Settings changed' : 'Ready to print';
  $('#ready-label').classList.toggle('dirty', dirty);
  $('#grid-hint').textContent = form.elements.grid.value === '5' ? 'Includes a FREE space in the center.' : 'Every square is a picture. No FREE space.';
  document.querySelectorAll('[data-count]').forEach(button => {
    const selected = button.dataset.count === form.elements.count.value;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected));
  });
  lock(false);
  status(dirty ? 'Settings changed. Generate your cards to update the preview and download.' : 'Your set is ready. The PDF matches the pages shown in this preview.');
}
form.addEventListener('input', markDirty);
form.addEventListener('change', markDirty);
document.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => { form.elements.count.value = button.dataset.count; markDirty(); }));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  const nextSettings = settings();
  lock(true); status(`Mixing ${nextSettings.count} different cards…`);
  await new Promise(resolve => setTimeout(resolve, 80));
  try {
    batch = generateBatch(nextSettings); dirty = false; pageIndex = 0;
    renderBatch();
    $('#ready-label').textContent = 'Ready to print'; $('#ready-label').classList.remove('dirty');
    status(`Ready! ${batch.cards.length} different cards, ${batch.calling.length} matching calling cards, and printable rules.`);
  } catch (error) { status(error.message); }
  finally { lock(false); }
});
const tabs = [...document.querySelectorAll('[data-tab]')];
function selectTab(button) {
  currentTab = button.dataset.tab; pageIndex = 0;
  tabs.forEach(tab => { tab.setAttribute('aria-selected', String(tab === button)); tab.tabIndex = tab === button ? 0 : -1; });
  $('#preview-content').setAttribute('aria-labelledby', button.id);
  renderPreview();
}
tabs.forEach((button, index) => {
  button.addEventListener('click', () => selectTab(button));
  button.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target !== undefined) { event.preventDefault(); tabs[target].focus(); selectTab(tabs[target]); }
  });
});
$('#previous').addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; renderPreview(); } });
$('#next').addEventListener('click', () => { if (pageIndex < group().length - 1) { pageIndex++; renderPreview(); } });
$('#page-select').addEventListener('change', event => { pageIndex = Number(event.target.value); renderPreview(); });
$('#view-all').addEventListener('click', () => { galleryOpen = !galleryOpen; renderGallery(); });
$('#all-pages').addEventListener('click', event => {
  const button = event.target.closest('[data-page]');
  if (!button) return;
  pageIndex = Number(button.dataset.page); renderPreview();
  $('#preview-paper').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
$('#download-pdf').addEventListener('click', async () => {
  if (busy || dirty) return;
  lock(true); $('#export-progress').hidden = false;
  const label = $('#download-pdf').innerHTML; $('#download-pdf').textContent = 'Preparing PDF…';
  try {
    const bytes = await buildPdf(batch, { progress: (page, total) => {
      status(`Preparing your PDF: page ${page} of ${total}…`); $('#export-progress').value = page / total * 100;
    } });
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = `halloween-bingo-${batch.cards.length}-cards-${batch.settings.grid}x${batch.settings.grid}-${batch.settings.paper}-${batch.settings.color}.pdf`;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status(`Your ${pages.length}-page PDF is ready. Print at Actual size on ${PAPER[batch.settings.paper].label} paper.`);
  } catch (error) { status('We couldn’t create the download. Please try again, or use Print / Save as PDF.'); console.error(error); }
  finally { $('#download-pdf').innerHTML = label; $('#export-progress').hidden = true; lock(false); }
});
$('#print').addEventListener('click', async () => {
  if (busy || dirty) return;
  lock(true); status('Preparing your print pages…');
  try {
    await Promise.all([...new Set([...batch.calling, 'free'])].map(id => new Promise((resolve, reject) => {
      const img = new Image(); img.onload = resolve; img.onerror = reject; img.src = assetPath(id, batch.settings.color);
    })));
    preparePrint();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.print();
    status(`Print preview opened. Use ${PAPER[batch.settings.paper].label}, Actual size, and turn off browser headers and footers.`);
  } catch { status('The print artwork could not load. Please reload the page and try again.'); }
  finally { lock(false); }
});
window.addEventListener('beforeprint', preparePrint);
document.querySelectorAll('.default-download').forEach(anchor => anchor.addEventListener('click', event => {
  if (busy) { event.preventDefault(); return; }
  status('Downloading the ready-made 30-card set: 5 × 5, full color, US Letter, with calling cards and rules.');
}));
renderBatch();
