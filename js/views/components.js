/* KitaKo — VIEW · Shared UI: icons, toasts, modals, charts, receipt layout. */
'use strict';

const ICONS = {
  dashboard:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  pos:'<path d="M3 4h18v12H3z"/><path d="M8 20h8M12 16v4"/>',
  products:'<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
  inventory:'<path d="M3 3h18v5H3zM5 8v13h14V8"/><path d="M10 12h4"/>',
  transactions:'<path d="M4 6h16M4 12h16M4 18h10"/>',
  receipts:'<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  reports:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  discounts:'<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  register:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  notifications:'<path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>',
  config:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-2.9-1.2l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 003 15H3a2 2 0 110-4h.1a1.7 1.7 0 001.2-2.9l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 009 3.1V3a2 2 0 114 0v.1a1.7 1.7 0 002.9 1.2l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 001.2 2.9h.1a2 2 0 110 4z"/>',
  logout:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>', bell:'<path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>',
  x:'<path d="M18 6L6 18M6 6l12 12"/>', edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>', eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', printer:'<path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  download:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>', alert:'<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01"/>',
  check:'<path d="M20 6L9 17l-5-5"/>', box:'<path d="M21 8l-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/>', cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  chevL:'<path d="M15 18l-6-6 6-6"/>', panelClose:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 15l-3-3 3-3"/>', panelOpen:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M14 9l3 3-3 3"/>', filter:'<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>', sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  eyeOff:'<path d="M17.9 17.9A10.1 10.1 0 0112 20c-7 0-11-8-11-8a18.5 18.5 0 015.1-5.9M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.2M14.1 14.1a3 3 0 11-4.2-4.2M1 1l22 22"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>', unlock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/>',
  user:'<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>', copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>'
};

const icon = n => `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg></span>`;

const fillIcons = (root = document) => $$('[data-ico]', root).forEach(el => { el.outerHTML = icon(el.dataset.ico); });

const statusPill = p => ({in: '<span class="pill ok">In stock</span>', low: '<span class="pill warn">Low stock</span>', out: '<span class="pill err">Out of stock</span>'}[stockStatus(p)]);

function updateBell() {
  const n = (S.notifs || []).filter(x => !x.read).length;
  const b = $('#bellCount'); if (b) { b.hidden = !n; b.textContent = n > 99 ? '99+' : n; }
  const c = $('#nav [data-page=notifications] .count'); if (c) { c.hidden = !n; c.textContent = n; }
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), type === 'error' ? 5000 : 3200);
}

let modalClose = null;

function openModal(title, body, foot = '', opts = {}) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = body;
  $('#modalFoot').innerHTML = foot;
  const m = $('#modal .modal'); m.className = 'modal' + (opts.wide ? ' wide' : '') + (opts.small ? ' small' : '');
  $('#modal').hidden = false; modalClose = opts.onClose || null;
  fillIcons($('#modal'));
  const f = $('#modalBody input:not([type=checkbox]):not([type=file]):not([readonly]),#modalBody select'); if (f && !opts.noFocus) f.focus();
  return $('#modal');
}

function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; const f = modalClose; modalClose = null; if (f) f(); }

function confirmBox(msg, onYes, {title = 'Please confirm', ok = 'Confirm', danger = true} = {}) {
  $('#confirmTitle').textContent = title; $('#confirmMsg').textContent = msg;
  const y = $('#confirmYes'); y.textContent = ok; y.className = 'btn ' + (danger ? 'primary' : 'dark');
  $('#confirm').hidden = false; y.focus();
  y.onclick = () => { $('#confirm').hidden = true; onYes(); };
  $('#confirmNo').onclick = () => { $('#confirm').hidden = true; };
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-close]') || e.target.id === 'modal') closeModal();
  if (e.target.id === 'confirm') $('#confirm').hidden = true;
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#confirm').hidden) $('#confirm').hidden = true; else if (!$('#modal').hidden) closeModal();
});

const formVal = (root, sel) => { const el = $(sel, root); return el ? el.value.trim() : ''; };

function fieldErr(input, msg) { input.classList.add('invalid'); input.focus(); toast(msg, 'error'); return false; }

