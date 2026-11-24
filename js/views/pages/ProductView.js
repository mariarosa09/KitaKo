/* KitaKo — VIEW · Product: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const ProductView = {
  filterButtons() {
    return `<button class="btn ghost" id="pfReset">Reset</button><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="pfApply">Apply</button>`;
  },

  filterModal() {
    return `<form class="form" id="pff">
      <label>Category<select id="pCat"><option value="all">All categories</option>${S.categories.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
      <label>Availability<select id="pAvail"><option value="all">All</option><option value="yes">Available</option><option value="no">Unavailable</option></select></label>
      <label>Sort by<select id="pSort"><option value="name">Name (A–Z)</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="stock-asc">Stock: low to high</option><option value="stock-desc">Stock: high to low</option></select></label></form>`;
  },

  page() {
    return `<div class="card">
    <div class="card-head"><h3>Product catalog</h3><div class="row"><button class="btn" id="catBtn">${icon('edit')}Categories</button><button class="btn primary" id="addProd">${icon('plus')}Add product</button></div></div>
    <div class="searchbar"><input id="pQ" type="search" placeholder="Search product name or SKU…" value="${esc(prodUI.q)}" aria-label="Search products">
      <button class="icon-btn bordered" id="pFilter" type="button" aria-label="Filter and sort" title="Filter and sort">${icon('filter')}<span class="badge" id="pFCount" hidden></span></button></div>
    <div class="filter-chips" id="pChips"></div><div style="height:12px"></div>
    <div class="table-wrap"><table class="stack"><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th class="num">Price</th><th class="num">Cost</th><th class="num">Stock</th><th>Status</th><th>Available</th><th></th></tr></thead><tbody id="pBody"></tbody></table></div>
    <p class="hint" id="pCount" style="margin-top:10px"></p></div>`;
  },

  pBody({list}) {
    return list.length ? list.map(p => `<tr><td class="mono">${esc(p.sku)}</td><td><b>${esc(p.name)}</b>${p.desc ? `<div class="hint">${esc(p.desc)}</div>` : ''}</td><td>${esc(catName(p.cat))}</td>
    <td class="num">${money(p.price)}</td><td class="num">${p.cost === '' || p.cost == null ? '<span class="hint">—</span>' : money(p.cost)}</td><td class="num">${p.stock} <span class="hint">${esc(p.unit)}</span></td><td>${statusPill(p)}</td>
    <td><input type="checkbox" class="switch" data-avail="${esc(p.id)}" ${p.available ? 'checked' : ''} aria-label="Available"></td>
    <td class="actions"><button class="btn sm" data-edit-p="${esc(p.id)}">${icon('edit')}Edit</button><button class="btn sm danger" data-del-p="${esc(p.id)}" aria-label="Delete">${icon('trash')}</button></td></tr>`).join('')
    : `<tr><td colspan="9"><div class="empty"><b>No products match</b>${S.products.length ? 'Clear the filters to see all products.' : 'Add your first product to start selling.'}</div></td></tr>`;
  },

  productFormButtons({isNew}) {
    return `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="pSave">${isNew ? 'Add product' : 'Save changes'}</button>`;
  },

  productFormModal({isNew, p}) {
    return `<form class="form" id="pf">
    <label>Product name *<input id="fName" value="${esc(p.name)}" maxlength="80"></label>
    <div class="grid2"><label>Product code / SKU *<input id="fSku" value="${esc(p.sku)}" maxlength="30" placeholder="e.g. BUR-010"></label>
      <label>Category *<select id="fCat">${S.categories.map(c => `<option value="${esc(c.id)}" ${c.id === p.cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label></div>
    <div class="grid2"><label>Selling price (${esc(S.settings.currency)}) *<input id="fPrice" type="number" min="0" step="0.01" value="${esc(p.price)}"></label>
      <label>Unit cost (${esc(S.settings.currency)}) <span class="hint" style="font-weight:400">optional · for profit reports</span><input id="fCost" type="number" min="0" step="0.01" value="${esc(p.cost ?? '')}"></label></div>
    <div class="grid3"><label>${isNew ? 'Initial stock' : 'Stock quantity'} *<input id="fStock" type="number" min="0" step="1" value="${esc(p.stock)}"></label>
      <label>Minimum stock level *<input id="fMin" type="number" min="0" step="1" value="${esc(p.min)}"></label>
      <label>Unit<input id="fUnit" value="${esc(p.unit)}" maxlength="15"></label></div>
    <label>Description<textarea id="fDesc" maxlength="240">${esc(p.desc)}</textarea></label>
    <label class="check"><input type="checkbox" id="fAvail" ${p.available ? 'checked' : ''}> Available for sale</label></form>`;
  },

  categoryManagerModal() {
    return `<div class="row" style="margin-bottom:14px"><input id="newCat" placeholder="New category name" style="flex:1"><button class="btn primary" id="addCat">${icon('plus')}Add</button></div>
      <div class="list">${S.categories.map(c => { const n = S.products.filter(p => p.cat === c.id).length; return `<div class="list-item"><input value="${esc(c.name)}" data-catname="${esc(c.id)}" style="flex:1"><span class="hint nowrap">${n} product${n === 1 ? '' : 's'}</span>
        <button class="btn sm" data-rencat="${esc(c.id)}">Rename</button>${c.name === 'Others' ? '' : `<button class="btn sm danger" data-delcat="${esc(c.id)}" aria-label="Delete">${icon('trash')}</button>`}</div>`; }).join('')}</div>
      <p class="hint" style="margin-top:10px">Assign products to a category from the product form. Deleting a category moves its products to “Others”.</p>`;
  }
};
