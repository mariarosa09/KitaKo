/* KitaKo — CONTROLLER · Auth: handles user actions, updates models, renders AuthView. */
'use strict';

let googlePending = null;

// {name, email} while finishing a Google sign-up
function showAuth() {
  $('#app').hidden = true; $('#auth').hidden = false; $('#authMain').hidden = false; $('#bizStep').hidden = true;
  authTab('login'); $('#loginError').textContent = ''; $('#loginUser').focus();
}

function authTab(which) {
  $$('[data-auth-tab]').forEach(b => b.classList.toggle('active', b.dataset.authTab === which));
  $('#loginForm').hidden = which !== 'login'; $('#registerForm').hidden = which !== 'register';
  $('#googleLbl').textContent = which === 'login' ? 'Continue with Google' : 'Sign up with Google';
  if (which === 'login') cancelGoogle();
}

$$('[data-auth-tab]').forEach(b => b.addEventListener('click', () => authTab(b.dataset.authTab)));

document.addEventListener('click', e => {
  const t = e.target.closest('.pw-toggle'); if (!t) return;
  const inp = t.parentElement.querySelector('input'), show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  t.innerHTML = icon(show ? 'eyeOff' : 'eye');
  t.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); t.title = show ? 'Hide password' : 'Show password';
});

document.addEventListener('input', e => e.target.classList?.remove('invalid'));

$('#inboxClose').addEventListener('click', () => { $('#inbox').hidden = true; });

function verifyEmail({email, purpose, title = 'Verify your email', intro = '', onVerified, onCancel}) {
  sendOtp(email, purpose);
  let done = false;
  openModal(title, AuthView.verifyEmailModal({email, intro}),
    `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="otpGo">Verify</button>`,
    {small: true, onClose: () => { clearInterval(timer); if (!done) { delete OTP[email + '|' + purpose]; onCancel && onCancel(); } }});
  const tick = () => { const o = OTP[email + '|' + purpose], el = $('#otpTimer'), rb = $('#otpResend'); if (!el) return;
    const wait = o ? Math.ceil((o.sent + OTP_COOLDOWN - Date.now()) / 1000) : 0;
    rb.disabled = wait > 0; rb.style.opacity = wait > 0 ? .45 : 1; el.textContent = wait > 0 ? `Resend available in ${wait}s` : 'Didn’t get it?'; };
  const timer = setInterval(tick, 1000); tick();
  $('#otpCode').oninput = e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); $('#otpErr').textContent = ''; };
  $('#otpResend').onclick = () => { sendOtp(email, purpose); $('#otpErr').textContent = ''; $('#otpCode').value = ''; tick(); toast('A new code was sent to ' + email + '.'); };
  $('#otpForm').onsubmit = e => { e.preventDefault(); $('#otpGo').click(); };
  $('#otpGo').onclick = () => {
    const err = checkOtp(email, purpose, $('#otpCode').value.trim());
    if (err) { $('#otpErr').textContent = err; $('#otpCode').select(); return; }
    done = true; closeModal(); $('#inbox').hidden = true; onVerified();
  };
}

/* ---------- sign in / sign up ---------- */
function resetFilters() {
  Object.assign(posUI, {q: '', cat: 'all', edit: false}); Object.assign(prodUI, {q: '', cat: 'all', avail: 'all'}); Object.assign(invUI, {q: '', cat: 'all', status: 'all'});
  Object.assign(txUI, {q: '', from: '', to: '', method: 'all', type: 'all'}); Object.assign(rcUI, {q: '', sel: null}); ntUI.f = 'all'; setUI.tab = 'info';
}

function signIn(u, remember, msg) {
  session.lock(); session.set(u.id, remember); resetFilters();
  if (!u.bizId || !S.businesses.some(b => b.id === u.bizId)) { u.bizId = null; return showBizStep(); }
  loadBiz(u.bizId);
  startApp(true, msg);
}

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('#loginUser').value.trim().toLowerCase(), pw = $('#loginPass').value, err = $('#loginError');
  if (!id || !pw) { err.textContent = 'Enter your username or email and password.'; return; }
  const u = S.users.find(x => x.username.toLowerCase() === id || x.email.toLowerCase() === id);
  if (u && !u.pass) { err.textContent = 'This account signs in with Google. Use “Continue with Google”.'; return; }
  if (!u || u.pass !== hash(pw)) { err.textContent = 'Incorrect username/email or password.'; $('#loginPass').value = ''; return; }
  err.textContent = ''; $('#loginPass').value = '';
  signIn(u, $('#rememberMe').checked);
});

/* Google sign-in — simulated: a frontend-only prototype cannot talk to Google without a server and client ID. */
$('#googleBtn').addEventListener('click', googleFlow);

