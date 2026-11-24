/* KitaKo — VIEW · Settings: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const SettingsView = {
  page({biz, owner, st, staff, tabs, u}) {
    return `<nav class="stabs" id="stabs" aria-label="Settings sections">${tabs.map(([k, l, i]) => `<button class="stab ${setUI.tab === k ? 'active' : ''}" data-stab-btn="${k}">${icon(i)}${l}</button>`).join('')}</nav>
  <div class="set-wrap">
    <div class="card" data-stab="info"><h3>Business information</h3><form class="form" id="sInfo">
      <label>Business name *<input id="sName" value="${esc(st.name)}"></label><label>Address *<input id="sAddr" value="${esc(st.address)}"></label>
      <div class="grid2"><label>Contact number<input id="sPhone" value="${esc(st.phone)}"></label><label>Email address<input id="sEmail" type="email" value="${esc(st.email)}"></label></div>
      <label>VAT Reg. TIN (printed on receipts)<input id="sTin" value="${esc(st.tin || '')}"></label>
      <button class="btn primary" type="submit">Save information</button></form></div>
    <div class="card" data-stab="finance"><h3>Financial &amp; receipt settings</h3><form class="form" id="sFin">
      <div class="grid2"><label>Currency<select id="sCur"><option value="PHP|₱">Philippine Peso (₱)</option><option value="USD|$">US Dollar ($)</option></select></label>
        <label>VAT rate (%)<input id="sVat" type="number" min="0" max="100" step="0.01" value="${esc(st.vatRate)}"></label></div>
      <label class="check"><input type="checkbox" id="sIncl" ${st.vatInclusive ? 'checked' : ''}> Menu prices already include VAT</label>
      <div class="grid2"><label>Dine-in service charge (%)<input id="sSvc" type="number" min="0" max="100" step="0.01" value="${esc(st.serviceCharge)}"></label>
        <label>Delivery fee (${esc(st.currency)})<input id="sDel" type="number" min="0" step="0.01" value="${esc(st.deliveryFee)}"></label></div>
      <div class="grid2"><label>Senior/PWD default rate (%)<input id="sStat" type="number" min="0" max="100" step="0.01" value="${esc(st.statRate)}"></label>
        <label>Default discount at checkout<select id="sDefD"><option value="">None</option>${S.discounts.map(d => `<option value="${esc(d.id)}" ${d.id === st.defaultDiscountId ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label></div>
      <label class="check"><input type="checkbox" id="sExempt" ${st.statVatExempt ? 'checked' : ''}> Senior Citizen &amp; PWD sales are VAT-exempt</label>
      <label>Default minimum stock for new products<input id="sLow" type="number" min="0" step="1" value="${esc(st.lowStockDefault)}"></label>
      <label>Receipt footer message<input id="sFoot" value="${esc(st.receiptFooter)}" maxlength="120"></label>
      <label class="check"><input type="checkbox" id="sVatB" ${st.showVatBreakdown ? 'checked' : ''}> Show VAT breakdown on receipts</label>
      <label class="check"><input type="checkbox" id="sCash" ${st.showCashier !== false ? 'checked' : ''}> Show cashier name on receipts</label>
      <button class="btn primary" type="submit">Save settings</button></form></div>
    <div class="two-col" data-stab="profile"><div class="card" id="profileCard"><h3>Profile</h3><form class="form" id="sProf">
      <label>Full name *<input id="uName" value="${esc(u.fullname)}"></label>
      <label>Username *<input id="uUser" value="${esc(u.username)}"></label>
      <label>Email *<input id="uEmail" type="email" value="${esc(u.email)}"></label>
      <p class="hint">Changing your email sends a code to the new address.</p>
      <p class="hint">Role: ${owner ? 'Business owner' : 'Cashier'} · ${esc(biz.name)} · signs in with ${u.pass ? 'password' : ''}${u.pass && u.google ? ' or ' : ''}${u.google ? 'Google' : ''} · member since ${fmtDate(u.created)}</p><button class="btn primary" type="submit">Save profile</button></form></div>
      <div class="card"><h3>${u.pass ? 'Change password' : 'Set a password'}</h3><form class="form" id="sPw">
      ${u.pass ? `<label>Current password${pwField('pw0', 'current-password')}</label>` : '<p class="hint">You sign in with Google. Set a password to also log in with your username.</p>'}
      <div class="grid2"><label>New password${pwField('pw1')}</label><label>Confirm new password${pwField('pw2')}</label></div>
      <div class="row"><button class="btn dark" type="submit">${u.pass ? 'Change' : 'Set'} password</button></div></form></div></div>
    <div class="card" data-stab="notifs"><div class="card-head"><h3>Notification preferences</h3><button class="btn sm" type="button" id="npToggle" aria-live="polite"></button></div>
      <form class="form" id="sNotif"><p class="hint" style="margin:0">Choose which events appear in Notifications for ${esc(biz.name)}. Turning one off stops new notices of that kind; existing ones stay.</p>
      <div class="notif-prefs">${NOTIF_PREFS.map(([k, l, d]) => `<label class="pref"><input type="checkbox" class="switch" data-npref="${k}" ${st.notify?.[k] !== false ? 'checked' : ''}><span><b>${l}</b><span class="hint">${d}</span></span></label>`).join('')}</div>
      <div><button class="btn primary" type="submit">Save notification settings</button></div></form></div>
    <div class="card" data-stab="staff"><h3>Business account</h3><div class="form">
      <label>Business username (cashiers use this to join)<span class="copy-field"><input id="bizUname" value="${esc(biz.username)}" readonly><button class="btn" type="button" id="copyBiz">${icon('copy')}Copy</button></span></label>
      ${owner ? `<form class="form" id="sBizPw"><div class="section-title">Change business password</div><p class="hint">Cashiers enter this password to open business mode.</p>
        <div class="grid2"><label>New business password${pwField('bp1')}</label><label>Confirm${pwField('bp2')}</label></div><button class="btn dark" type="submit">${icon('lock')}Update business password</button></form>`
        : '<div class="note">You are in business mode as a cashier. Use “Exit business mode” in the menu when you are done.</div>'}
      <div class="section-title">Staff (${staff.length})</div>${owner ? '<p class="hint" style="margin:0">To add a cashier, have them choose <b>Create account → Cashier</b>, then join with the business username above.</p>' : ''}
      <div class="list">${staff.map(x => `<div class="list-item"><span class="avatar">${esc(x.fullname.slice(0, 1).toUpperCase())}</span><div style="flex:1"><b>${esc(x.fullname)}</b>${x.id === u.id ? ' <span class="hint">(you)</span>' : ''}<div class="meta">${esc(x.username)} · ${esc(x.email)}</div></div>
        <span class="pill ${x.role === 'owner' ? 'ok' : 'mute'}">${x.role === 'owner' ? 'Owner' : 'Cashier'}</span>${owner && x.role === 'cashier' ? `<button class="btn sm" data-edstaff="${esc(x.id)}">${icon('edit')}Edit</button><button class="btn sm danger" data-rmstaff="${esc(x.id)}" aria-label="Remove">${icon('trash')}</button>` : ''}</div>`).join('')}</div></div></div>
</div>`;
  },

  staffFormButtons() {
    return `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="stSave">Save changes</button>`;
  },

  staffFormModal({x}) {
    return `<form class="form" id="stf" novalidate>
      <label>Full name *<input id="stName" value="${esc(x.fullname)}"></label>
      <label>Username *<input id="stUser" value="${esc(x.username)}" autocomplete="off"></label>
      <p class="hint">Email: ${esc(x.email)}. Cashiers change their own email and password in Settings, or with “Forgot password?” on the login screen.</p>
      <p class="form-error" id="stErr"></p></form>`;
  }
};
