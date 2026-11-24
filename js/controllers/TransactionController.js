/* KitaKo — CONTROLLER · Transaction: handles user actions, updates models, renders TransactionView. */
'use strict';

document.addEventListener('click', e => { const b = e.target.closest('[data-txn]'); if (b) txnDetails(b.dataset.txn); });

document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-txn]')) { e.preventDefault(); txnDetails(e.target.dataset.txn); } });

const txUI = {q: '', from: '', to: '', method: 'all', type: 'all'};

function filteredTxns() {
  const q = txUI.q.trim().toLowerCase();
  const a = txUI.from ? sod(txUI.from + 'T00:00') : null, b = txUI.to ? eod(txUI.to + 'T00:00') : null;
  return S.txns.filter(t => (!q || t.id.toLowerCase().includes(q) || t.receipt.toLowerCase().includes(q) || (t.customer || '').toLowerCase().includes(q))
    && (!a || new Date(t.date) >= a) && (!b || new Date(t.date) <= b) && (txUI.method === 'all' || t.method === txUI.method) && (txUI.type === 'all' || t.orderType === txUI.type))
    .sort((x, y) => y.date.localeCompare(x.date));
}

RENDER.transactions = el => {
  el.innerHTML = TransactionView.page();
  let limit = 50;
  const OT = {'dine-in': 'Dine-in', takeout: 'Takeout', delivery: 'Delivery'};
  const draw = () => {
    const list = filteredTxns();
    $('#tSum').textContent = `${list.length} transactions · ${money(sum(list, t => t.total))} · tap a row for details`;
    $('#tBody').innerHTML = TransactionView.tBody({OT, limit, list});
    $('#tMore').hidden = list.length <= limit;
    const chips = [txUI.from && 'From ' + fmtDate(txUI.from + 'T00:00'), txUI.to && 'To ' + fmtDate(txUI.to + 'T00:00'), txUI.method !== 'all' && txUI.method, txUI.type !== 'all' && OT[txUI.type]].filter(Boolean);
    $('#tChips').innerHTML = chips.map(c => `<span class="fchip">${esc(c)}</span>`).join('') + (chips.length ? '<button class="link" id="tClear" type="button">Clear filters</button>' : '');
    $('#tFCount').hidden = !chips.length; $('#tFCount').textContent = chips.length;
    const cl = $('#tClear'); if (cl) cl.onclick = () => { Object.assign(txUI, {from: '', to: '', method: 'all', type: 'all'}); limit = 50; draw(); };
  };
  $('#tQ').addEventListener('input', e => { txUI.q = e.target.value; limit = 50; draw(); });
  $('#tMore').onclick = () => { limit += 100; draw(); };
  $('#tFilter').onclick = () => {
    openModal('Filter transactions', TransactionView.filterModal(),
      TransactionView.filterButtons(), {small: true, noFocus: true});
    $('#tM').value = txUI.method; $('#tT').value = txUI.type;
    $('#tfReset').onclick = () => { Object.assign(txUI, {from: '', to: '', method: 'all', type: 'all'}); closeModal(); limit = 50; draw(); };
    $('#tfApply').onclick = () => {
      const f = $('#tFrom').value, t = $('#tTo').value;
      if (f && t && f > t) return fieldErr($('#tTo'), '“To” must be on or after “From”.');
      Object.assign(txUI, {from: f, to: t, method: $('#tM').value, type: $('#tT').value}); closeModal(); limit = 50; draw();
    };
  };
  const head = ['Transaction ID','Receipt No.','Date','Time','Cashier','Items','Subtotal','Discount','VAT','Total','Payment Method','Order Type','Customer'];
  const rows = () => filteredTxns().map(t => [t.id, t.receipt, dayKey(t.date), fmtTime(t.date), t.cashier, sum(t.items, i => i.qty), t.subtotal, t.discount?.amount || 0, t.vat, t.total, t.method, t.orderType, t.customer]);
  $('#tExport').onclick = () => {
    const n = filteredTxns().length;
    openModal('Export transactions', TransactionView.exportModal({n}),
      `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="txGo">${icon('download')}Export</button>`, {small: true});
    $('#txGo').onclick = () => {
      const r = rows(), fmt = $('#txFmt').value, name = 'transactions-' + dayKey(new Date());
      if (!r.length) return toast('No transactions to export.', 'warn');
      if (fmt === 'csv' || fmt === 'excel') exportCSV(name, [head, ...r], fmt === 'excel');
      else if (fmt === 'xlsx') exportXLSX(name, [{name: 'Transactions', rows: [head, ...r]}]);
      else {
        const doc = newPDF({orientation: 'landscape', unit: 'mm', format: 'a4'}); if (!doc) return;
        const y = pdfHeader(doc, 'Transaction History', `${r.length} transactions · total ${pdfMoney(sum(r, x => x[9]))}`);
        pdfTable(doc, y, head.slice(0, 12), r.map(x => [x[0], x[1], x[2], x[3], x[4], x[5], fmtNum(x[6]), fmtNum(x[7]), fmtNum(x[8]), fmtNum(x[9]), x[10], x[11]]), {styles: {fontSize: 7, cellPadding: 1.2}, columnStyles: {5: {halign: 'right'}, 6: {halign: 'right'}, 7: {halign: 'right'}, 8: {halign: 'right'}, 9: {halign: 'right'}}});
        saveFile(name + '.pdf', pdfOut(doc));
      }
      closeModal();
    };
  };
  draw();
};

function txnDetails(id) {
  const t = S.txns.find(x => x.id === id); if (!t) return toast('Transaction not found.', 'error');
  openModal('Transaction ' + t.receipt, TransactionView.txnDetailsModal({t}),
    TransactionView.txnDetailsButtons(), {noFocus: true});
  $('#dRcpt').onclick = () => showReceipt(t);
  $('#dPrint').onclick = () => printReceipt(t);
  $('#dPdf').onclick = () => receiptPDF(t);
}