function googleFlow() {
  const known = S.users.filter(u => u.google);
  openModal('Sign in with Google', AuthView.googleFlowModal({known}),
    `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="gNext">Continue</button>`, {small: true, noFocus: !!known.length});
  $('#modalBody').onclick = e => { const b = e.target.closest('[data-gacct]'); if (b) { closeModal(); signIn(S.users.find(u => u.id === b.dataset.gacct), true); } };
  $('#gForm').onsubmit = e => { e.preventDefault(); $('#gNext').click(); };
  $('#gNext').onclick = () => {
    const name = $('#gName').value.trim(), email = $('#gEmail').value.trim().toLowerCase();
    if (!name) { $('#gErr').textContent = 'Enter your name.'; return; }
    if (!EMAIL_RE.test(email)) { $('#gErr').textContent = 'Enter a valid email address.'; return; }
    const existing = S.users.find(u => u.email.toLowerCase() === email);
    closeModal();
    if (existing) { if (!existing.google) { existing.google = true; save('users'); } signIn(existing, true); return; }
    authTab('register'); googlePending = {name, email};
    $('#regName').value = name; $('#regEmail').value = email; $('#regEmail').readOnly = true;
    if (!$('#regUser').value) $('#regUser').value = email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20);
    $('#pwFields').hidden = true; $('#regNext').hidden = true;
    $('#gBanner').hidden = false;
    $('#gBanner').innerHTML = AuthView.gBanner({email});
    $('#gCancel').onclick = cancelGoogle;
    $('#regUser').focus();
  };
}

function cancelGoogle() {
  googlePending = null;
  $('#gBanner').hidden = true; $('#pwFields').hidden = false; $('#regNext').hidden = false; $('#regEmail').readOnly = false;
}

/* step 1: account details → step 2: verify email (OTP) → step 3: business */
$('#registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const err = $('#regError'), role = $('[name=role]:checked').value, g = googlePending;
  const v = id => $(id).value.trim();
  const bad = (sel, m) => { $(sel).classList.add('invalid'); $(sel).focus(); err.textContent = m; return false; };
  err.textContent = '';
  const f = {name: v('#regName'), user: v('#regUser'), email: (g ? g.email : v('#regEmail')).toLowerCase(), p1: $('#regPass').value, p2: $('#regPass2').value};
  if (!f.name) return bad('#regName', 'Full name is required.');
  if (!USER_RE.test(f.user)) return bad('#regUser', 'Username must be 3–20 letters, numbers, dots or underscores.');
  if (S.users.some(u => u.username.toLowerCase() === f.user.toLowerCase())) return bad('#regUser', 'That username is already taken.');
  if (!EMAIL_RE.test(f.email)) return bad('#regEmail', 'Enter a valid email address.');
  if (S.users.some(u => u.email.toLowerCase() === f.email)) return bad('#regEmail', 'An account with that email already exists.');
  if (!g) {
    if (f.p1.length < 6) return bad('#regPass', 'Password must be at least 6 characters.');
    if (f.p1 !== f.p2) return bad('#regPass2', 'Passwords do not match.');
  }
  const create = () => {
    if (S.users.some(u => u.username.toLowerCase() === f.user.toLowerCase() || u.email.toLowerCase() === f.email)) { err.textContent = 'That username or email was just taken. Try another.'; return; }
    const nu = {id: uid('u'), fullname: f.name, username: f.user, email: f.email, pass: g ? null : hash(f.p1), role, bizId: null, provider: g ? 'google' : 'password', google: !!g, verified: true, created: new Date().toISOString()};
    S.users.push(nu); save('users');
    e.target.reset(); cancelGoogle(); $('[name=role][value=cashier]').checked = true;
    session.set(nu.id, false); showBizStep();
    toast('Email verified. One more step.', 'success');
  };
  if (g) create();
  else verifyEmail({email: f.email, purpose: 'sign-up', title: 'Verify your email', onVerified: create});
});

function showBizStep() {
  const u = user(); if (!u) return showAuth();
  const owner = u.role === 'owner';
  $('#app').hidden = true; $('#auth').hidden = false; $('#authMain').hidden = true; $('#bizStep').hidden = false;
  $('#ownerFields').hidden = !owner; $('#cashierFields').hidden = owner;
  $('#bsTitle').textContent = owner ? 'Set up your business' : 'Join your business';
  $('#bsSub').textContent = `Signed in as ${u.fullname} (${u.email}). ` + (owner ? 'Tell us about your business. You can change these later in Settings.' : 'Enter the business username your owner gave you.');
  $('#bizSubmit').textContent = owner ? 'Create business' : 'Join business';
  $('#bizError').textContent = '';
  (owner ? $('#bizName') : $('#regBizUser')).focus();
}

$('#bizLogout').addEventListener('click', () => { session.clear(); showAuth(); });

