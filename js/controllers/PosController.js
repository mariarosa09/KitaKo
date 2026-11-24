/* KitaKo — CONTROLLER · Pos: handles user actions, updates models, renders PosView. */
'use strict';

const posUI = {q: '', cat: 'all', sort: 'name', edit: false};

function addToCart(pid, n = 1) {
  const p = product(pid); if (!p) return;
  if (!p.available) return toast(p.name + ' is marked unavailable.', 'error');
  const c = cartState(), line = c.items.find(i => i.pid === pid), have = line ? line.qty : 0;
  if (p.stock <= 0) return toast(p.name + ' is out of stock.', 'error');
  if (have + n > p.stock) return toast(`Only ${p.stock} ${p.unit} of ${p.name} in stock.`, 'error');
  if (line) line.qty += n; else c.items.push({pid, qty: n});
  save('cart'); drawCart(); drawProducts();
}

function setQty(pid, q) {
  const c = cartState(), line = c.items.find(i => i.pid === pid), p = product(pid); if (!line || !p) return;
  q = Math.floor(+q);
  if (!isFinite(q) || q < 0) { toast('Enter a valid quantity.', 'error'); drawCart(); return; }
  if (q === 0) { c.items = c.items.filter(i => i.pid !== pid); }
  else if (q > p.stock) { toast(`Only ${p.stock} ${p.unit} of ${p.name} in stock.`, 'error'); line.qty = p.stock; }
  else line.qty = q;
  save('cart'); drawCart(); drawProducts();
}

RENDER.pos = el => {
  const c = cartState();
  el.innerHTML = PosView.page({c});
  $('#posSort').value = posUI.sort;
  $('#posQ').oninput = e => { posUI.q = e.target.value; drawProducts(); };
  $('#posSort').onchange = e => { posUI.sort = e.target.value; drawProducts(); };
  $('#posCats').onclick = e => { const b = e.target.closest('[data-cat]'); if (b) { posUI.cat = b.dataset.cat; drawCats(); drawProducts(); } };
  $('#posGrid').onclick = e => {
    if (e.target.closest('[data-padd]')) return productForm();
    const pd = e.target.closest('[data-pdel]'); if (pd) return deleteProduct(product(pd.dataset.pdel));
    const b = e.target.closest('[data-add]'); if (!b) return;
    if (posUI.edit) productForm(product(b.dataset.add)); else addToCart(b.dataset.add);
  };
  $('#editMenu').onclick = () => {
    if (posUI.edit) { posUI.edit = false; return rerender(); }
    if (unlocked()) { posUI.edit = true; return rerender(); }
    businessMode('pos', () => { posUI.edit = true; go('pos'); });
  };
  $('#orderType').onclick = e => { const b = e.target.closest('[data-ot]'); if (!b) return; c.orderType = b.dataset.ot; $$('#orderType button').forEach(x => x.classList.toggle('active', x === b)); save('cart'); drawCart(); };
  $('#custName').oninput = e => { c.customer = e.target.value; save('cart'); };
  $('#orderNotes').oninput = e => { c.notes = e.target.value; save('cart'); };
  $('#idNo').oninput = e => { c.idNo = e.target.value; save('cart'); };
  $('#discSel').onchange = e => { c.discountId = e.target.value; save('cart'); drawCart(); };
  $('#cart').addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    const line = c.items.find(i => i.pid === b.dataset.pid); if (!line) return;
    if (b.dataset.q === 'rm') setQty(line.pid, 0); else setQty(line.pid, line.qty + (+b.dataset.q));
  });
  $('#cart').addEventListener('change', e => { if (e.target.matches('[data-edit]')) setQty(e.target.dataset.edit, e.target.value); });
  $('#clearCart').onclick = () => { if (!c.items.length) return; confirmBox('Remove all items from the current order?', () => { c.items = []; c.notes = ''; c.customer = ''; c.discountId = ''; c.idNo = ''; save('cart'); rerender(); toast('Cart cleared.'); }, {ok: 'Clear cart'}); };
  $('#holdBtn').onclick = holdOrder;
  $('#heldBtn').onclick = heldOrders;
  $('#payBtn').onclick = openPayment;
  $('#mobileCart').onclick = () => $('#ticket').scrollIntoView({behavior: 'smooth'});
  drawCats(); drawProducts(); drawCart();
};

