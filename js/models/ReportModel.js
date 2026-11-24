/* KitaKo — MODEL · Sales analytics: totals, trends, best sellers, profit. */
'use strict';

const salesByDay = (txns, from, days) => { const m = {}; txns.forEach(t => { const k = dayKey(t.date); m[k] = (m[k] || 0) + t.total; }); return Array.from({length: days}, (_, i) => { const d = addDays(from, i); return {label: d.toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}), v: r2(m[dayKey(d)] || 0), d}; }); };

function weeksBack(n) { const out = [], today = sod(new Date()); const ws = addDays(today, -((today.getDay() + 6) % 7)); for (let i = n - 1; i >= 0; i--) { const s = addDays(ws, -7 * i); out.push({from: s, to: eod(addDays(s, 6)), label: s.toLocaleDateString('en-PH', {month: 'short', day: 'numeric'})}); } return out; }

function monthsBack(n) { const out = [], t = new Date(); for (let i = n - 1; i >= 0; i--) { const s = new Date(t.getFullYear(), t.getMonth() - i, 1); out.push({from: s, to: eod(new Date(s.getFullYear(), s.getMonth() + 1, 0)), label: s.toLocaleDateString('en-PH', {month: 'short'}) + (s.getMonth() === 0 || i === n - 1 ? ' ' + s.getFullYear() : '')}); } return out; }

const inRange = (t, a, b) => { const d = new Date(t.date); return d >= a && d <= b; };

function productStats(txns) {
  const m = {};
  txns.forEach(t => t.items.forEach(i => { const k = i.pid; m[k] = m[k] || {pid: i.pid, name: i.name, cat: i.catName || catName(i.cat), qty: 0, rev: 0}; m[k].qty += i.qty; m[k].rev += i.price * i.qty; }));
  return Object.values(m).sort((a, b) => b.qty - a.qty);
}

function catStats(txns) { const m = {}; txns.forEach(t => t.items.forEach(i => { const k = i.catName || catName(i.cat); m[k] = (m[k] || 0) + i.price * i.qty; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); }

function allExpenses(a, b) { const shifts = [...S.register.history, ...(S.register.current ? [S.register.current] : [])]; return shifts.flatMap(s => s.moves.filter(m => m.type === 'expense' && new Date(m.at) >= a && new Date(m.at) <= b)); }

function analyze(a, b) {
  const tx = S.txns.filter(t => inRange(t, a, b));
  const revenue = r2(sum(tx, t => t.total)), vat = r2(sum(tx, t => t.vat)), charges = r2(sum(tx, t => t.charges)), discounts = r2(sum(tx, t => t.discount?.amount || 0));
  let covered = 0, coveredRev = 0, cogs = 0, allRev = 0;
  tx.forEach(t => { const netEx = t.total - t.vat - t.charges, f = t.subtotal ? netEx / t.subtotal : 0;
    t.items.forEach(i => { const line = i.price * i.qty * f; allRev += line; if (i.cost !== '' && i.cost != null && isFinite(+i.cost)) { covered += line; coveredRev += line; cogs += +i.cost * i.qty; } }); });
  const exp = allExpenses(a, b), expenses = r2(sum(exp, m => m.amount));
  const coverage = allRev ? covered / allRev : 0;
  const gross = coverage > 0 ? r2(coveredRev - cogs) : null;
  return {tx, revenue, vat, charges, discounts, netSales: r2(allRev), items: sum(tx, t => sum(t.items, i => i.qty)), avg: tx.length ? revenue / tx.length : 0,
    cogs: r2(cogs), gross, coverage, expenses, expCount: exp.length, net: gross != null && exp.length ? r2(gross - expenses) : null, margin: gross != null && coveredRev ? gross / coveredRev * 100 : null};
}
