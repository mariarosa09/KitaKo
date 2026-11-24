/* KitaKo — CONTROLLER · Auth: log in, sign up with an emailed code, Google, password reset — all through Supabase Auth. */
'use strict';

let googlePending = null;   // {name, email} while a Google account picks its role and username

const appUrl = () => location.origin + location.pathname;

function showAuth(msg) {
  $('#boot').hidden = true; $('#app').hidden = true; $('#auth').hidden = false; $('#authMain').hidden = false; $('#bizStep').hidden = true;
  authTab('login'); $('#loginError').textContent = msg || ''; $('#loginUser').focus();
}

function authTab(which) {
  $$('[data-auth-tab]').forEach(b => b.classList.toggle('active', b.dataset.authTab === which));
  $('#loginForm').hidden = which !== 'login'; $('#registerForm').hidden = which !== 'register';
  $('#googleLbl').textContent = which === 'login' ? 'Continue with Google' : 'Sign up with Google';
  $('#googleBtn').hidden = !!googlePending; $('#authOr').hidden = !!googlePending;
  if (which === 'login' && googlePending) cancelGoogle();
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

/* disable a button while a request runs */
async function busy(btn, fn) { if (btn) btn.disabled = true; try { return await fn(); } finally { if (btn) btn.disabled = false; } }

/* Supabase emails a code (the email templates must include {{ .Token }} — see README) */
const otpCheck = (email, type) => async code => { const {error} = await sb.auth.verifyOtp({email, token: code, type}); return error ? authMsg(error) : null; };
const otpResend = (email, type) => async () => { const {error} = await sb.auth.resend({type, email}); return error ? authMsg(error) : null; };

function verifyEmail({email, title = 'Verify your email', intro = '', verify, resend, onVerified, onCancel}) {
  let done = false, sentAt = Date.now();
  openModal(title, AuthView.verifyEmailModal({email, intro}),
    `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="otpGo">Verify</button>`,
    {small: true, onClose: () => { clearInterval(timer); if (!done && onCancel) onCancel(); }});
  const tick = () => { const el = $('#otpTimer'), rb = $('#otpResend'); if (!el) return;
    const wait = Math.ceil((sentAt + 60e3 - Date.now()) / 1000);
    rb.disabled = wait > 0; rb.style.opacity = wait > 0 ? .45 : 1; el.textContent = wait > 0 ? `Resend available in ${wait}s` : 'Didn’t get it? Check spam.'; };
  const timer = setInterval(tick, 1000); tick();
  $('#otpCode').oninput = e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8); $('#otpErr').textContent = ''; };
  $('#otpResend').onclick = () => busy($('#otpResend'), async () => {
    const err = await resend(); if (err) { $('#otpErr').textContent = err; return; }
    sentAt = Date.now(); $('#otpCode').value = ''; toast('A new code was sent to ' + email + '.');
  }).then(tick);
  $('#otpForm').onsubmit = e => { e.preventDefault(); $('#otpGo').click(); };
  $('#otpGo').onclick = () => busy($('#otpGo'), async () => {
    const code = $('#otpCode').value.trim();
    if (!/^\d{6,8}$/.test(code)) { $('#otpErr').textContent = 'Enter the code from the email.'; return; }
    const err = await verify(code);
    if (err) { if ($('#otpErr')) { $('#otpErr').textContent = err; $('#otpCode').select(); } return; }
    done = true; closeModal(); if (onVerified) onVerified();
  });
}

/* ---------- after signing in: profile → business → app ---------- */
function resetFilters() {
  Object.assign(posUI, {q: '', cat: 'all', edit: false}); Object.assign(prodUI, {q: '', cat: 'all', avail: 'all'}); Object.assign(invUI, {q: '', cat: 'all', status: 'all'});
  Object.assign(txUI, {q: '', from: '', to: '', method: 'all', type: 'all'}); Object.assign(rcUI, {q: '', sel: null}); ntUI.f = 'all'; setUI.tab = 'info';
}

async function afterAuth(msg, fresh = true) {
  let u;
  try { u = await loadMe(); } catch (e) { return showAuth(authMsg(e)); }
  if (!u) { await signOutCloud(); return showAuth('Your account has no KitaKo profile. Make sure supabase/schema.sql was run, then sign up again.'); }
  if (!u.role || !u.username) return showCompleteProfile(u);
  if (!u.bizId || !business()) return showBizStep();
  if (fresh) { session.lock(); resetFilters(); }
  try { if (BIZ !== u.bizId) await loadBiz(u.bizId); } catch (e) { return showAuth('Could not load your business: ' + authMsg(e)); }
  startApp(fresh, msg);
}

