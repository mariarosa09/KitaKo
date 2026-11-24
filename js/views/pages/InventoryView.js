/* KitaKo — VIEW · Inventory: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const InventoryView = {
  page({c}) {
    return `<div class="stats c5">
      <div class="stat"><span>Products tracked</span><b>${S.products.length}</b></div>
      <div class="stat"><span>In stock</span><b style="color:var(--ok)">${c.in}</b></div>
      <div class="stat warn"><span>Low stock</span><b>${c.low}</b></div>
      <div class="stat err"><span>Out of stock</span><b>${c.out}</b></div>
      <div class="stat"><span>Stock value at cost</span><b>${money(sum(S.products, p => (+p.cost || 0) * p.stock))}</b></div></div>
    <div class="card"><div class="card-head"><div class="tabs" style="width:auto;flex:0 1 auto"><button class="tab ${invUI.tab === 'stock' ? 'active' : ''}" data-itab="stock">Stock levels</button><button class="tab ${invUI.tab === 'moves' ? 'active' : ''}" data-itab="moves">Movement history</button></div>
      <button class="btn dark" id="invExport">${icon('download')}Export inventory</button></div>
      <div id="invPane"></div></div>`;
  },

  iBody({list}) {
    return list.length ? list.map(p => `<tr><td class="mono">${esc(p.sku)}</td><td><b>${esc(p.name)}</b></td><td>${esc(catName(p.cat))}</td><td class="num"><b>${p.stock}</b></td><td>${esc(p.unit)}</td><td class="num">${p.min}</td><td>${statusPill(p)}</td><td class="nowrap hint">${fmtDT(p.updated)}</td>
      <td><div class="actions"><button class="act-btn" data-stock="${esc(p.id)}" data-mode="add" title="Add stock" aria-label="Add stock to ${esc(p.name)}">+</button><button class="act-btn" data-stock="${esc(p.id)}" data-mode="deduct" title="Deduct stock" aria-label="Deduct stock from ${esc(p.name)}">−</button><button class="act-btn" data-stock="${esc(p.id)}" data-mode="adjust" title="Set exact quantity" aria-label="Adjust ${esc(p.name)}">${icon('sliders')}</button></div></td></tr>`).join('')
      : '<tr><td colspan="9"><div class="empty"><b>No inventory records match</b>Change the search or filters.</div></td></tr>';
  },

  stockPane() {
    return `<div class="toolbar" style="margin-bottom:14px">
      <label class="grow">Search<input id="iQ" type="search" placeholder="Name or code…" value="${esc(invUI.q)}"></label>
      <label>Category<select id="iCat"><option value="all">All categories</option>${S.categories.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
      <label>Stock status<select id="iStatus"><option value="all">All</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></label></div>
    <div class="table-wrap"><table class="one-line"><thead><tr><th>Code</th><th>Product</th><th>Category</th><th class="num">Stock</th><th>Unit</th><th class="num">Min.</th><th>Status</th><th>Last updated</th><th style="text-align:right">Adjust stock</th></tr></thead><tbody id="iBody"></tbody></table></div>`;
  },

  movesPane({T, mv}) {
    return mv.length ? `<div class="table-wrap"><table class="one-line"><thead><tr><th>Date &amp; time</th><th>Product</th><th>Type</th><th class="num">Previous</th><th class="num">Change</th><th class="num">Updated</th><th>Reason</th></tr></thead><tbody>
    ${mv.map(m => `<tr><td>${fmtDT(m.at)}</td><td><b>${esc(m.name)}</b></td><td><span class="pill ${T[m.type][1]}">${T[m.type][0]}</span></td><td class="num">${m.prev}</td><td class="num" style="color:${m.change < 0 ? 'var(--err)' : 'var(--ok)'}">${m.change > 0 ? '+' : ''}${m.change}</td><td class="num"><b>${m.next}</b></td><td class="reason" title="${esc(m.reason)}">${esc(m.reason)}</td></tr>`).join('')}</tbody></table></div>
    <p class="hint" style="margin-top:10px">Showing the latest ${mv.length} of ${S.stockMoves.length} movements.</p>`
    : '<div class="empty"><b>No stock movements yet</b>Additions, deductions, adjustments and sales will be logged here.</div>';
  },

  stockDialogModal({mode, p, reasons}) {
    return `<form class="form" id="sf"><div class="note">Current stock: <b>${p.stock} ${esc(p.unit)}</b> · minimum ${p.min}</div>
    <label>${mode === 'adjust' ? 'New quantity' : 'Quantity to ' + (mode === 'add' ? 'add' : 'deduct')} *<input id="sQty" type="number" min="0" step="1" inputmode="numeric"></label>
    <label>Reason *<select id="sReason">${reasons.map(r => `<option>${r}</option>`).join('')}</select></label>
    <label>Details<input id="sNote" placeholder="Optional details (supplier, batch, etc.)"></label>
    <div class="hint" id="sPreview"></div></form>`;
  },

  exportInventoryDialogModal() {
    return `<div class="form">
    <label>Products to include<select id="exF"><option value="all">All products</option><option value="cats">Selected categories</option><option value="low">Low-stock products</option><option value="out">Out-of-stock products</option></select></label>
    <div id="exCats" hidden><div class="grid2">${S.categories.map(c => `<label class="check"><input type="checkbox" value="${esc(c.id)}" checked> ${esc(c.name)}</label>`).join('')}</div></div>
    <label>Format<select id="exFmt"><option value="csv">CSV</option><option value="excel">Excel-compatible CSV</option><option value="xlsx">Excel workbook (.xlsx)</option><option value="pdf">PDF</option></select></label>
    <p class="hint" id="exCount"></p></div>`;
  }
};
