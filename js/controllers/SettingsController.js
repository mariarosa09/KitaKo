/* KitaKo — CONTROLLER · Settings: handles user actions, updates models, renders SettingsView. */
'use strict';

const setUI = {tab: 'info'};

const SET_TABS = [['info', 'Business information', 'register'], ['finance', 'Financial & receipts', 'cash'], ['profile', 'Profile & security', 'user'], ['staff', 'Business account & staff', 'lock'], ['notifs', 'Notifications', 'bell']];

const NOTIF_PREFS = [['low', 'Low-stock alerts', 'When a product reaches its minimum stock level'], ['out', 'Out-of-stock alerts', 'When a product runs out'],
  ['sale', 'Completed sales', 'One notice per finished transaction'], ['inventory', 'Inventory adjustments', 'Stock added, deducted or corrected by hand'],
  ['product', 'Product updates', 'Products added, edited, deleted or made unavailable'], ['cash', 'Cash register', 'Shifts opened/closed, cash movements and reconciliation reminders'],
  ['summary', 'Daily sales summaries', 'Yesterday’s total when you log in'], ['info', 'Account & system', 'Business mode, staff and password changes']];

RENDER.config = el => {
  const st = S.settings, u = user(), biz = business(), owner = isOwner();
  const staff = S.users.filter(x => x.bizId === biz.id);
  const tabs = unlocked() ? SET_TABS : SET_TABS.filter(t => t[0] === 'profile');
  if (!tabs.some(t => t[0] === setUI.tab)) setUI.tab = tabs[0][0];
  el.innerHTML = SettingsView.page({biz, owner, st, staff, tabs, u});
  $('#sCur').value = st.currencyCode + '|' + st.currency;
  const showTab = () => { $$('[data-stab]', el).forEach(c => { c.hidden = c.dataset.stab !== setUI.tab; }); $$('[data-stab-btn]', el).forEach(b => b.classList.toggle('active', b.dataset.stabBtn === setUI.tab)); };
  // one button: label shows what it will do next, and follows the individual switches
  const prefBoxes = () => $$('[data-npref]', el);
  const syncToggle = () => { const allOn = prefBoxes().every(c => c.checked); const b = $('#npToggle'); b.textContent = allOn ? 'Turn all off' : 'Turn all on'; b.dataset.next = allOn ? 'off' : 'on'; };
  $('#npToggle').onclick = () => { const on = $('#npToggle').dataset.next === 'on'; prefBoxes().forEach(c => { c.checked = on; }); syncToggle(); };
  $('#sNotif').addEventListener('change', e => { if (e.target.matches('[data-npref]')) syncToggle(); });
  syncToggle();
  $('#sNotif').onsubmit = e => { e.preventDefault(); st.notify = Object.fromEntries($$('[data-npref]', el).map(c => [c.dataset.npref, c.checked])); save('settings');
    const off = Object.values(st.notify).filter(x => !x).length; toast(off ? `Saved. ${off} notification type${off === 1 ? ' is' : 's are'} turned off.` : 'Saved. All notifications are on.', 'success'); };
  $('#stabs').onclick = e => { const b = e.target.closest('[data-stab-btn]'); if (b) { setUI.tab = b.dataset.stabBtn; showTab(); } };
  showTab();
  el.querySelectorAll('[data-edstaff]').forEach(b => b.onclick = () => staffForm(S.users.find(y => y.id === b.dataset.edstaff)));
  $('#sInfo').onsubmit = e => { e.preventDefault(); const n = $('#sName').value.trim(), a = $('#sAddr').value.trim(), em = $('#sEmail').value.trim();
    if (!n) return fieldErr($('#sName'), 'Business name is required.'); if (!a) return fieldErr($('#sAddr'), 'Address is required.');
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return fieldErr($('#sEmail'), 'Enter a valid email.');
    Object.assign(st, {name: n, address: a, phone: $('#sPhone').value.trim(), email: em, tin: $('#sTin').value.trim()}); biz.name = n; save('settings', 'businesses'); refreshProfile(); toast('Business information saved.', 'success'); };
  $('#copyBiz').onclick = async () => { try { await navigator.clipboard.writeText(biz.username); toast('Business username copied.', 'success'); } catch { $('#bizUname').select(); toast('Press Ctrl+C to copy.', 'warn'); } };
  if (owner) $('#sBizPw').onsubmit = e => { e.preventDefault();
    if ($('#bp1').value.length < 6) return fieldErr($('#bp1'), 'Business password must be at least 6 characters.');
    if ($('#bp1').value !== $('#bp2').value) return fieldErr($('#bp2'), 'Passwords do not match.');
    busy(e.submitter, async () => { const {error} = await sb.rpc('set_business_password', {p_password: $('#bp1').value});
      if (error) return toast(authMsg(error), 'error');
      e.target.reset(); notify('info', 'Business password changed', `${u.fullname} changed the business password.`); toast('Business password updated.', 'success'); }); };
  el.querySelectorAll('[data-rmstaff]').forEach(b => b.onclick = () => { const x = S.users.find(y => y.id === b.dataset.rmstaff);
    confirmBox(`Remove ${x.fullname} from ${biz.name}? They can no longer open this business. Their login stays, and past sales keep their name.`, async () => {
      const {error} = await sb.rpc('remove_staff', {p_user: x.id}); if (error) return toast(authMsg(error), 'error');
      S.users = S.users.filter(y => y !== x); rerender(); toast(x.fullname + ' removed.', 'success'); }, {ok: 'Remove cashier'}); });
  $('#sFin').onsubmit = e => { e.preventDefault();
    const vat = num($('#sVat').value), svc = num($('#sSvc').value), del = num($('#sDel').value), stat = num($('#sStat').value), low = num($('#sLow').value);
    if (!(vat >= 0 && vat <= 100)) return fieldErr($('#sVat'), 'VAT must be between 0 and 100.');
    if (!(svc >= 0 && svc <= 100)) return fieldErr($('#sSvc'), 'Service charge must be between 0 and 100.');
    if (!(del >= 0)) return fieldErr($('#sDel'), 'Delivery fee cannot be negative.');
    if (!(stat >= 0 && stat <= 100)) return fieldErr($('#sStat'), 'Rate must be between 0 and 100.');
    if (!(low >= 0) || !Number.isInteger(low)) return fieldErr($('#sLow'), 'Enter a whole number.');
    const [code, sym] = $('#sCur').value.split('|');
    Object.assign(st, {currencyCode: code, currency: sym, vatRate: vat, vatInclusive: $('#sIncl').checked, serviceCharge: svc, deliveryFee: del, statRate: stat, statVatExempt: $('#sExempt').checked, defaultDiscountId: $('#sDefD').value, lowStockDefault: low, receiptFooter: $('#sFoot').value.trim(), showVatBreakdown: $('#sVatB').checked, showCashier: $('#sCash').checked});
    save('settings'); toast('Settings saved. New orders use the updated rates.', 'success'); };
  $('#sProf').onsubmit = e => { e.preventDefault(); const n = $('#uName').value.trim(), un = $('#uUser').value.trim(), em = $('#uEmail').value.trim(), btn = e.submitter;
    if (!n) return fieldErr($('#uName'), 'Full name is required.');
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(un)) return fieldErr($('#uUser'), 'Username must be 3–20 letters, numbers, dots or underscores.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return fieldErr($('#uEmail'), 'Enter a valid email.');
    busy(btn, async () => {
      if (n !== u.fullname || un !== u.username) {
        const {error} = await sb.from('profiles').update({fullname: n, username: un}).eq('id', u.id);
        if (error) return error.code === '23505' ? fieldErr($('#uUser'), 'That username is taken.') : toast(authMsg(error), 'error');
        Object.assign(u, {fullname: n, username: un}); refreshProfile();
      }
      if (em.toLowerCase() !== u.email.toLowerCase()) await changeEmail(u, em, () => rerender()); else toast('Profile updated.', 'success');
    }); };
  $('#sLogout').onclick = logout;
  $('#sPw').onsubmit = e => { e.preventDefault(); const first = !u.pass; busy(e.submitter, () => changePassword(u, $('#pw0') || {}, $('#pw1'), $('#pw2'), () => { if (first) rerender(); else e.target.reset(); })); };
};

/* owner: edit a cashier's name and username (cashiers manage their own email and password) */
function staffForm(x) {
  openModal('Edit cashier', SettingsView.staffFormModal({x}), SettingsView.staffFormButtons());
  $('#stf').onsubmit = e => { e.preventDefault(); $('#stSave').click(); };
  $('#stSave').onclick = () => busy($('#stSave'), async () => {
    const n = $('#stName').value.trim(), un = $('#stUser').value.trim();
    const err = m => { $('#stErr').textContent = m; };
    if (!n) return err('Full name is required.');
    if (!USER_RE.test(un)) return err('Username must be 3–20 letters, numbers, dots or underscores.');
    const {error} = await sb.from('profiles').update({fullname: n, username: un}).eq('id', x.id);
    if (error) return err(error.code === '23505' ? 'That username is taken.' : authMsg(error));
    Object.assign(x, {fullname: n, username: un});
    closeModal(); setUI.tab = 'staff'; rerender(); toast('Cashier updated.', 'success');
  });
}