/* ---------- log in ---------- */
async function emailFor(login) {
  if (login.includes('@')) return login;
  const {data, error} = await sb.rpc('email_for_login', {p_login: login});
  if (error) throw error;
  return data;
}

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('#loginUser').value.trim().toLowerCase(), pw = $('#loginPass').value, err = $('#loginError');
  if (!id || !pw) { err.textContent = 'Enter your username or email and password.'; return; }
  err.textContent = '';
  busy($('#loginForm [type=submit]'), async () => {
    try {
      const email = await emailFor(id);
      if (!email) { err.textContent = 'Incorrect username/email or password.'; $('#loginPass').value = ''; return; }
      rememberMe($('#rememberMe').checked);
      const {error} = await sb.auth.signInWithPassword({email, password: pw});
      if (error && /not confirmed/i.test(error.message)) {
        const r = await otpResend(email, 'signup')(); if (r) { err.textContent = r; return; }
        return verifyEmail({email, intro: 'Your email isn’t verified yet.', verify: otpCheck(email, 'signup'), resend: otpResend(email, 'signup'),
          onVerified: () => { $('#loginPass').value = ''; afterAuth(); }});
      }
      if (error) { err.textContent = authMsg(error); $('#loginPass').value = ''; return; }
      $('#loginPass').value = '';
      await afterAuth();
    } catch (ex) { err.textContent = authMsg(ex); }
  });
});

/* ---------- Google (Supabase redirects to Google and back to this page) ---------- */
$('#googleBtn').addEventListener('click', () => busy($('#googleBtn'), async () => {
  if (!/^https?:$/.test(location.protocol)) return toast('Google sign-in needs KitaKo opened from a web address (http/https), not as a file.', 'error');
  rememberMe(true);
  try { sessionStorage.setItem(GP + 'oauth', '1'); } catch {}
  const {error} = await sb.auth.signInWithOAuth({provider: 'google', options: {redirectTo: appUrl(), queryParams: {prompt: 'select_account'}}});
  if (error) toast(authMsg(error), 'error');
}));

/* signed in, but the account still needs a role and username (Google sign-up) */
function showCompleteProfile(u) {
  $('#boot').hidden = true; $('#app').hidden = true; $('#auth').hidden = false; $('#authMain').hidden = false; $('#bizStep').hidden = true;
  googlePending = {name: u.fullname, email: u.email};
  authTab('register');
  $('#regName').value = u.fullname; $('#regEmail').value = u.email; $('#regEmail').readOnly = true;
  if (!$('#regUser').value) $('#regUser').value = (u.username || u.email.split('@')[0]).replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20);
  if (u.role) $(`[name=role][value=${u.role}]`).checked = true;
  $('#pwFields').hidden = true; $('#regNext').hidden = true;
  $('#gBanner').hidden = false; $('#gBanner').innerHTML = AuthView.gBanner({email: u.email});
  $('#gCancel').onclick = () => { cancelGoogle(); authTab('login'); };
  $('#regUser').focus();
}

function cancelGoogle() {
  const was = googlePending; googlePending = null;
  $('#gBanner').hidden = true; $('#pwFields').hidden = false; $('#regNext').hidden = false; $('#regEmail').readOnly = false;
  $('#googleBtn').hidden = false; $('#authOr').hidden = false;
  if (was) { $('#registerForm').reset(); signOutCloud(); }
}