function drawCats() {
  const used = new Set(S.products.map(p => p.cat));
  $('#posCats').innerHTML = `<button class="chip ${posUI.cat === 'all' ? 'active' : ''}" data-cat="all">All</button>` +
    S.categories.filter(c => used.has(c.id)).map(c => `<button class="chip ${posUI.cat === c.id ? 'active' : ''}" data-cat="${esc(c.id)}">${esc(c.name)}</button>`).join('');
}

function drawProducts() {
  const g = $('#posGrid'); if (!g) return;
  const q = posUI.q.trim().toLowerCase(), inCart = {}; cartState().items.forEach(i => inCart[i.pid] = i.qty);
  let list = S.products.filter(p => (posUI.cat === 'all' || p.cat === posUI.cat) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));
  const s = posUI.sort; list.sort((a, b) => s === 'price-asc' ? a.price - b.price : s === 'price-desc' ? b.price - a.price : a.name.localeCompare(b.name));
  const edit = posUI.edit && unlocked();
  const addCard = edit ? `<button class="pcard add" data-padd>${icon('plus')}<span>Add product</span></button>` : '';
  g.innerHTML = PosView.products({addCard, edit, inCart, list});
}

function drawCart() {
  const box = $('#cart'); if (!box) return;
  const c = cartState(), lines = cartLines(), d = cartDiscount(), t = calc(lines, d, c.orderType);
  box.innerHTML = PosView.cart({lines});
  const st = S.settings;
  $('#totals').innerHTML = PosView.totals({c, d, lines, st, t});
  $('#payBtn').disabled = !lines.length; $('#holdBtn').disabled = !lines.length;
  $('#idNo').hidden = !(d && (d.type === 'senior' || d.type === 'pwd'));
  $('#mcTotal').textContent = money(t.total) + ' · ' + sum(lines, l => l.qty) + ' items';
}

function holdOrder() {
  const c = cartState(); if (!c.items.length) return;
  S.held.unshift({id: uid('h'), at: new Date().toISOString(), cart: JSON.parse(JSON.stringify(c)), total: calc(cartLines(), cartDiscount(), c.orderType).total});
  S.cart = null; save('held', 'cart'); rerender(); toast('Order held. Resume it from “Held orders”.', 'success');
}

function heldOrders() {
  const body = PosView.heldOrdersList();
  openModal('Held orders', body, '<button class="btn dark" data-close>Close</button>');
  $('#modalBody').onclick = e => {
    const r = e.target.closest('[data-resume]'), d = e.target.closest('[data-delheld]');
    if (r) {
      const h = S.held.find(x => x.id === r.dataset.resume);
      const go2 = () => { S.cart = h.cart; S.held = S.held.filter(x => x !== h); save('held', 'cart'); closeModal(); rerender(); toast('Order resumed.', 'success'); };
      if (cartState().items.length) confirmBox('The current cart will be held so you can resume this order. Continue?', () => { holdOrder(); go2(); }, {ok: 'Swap orders', danger: false}); else go2();
    }
    if (d) confirmBox('Delete this held order? This cannot be undone.', () => { S.held = S.held.filter(x => x.id !== d.dataset.delheld); save('held'); closeModal(); heldOrders(); $('#heldCount') && ($('#heldCount').textContent = S.held.length); toast('Held order deleted.'); }, {ok: 'Delete'});
  };
}