$('#bizForm').addEventListener('submit', e => {
  e.preventDefault();
  const u = user(); if (!u) return showAuth();
  const err = $('#bizError'), v = id => $(id).value.trim();
  const bad = (sel, m) => { $(sel).classList.add('invalid'); $(sel).focus(); err.textContent = m; return false; };
  err.textContent = '';
  let biz;
  if (u.role === 'cashier') {
    const bu = v('#regBizUser').toLowerCase();
    if (!bu) return bad('#regBizUser', 'Enter your company’s business username.');
    biz = S.businesses.find(b => b.username === bu);
    if (!biz) return bad('#regBizUser', 'No business uses that username. Check with your owner.');
  } else {
    const b = {name: v('#bizName'), address: v('#bizAddr'), phone: v('#bizPhone'), email: v('#bizEmail'), tin: v('#bizTin'), username: v('#bizUser').toLowerCase(), p1: $('#bizPass').value, p2: $('#bizPass2').value};
    if (!b.name) return bad('#bizName', 'Business name is required.');
    if (!b.address) return bad('#bizAddr', 'Business address is required.');
    if (b.email && !EMAIL_RE.test(b.email)) return bad('#bizEmail', 'Enter a valid business email.');
    if (!BIZ_RE.test(b.username)) return bad('#bizUser', 'Business username: 3–30 lowercase letters, numbers or dashes.');
    if (S.businesses.some(x => x.username === b.username)) return bad('#bizUser', 'That business username is already taken.');
    if (b.p1.length < 6) return bad('#bizPass', 'Business password must be at least 6 characters.');
    if (b.p1 !== b.p2) return bad('#bizPass2', 'Business passwords do not match.');
    biz = {id: uid('biz'), username: b.username, name: b.name, pass: hash(b.p1), ownerId: u.id, created: new Date().toISOString()};
    S.businesses.push(biz);
    const prev = BIZ; BIZ = biz.id; seedBusiness($('#bizSample').checked, b); BIZ = prev;
  }
  u.bizId = biz.id; save('users', 'businesses');
  e.target.reset();
  signIn(u, false, u.role === 'owner' ? `Welcome, ${u.fullname}! ${biz.name} is ready.` : `Welcome, ${u.fullname}! You joined ${biz.name}.`);
});

/* forgot password: identify → code to the account email → new password */
$('#forgotBtn').addEventListener('click', () => {
  openModal('Reset password', AuthView.forgotPasswordModal(),
    `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="fpGo">Send code</button>`, {small: true});
  $('#fpForm').onsubmit = e => { e.preventDefault(); $('#fpGo').click(); };
  $('#fpGo').onclick = () => {
    const id = $('#fpId').value.trim().toLowerCase();
    const u = S.users.find(x => x.username.toLowerCase() === id || x.email.toLowerCase() === id);
    if (!u) { $('#fpErr').textContent = 'No account matches that username or email.'; return; }
    verifyEmail({email: u.email, purpose: 'password reset', title: 'Reset password', onVerified: () => newPasswordModal(u)});
  };
});

function newPasswordModal(u) {
  openModal('Choose a new password', AuthView.newPasswordModal({u}),
    `<button class="btn primary" id="npGo">Save password</button>`, {small: true});
  $('#npForm').onsubmit = e => { e.preventDefault(); $('#npGo').click(); };
  $('#npGo').onclick = () => {
    if ($('#np1').value.length < 6) { $('#npErr').textContent = 'Password must be at least 6 characters.'; return; }
    if ($('#np1').value !== $('#np2').value) { $('#npErr').textContent = 'Passwords do not match.'; return; }
    u.pass = hash($('#np1').value); save('users'); closeModal(); toast('Password reset. Log in with your new password.', 'success');
    if ($('#app').hidden) { authTab('login'); $('#loginUser').value = u.username; $('#loginPass').focus(); }
  };
}

/* change password / email for the signed-in user, both confirmed by a code */
function changePassword(u, cur, p1, p2, done) {
  if (u.pass && hash(cur.value) !== u.pass) return fieldErr(cur, 'Current password is incorrect.');
  if (p1.value.length < 6) return fieldErr(p1, 'New password must be at least 6 characters.');
  if (p1.value !== p2.value) return fieldErr(p2, 'Passwords do not match.');
  const nh = hash(p1.value), first = !u.pass;
  verifyEmail({email: u.email, purpose: 'password change', title: 'Confirm password change', onVerified: () => { u.pass = nh; save('users'); toast(first ? 'Password set.' : 'Password changed.', 'success'); done && done(); }});
}

function changeEmail(u, newEmail, done) {
  newEmail = newEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(newEmail)) return toast('Enter a valid email address.', 'error');
  if (S.users.some(x => x !== u && x.email.toLowerCase() === newEmail)) return toast('That email is used by another account.', 'error');
  verifyEmail({email: newEmail, purpose: 'email change', title: 'Verify your new email', intro: 'Your email changes after you enter the code sent to the new address.',
    onVerified: () => { u.email = newEmail; save('users'); toast('Email updated to ' + newEmail + '.', 'success'); done && done(); }});
}