/* ---------- sign up: 1 account details → 2 verify email (code) → 3 business ---------- */
$('#registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target, err = $('#regError'), role = $('[name=role]:checked').value, g = googlePending;
  const v = id => $(id).value.trim();
  const bad = (sel, m) => { $(sel).classList.add('invalid'); $(sel).focus(); err.textContent = m; };
  err.textContent = '';
  const f = {name: v('#regName'), user: v('#regUser'), email: (g ? g.email : v('#regEmail')).toLowerCase(), p1: $('#regPass').value, p2: $('#regPass2').value};
  if (!f.name) return bad('#regName', 'Full name is required.');
  if (!USER_RE.test(f.user)) return bad('#regUser', 'Username must be 3–20 letters, numbers, dots or underscores.');
  if (!EMAIL_RE.test(f.email)) return bad('#regEmail', 'Enter a valid email address.');
  if (!g) {
    if (f.p1.length < 6) return bad('#regPass', 'Password must be at least 6 characters.');
    if (f.p1 !== f.p2) return bad('#regPass2', 'Passwords do not match.');
  }
  const finish = () => { form.reset(); $('[name=role][value=cashier]').checked = true; toast('Account ready. One more step.', 'success'); afterAuth(); };
  busy($('#regSubmit'), async () => {
    try {
      const {data: free, error: fe} = await sb.rpc('username_available', {p_username: f.user});
      if (fe) throw fe;
      if (!free) return bad('#regUser', 'That username is already taken.');
      if (g) {
        const {error} = await sb.rpc('complete_profile', {p_fullname: f.name, p_username: f.user, p_role: role});
        if (error) return error.code === '23505' ? bad('#regUser', 'That username is already taken.') : (err.textContent = authMsg(error));
        cancelGoogleUi(); return finish();
      }
      rememberMe(true);
      const {data, error} = await sb.auth.signUp({email: f.email, password: f.p1, options: {data: {fullname: f.name, username: f.user, role}, emailRedirectTo: appUrl()}});
      if (error) return (err.textContent = authMsg(error));
      if (data.user && !data.user.identities?.length) return bad('#regEmail', 'An account with that email already exists. Log in instead.');
      if (data.session) return finish();                       // "Confirm email" is turned off in Supabase
      verifyEmail({email: f.email, verify: otpCheck(f.email, 'signup'), resend: otpResend(f.email, 'signup'), onVerified: finish});
    } catch (ex) { err.textContent = authMsg(ex); }
  });
});

// leave Google mode without signing out (the profile is now complete)
function cancelGoogleUi() { googlePending = null; $('#gBanner').hidden = true; $('#pwFields').hidden = false; $('#regNext').hidden = false; $('#regEmail').readOnly = false; $('#googleBtn').hidden = false; $('#authOr').hidden = false; }

function showBizStep() {
  const u = user(); if (!u) return showAuth();
  const owner = u.role === 'owner';
  $('#boot').hidden = true; $('#app').hidden = true; $('#auth').hidden = false; $('#authMain').hidden = true; $('#bizStep').hidden = false;
  $('#ownerFields').hidden = !owner; $('#cashierFields').hidden = owner;
  $('#bsTitle').textContent = owner ? 'Set up your business' : 'Join your business';
  $('#bsSub').textContent = `Signed in as ${u.fullname} (${u.email}). ` + (owner ? 'Tell us about your business. You can change these later in Settings.' : 'Enter the business username your owner gave you.');
  $('#bizSubmit').textContent = owner ? 'Create business' : 'Join business';
  $('#bizError').textContent = '';
  (owner ? $('#bizName') : $('#regBizUser')).focus();
}

$('#bizLogout').addEventListener('click', async () => { await signOutCloud(); showAuth(); });

$('#bizForm').addEventListener('submit', e => {
  e.preventDefault();
  const u = user(); if (!u) return showAuth();
  const form = e.target, err = $('#bizError'), v = id => $(id).value.trim();
  const bad = (sel, m) => { $(sel).classList.add('invalid'); $(sel).focus(); err.textContent = m; };
  err.textContent = '';
  if (u.role === 'cashier') {
    const bu = v('#regBizUser').toLowerCase();
    if (!bu) return bad('#regBizUser', 'Enter your company’s business username.');
    return busy($('#bizSubmit'), async () => {
      const {error} = await sb.rpc('join_business', {p_username: bu});
      if (error) return /No business/i.test(error.message) ? bad('#regBizUser', 'No business uses that username. Check with your owner.') : (err.textContent = authMsg(error));
      form.reset();
      await afterAuth(`Welcome, ${u.fullname}! You joined ${business()?.name || 'your business'}.`);
    });
  }
  const b = {name: v('#bizName'), address: v('#bizAddr'), phone: v('#bizPhone'), email: v('#bizEmail'), tin: v('#bizTin'), username: v('#bizUser').toLowerCase(), p1: $('#bizPass').value, p2: $('#bizPass2').value};
  if (!b.name) return bad('#bizName', 'Business name is required.');
  if (!b.address) return bad('#bizAddr', 'Business address is required.');
  if (b.email && !EMAIL_RE.test(b.email)) return bad('#bizEmail', 'Enter a valid business email.');
  if (!BIZ_RE.test(b.username)) return bad('#bizUser', 'Business username: 3–30 lowercase letters, numbers or dashes.');
  if (b.p1.length < 6) return bad('#bizPass', 'Business password must be at least 6 characters.');
  if (b.p1 !== b.p2) return bad('#bizPass2', 'Business passwords do not match.');
  busy($('#bizSubmit'), async () => {
    try {
      const {data: id, error} = await sb.rpc('create_business', {p_username: b.username, p_name: b.name, p_password: b.p1});
      if (error) return error.code === '23505' ? bad('#bizUser', 'That business username is already taken.') : (err.textContent = authMsg(error));
      const sample = $('#bizSample').checked;
      await loadMe();
      session.lock(); resetFilters();
      await createBizData(id, sample, b);
      form.reset();
      startApp(true, `Welcome, ${u.fullname}! ${b.name} is ready.`);
    } catch (ex) { err.textContent = authMsg(ex); }
  });
});