function openPayment() {
  const c = cartState(), lines = cartLines(); if (!lines.length) return;
  const bad = lines.find(l => !l.p.available || l.qty > l.p.stock);
  if (bad) return toast(`${bad.name}: ${!bad.p.available ? 'unavailable' : 'only ' + bad.p.stock + ' in stock'}. Adjust the cart first.`, 'error');
  const d = cartDiscount(), t = calc(lines, d, c.orderType);
  const pay = {method: 'Cash', received: '', confirmed: false, ref: ''};
  openModal('Checkout', PosView.checkoutModal({c, d, lines, t}),
    `<button class="btn ghost" data-close>Back to order</button><button class="btn primary" id="confirmPay" disabled>Confirm payment</button>`, {wide: true, noFocus: true});
  const pane = () => {
    const P = $('#payPane'); if (!P) return;
    if (pay.method === 'Cash') {
      const qs = [...new Set([t.total, ...[20, 50, 100, 200, 500, 1000].map(s => Math.ceil(t.total / s) * s)])].sort((a, b) => a - b).slice(0, 5);
      P.innerHTML = PosView.cashPane({pay, qs, t});
      const upd = () => {
        const r = num(pay.received), ok = isFinite(r) && r >= t.total;
        $('#changeBox').innerHTML = pay.received === '' ? '' : ok ? `<div class="change ok"><span>Change</span><span>${money(r - t.total)}</span></div>` : `<div class="change bad"><span>Insufficient payment</span><span>short ${money(t.total - (isFinite(r) ? r : 0))}</span></div>`;
        $('#confirmPay').disabled = !ok;
      };
      $('#cashIn').oninput = e => { pay.received = e.target.value; upd(); };
      P.onclick = e => { const b = e.target.closest('[data-cash]'); if (b) { pay.received = b.dataset.cash; $('#cashIn').value = pay.received; upd(); } };
      upd(); $('#cashIn').focus();
    } else {
      const card = /Card/.test(pay.method);
      P.onclick = null;
      P.innerHTML = PosView.referencePane({card, pay});
      const upd = () => { const ok = refOK(pay.ref); $('#confirmPay').disabled = !ok; $('#refErr').textContent = pay.ref && !ok ? 'Reference number should be 6–30 letters or digits.' : ''; };
      $('#refNo').oninput = e => { pay.ref = e.target.value.trim(); upd(); };
      upd(); $('#refNo').focus();
    }
  };
  $('#methods').onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; pay.method = b.dataset.m; pay.ref = ''; pay.received = ''; $$('#methods .method').forEach(x => x.classList.toggle('active', x === b)); pane(); };
  $('#confirmPay').onclick = () => completeSale(pay, t, d);
  pane();
}

function completeSale(pay, t, d) {
  const c = cartState(), lines = cartLines();
  for (const l of lines) if (!l.p.available || l.qty > l.p.stock) return toast(`${l.name} no longer has enough stock.`, 'error');
  const received = pay.method === 'Cash' ? num(pay.received) : t.total;
  if (pay.method === 'Cash' && !(received >= t.total)) return toast('Amount received is less than the total.', 'error');
  if (pay.method !== 'Cash' && !refOK(pay.ref)) return toast('Enter the ' + pay.method + ' reference number.', 'error');
  S.meta.receiptCounter = (S.meta.receiptCounter || 1000) + 1;
  const items = lines.map(({p, ...rest}) => rest);
  const txn = buildTxn({at: new Date(), items, c: t, discount: d, method: pay.method, received, orderType: c.orderType, customer: c.customer, notes: c.notes, cashier: user().fullname, rc: S.meta.receiptCounter, ref: pay.ref, idNo: c.idNo});
  S.txns.push(txn);
  lines.forEach(l => changeStock(l.p, l.p.stock - l.qty, 'sale', 'Sale ' + txn.receipt));
  notify('sale', 'Transaction completed', `${txn.receipt}: ${money(txn.total)} via ${txn.method}.`, true);
  S.cart = null;
  save('txns', 'products', 'stockMoves', 'notifs', 'cart', 'meta');
  updateBell(); closeModal(); rerender();
  showReceipt(txn, true);
}
