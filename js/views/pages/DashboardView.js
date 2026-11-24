/* KitaKo — VIEW · Dashboard: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const DashboardView = {
  page({best, cashToday, items, low, maxQ, now, out, recent, sales, tToday}) {
    return `
  <div class="stats c8">
    <div class="stat hero"><span>Total sales today</span><b>${money(sales)}</b></div>
    <div class="stat"><span>Transactions today</span><b>${tToday.length}</b></div>
    <div class="stat"><span>Products sold today</span><b>${items}</b></div>
    <div class="stat"><span>Average transaction</span><b>${money(tToday.length ? sales / tToday.length : 0)}</b></div>
    <div class="stat"><span>Cash sales today</span><b>${money(cashToday)}</b></div>
    <div class="stat"><span>Total products</span><b>${S.products.length}</b></div>
    <div class="stat warn"><span>Low-stock products</span><b>${low.length}</b></div>
    <div class="stat err"><span>Out-of-stock products</span><b>${out.length}</b></div>
  </div>
  <div class="card"><div class="card-head"><h3>Quick actions</h3><span class="hint">${fmtDate(now)}</span></div><div class="quick">
    <button class="btn primary" data-go="pos">${icon('plus')}New transaction</button>
    <button class="btn" id="qaAdd">${icon('products')}Add product</button>
    <button class="btn" data-go="inventory">${icon('inventory')}Manage inventory</button>
    <button class="btn" data-go="transactions">${icon('transactions')}View transactions</button>
    <button class="btn accent" data-go="reports">${icon('reports')}Generate sales report</button></div></div>
  <div class="grid-2">
    <div class="card span-2"><div class="card-head"><h3>Daily sales · last 14 days</h3><span class="hint">Today ${money(sales)}</span></div><div class="chart-box"><canvas id="cDaily"></canvas></div></div>
    <div class="card"><h3>Weekly sales overview</h3><div class="chart-box short"><canvas id="cWeekly"></canvas></div></div>
    <div class="card"><h3>Monthly sales overview</h3><div class="chart-box short"><canvas id="cMonthly"></canvas></div></div>
  </div>
  <div class="grid-3">
    <div class="card"><div class="card-head"><h3>Best-selling products</h3><span class="hint">Last 30 days</span></div>
      ${best.length ? `<div class="bars">${best.map(b => `<div class="bar-row"><span>${esc(b.name)}</span><b class="num">${b.qty} sold</b><div class="track"><div class="fill" style="width:${(b.qty / maxQ * 100).toFixed(1)}%"></div></div></div>`).join('')}</div>` : '<div class="empty"><b>No sales yet</b>Completed orders will rank here.</div>'}</div>
    <div class="card"><div class="card-head"><h3>Popular categories</h3><span class="hint">Last 30 days</span></div><div class="chart-box short"><canvas id="cCats"></canvas></div></div>
    <div class="card"><div class="card-head"><h3>Low-stock alerts</h3><button class="btn sm" data-go="inventory">Restock</button></div>
      ${low.length + out.length ? `<div class="list">${[...out, ...low].slice(0, 8).map(p => `<div class="list-item"><div style="flex:1"><b>${esc(p.name)}</b><div class="meta">${p.stock} ${esc(p.unit)} left · min ${p.min}</div></div>${statusPill(p)}</div>`).join('')}</div>` : '<div class="empty"><b>All stocked up</b>No products are at or below their minimum level.</div>'}</div>
  </div>
  <div class="card"><div class="card-head"><h3>Recent transactions</h3><button class="btn sm" data-go="transactions">View all</button></div>
    ${recent.length ? `<div class="table-wrap"><table class="stack"><thead><tr><th>Receipt</th><th>Date &amp; time</th><th>Items</th><th>Payment</th><th>Type</th><th class="num">Total</th></tr></thead><tbody>
    ${recent.map(t => `<tr class="click" data-txn="${esc(t.id)}" tabindex="0" title="View transaction details"><td class="mono">${esc(t.receipt)}</td><td class="nowrap">${fmtDT(t.date)}</td><td>${sum(t.items, i => i.qty)}</td><td>${esc(t.method)}</td><td>${esc(t.orderType)}</td><td class="num"><b>${money(t.total)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><b>No transactions yet</b>Ring up an order in Point of Sale.</div>'}</div>`;
  }
};
