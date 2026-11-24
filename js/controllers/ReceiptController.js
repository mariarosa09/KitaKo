/* KitaKo — CONTROLLER · Receipt: handles user actions, updates models, renders ReceiptView. */
'use strict';

function printReceipt(t) {
  if (framed) { toast('Printing is blocked inside this preview — saving a PDF you can print instead.', 'warn'); receiptPDF(t); return; }
  $('#printArea').innerHTML = receiptHTML(t);
  window.print();
}

function showReceipt(t, afterSale) {
  openModal(afterSale ? 'Payment successful' : 'Receipt ' + t.receipt,
    ReceiptView.showReceiptModal({afterSale, t}),
    ReceiptView.showReceiptButtons({afterSale}), {noFocus: true});
  $('#rPrint').onclick = () => printReceipt(t);
  $('#rPdf').onclick = () => receiptPDF(t);
}

const rcUI = {q: '', sel: null};

RENDER.receipts = el => {
  el.innerHTML = ReceiptView.page();
  const list = () => { const q = rcUI.q.trim().toLowerCase(); return [...S.txns].filter(t => !q || t.receipt.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)).sort((a, b) => b.date.localeCompare(a.date)); };
  const draw = () => {
    const l = list(); if (!rcUI.sel || !S.txns.some(t => t.id === rcUI.sel)) rcUI.sel = l[0]?.id || null;
    $('#rcCount').textContent = l.length + ' found';
    $('#rcList').innerHTML = ReceiptView.rcList({l});
    const t = S.txns.find(x => x.id === rcUI.sel);
    $('#rcPrev').innerHTML = t ? receiptHTML(t) : '<div class="card empty"><b>No receipt selected</b>Completed sales generate receipts automatically.</div>';
    $('#rcPrint').disabled = $('#rcPdf').disabled = !t;
  };
  $('#rcQ').oninput = e => { rcUI.q = e.target.value; rcUI.sel = null; draw(); };
  $('#rcList').onclick = e => { const b = e.target.closest('[data-rc]'); if (b) { rcUI.sel = b.dataset.rc; draw(); if (innerWidth < 980) $('#rcPrev').scrollIntoView({behavior: 'smooth'}); } };
  $('#rcPrint').onclick = () => printReceipt(S.txns.find(x => x.id === rcUI.sel));
  $('#rcPdf').onclick = () => receiptPDF(S.txns.find(x => x.id === rcUI.sel));
  draw();
};