const pwField = (id, ac = 'new-password') => `<span class="pw"><input id="${id}" type="password" autocomplete="${ac}"><button type="button" class="pw-toggle" aria-label="Show password" title="Show password">${icon('eye')}</button></span>`;

/* views react to model events */
ModelEvents.on('notifications:changed', () => updateBell());

ModelEvents.on('cart:itemsRemoved', () => toast('Removed deleted product(s) from the cart.', 'warn'));

ModelEvents.on('sync:error', e => toast('Could not save to the server (' + authMsg(e) + '). KitaKo will keep retrying — keep this page open.', 'error'));


const PALETTE = ['#0B3866','#95F9C3','#2F7BC8','#3CCB8A','#F59E0B','#7DD3FC','#1E9E8F','#A78BFA','#94A3B8','#EA580C'];

function mkChart(id, cfg) {
  const cv = document.getElementById(id); if (!cv) return;
  if (!window.Chart) { cv.parentElement.innerHTML = '<div class="empty"><b>Charts unavailable</b>Chart.js could not load.</div>'; return; }
  const cs = getComputedStyle(document.body), ink = cs.color, grid = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#e6e6e6';
  Chart.defaults.color = ink; Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif"; Chart.defaults.borderColor = grid;
  Object.assign(Chart.defaults.elements.point, {radius: 0, hoverRadius: 5, hitRadius: 12}); Chart.defaults.elements.line.borderWidth = 2.5;
  cfg.options = Object.assign({responsive: true, maintainAspectRatio: false, plugins: {legend: {display: !!cfg.legend, position: 'bottom', labels: {boxWidth: 12}}, tooltip: {callbacks: cfg.money ? {label: c => ' ' + (c.dataset.label ? c.dataset.label + ': ' : '') + money(c.parsed.y ?? c.parsed.x ?? c.parsed)} : {}}}}, cfg.options || {});
  if (cfg.money && cfg.type !== 'doughnut' && cfg.type !== 'pie') {
    const ax = cfg.options.indexAxis === 'y' ? 'x' : 'y';
    const other = ax === 'y' ? 'x' : 'y';
    cfg.options.scales = Object.assign({[other]: {grid: {display: false}}, [ax]: {beginAtZero: true, ticks: {callback: v => S.settings.currency + (v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : v)}}}, cfg.options.scales || {});
  }
  // quieter axes: no axis lines, and no grid lines along the category axis
  if (cfg.type !== 'doughnut' && cfg.type !== 'pie') {
    const sc = cfg.options.scales = cfg.options.scales || {}, cat = cfg.options.indexAxis === 'y' ? 'y' : 'x';
    for (const k of ['x', 'y']) { sc[k] = sc[k] || {}; sc[k].border = {display: false, ...(sc[k].border || {})}; }
    sc[cat].grid = {display: false, ...(sc[cat].grid || {})};
  }
  charts[id] = new Chart(cv, cfg);
}

