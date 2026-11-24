/* KitaKo — VIEW · Transaction: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const TransactionView = {
  exportModal({n}) {
    return `<div class="form"><p class="hint" style="margin:0">Exports the <b>${n}</b> transaction${n === 1 ? '' : 's'} that match your current search and filters.</p>
      <label>Format<select id="txFmt"><option value="csv">CSV</option><option value="excel">Excel-compatible CSV</option><option value="xlsx">Excel workbook (.xlsx)</option><option value="pdf">PDF</option></select></label></div>`;
  },

  filterButtons() {
    return `<button class="btn ghost" id="tfReset">Reset</button><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="tfApply">Apply</button>`;
  },

  filterModal() {
    return `<form class="form" id="tff">
      <div class="date-range"><label>From<input id="tFrom" type="date" value="${esc(txUI.from)}"></label><label>To<input id="tTo" type="date" value="${esc(txUI.to)}"></label></div>
      <label>Payment method<select id="tM"><option value="all">All methods</option>${METHODS.map(m => `<option>${m}</option>`).join('')}</select></label>
      <label>Order type<select id="tT"><option value="all">All types</option><option value="dine-in">Dine-in</option><option value="takeout">Takeout</option><option value="delivery">Delivery</option></select></label></form>`;
  },

  tBody({OT, limit, list}) {
    return list.length ? list.slice(0, limit).map(t => `<tr class="click" data-txn="${esc(t.id)}" tabindex="0" title="View transaction details"><td class="mono">${esc(t.id)}</td><td class="mono">${esc(t.receipt)}</td><td class="nowrap">${fmtDate(t.date)}</td><td class="nowrap">${fmtTime(t.date)}</td><td>${esc(t.cashier)}</td>
      <td class="num">${sum(t.items, i => i.qty)}</td><td class="num"><b>${money(t.total)}</b></td><td>${esc(t.method)}</td><td>${esc(OT[t.orderType] || t.orderType)}</td></tr>`).join('')
      : '<tr><td colspan="9"><div class="empty"><b>No transactions found</b>Adjust the search or filters.</div></td></tr>';
  },

  page() {
    return `<div class="card">
    <div class="searchbar"><input id="tQ" type="search" placeholder="Search transaction ID, receipt no. or customer" value="${esc(txUI.q)}" aria-label="Search transactions">
      <button class="icon-btn bordered" id="tFilter" type="button" aria-label="Filter transactions" title="Filter by date, payment and order type">${icon('filter')}<span class="badge" id="tFCount" hidden></span></button>
      <button class="icon-btn bordered" id="tExport" type="button" aria-label="Export transactions" title="Export">${icon('download')}</button></div>
    <div class="filter-chips" id="tChips"></div>
    <p class="hint" id="tSum" style="margin:12px 0 10px"></p>
    <div class="table-wrap"><table class="stack"><thead><tr><th>Transaction ID</th><th>Receipt No.</th><th>Date</th><th>Time</th><th>Cashier</th><th class="num">Items</th><th class="num">Total</th><th>Payment</th><th>Order type</th></tr></thead><tbody id="tBody"></tbody></table></div>
    <div class="row" style="justify-content:center;margin-top:12px"><button class="btn sm" id="tMore" hidden>Show more</button></div></div>`;
  },

  txnDetailsButtons() {
    return `<button class="btn" id="dPdf">${icon('download')}PDF</button><button class="btn" id="dPrint">${icon('printer')}Reprint</button><button class="btn primary" id="dRcpt">${icon('receipts')}View receipt</button>`;
  },

  txnDetailsModal({t}) {
    return `<dl class="kv"><dt>Transaction ID</dt><dd class="mono">${esc(t.id)}</dd><dt>Receipt No.</dt><dd>${esc(t.receipt)}</dd><dt>Date &amp; time</dt><dd>${fmtDT(t.date)}</dd>
      <dt>Cashier</dt><dd>${esc(t.cashier)}</dd><dt>Order type</dt><dd>${esc(t.orderType)}</dd>${t.customer ? `<dt>Customer</dt><dd>${esc(t.customer)}</dd>` : ''}<dt>Payment</dt><dd>${esc(t.method)}${t.ref ? ' · ' + esc(t.ref) : ''}</dd></dl>
    <div class="table-wrap" style="margin:14px 0"><table><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Subtotal</th></tr></thead><tbody>
      ${t.items.map(i => `<tr><td>${esc(i.name)} <span class="hint mono">${esc(i.sku)}</span></td><td class="num">${i.qty}</td><td class="num">${money(i.price)}</td><td class="num">${money(i.price * i.qty)}</td></tr>`).join('')}</tbody></table></div>
    <dl class="kv"><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd>${t.lessVat ? `<dt>Less VAT</dt><dd>−${money(t.lessVat)}</dd>` : ''}${t.discount ? `<dt>Discount (${esc(t.discount.name)})</dt><dd>−${money(t.discount.amount)}</dd>` : ''}
      ${t.charges ? `<dt>Additional charges</dt><dd>${money(t.charges)}</dd>` : ''}<dt>VAT</dt><dd>${money(t.vat)}</dd><dt>Total</dt><dd class="big" style="color:var(--primary)">${money(t.total)}</dd>
      <dt>Amount received</dt><dd>${money(t.received)}</dd><dt>Change</dt><dd>${money(t.change)}</dd></dl>
    ${t.notes ? `<p class="note" style="margin-top:12px">Note: ${esc(t.notes)}</p>` : ''}
    <p class="hint" style="margin-top:12px">Prices and names are stored as they were at the time of purchase.</p>`;
  }
};
