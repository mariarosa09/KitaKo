/* KitaKo — MODEL · Pricing (Philippine VAT, Senior/PWD), discounts, transactions and the cart. */
'use strict';

const DISC_TYPES = {percent: 'Percentage', fixed: 'Fixed amount', promo: 'Promotional', senior: 'Senior Citizen', pwd: 'PWD'};

const discActive = d => { if (!d || !d.enabled) return false; const t = dayKey(new Date()); return (!d.from || d.from <= t) && (!d.to || d.to >= t); };

function calc(items, disc, orderType) {
  const st = S.settings, rate = (+st.vatRate || 0) / 100;
  const subtotal = r2(sum(items, i => i.price * i.qty));
  let charges = 0;
  if (orderType === 'dine-in' && +st.serviceCharge) charges += subtotal * st.serviceCharge / 100;
  if (orderType === 'delivery' && +st.deliveryFee && items.length) charges += +st.deliveryFee;
  charges = r2(charges);
  const out = {subtotal, discount: 0, lessVat: 0, vat: 0, vatable: 0, vatExempt: 0, charges, total: 0, note: ''};
  if (!items.length) return out;
  const statutory = disc && (disc.type === 'senior' || disc.type === 'pwd');
  if (statutory && st.statVatExempt) {
    const base = st.vatInclusive ? subtotal / (1 + rate) : subtotal;
    out.lessVat = st.vatInclusive ? r2(subtotal - base) : 0;
    out.vatExempt = r2(base);
    out.discount = r2(base * disc.value / 100);
    out.total = r2(base - out.discount + charges);
    out.note = `VAT-exempt sale; ${disc.value}% off the VAT-exclusive price.`;
    return out;
  }
  if (disc) {
    if (disc.type === 'fixed') out.discount = Math.min(+disc.value, subtotal);
    else if (disc.type === 'promo' && subtotal < (+disc.minSpend || 0)) out.note = `Promo needs a minimum spend of ${money(disc.minSpend)}.`;
    else out.discount = subtotal * disc.value / 100;
    out.discount = r2(out.discount);
  }
  const net = subtotal - out.discount;
  if (st.vatInclusive) { out.vatable = r2(net / (1 + rate)); out.vat = r2(net - out.vatable); out.total = r2(net + charges); }
  else { out.vatable = r2(net); out.vat = r2(net * rate); out.total = r2(net + out.vat + charges); }
  return out;
}

function buildTxn({at, items, c, discount, method, received, orderType, customer, notes, cashier, rc, ref, idNo}) {
  const d = new Date(at);
  return {
    id: 'TXN-' + dayKey(d).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
    receipt: 'OR-' + pad(rc, 6), date: d.toISOString(), cashier,
    items: items.map(i => ({...i})), subtotal: c.subtotal,
    discount: discount ? {id: discount.id, name: discount.name, type: discount.type, value: discount.value, amount: c.discount, idNo: idNo || ''} : null,
    lessVat: c.lessVat, vatable: c.vatable, vat: c.vat, vatExempt: c.vatExempt, charges: c.charges, total: c.total,
    method, received: r2(received), change: r2(Math.max(0, received - c.total)), ref: ref || '', orderType, customer: customer || '', notes: notes || ''
  };
}

function cartState() { if (!S.cart) S.cart = {items: [], orderType: 'dine-in', customer: '', notes: '', discountId: S.settings.defaultDiscountId || '', idNo: ''}; return S.cart; }

function cartLines() {
  const c = cartState(); const gone = [];
  c.items = c.items.filter(i => { const p = product(i.pid); if (!p) gone.push(i); return !!p; });
  if (gone.length) { save('cart'); ModelEvents.emit('cart:itemsRemoved', gone.length); }
  return c.items.map(i => { const p = product(i.pid); return {pid: p.id, name: p.name, sku: p.sku, cat: p.cat, catName: catName(p.cat), price: p.price, cost: p.cost, qty: i.qty, p}; });
}

const cartDiscount = () => { const d = S.discounts.find(x => x.id === cartState().discountId); return discActive(d) ? d : null; };

const METHODS = ['Cash','GCash','Maya','Debit Card','Credit Card'];

const refOK = r => /^[A-Za-z0-9 -]{6,30}$/.test(r || '') && (r.match(/[A-Za-z0-9]/g) || []).length >= 6;