/* ---------- forgot password: identify → code to the account email → new password ---------- */
$('#forgotBtn').addEventListener('click', () => {
  openModal('Reset password', AuthView.forgotPasswordModal(),
    `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="fpGo">Send code</button>`, {small: true});
  $('#fpForm').onsubmit = e => { e.preventDefault(); $('#fpGo').click(); };
  $('#fpGo').onclick = () => busy($('#fpGo'), async () => {
    const id = $('#fpId').value.trim().toLowerCase();
    if (!id) { $('#fpErr').textContent = 'Enter your username or email.'; return; }
    try {
      const email = await emailFor(id);
      if (!email) { $('#fpErr').textContent = 'No account uses that username.'; return; }
      const send = async () => { const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: appUrl()}); return error ? authMsg(error) : null; };
      const r = await send(); if (r) { $('#fpErr').textContent = r; return; }
      verifyEmail({email, title: 'Reset password', intro: 'If an account uses this email, we sent it a code.', verify: otpCheck(email, 'recovery'), resend: send, onVerified: () => newPasswordModal(email)});
    } catch (ex) { $('#fpErr').textContent = authMsg(ex); }
  });
});

function newPasswordModal(email) {
  let done = false;
  openModal('Choose a new password', AuthView.newPasswordModal({email}),
    `<button class="btn primary" id="npGo">Save password</button>`, {small: true, onClose: () => { if (!done) signOutCloud(); }});
  $('#npForm').onsubmit = e => { e.preventDefault(); $('#npGo').click(); };
  $('#npGo').onclick = () => busy($('#npGo'), async () => {
    if ($('#np1').value.length < 6) { $('#npErr').textContent = 'Password must be at least 6 characters.'; return; }
    if ($('#np1').value !== $('#np2').value) { $('#npErr').textContent = 'Passwords do not match.'; return; }
    const {error} = await sb.auth.updateUser({password: $('#np1').value, data: {has_password: true}});
    if (error) { $('#npErr').textContent = authMsg(error); return; }
    done = true; closeModal(); toast('Password reset. You are signed in.', 'success');
    afterAuth();
  });
}

/* ---------- change password / email for the signed-in user ---------- */
async function changePassword(u, cur, p1, p2, done) {
  if (u.pass && !cur.value) return fieldErr(cur, 'Enter your current password.');
  if (p1.value.length < 6) return fieldErr(p1, 'New password must be at least 6 characters.');
  if (p1.value !== p2.value) return fieldErr(p2, 'Passwords do not match.');
  if (u.pass) {
    const {error} = await sb.auth.signInWithPassword({email: u.email, password: cur.value});
    if (error) return fieldErr(cur, /Invalid login/i.test(error.message) ? 'Current password is incorrect.' : authMsg(error));
  }
  const {error} = await sb.auth.updateUser({password: p1.value, data: {has_password: true}});
  if (error) return toast(authMsg(error), 'error');
  const first = !u.pass; u.pass = true;
  toast(first ? 'Password set. You can now also log in with your username.' : 'Password changed.', 'success');
  if (done) done();
}

async function changeEmail(u, newEmail, done) {
  newEmail = newEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(newEmail)) return toast('Enter a valid email address.', 'error');
  const {error} = await sb.auth.updateUser({email: newEmail}, {emailRedirectTo: appUrl()});
  if (error) return toast(authMsg(error), 'error');
  verifyEmail({email: newEmail, title: 'Verify your new email', intro: 'Your email changes after you enter the code sent to the new address.',
    verify: otpCheck(newEmail, 'email_change'), resend: otpResend(newEmail, 'email_change'),
    onVerified: () => { u.email = newEmail; toast('Email updated to ' + newEmail + '.', 'success'); if (done) done(); }});
}
