/* KitaKo — CONTROLLER · Inventory: handles user actions, updates models, renders InventoryView. */
'use strict';

const invUI = {q: '', cat: 'all', status: 'all', tab: 'stock'};

RENDER.inventory = el => {
  const c = {in: 0, low: 0, out: 0}; S.products.forEach(p => c[stockStatus(p)]++);
  el.innerHTML = InventoryView.page({c});
  $$('[data-itab]').forEach(b => b.onclick = () => { invUI.tab = b.dataset.itab; rerender(); });
  $('#invExport').onclick = exportInventoryDialog;
  invUI.tab === 'stock' ? drawStock() : drawMoves();
};

function drawStock() {
  $('#invPane').innerHTML = InventoryView.stockPane();
  $('#iCat').value = invUI.cat; $('#iStatus').value = invUI.status;
  $('#iQ').oninput = e => { invUI.q = e.target.value; body(); };
  $('#iCat').onchange = e => { invUI.cat = e.target.value; body(); };
  $('#iStatus').onchange = e => { invUI.status = e.target.value; body(); };
  $('#iBody').onclick = e => { const b = e.target.closest('[data-stock]'); if (b) stockDialog(product(b.dataset.stock), b.dataset.mode); };
  const body = () => {
    const q = invUI.q.trim().toLowerCase();
    const list = S.products.filter(p => (invUI.cat === 'all' || p.cat === invUI.cat) && (invUI.status === 'all' || stockStatus(p) === invUI.status) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))).sort((a, b) => a.name.localeCompare(b.name));
    $('#iBody').innerHTML = InventoryView.iBody({list});
  };
  body();
}

function drawMoves() {
  const mv = S.stockMoves.slice(0, 300);
  const T = {add: ['Stock added', 'ok'], deduct: ['Stock deducted', 'warn'], adjust: ['Manual adjustment', 'y'], sale: ['Sale deduction', 'mute']};
  $('#invPane').innerHTML = InventoryView.movesPane({T, mv});
}

function stockDialog(p, mode) {
  const title = {add: 'Add stock', deduct: 'Deduct stock', adjust: 'Adjust quantity'}[mode];
  const reasons = {add: ['Delivery from supplier', 'Production / prepared', 'Returned item', 'Other'], deduct: ['Spoilage / waste', 'Damaged', 'Staff meal', 'Other'], adjust: ['Physical count', 'Correction', 'Other']}[mode];
  openModal(title + ' · ' + p.name, InventoryView.stockDialogModal({mode, p, reasons}), `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="sSave">${title}</button>`, {small: true});
  const calcNext = () => { const q = num($('#sQty').value); if (!isFinite(q)) return NaN; return mode === 'add' ? p.stock + q : mode === 'deduct' ? p.stock - q : q; };
  $('#sQty').oninput = () => { const n = calcNext(); $('#sPreview').textContent = isFinite(n) ? `New stock will be ${n} ${p.unit}.` : ''; };
  $('#sf').onsubmit = e => { e.preventDefault(); $('#sSave').click(); };
  $('#sSave').onclick = () => {
    const q = num($('#sQty').value), n = calcNext();
    if (!isFinite(q) || q < 0 || !Number.isInteger(q) || (mode !== 'adjust' && q === 0)) return fieldErr($('#sQty'), 'Enter a valid whole-number quantity.');
    if (n < 0) return fieldErr($('#sQty'), `Cannot deduct more than the ${p.stock} in stock.`);
    const reason = $('#sReason').value + ($('#sNote').value.trim() ? ' — ' + $('#sNote').value.trim() : '');
    changeStock(p, n, mode, reason);
    save('products', 'stockMoves', 'notifs'); updateBell(); closeModal(); rerender(); toast(`${p.name}: stock is now ${n}.`, 'success');
  };
}

function exportInventoryDialog() {
  openModal('Export inventory', InventoryView.exportInventoryDialogModal(), `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="exGo">${icon('download')}Export</button>`, {small: true});
  const cats = () => $$('#exCats input:checked').map(i => i.value);
  const cnt = () => { $('#exCats').hidden = $('#exF').value !== 'cats'; $('#exCount').textContent = inventoryRows($('#exF').value, cats()).length + ' products will be exported.'; };
  $('#exF').onchange = cnt; $('#exCats').onchange = cnt; cnt();
  $('#exGo').onclick = () => {
    const f = $('#exF').value, rows = inventoryRows(f, cats()), fmt = $('#exFmt').value, name = 'inventory-' + f + '-' + dayKey(new Date());
    if (!rows.length) return toast('Nothing to export for that filter.', 'warn');
    if (fmt === 'csv' || fmt === 'excel') exportCSV(name, [INV_HEAD, ...rows], fmt === 'excel');
    else if (fmt === 'xlsx') exportXLSX(name, [{name: 'Inventory', rows: [INV_HEAD, ...rows]}]);
    else { const doc = newPDF({orientation: 'landscape', unit: 'mm', format: 'a4'}); if (!doc) return;
      const y = pdfHeader(doc, 'Inventory Report', {all: 'All products', cats: 'Selected categories', low: 'Low-stock products', out: 'Out-of-stock products'}[f]);
      pdfTable(doc, y, INV_HEAD, rows.map(r => { r = [...r]; r[7] = pdfMoney(r[7]); return r; }), {columnStyles: {3: {halign: 'right'}, 5: {halign: 'right'}, 7: {halign: 'right'}}});
      saveFile(name + '.pdf', pdfOut(doc)); }
    closeModal();
  };
}
