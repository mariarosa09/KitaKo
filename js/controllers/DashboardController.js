/* KitaKo — CONTROLLER · Dashboard: handles user actions, updates models, renders DashboardView. */
'use strict';

RENDER.dashboard = el => {
  const today = sod(new Date()), now = new Date();
  const tToday = S.txns.filter(t => inRange(t, today, eod(today)));
  const sales = sum(tToday, t => t.total), items = sum(tToday, t => sum(t.items, i => i.qty)), cashToday = sum(tToday.filter(t => t.method === 'Cash'), t => t.total);
  const low = S.products.filter(p => stockStatus(p) === 'low'), out = S.products.filter(p => stockStatus(p) === 'out');
  const last30 = S.txns.filter(t => inRange(t, addDays(today, -29), eod(today)));
  const best = productStats(last30).slice(0, 6), maxQ = best[0]?.qty || 1;
  const recent = [...S.txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  el.innerHTML = DashboardView.page({best, cashToday, items, low, maxQ, now, out, recent, sales, tToday});
  $('#qaAdd').onclick = () => productForm();
  const d14 = salesByDay(S.txns.filter(t => new Date(t.date) >= addDays(today, -13)), addDays(today, -13), 14);
  mkChart('cDaily', {type: 'line', money: true, data: {labels: d14.map(x => x.label), datasets: [{label: 'Sales', data: d14.map(x => x.v), borderColor: '#0B3866', backgroundColor: 'rgba(11,56,102,.12)', fill: true, tension: .3, pointRadius: 3}]}});
  const wk = weeksBack(8).map(w => ({...w, v: r2(sum(S.txns.filter(t => inRange(t, w.from, w.to)), t => t.total))}));
  mkChart('cWeekly', {type: 'bar', money: true, data: {labels: wk.map(w => w.label), datasets: [{label: 'Week of', data: wk.map(w => w.v), backgroundColor: '#0B3866', borderRadius: 6}]}});
  const mo = monthsBack(6).map(m => ({...m, v: r2(sum(S.txns.filter(t => inRange(t, m.from, m.to)), t => t.total))}));
  mkChart('cMonthly', {type: 'bar', money: true, data: {labels: mo.map(m => m.label), datasets: [{label: 'Sales', data: mo.map(m => m.v), backgroundColor: '#95F9C3', borderColor: '#0B3866', borderWidth: 1.5, borderRadius: 6}]}});
  const cs = catStats(last30).slice(0, 7);
  if (cs.length) mkChart('cCats', {type: 'doughnut', money: true, legend: true, data: {labels: cs.map(c => c[0]), datasets: [{data: cs.map(c => r2(c[1])), backgroundColor: PALETTE, borderWidth: 0}]}, options: {cutout: '62%'}});
};
