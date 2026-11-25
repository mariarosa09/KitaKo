/* KitaKo — CONTROLLER · App: handles user actions, updates models, renders AppView. */
'use strict';

const PAGES = [
  ['dashboard','Dashboard'],['pos','Point of Sale'],['products','Products'],['inventory','Inventory'],['transactions','Transaction History'],
  ['receipts','Digital Receipts'],['reports','Sales Reports'],['discounts','Discounts and Promotions'],['register','Cash Register'],['notifications','Notifications'],['config','Settings']
];

// sidebar sections (the label is left out for the first group)
const NAV_GROUPS = [['', ['dashboard']], ['Selling', ['pos', 'transactions', 'receipts', 'register']], ['Catalog', ['products', 'inventory', 'discounts']], ['Insights', ['reports', 'notifications']], ['', ['config']]];

const RENDER = {};

let current = 'pos';

const charts = {};

function startApp(fresh, msg) {
  const u = user(); if (!u) return showAuth();
  if (!u.bizId) return showBizStep();
  if (BIZ !== u.bizId) return afterAuth(msg, fresh);
  $('#boot').hidden = true; $('#auth').hidden = true; $('#app').hidden = false;
  buildNav(); refreshProfile(); updateBell();
  if (fresh) loginChecks(msg);
  const h = location.hash.slice(1);
  go(PAGES.some(p => p[0] === h) && canAccess(h) ? h : unlocked() ? 'dashboard' : 'pos', true);
}

function buildNav() {
  const owner = isOwner(), open = unlocked();
  $('#nav').innerHTML = AppView.nav({open, owner});
  $('#roleTag').textContent = owner ? 'Business owner' : open ? 'Cashier · business mode' : 'Cashier';
  $('#bellBtn').hidden = !open;
  updateBell();
}

function businessMode(target, after) {
  const b = business();
  openModal('Business mode', AppView.businessModeModal({b}),
    `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="bmGo">${icon('unlock')}Unlock</button>`, {small: true});
  $('#bmForm').onsubmit = e => { e.preventDefault(); $('#bmGo').click(); };
  $('#bmGo').onclick = () => busy($('#bmGo'), async () => {
    const {data: ok, error} = await sb.rpc('check_business_password', {p_password: $('#bmPass').value});
    if (error) { $('#bmErr').textContent = authMsg(error); return; }
    if (!ok) { $('#bmErr').textContent = 'Incorrect business password.'; $('#bmPass').value = ''; $('#bmPass').focus(); return; }
    session.unlock(user().id);
    notify('info', 'Business mode opened', `${user().fullname} opened business mode.`);
    closeModal(); buildNav(); toast('Business mode unlocked.', 'success');
    if (after) after(); else go(target && target !== 'pos' ? target : 'dashboard');
  });
}

function lockBusiness() { session.lock(); current = 'pos'; buildNav(); go('pos'); toast('Back to cashier mode. Business screens are locked.'); }

function refreshProfile() { const u = user(); if (!u) return;
  const b = business(); if (b) { $('#brandName').textContent = b.name; $('#brandMark').title = b.name; document.title = b.name + ' · KitaKo'; } $('#profileName').textContent = u.fullname; $('#avatar').textContent = u.fullname.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

function loginChecks(msg) {
  // daily summary for yesterday (once), and reminder for a shift left open from an earlier day
  const y = dayKey(addDays(new Date(), -1));
  if (S.meta.lastSummary !== y) {
    const tx = S.txns.filter(t => dayKey(t.date) === y);
    if (tx.length) notify('summary', 'Daily sales summary', `${fmtDate(addDays(new Date(), -1))}: ${money(sum(tx, t => t.total))} from ${tx.length} transactions.`, true);
    S.meta.lastSummary = y; save('meta');
  }
  const cur = S.register.current;
  if (cur && dayKey(cur.openedAt) !== dayKey(new Date())) notify('cash', 'Cash reconciliation reminder', `The shift opened ${fmtDT(cur.openedAt)} is still open. Count the drawer and close it.`, true);
  save('notifs'); updateBell();
  toast(msg || 'Welcome, ' + user().fullname + '!', 'success');
}

function go(page, replace) {
  if (!RENDER[page]) page = 'pos';
  if (!canAccess(page)) {
    businessMode(page);
    if ($('#content').children.length && canAccess(current)) { try { history.replaceState(null, '', '#' + current); } catch {} return; }
    page = 'pos';
  }
  current = page;
  $$('#nav .nav-item[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  if (page === 'config' && !unlocked()) setUI.tab = 'profile';
  $('#pageTitle').textContent = PAGES.find(p => p[0] === page)[1];
  Object.values(charts).forEach(c => c.destroy()); for (const k in charts) delete charts[k];
  $('#app').classList.remove('nav-open');
  if (location.hash.slice(1) !== page) { try { history[replace ? 'replaceState' : 'pushState'](null, '', '#' + page); } catch { location.hash = page; } }
  RENDER[page]($('#content'));
  fillIcons($('#content'));
  $('#content').scrollTop = 0; window.scrollTo(0, 0);
}

const rerender = () => { if (!$('#app').hidden) go(current, true); };

window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (user() && !$('#app').hidden && h !== current && RENDER[h]) go(h, true); });

