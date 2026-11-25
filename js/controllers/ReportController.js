/* KitaKo — CONTROLLER · Report: handles user actions, updates models, renders ReportView. */
'use strict';

const repUI = {period: 'monthly', from: dayKey(addDays(new Date(), -29)), to: dayKey(new Date()), trend: 'daily'};

function periodRange() {
  const n = new Date(), t = sod(n);
  switch (repUI.period) {
    case 'daily': return [t, eod(t), 'Today, ' + fmtDate(t)];
    case 'weekly': return [addDays(t, -6), eod(t), 'Last 7 days'];
    case 'monthly': return [new Date(n.getFullYear(), n.getMonth(), 1), eod(t), n.toLocaleDateString('en-PH', {month: 'long', year: 'numeric'})];
    case 'annually': return [new Date(n.getFullYear(), 0, 1), eod(t), 'Year ' + n.getFullYear()];
    default: { const a = sod(repUI.from + 'T00:00'), b = eod(repUI.to + 'T00:00'); return [a, b, fmtDate(a) + ' – ' + fmtDate(b)]; }
  }
}

RENDER.reports = el => {
  const [a, b, label] = periodRange(), R = analyze(a, b);
  const prods = productStats(R.tx), sold = new Set(prods.map(p => p.pid));
  const least = [...S.products.filter(p => !sold.has(p.id)).map(p => ({name: p.name, qty: 0})), ...[...prods].reverse()].slice(0, 8);
  el.innerHTML = ReportView.page({R, a, b, label});
  $('#rp').value = repUI.period;
  $('#rp').onchange = e => { repUI.period = e.target.value; rerender(); };
  // picking any date switches to a custom time span, starting from the range currently shown
  const pick = () => {
    const f = $('#rFrom').value, t = $('#rTo').value;
    if (!f || !t) return;
    if (f > t) { $('#rTo').classList.add('invalid'); return toast('“From” must be on or before “To”.', 'error'); }
    Object.assign(repUI, {period: 'custom', from: f, to: t}); rerender();
  };
  $('#rFrom').onchange = pick; $('#rTo').onchange = pick;
  $('#trendSeg').onclick = e => { const b = e.target.closest('[data-tr]'); if (b) { repUI.trend = b.dataset.tr; rerender(); } };
  // trend
  // trend follows the selected From–To span, grouped by day, week or month
  let tl;
  const span = S.txns.filter(t => inRange(t, a, b));
  if (repUI.trend === 'daily') { const n = Math.min(400, Math.round((sod(b) - sod(a)) / 864e5) + 1), d = salesByDay(span, sod(a), n); tl = {labels: d.map(x => x.label), v: d.map(x => x.v)}; }
  else if (repUI.trend === 'weekly') { const w = []; for (let s0 = addDays(sod(a), -((sod(a).getDay() + 6) % 7)); s0 <= b; s0 = addDays(s0, 7)) w.push({from: s0, to: eod(addDays(s0, 6)), label: s0.toLocaleDateString('en-PH', {month: 'short', day: 'numeric'})});
    tl = {labels: w.map(x => 'Wk ' + x.label), v: w.map(x => r2(sum(span.filter(t => inRange(t, x.from, x.to)), t => t.total)))}; }
  else { const m = []; for (let d = new Date(a.getFullYear(), a.getMonth(), 1); d <= b; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) m.push({from: d, to: eod(new Date(d.getFullYear(), d.getMonth() + 1, 0)), label: d.toLocaleDateString('en-PH', {month: 'short', year: 'numeric'})});
    tl = {labels: m.map(x => x.label), v: m.map(x => r2(sum(span.filter(t => inRange(t, x.from, x.to)), t => t.total)))}; }
  mkChart('rTrend', {type: repUI.trend === 'daily' ? 'line' : 'bar', money: true, data: {labels: tl.labels, datasets: [{label: 'Sales', data: tl.v, borderColor: '#0B3866', backgroundColor: repUI.trend === 'daily' ? 'rgba(11,56,102,.07)' : '#0B3866', fill: true, tension: .3, borderRadius: 6}]}});
  const top = prods.slice(0, 8);
  mkChart('rBest', {type: 'bar', data: {labels: top.map(p => p.name), datasets: [{label: 'Qty sold', data: top.map(p => p.qty), backgroundColor: '#0B3866', borderRadius: 5}]}, options: {indexAxis: 'y'}});
  mkChart('rLeast', {type: 'bar', data: {labels: least.map(p => p.name), datasets: [{label: 'Qty sold', data: least.map(p => p.qty), backgroundColor: '#95F9C3', borderColor: '#0B3866', borderWidth: 1.5, borderRadius: 5}]}, options: {indexAxis: 'y', scales: {x: {beginAtZero: true, ticks: {precision: 0}}}}});
  const cs = catStats(R.tx);
  mkChart('rCat', {type: 'bar', money: true, data: {labels: cs.map(c => c[0]), datasets: [{label: 'Sales', data: cs.map(c => r2(c[1])), backgroundColor: '#0B3866', borderRadius: 5}]}});
  const by = (k) => { const m = {}; R.tx.forEach(t => { m[t[k]] = (m[t[k]] || 0) + t.total; }); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
  const pm = by('method'); mkChart('rPay', {type: 'doughnut', money: true, legend: true, data: {labels: pm.map(x => x[0]), datasets: [{data: pm.map(x => r2(x[1])), backgroundColor: PALETTE, borderWidth: 0}]}, options: {cutout: '58%'}});
  const ot = by('orderType'); mkChart('rType', {type: 'pie', money: true, legend: true, data: {labels: ot.map(x => x[0]), datasets: [{data: ot.map(x => r2(x[1])), backgroundColor: ['#0B3866', '#95F9C3', '#2F7BC8'], borderWidth: 0}]}});
  const hrs = Array(24).fill(0); R.tx.forEach(t => { hrs[new Date(t.date).getHours()] += t.total; });
  const hr0 = Math.max(0, hrs.findIndex(v => v > 0)), hr1 = hrs.length - [...hrs].reverse().findIndex(v => v > 0);
  const hrRange = R.tx.length ? [...Array(hr1 - hr0).keys()].map(i => i + hr0) : [...Array(14).keys()].map(i => i + 8);
  mkChart('rHours', {type: 'bar', money: true, data: {labels: hrRange.map(h => (h % 12 || 12) + (h < 12 ? 'am' : 'pm')), datasets: [{label: 'Sales', data: hrRange.map(h => r2(hrs[h])), backgroundColor: hrRange.map(h => hrs[h] === Math.max(...hrs) && hrs[h] > 0 ? '#95F9C3' : '#0B3866'), borderColor: '#0B3866', borderWidth: 1.5, borderRadius: 5}]}});
  const days = Math.min(400, Math.round((sod(b) - sod(a)) / 864e5) + 1);
  let vol;
  if (days <= 1) vol = {labels: hrRange.map(h => (h % 12 || 12) + (h < 12 ? 'am' : 'pm')), v: hrRange.map(h => R.tx.filter(t => new Date(t.date).getHours() === h).length)};
  else if (days <= 62) { const m = {}; R.tx.forEach(t => { const k = dayKey(t.date); m[k] = (m[k] || 0) + 1; }); vol = {labels: [...Array(days).keys()].map(i => addDays(a, i).toLocaleDateString('en-PH', {month: 'short', day: 'numeric'})), v: [...Array(days).keys()].map(i => m[dayKey(addDays(a, i))] || 0)}; }
  else { const m = {}; R.tx.forEach(t => { const d = new Date(t.date), k = d.getFullYear() + '-' + d.getMonth(); m[k] = (m[k] || 0) + 1; }); const ks = []; for (let d = new Date(a.getFullYear(), a.getMonth(), 1); d <= b; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) ks.push(d); vol = {labels: ks.map(d => d.toLocaleDateString('en-PH', {month: 'short', year: '2-digit'})), v: ks.map(d => m[d.getFullYear() + '-' + d.getMonth()] || 0)}; }
  mkChart('rVol', {type: 'bar', data: {labels: vol.labels, datasets: [{label: 'Transactions', data: vol.v, backgroundColor: '#0B3866', borderRadius: 4}]}, options: {scales: {y: {beginAtZero: true, ticks: {precision: 0}}}}});
  // exports
  const summaryRows = () => [['Metric', 'Value'], ['Period', label], ['Total Revenue', R.revenue], ['Transactions', R.tx.length], ['Products Sold', R.items], ['Average Transaction Value', r2(R.avg)], ['Discounts Given', R.discounts], ['VAT Collected', R.vat], ['Net Sales (ex-VAT)', R.netSales],
    ['Cost of Goods Sold', R.gross == null ? 'n/a' : R.cogs], ['Estimated Gross Profit', R.gross == null ? 'n/a' : R.gross], ['Total Expenses', R.expCount ? R.expenses : 'n/a'], ['Estimated Net Profit', R.net == null ? 'n/a' : R.net], ['Gross Margin %', R.margin == null ? 'n/a' : r2(R.margin)]];
  const prodRows = () => [['Product', 'Category', 'Qty Sold', 'Revenue'], ...prods.map(p => [p.name, p.cat, p.qty, r2(p.rev)])];
  const pmRows = () => [['Payment Method', 'Sales'], ...pm.map(x => [x[0], r2(x[1])])];
  const otRows = () => [['Order Type', 'Sales'], ...ot.map(x => [x[0], r2(x[1])])];
  const reportPDF = name => {
    const doc = newPDF({unit: 'mm', format: 'a4'}); if (!doc) return;
    let y = pdfHeader(doc, 'Sales Report', label);
    y = pdfTable(doc, y, ['Metric', 'Value'], summaryRows().slice(1).map(r => [r[0], typeof r[1] === 'number' && !/Transactions|Products Sold|Margin/.test(r[0]) ? pdfMoney(r[1]) : String(r[1])]), {columnStyles: {1: {halign: 'right'}}});
    y = pdfTable(doc, y, ['Product', 'Category', 'Qty Sold', 'Revenue'], prods.map(p => [p.name, p.cat, p.qty, pdfMoney(p.rev)]), {columnStyles: {2: {halign: 'right'}, 3: {halign: 'right'}}});
    y = pdfTable(doc, y, ['Payment Method', 'Sales'], pm.map(x => [x[0], pdfMoney(x[1])]), {columnStyles: {1: {halign: 'right'}}});
    pdfTable(doc, y, ['Order Type', 'Sales'], ot.map(x => [x[0], pdfMoney(x[1])]), {columnStyles: {1: {halign: 'right'}}});
    saveFile(name + '.pdf', pdfOut(doc));
  };
  $('#rExport').onclick = () => {
    openModal('Export sales report', ReportView.exportModal({label, n: R.tx.length}),
      `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="rGo">${icon('download')}Export</button>`, {small: true});
    $('#rGo').onclick = () => {
      if (!R.tx.length) return toast('No sales in this period to export.', 'warn');
      const fmt = $('#rFmt').value, name = 'sales-report-' + repUI.period + '-' + dayKey(new Date());
      if (fmt === 'csv' || fmt === 'excel') exportCSV(name, [...summaryRows(), [], ...prodRows(), [], ...pmRows(), [], ...otRows()], fmt === 'excel');
      else if (fmt === 'xlsx') exportXLSX(name, [{name: 'Summary', rows: summaryRows()}, {name: 'Products', rows: prodRows()}, {name: 'Payment Methods', rows: pmRows()}, {name: 'Order Types', rows: otRows()}]);
      else reportPDF(name);
      closeModal();
    };
  };
};
