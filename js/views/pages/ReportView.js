/* KitaKo — VIEW · Report: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const ReportView = {
  exportModal({label, n}) {
    return `<div class="form"><p class="hint" style="margin:0">Exports the sales report for <b>${esc(label)}</b> (${n} transaction${n === 1 ? '' : 's'}): summary, products sold, payment methods and order types.</p>
      <label>Format<select id="rFmt"><option value="csv">CSV</option><option value="excel">Excel-compatible CSV</option><option value="xlsx">Excel workbook (.xlsx)</option><option value="pdf">PDF</option></select></label></div>`;
  },

  page({R, a, b, label}) {
    return `<div class="card"><div class="rep-bar">
      <label>Report period<select id="rp"><option value="daily">Daily (today)</option><option value="weekly">Weekly (last 7 days)</option><option value="monthly">Monthly (this month)</option><option value="annually">Annually (this year)</option><option value="custom">Custom range</option></select></label>
      <label>From<input type="date" id="rFrom" value="${esc(dayKey(a))}" max="${dayKey(new Date())}"></label>
      <label>To<input type="date" id="rTo" value="${esc(dayKey(b))}" max="${dayKey(new Date())}"></label>
      <div class="btns"><button class="icon-btn bordered" id="rExport" type="button" aria-label="Export sales report" title="Export">${icon('download')}</button></div></div>
      <p class="hint" style="margin-top:10px">Showing <b>${esc(label)}</b> · ${R.tx.length} transactions</p></div>
    <div class="stats c6">
      <div class="stat hero"><span>Total revenue</span><b>${money(R.revenue)}</b></div>
      <div class="stat"><span>Transactions</span><b>${R.tx.length}</b></div>
      <div class="stat"><span>Products sold</span><b>${R.items}</b></div>
      <div class="stat"><span>Avg. transaction</span><b>${money(R.avg)}</b></div>
      <div class="stat"><span>Est. gross profit</span><b>${R.gross == null ? '—' : money(R.gross)}</b></div>
      <div class="stat"><span>Est. net profit</span><b>${R.net == null ? '—' : money(R.net)}</b></div></div>
    <div class="card"><div class="card-head"><h3>Sales trend · ${esc(label)}</h3><div class="seg" id="trendSeg" style="width:300px">${['daily','weekly','monthly'].map(k => `<button data-tr="${k}" class="${repUI.trend === k ? 'active' : ''}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></div><div class="chart-box tall"><canvas id="rTrend"></canvas></div></div>
    <div class="rep-grid">
      <div class="card"><h3>Best-selling products</h3><div class="chart-box"><canvas id="rBest"></canvas></div></div>
      <div class="card"><h3>Least-selling products</h3><div class="chart-box"><canvas id="rLeast"></canvas></div></div>
      <div class="card"><h3>Popular categories</h3><div class="chart-box"><canvas id="rCat"></canvas></div></div>
      <div class="card"><h3>Payment method distribution</h3><div class="chart-box"><canvas id="rPay"></canvas></div></div>
      <div class="card"><h3>Sales by order type</h3><div class="chart-box"><canvas id="rType"></canvas></div></div>
      <div class="card"><h3>Peak sales hours</h3><p class="hint" style="margin:-6px 0 8px">Busiest hour in mint.</p><div class="chart-box"><canvas id="rHours"></canvas></div></div>
    </div>
    <div class="card"><h3>Transaction volume</h3><div class="chart-box short"><canvas id="rVol"></canvas></div></div>
    <div class="card"><div class="card-head"><h3>Profit analysis</h3><span class="hint">Revenue is money collected; profit subtracts costs.</span></div>
      <div class="grid-2"><dl class="kv">
        <dt>Total revenue (collected)</dt><dd>${money(R.revenue)}</dd><dt>Less VAT collected</dt><dd>−${money(R.vat)}</dd><dt>Less delivery/service charges</dt><dd>−${money(R.charges)}</dd>
        <dt>Net sales (ex-VAT, after ${money(R.discounts)} discounts)</dt><dd>${money(R.netSales)}</dd>
        <dt>Cost of goods sold</dt><dd>${R.gross == null ? '—' : money(R.cogs)}</dd><dt>Gross profit</dt><dd class="big">${R.gross == null ? '—' : money(R.gross)}</dd>
        <dt>Total expenses (cash register)</dt><dd>${R.expCount ? money(R.expenses) : '—'}</dd><dt>Estimated net profit</dt><dd class="big" style="color:${R.net != null && R.net < 0 ? 'var(--err)' : 'var(--ok)'}">${R.net == null ? '—' : money(R.net)}</dd>
        <dt>Gross profit margin</dt><dd>${R.margin == null ? '—' : R.margin.toFixed(1) + '%'}</dd></dl>
        <div class="form" style="align-content:start">
          ${!R.tx.length ? '<div class="note">No sales in this period.</div>' : R.coverage === 0 ? '<div class="note err">No unit costs are recorded for the products sold, so profit is not estimated. Add unit costs in Products.</div>' : R.coverage < 0.999 ? `<div class="note">Only ${(R.coverage * 100).toFixed(0)}% of net sales have unit-cost data. Gross profit and margin cover those items only.</div>` : '<div class="note" style="background:var(--ok-soft)">Unit costs are recorded for every item sold in this period.</div>'}
          ${R.tx.length && !R.expCount ? '<div class="note">No expenses recorded in this period. Record cash expenses in Cash Register to estimate net profit.</div>' : ''}
          <p class="hint">Gross profit = net sales − cost of goods sold. Net profit = gross profit − recorded expenses. Estimates only.</p></div></div></div>`;
  }
};
