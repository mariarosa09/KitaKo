/* KitaKo — VIEW · File output: CSV, Excel and PDF (receipts, reports, shift reports). */
'use strict';

let downloadsNS;

// undefined = not yet known, null = not available
try { if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then(ns => { downloadsNS = ns; }, () => { downloadsNS = null; }); else downloadsNS = null; } catch { downloadsNS = null; }

async function saveFile(filename, data, mime) {
  if (downloadsNS) {
    try { await downloadsNS.save({filename, data}); toast('Saved ' + filename, 'success'); return; }
    catch (e) { if (e && e.code === 'declined') { toast('Download cancelled', 'warn'); return; } if (e && e.code === 'rate_limited') { toast('Another download is waiting for confirmation.', 'warn'); return; } }
  }
  try {
    const blob = data instanceof Blob ? data : new Blob([data], {type: mime || 'application/octet-stream'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('Downloaded ' + filename, 'success');
  } catch { toast('Downloads are blocked in this view. Open the page in a browser tab.', 'error'); }
}

const csvCell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n');

function exportCSV(name, rows, excel) { saveFile(name + '.csv', (excel ? '﻿' : '') + toCSV(rows), 'text/csv'); }

function exportXLSX(name, sheets) {
  if (!window.XLSX) { toast('Excel library did not load — saving Excel-compatible CSV instead.', 'warn'); return exportCSV(name, sheets[0].rows, true); }
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.rows), s.name.slice(0, 31)));
  const buf = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
  saveFile(name + '.xlsx', new Blob([buf], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}

function newPDF(opts) {
  const J = window.jspdf && window.jspdf.jsPDF;
  if (!J) { toast('PDF library did not load. Check your connection and reload.', 'error'); return null; }
  return new J(opts);
}

function pdfHeader(doc, title, sub) {
  const st = S.settings, w = doc.internal.pageSize.getWidth();
  doc.setFillColor(11, 56, 102); doc.rect(0, 0, w, 22, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(st.name, 12, 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text(`${st.address}  ·  ${st.phone}  ·  ${st.email}`, 12, 16);
  doc.setTextColor(30); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(title, 12, 32);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100);
  doc.text((sub ? sub + '  ·  ' : '') + 'Generated ' + fmtDT(new Date()) + ' by ' + (user()?.fullname || ''), 12, 38);
  doc.setTextColor(30);
  return 44;
}

function pdfTable(doc, startY, head, body, opts = {}) {
  if (typeof doc.autoTable !== 'function') { doc.text('Table plugin unavailable.', 12, startY + 4); return startY + 10; }
  doc.autoTable({startY, head: [head], body, theme: 'grid', styles: {fontSize: 8, cellPadding: 1.6}, headStyles: {fillColor: [11, 56, 102], textColor: 255}, alternateRowStyles: {fillColor: [240, 250, 245]}, margin: {left: 12, right: 12}, ...opts});
  return doc.lastAutoTable.finalY + 8;
}

const pdfOut = doc => new Blob([doc.output('arraybuffer')], {type: 'application/pdf'});

function receiptPDF(t, returnDoc) {
  const st = S.settings, lines = 34 + t.items.length * 2 + (t.discount ? 2 : 0) + (t.notes ? 2 : 0);
  const doc = newPDF({unit: 'mm', format: [80, Math.max(120, lines * 4.2)]}); if (!doc) return;
  let y = 8; const W = 80, M = 5;
  const C = (s, sz = 8, b) => { doc.setFont('courier', b ? 'bold' : 'normal'); doc.setFontSize(sz); doc.splitTextToSize(String(s), W - 2 * M).forEach(l => { doc.text(l, W / 2, y, {align: 'center'}); y += sz * 0.42; }); };
  const L = (a, b, bold) => { doc.setFont('courier', bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 9.5 : 8); const la = doc.splitTextToSize(String(a), W - 2 * M - 24); la.forEach((l, i) => { doc.text(l, M, y); if (i === 0) doc.text(String(b), W - M, y, {align: 'right'}); y += 3.6; }); };
  const HR = () => { doc.setLineDashPattern([0.8, 0.8], 0); doc.line(M, y - 1.5, W - M, y - 1.5); y += 2.2; };
  C(st.name, 11, true); y += 1; C(st.address, 7.5); C(st.phone + ' · ' + st.email, 7.5); if (st.tin) C('VAT REG TIN ' + st.tin, 7.5); y += 1; HR();
  L('Receipt No.', t.receipt); L('Transaction', t.id); L('Date', fmtDT(t.date)); if (st.showCashier !== false) L('Cashier', t.cashier);
  L('Order type', t.orderType); if (t.customer) L('Customer/No.', t.customer); HR();
  t.items.forEach(i => { L(i.name, ''); L(`  ${i.qty} x ${fmtNum(i.price)}`, fmtNum(i.price * i.qty)); }); HR();
  L('Subtotal', fmtNum(t.subtotal)); if (t.lessVat) L('Less VAT', '-' + fmtNum(t.lessVat));
  if (t.discount && t.discount.amount) L('Discount: ' + t.discount.name, '-' + fmtNum(t.discount.amount));
  if (t.discount && t.discount.idNo) L('ID No.', t.discount.idNo);
  if (t.charges) L(t.orderType === 'delivery' ? 'Delivery fee' : 'Service charge', fmtNum(t.charges));
  if (!st.vatInclusive && t.vat) L('VAT', fmtNum(t.vat));
  L('TOTAL', pdfMoney(t.total), true); HR();
  L('Payment', t.method); if (t.ref) L('Reference', t.ref); L('Amount received', fmtNum(t.received)); L('Change', fmtNum(t.change));
  if (st.showVatBreakdown) { HR(); L('VATable sales', fmtNum(t.vatable)); L('VAT amount', fmtNum(t.vat)); L('VAT-exempt sales', fmtNum(t.vatExempt)); }
  if (t.notes) { HR(); C('Note: ' + t.notes, 7.5); }
  HR(); C(st.receiptFooter, 7.5);
  if (returnDoc) return doc;
  saveFile(t.receipt + '.pdf', pdfOut(doc));
}

function shiftPDF(s, interim) {
  const N = shiftNumbers(s, s.closedAt), doc = newPDF({unit: 'mm', format: 'a4'}); if (!doc) return;
  let y = pdfHeader(doc, interim ? 'Shift Report (interim)' : 'End-of-Shift Report', `${fmtDT(s.openedAt)} – ${s.closedAt ? fmtDT(s.closedAt) : 'open'} · ${s.by}`);
  const allTx = S.txns.filter(t => new Date(t.date) >= new Date(s.openedAt) && new Date(t.date) <= (s.closedAt ? new Date(s.closedAt) : new Date()));
  const rows = [['Opening cash', pdfMoney(s.opening)], ['Total cash sales (' + N.cashTx.length + ' transactions)', pdfMoney(N.cashSales)], ['Cash added', pdfMoney(N.added)], ['Cash withdrawn', pdfMoney(N.withdrawn)], ['Cash expenses', pdfMoney(N.expenses)],
    ['Expected cash balance', pdfMoney(s.expected ?? N.expected)], ['Actual cash count', isFinite(s.actual) ? pdfMoney(s.actual) : 'not counted'], ['Cash shortage / overage', s.variance == null || !isFinite(s.variance) ? '—' : (s.variance > 0 ? '+' : '') + pdfMoney(s.variance)]];
  y = pdfTable(doc, y, ['Cash reconciliation', 'Amount'], rows, {columnStyles: {1: {halign: 'right'}}});
  const byM = {}; allTx.forEach(t => { byM[t.method] = byM[t.method] || [0, 0]; byM[t.method][0]++; byM[t.method][1] += t.total; });
  y = pdfTable(doc, y, ['All sales by payment method', 'Transactions', 'Amount'], [...Object.entries(byM).map(([k, v]) => [k, v[0], pdfMoney(v[1])]), ['Total', allTx.length, pdfMoney(sum(allTx, t => t.total))]], {columnStyles: {1: {halign: 'right'}, 2: {halign: 'right'}}});
  if (s.moves.length) y = pdfTable(doc, y, ['Time', 'Movement', 'Reason', 'Amount'], s.moves.map(m => [fmtTime(m.at), m.type, m.reason, pdfMoney(m.amount)]), {columnStyles: {3: {halign: 'right'}}});
  doc.setFontSize(9); doc.text('Cashier signature: ______________________      Supervisor: ______________________', 12, Math.min(y + 12, 285));
  saveFile('shift-report-' + dayKey(s.openedAt) + (interim ? '-interim' : '') + '.pdf', pdfOut(doc));
}
