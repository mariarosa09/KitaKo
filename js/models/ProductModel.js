/* KitaKo — MODEL · Products, categories and stock levels (every stock change is logged). */
'use strict';

const catName = id => (S.categories.find(c => c.id === id) || {}).name || 'Uncategorized';

const product = id => S.products.find(p => p.id === id);

const stockStatus = p => p.stock <= 0 ? 'out' : p.stock <= p.min ? 'low' : 'in';

const STATUS_LABEL = {in: 'In Stock', low: 'Low Stock', out: 'Out of Stock'};

/* stock change with movement log + alerts when an item crosses its threshold */
function changeStock(p, next, type, reason) {
  const prev = p.stock; next = Math.max(0, Math.round(next));
  if (prev === next && type !== 'adjust') return;
  p.stock = next; p.updated = new Date().toISOString();
  S.stockMoves.unshift({id: uid('sm'), pid: p.id, name: p.name, sku: p.sku, type, prev, change: next - prev, next, reason, at: p.updated});
  if (S.stockMoves.length > 2000) S.stockMoves.length = 2000;
  const was = prev <= 0 ? 'out' : prev <= p.min ? 'low' : 'in', now = stockStatus(p);
  if (now !== was && now === 'out') notify('out', 'Out of stock', `${p.name} is now out of stock.`, true);
  else if (now !== was && now === 'low') notify('low', 'Low stock', `${p.name}: ${p.stock} ${p.unit} left (minimum ${p.min}).`, true);
  if (type !== 'sale') notify('inventory', 'Inventory updated', `${p.name}: ${prev} → ${next} (${reason}).`, true);
}

function suggestSku(catId) {
  const pre = (catName(catId).replace(/[^A-Za-z]/g, '').slice(0, 3) || 'PRD').toUpperCase();
  let n = 1; while (S.products.some(p => p.sku === pre + '-' + pad(n, 3))) n++;
  return pre + '-' + pad(n, 3);
}

function inventoryRows(filter, cats) {
  let list = [...S.products].sort((a, b) => catName(a.cat).localeCompare(catName(b.cat)) || a.name.localeCompare(b.name));
  if (filter === 'cats') list = list.filter(p => cats.includes(p.cat));
  if (filter === 'low') list = list.filter(p => stockStatus(p) === 'low');
  if (filter === 'out') list = list.filter(p => stockStatus(p) === 'out');
  return list.map(p => [p.sku, p.name, catName(p.cat), p.stock, p.unit, p.min, STATUS_LABEL[stockStatus(p)], r2(p.price), fmtDT(p.updated)]);
}

const INV_HEAD = ['Product Code','Product Name','Category','Current Stock','Unit','Minimum Stock','Stock Status','Selling Price','Last Updated'];
