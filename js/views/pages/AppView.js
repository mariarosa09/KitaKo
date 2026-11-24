/* KitaKo — VIEW · App: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const AppView = {
  nav({open, owner}) {
    return PAGES.filter(p => canAccess(p[0])).map(([k, l]) => `<button class="nav-item ${k === current ? 'active' : ''}" data-page="${k}" title="${l}">${icon(k)}<span>${l}</span>${k === 'notifications' ? '<span class="count" hidden></span>' : ''}</button>`).join('')
    + (owner ? '' : open ? `<button class="nav-item mode" id="lockBtn" title="Exit business mode">${icon('lock')}<span>Exit business mode</span></button>` : `<button class="nav-item mode" id="unlockBtn" title="Business mode">${icon('unlock')}<span>Business mode</span></button>`);
  },

  businessModeModal({b}) {
    return `<form class="form" id="bmForm"><div class="lock-hero">${icon('lock')}<b>${esc(b.name)}</b>
      <p class="hint">Enter the business password to open the dashboard, products, inventory, transactions, reports and settings.</p></div>
    <label>Business password${pwField('bmPass', 'off')}</label><p class="form-error" id="bmErr" role="alert"></p></form>`;
  },

  accountModalButtons() {
    return `<button class="btn danger" id="amOut">${icon('logout')}Logout</button><span class="spacer"></span><button class="btn ghost" data-close>Close</button>`;
  },

  accountModal({b, u}) {
    return `<dl class="kv"><dt>Name</dt><dd>${esc(u.fullname)}</dd><dt>Username</dt><dd>${esc(u.username)}</dd><dt>Email</dt><dd>${esc(u.email)}</dd>
      <dt>Role</dt><dd>${u.role === 'owner' ? 'Business owner' : 'Cashier'}</dd><dt>Business</dt><dd>${esc(b.name)}</dd><dt>Sign-in</dt><dd>${u.pass ? 'Password' : ''}${u.pass && u.google ? ' + ' : ''}${u.google ? 'Google' : ''}</dd></dl>
    <form class="form" id="amEm" style="margin-top:16px"><div class="section-title">Change email</div>
      <label>New email<input id="amEmail" type="email" value="${esc(u.email)}"></label><button class="btn" type="submit">Send verification code</button></form>
    <form class="form" id="amPw" style="margin-top:16px"><div class="section-title">${u.pass ? 'Change password' : 'Set a password'}</div>
      ${u.pass ? `<label>Current password${pwField('am0', 'current-password')}</label>` : ''}
      <label>New password${pwField('am1')}</label><label>Confirm new password${pwField('am2')}</label>
      <button class="btn dark" type="submit">Verify &amp; save password</button></form>`;
  }
};