function receiptHTML(t) {
  const st = S.settings, L = (a, b, cls = '') => `<div class="l ${cls}"><span>${a}</span><span>${b}</span></div>`;
  const ot = {'dine-in': 'Dine-in', takeout: 'Takeout', delivery: 'Delivery'}[t.orderType] || t.orderType;
  return `<div class="receipt">
    <div class="c"><h4>${esc(st.name)}</h4><div class="sm">${esc(st.address)}</div><div class="sm">${esc(st.phone)} · ${esc(st.email)}</div>${st.tin ? `<div class="sm">VAT REG TIN ${esc(st.tin)}</div>` : ''}</div><hr>
    ${L('Receipt No.', esc(t.receipt))}${L('Transaction', esc(t.id))}${L('Date', esc(fmtDT(t.date)))}
    ${st.showCashier !== false ? L('Cashier', esc(t.cashier)) : ''}${L('Order type', esc(ot))}${t.customer ? L('Customer / No.', esc(t.customer)) : ''}<hr>
    ${t.items.map(i => `<div>${esc(i.name)}</div>${L(`&nbsp;&nbsp;${i.qty} x ${fmtNum(i.price)}`, fmtNum(i.price * i.qty))}`).join('')}<hr>
    ${L('Subtotal', fmtNum(t.subtotal))}
    ${t.lessVat ? L(`Less VAT (${st.vatRate}%)`, '-' + fmtNum(t.lessVat)) : ''}
    ${t.discount && t.discount.amount ? L(`Discount: ${esc(t.discount.name)}${t.discount.type === 'percent' || t.discount.type === 'promo' || t.discount.type === 'senior' || t.discount.type === 'pwd' ? ' (' + t.discount.value + '%)' : ''}`, '-' + fmtNum(t.discount.amount)) : ''}
    ${t.discount && t.discount.idNo ? L('ID No.', esc(t.discount.idNo)) : ''}
    ${t.charges ? L(t.orderType === 'delivery' ? 'Delivery fee' : 'Service charge', fmtNum(t.charges)) : ''}
    ${!S.settings.vatInclusive && t.vat ? L(`VAT (${st.vatRate}%)`, fmtNum(t.vat)) : ''}
    ${L('TOTAL', esc(st.currency) + fmtNum(t.total), 'tot')}<hr>
    ${L('Payment', esc(t.method))}${t.ref ? L('Reference', esc(t.ref)) : ''}${L('Amount received', fmtNum(t.received))}${L('Change', fmtNum(t.change))}
    ${st.showVatBreakdown ? `<hr>${L('VATable sales', fmtNum(t.vatable))}${L('VAT amount', fmtNum(t.vat))}${L('VAT-exempt sales', fmtNum(t.vatExempt))}` : ''}
    ${t.notes ? `<hr><div class="sm">Note: ${esc(t.notes)}</div>` : ''}
    <hr><div class="c sm">${esc(st.receiptFooter)}</div>
  </div>`;
}

const framed = (() => { try { return window.top !== window.self; } catch { return true; } })();

const NT = {low: ['Low stock', 'warn', 'alert'], out: ['Out of stock', 'err', 'alert'], sale: ['Sale', 'ok', 'check'], inventory: ['Inventory', 'y', 'box'], product: ['Product', 'y', 'products'], cash: ['Cash register', 'mute', 'cash'], summary: ['Daily summary', 'ok', 'reports'], info: ['System', 'mute', 'info']};

/* ---------- date picker ----------
   Every <input type="date"> opens this calendar instead of the browser's, so it matches the app.
   The input keeps its value (YYYY-MM-DD) and still fires input/change, so pages read it as before;
   typing a date with the keyboard still works. */
