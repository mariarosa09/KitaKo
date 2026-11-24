/* KitaKo — CONTROLLER · Product: handles user actions, updates models, renders ProductView. */
'use strict';

const prodUI = {q: '', cat: 'all', avail: 'all', sort: 'name'};

RENDER.products = el => {
  el.innerHTML = ProductView.page();
  $('#pQ').addEventListener('input', e => { prodUI.q = e.target.value; drawProdTable(); });
  $('#pFilter').onclick = () => {
    openModal('Filter & sort products', ProductView.filterModal(),
      ProductView.filterButtons(), {small: true});
    $('#pCat').value = prodUI.cat; $('#pAvail').value = prodUI.avail; $('#pSort').value = prodUI.sort;
    $('#pfReset').onclick = () => { Object.assign(prodUI, {cat: 'all', avail: 'all', sort: 'name'}); closeModal(); drawProdTable(); };
    $('#pfApply').onclick = () => { Object.assign(prodUI, {cat: $('#pCat').value, avail: $('#pAvail').value, sort: $('#pSort').value}); closeModal(); drawProdTable(); };
  };
  $('#addProd').onclick = () => productForm();
  $('#catBtn').onclick = categoryManager;
  $('#pBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-p]'), del = e.target.closest('[data-del-p]');
    if (ed) productForm(product(ed.dataset.editP));
    if (del) deleteProduct(product(del.dataset.delP));
  });
  $('#pBody').addEventListener('change', e => {
    if (!e.target.matches('[data-avail]')) return;
    const p = product(e.target.dataset.avail); p.available = e.target.checked; p.updated = new Date().toISOString();
    notify('product', 'Availability changed', `${p.name} is now ${p.available ? 'available' : 'unavailable'}.`, true);
    save('products', 'notifs'); updateBell(); toast(`${p.name} marked ${p.available ? 'available' : 'unavailable'}.`, 'success');
  });
  drawProdTable();
};

function drawProdTable() {
  const q = prodUI.q.trim().toLowerCase();
  let list = S.products.filter(p => (prodUI.cat === 'all' || p.cat === prodUI.cat) && (prodUI.avail === 'all' || (prodUI.avail === 'yes') === p.available) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));
  const s = prodUI.sort; list.sort((a, b) => s === 'price-asc' ? a.price - b.price : s === 'price-desc' ? b.price - a.price : s === 'stock-asc' ? a.stock - b.stock : s === 'stock-desc' ? b.stock - a.stock : a.name.localeCompare(b.name));
  $('#pBody').innerHTML = ProductView.pBody({list});
  $('#pCount').textContent = `Showing ${list.length} of ${S.products.length} products.`;
  const SORTS = {'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', 'stock-asc': 'Stock: low to high', 'stock-desc': 'Stock: high to low'};
  const chips = [prodUI.cat !== 'all' && catName(prodUI.cat), prodUI.avail !== 'all' && (prodUI.avail === 'yes' ? 'Available' : 'Unavailable'), SORTS[prodUI.sort]].filter(Boolean);
  $('#pChips').innerHTML = chips.map(c => `<span class="fchip">${esc(c)}</span>`).join('');
  $('#pFCount').hidden = !chips.length; $('#pFCount').textContent = chips.length;
}

function deleteProduct(p) {
  confirmBox(`Delete “${p.name}”? It will be removed from the POS and inventory. Past transactions keep their records.`, () => {
    S.products = S.products.filter(x => x !== p); if (S.cart) S.cart.items = S.cart.items.filter(i => i.pid !== p.id);
    notify('product', 'Product deleted', `${p.name} (${p.sku}) was removed from the catalog.`, true);
    save('products', 'cart', 'notifs'); updateBell(); rerender(); toast(p.name + ' deleted.', 'success'); }, {ok: 'Delete product', title: 'Delete product'});
}