document.addEventListener('click', e => { if (e.target.closest('#unlockBtn')) businessMode(); if (e.target.closest('#lockBtn')) lockBusiness(); });

$('#nav').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b) go(b.dataset.page); });

document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { e.preventDefault(); go(b.dataset.go); } });

$('#menuBtn').addEventListener('click', () => $('#app').classList.toggle('nav-open'));

$('#scrim').addEventListener('click', () => $('#app').classList.remove('nav-open'));

$('#bellBtn').addEventListener('click', () => go('notifications'));

$('#profileBtn').addEventListener('click', () => { setUI.tab = 'profile'; go('config'); });

/* collapsible sidebar (remembered in this browser) */
const navPref = {get() { try { return localStorage.getItem(GP + 'navCollapsed') === '1'; } catch { return false; } }, set(v) { try { localStorage.setItem(GP + 'navCollapsed', v ? '1' : '0'); } catch {} }};

function applyCollapse(c) {
  $('#app').classList.toggle('collapsed', c);
  const b = $('#collapseBtn'); b.innerHTML = icon(c ? 'panelOpen' : 'panelClose'); b.setAttribute('aria-label', c ? 'Expand sidebar' : 'Collapse sidebar'); b.title = b.getAttribute('aria-label');
  Object.values(charts).forEach(ch => setTimeout(() => ch.resize(), 220));
}

$('#collapseBtn').addEventListener('click', () => { const c = !$('#app').classList.contains('collapsed'); navPref.set(c); applyCollapse(c); });

function accountModal() {
  const u = user(), b = business();
  openModal('My account', AppView.accountModal({b, u}),
    AppView.accountModalButtons(), {noFocus: true});
  $('#amOut').onclick = () => { closeModal(); logout(); };
  $('#amEm').onsubmit = e => { e.preventDefault(); if ($('#amEmail').value.trim().toLowerCase() === u.email) return toast('That is already your email.', 'warn'); changeEmail(u, $('#amEmail').value, refreshProfile); };
  $('#amPw').onsubmit = e => { e.preventDefault(); busy(e.submitter, () => changePassword(u, $('#am0') || {}, $('#am1'), $('#am2'))); };
}

$('#logoutBtn').addEventListener('click', logout);

function logout() {
  confirmBox('Log out of KitaKo? Items in the current cart stay saved on this device for next time.', async () => {
    await signOutCloud(); leaveApp();
    showAuth(); toast('You have been logged out.');
  }, {title: 'Log out', ok: 'Log out'});
}

function leaveApp() {
  Object.values(charts).forEach(c => c.destroy()); for (const k in charts) delete charts[k]; current = 'pos'; $('#content').innerHTML = '';
  try { history.replaceState(null, '', location.pathname + location.search); } catch { location.hash = ''; }
}

/* another device changed this business's data: refresh what is on screen, unless the person is typing or a dialog is open */
let remotePending = false;
function refreshFromRemote() {
  if ($('#app').hidden) return;
  updateBell();
  const a = document.activeElement, typing = a && a.matches('input, textarea, select') && $('#content').contains(a);
  if (!$('#modal').hidden || !$('#confirm').hidden || typing) { remotePending = true; return; }
  remotePending = false; refreshProfile(); rerender();
}
ModelEvents.on('data:remote', refreshFromRemote);
setInterval(() => { if (remotePending) refreshFromRemote(); }, 3000);

function tick() { const c = $('#clock'); if (c) c.textContent = new Date().toLocaleString('en-PH', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit'}); }