const datePicker = {
  el: null, input: null, month: null,
  parse(v) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; },
  open(input) {
    if (input.disabled || input.readOnly) return;
    this.close(); this.input = input;
    const sel = this.parse(input.value) || new Date();
    this.month = new Date(sel.getFullYear(), sel.getMonth(), 1);
    const el = this.el = document.createElement('div');
    el.className = 'dp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Choose a date');
    document.body.appendChild(el);
    this.draw(); this.place();
    (el.querySelector('.dp-day.sel') || el.querySelector('.dp-day.today') || el.querySelector('.dp-day:not(:disabled)'))?.focus();
  },
  draw(focusKey) {
    const el = this.el, inp = this.input, m = this.month, sel = inp.value, today = dayKey(new Date());
    const min = inp.min || '', max = inp.max || '';
    const start = new Date(m.getFullYear(), m.getMonth(), 1 - m.getDay());
    const days = [...Array(42).keys()].map(i => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    const prevOk = !min || dayKey(new Date(m.getFullYear(), m.getMonth(), 0)) >= min;
    const nextOk = !max || dayKey(new Date(m.getFullYear(), m.getMonth() + 1, 1)) <= max;
    el.innerHTML = `<div class="dp-head"><button type="button" class="dp-nav" data-dp="-1" aria-label="Previous month" ${prevOk ? '' : 'disabled'}>${icon('chevL')}</button>
      <b>${m.toLocaleDateString('en-PH', {month: 'long', year: 'numeric'})}</b>
      <button type="button" class="dp-nav next" data-dp="1" aria-label="Next month" ${nextOk ? '' : 'disabled'}>${icon('chevL')}</button></div>
      <div class="dp-grid" role="grid">${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<span class="dp-wd">${d}</span>`).join('')}
      ${days.map(d => { const k = dayKey(d), off = (min && k < min) || (max && k > max);
        return `<button type="button" class="dp-day${d.getMonth() !== m.getMonth() ? ' out' : ''}${k === today ? ' today' : ''}${k === sel ? ' sel' : ''}" data-day="${k}" ${off ? 'disabled' : ''} tabindex="-1" aria-label="${fmtDate(d)}">${d.getDate()}</button>`; }).join('')}</div>
      <div class="dp-foot"><button type="button" class="btn sm ghost" data-dp-clear>Clear</button><button type="button" class="btn sm" data-dp-today ${(min && today < min) || (max && today > max) ? 'disabled' : ''}>Today</button></div>`;
    const f = focusKey && el.querySelector(`[data-day="${focusKey}"]:not(:disabled)`);
    if (f) f.focus();
  },
  place() {
    const r = this.input.getBoundingClientRect(), el = this.el, w = el.offsetWidth, h = el.offsetHeight;
    const below = r.bottom + 6 + h <= innerHeight || r.top - 6 - h < 0;
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    el.style.top = (below ? r.bottom + 6 : r.top - 6 - h) + 'px';
  },
  pick(v) {
    const inp = this.input; inp.value = v;
    inp.dispatchEvent(new Event('input', {bubbles: true})); inp.dispatchEvent(new Event('change', {bubbles: true}));
    this.close(); inp.focus();
  },
  close() { if (this.el) { this.el.remove(); this.el = null; } this.input = null; }
};

document.addEventListener('mousedown', e => {
  const inp = e.target.closest?.('input[type=date]');
  if (inp) { e.preventDefault(); if (datePicker.input === inp) return datePicker.close(); inp.focus(); return datePicker.open(inp); }
  if (datePicker.el && !datePicker.el.contains(e.target)) datePicker.close();
});
document.addEventListener('click', e => {
  const el = datePicker.el; if (!el || !el.contains(e.target)) return;
  const nav = e.target.closest('[data-dp]'), day = e.target.closest('[data-day]');
  if (nav && !nav.disabled) { datePicker.month.setMonth(datePicker.month.getMonth() + +nav.dataset.dp); datePicker.draw(); datePicker.place(); }
  else if (day && !day.disabled) datePicker.pick(day.dataset.day);
  else if (e.target.closest('[data-dp-today]')) datePicker.pick(dayKey(new Date()));
  else if (e.target.closest('[data-dp-clear]')) datePicker.pick('');
});
document.addEventListener('keydown', e => {
  const inp = e.target.closest?.('input[type=date]');
  if (inp && !datePicker.el && (e.key === 'ArrowDown' && e.altKey || e.key === 'F4')) { e.preventDefault(); return datePicker.open(inp); }
  const el = datePicker.el; if (!el) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); const i = datePicker.input; datePicker.close(); return i?.focus(); }
  const cur = e.target.closest?.('.dp-day'); if (!cur || !el.contains(cur)) return;
  const step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7}[e.key];
  if (!step) return;
  e.preventDefault();
  const d = datePicker.parse(cur.dataset.day); d.setDate(d.getDate() + step); const k = dayKey(d);
  if (!el.querySelector(`[data-day="${k}"]:not(.out)`)) { datePicker.month = new Date(d.getFullYear(), d.getMonth(), 1); datePicker.draw(k); datePicker.place(); }
  else el.querySelector(`[data-day="${k}"]`)?.focus();
}, true);
addEventListener('resize', () => datePicker.close());
document.addEventListener('scroll', e => { if (datePicker.el && !datePicker.el.contains(e.target)) datePicker.close(); }, true);

/* ---------- dropdown list ----------
   Clicking a <select> opens this list instead of the browser's, so options match the app.
   The <select> stays the source of truth (pages read/set .value as before) and still fires change.
   Touch screens keep the phone's own picker, which is easier to use with a thumb. */
const selectList = {
  el: null, select: null,
  touch: () => matchMedia('(pointer: coarse)').matches,
  open(sel) {
    if (sel.disabled || sel.multiple || this.touch()) return false;
    this.close(); this.select = sel;
    const el = this.el = document.createElement('div');
    el.className = 'sl'; el.setAttribute('role', 'listbox'); el.tabIndex = -1;
    el.innerHTML = [...sel.options].map((o, i) => `<button type="button" role="option" class="sl-opt${o.selected ? ' sel' : ''}" data-i="${i}" ${o.disabled ? 'disabled' : ''} aria-selected="${o.selected}" tabindex="-1">
      <span>${esc(o.textContent)}</span>${o.selected ? icon('check') : ''}</button>`).join('');
    document.body.appendChild(el);
    const r = sel.getBoundingClientRect();
    el.style.minWidth = r.width + 'px';
    const h = el.offsetHeight, w = el.offsetWidth, below = r.bottom + 6 + h <= innerHeight || r.top - 6 - h < 0;
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    el.style.top = (below ? r.bottom + 6 : Math.max(8, r.top - 6 - h)) + 'px';
    sel.classList.add('sl-open');
    const cur = el.querySelector('.sl-opt.sel') || el.querySelector('.sl-opt:not(:disabled)');
    if (cur) { cur.focus({preventScroll: true}); cur.scrollIntoView({block: 'nearest'}); }
    return true;
  },
  pick(i) {
    const sel = this.select; this.close(); sel.focus();
    if (sel.selectedIndex === +i) return;
    sel.selectedIndex = +i;
    sel.dispatchEvent(new Event('input', {bubbles: true})); sel.dispatchEvent(new Event('change', {bubbles: true}));
  },
  close() { if (this.el) { this.el.remove(); this.el = null; } this.select?.classList.remove('sl-open'); this.select = null; }
};

document.addEventListener('mousedown', e => {
  const sel = e.target.closest?.('select');
  if (sel && !selectList.touch()) { e.preventDefault(); if (selectList.select === sel) return selectList.close(); sel.focus(); selectList.open(sel); return; }
  if (selectList.el && !selectList.el.contains(e.target)) selectList.close();
});
document.addEventListener('click', e => {
  const o = selectList.el && e.target.closest('.sl-opt');
  if (o && selectList.el.contains(o) && !o.disabled) selectList.pick(o.dataset.i);
});
document.addEventListener('keydown', e => {
  const sel = e.target.closest?.('select');
  if (sel && !selectList.el && (e.key === 'Enter' || e.key === ' ' || (e.altKey && e.key === 'ArrowDown') || e.key === 'F4')) {
    if (selectList.open(sel)) e.preventDefault();
    return;
  }
  const el = selectList.el; if (!el) return;
  if (e.key === 'Escape' || e.key === 'Tab') { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } const s = selectList.select; selectList.close(); if (e.key === 'Escape') s?.focus(); return; }
  const opts = [...el.querySelectorAll('.sl-opt:not(:disabled)')], at = opts.indexOf(document.activeElement);
  let next = null;
  if (e.key === 'ArrowDown') next = opts[Math.min(at + 1, opts.length - 1)];
  else if (e.key === 'ArrowUp') next = opts[Math.max(at - 1, 0)];
  else if (e.key === 'Home') next = opts[0];
  else if (e.key === 'End') next = opts[opts.length - 1];
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (at >= 0) selectList.pick(opts[at].dataset.i); return; }
  else if (e.key.length === 1 && /\S/.test(e.key)) {   // jump to the next option starting with that letter
    const k = e.key.toLowerCase(), list = [...opts.slice(at + 1), ...opts.slice(0, at + 1)];
    next = list.find(o => o.textContent.trim().toLowerCase().startsWith(k));
  }
  if (next) { e.preventDefault(); next.focus(); next.scrollIntoView({block: 'nearest'}); }
}, true);
addEventListener('resize', () => selectList.close());
document.addEventListener('scroll', e => { if (selectList.el && !selectList.el.contains(e.target)) selectList.close(); }, true);