function productForm(p) {
  const isNew = !p; p = p || {name: '', sku: '', cat: S.categories[0]?.id, price: '', cost: '', stock: 0, min: S.settings.lowStockDefault, unit: 'pcs', desc: '', available: true};
  openModal(isNew ? 'Add product' : 'Edit product', ProductView.productFormModal({isNew, p}),
    ProductView.productFormButtons({isNew}));
  if (isNew) $('#fSku').value = suggestSku($('#fCat').value);
  $('#fCat').onchange = () => { if (isNew && /^[A-Z]{3}-\d{3}$/.test($('#fSku').value)) $('#fSku').value = suggestSku($('#fCat').value); };
  $('#pf').onsubmit = e => { e.preventDefault(); $('#pSave').click(); };
  $('#pSave').onclick = () => {
    const m = $('#modal'), name = formVal(m, '#fName'), sku = formVal(m, '#fSku').toUpperCase(), price = num($('#fPrice').value), costRaw = $('#fCost').value.trim(), cost = costRaw === '' ? '' : num(costRaw), stock = num($('#fStock').value), min = num($('#fMin').value);
    if (!name) return fieldErr($('#fName'), 'Product name is required.');
    if (!sku) return fieldErr($('#fSku'), 'Product code is required.');
    if (S.products.some(x => x !== p && x.sku.toUpperCase() === sku)) return fieldErr($('#fSku'), 'That product code is already used.');
    if (!isFinite(price) || price < 0) return fieldErr($('#fPrice'), 'Price must be zero or more.');
    if (cost !== '' && (!isFinite(cost) || cost < 0)) return fieldErr($('#fCost'), 'Cost cannot be negative.');
    if (!isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return fieldErr($('#fStock'), 'Stock must be a whole number, zero or more.');
    if (!isFinite(min) || min < 0 || !Number.isInteger(min)) return fieldErr($('#fMin'), 'Minimum stock must be a whole number, zero or more.');
    const data = {name, sku, cat: $('#fCat').value, price: r2(price), cost: cost === '' ? '' : r2(cost), min, unit: formVal(m, '#fUnit') || 'pcs', desc: formVal(m, '#fDesc'), available: $('#fAvail').checked};
    if (isNew) {
      const np = {id: uid('p'), ...data, stock: 0, updated: new Date().toISOString()}; S.products.push(np);
      if (stock > 0) changeStock(np, stock, 'add', 'Initial stock'); else np.stock = 0;
      notify('product', 'Product added', `${name} (${sku}) added at ${money(price)}.`, true);
    } else {
      const changes = [];
      if (p.price !== data.price) changes.push(`price ${money(p.price)} → ${money(data.price)}`);
      if (p.name !== data.name) changes.push(`renamed from “${p.name}”`);
      Object.assign(p, data, {updated: new Date().toISOString()});
      if (p.stock !== stock) changeStock(p, stock, 'adjust', 'Edited in product form');
      notify('product', 'Product updated', `${p.name}${changes.length ? ': ' + changes.join(', ') : ' details updated'}.`, true);
    }
    save('products', 'stockMoves', 'notifs'); updateBell(); closeModal(); rerender(); toast(isNew ? name + ' added — now on the POS and inventory.' : 'Changes saved.', 'success');
  };
}

function categoryManager() {
  const draw = () => {
    openModal('Categories', ProductView.categoryManagerModal(), '<button class="btn dark" data-close>Done</button>', {onClose: rerender});
    $('#addCat').onclick = () => {
      const n = $('#newCat').value.trim(); if (!n) return fieldErr($('#newCat'), 'Enter a category name.');
      if (S.categories.some(c => c.name.toLowerCase() === n.toLowerCase())) return fieldErr($('#newCat'), 'That category already exists.');
      S.categories.push({id: uid('c'), name: n}); save('categories'); toast('Category added.', 'success'); modalClose = null; draw();
    };
    $('#newCat').onkeydown = e => { if (e.key === 'Enter') $('#addCat').click(); };
    $('#modalBody').onclick = e => {
      const r = e.target.closest('[data-rencat]'), d = e.target.closest('[data-delcat]');
      if (r) { const c = S.categories.find(x => x.id === r.dataset.rencat), inp = $(`[data-catname="${CSS.escape(c.id)}"]`), n = inp.value.trim();
        if (!n) return fieldErr(inp, 'Name cannot be empty.');
        if (S.categories.some(x => x !== c && x.name.toLowerCase() === n.toLowerCase())) return fieldErr(inp, 'Another category has that name.');
        c.name = n; save('categories'); toast('Category renamed.', 'success'); }
      if (d) { const c = S.categories.find(x => x.id === d.dataset.delcat), n = S.products.filter(p => p.cat === c.id).length;
        confirmBox(`Delete category “${c.name}”?${n ? ` Its ${n} product(s) will move to “Others”.` : ''}`, () => {
          let others = S.categories.find(x => x.name === 'Others'); if (!others) { others = {id: uid('c'), name: 'Others'}; S.categories.push(others); }
          S.products.forEach(p => { if (p.cat === c.id) p.cat = others.id; });
          S.categories = S.categories.filter(x => x !== c); if (posUI.cat === c.id) posUI.cat = 'all'; if (prodUI.cat === c.id) prodUI.cat = 'all';
          save('categories', 'products'); toast('Category deleted.', 'success'); modalClose = null; draw(); }, {ok: 'Delete'}); }
    };
  };
  draw();
}
