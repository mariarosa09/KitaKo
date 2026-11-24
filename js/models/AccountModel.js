/* KitaKo — MODEL · Accounts, roles, access rules and one-time email codes. */
'use strict';

const user = () => S.users.find(u => u.id === session.get());

const business = () => S.businesses.find(b => b.id === BIZ);

const isOwner = () => user()?.role === 'owner';

const unlocked = () => isOwner() || (!!user() && session.unlocked() === user().id);

const CASHIER_PAGES = ['pos', 'register', 'config'];

// cashier without business mode: POS, cash drawer, own profile
const canAccess = page => CASHIER_PAGES.includes(page) || unlocked();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, USER_RE = /^[a-zA-Z0-9_.]{3,20}$/, BIZ_RE = /^[a-z0-9][a-z0-9-]{2,29}$/;

/* ---------- email one-time codes (simulated inbox: a frontend-only prototype has no mail server) ---------- */
const OTP = {};

const OTP_TTL = 5 * 60e3, OTP_COOLDOWN = 30e3, OTP_TRIES = 5;

function sendOtp(email, purpose) {
  const code = String(100000 + Math.floor(Math.random() * 900000));
  OTP[email + '|' + purpose] = {h: hash(code), exp: Date.now() + OTP_TTL, tries: 0, sent: Date.now()};
  ModelEvents.emit('otp:sent', email, purpose, code);   // simulated delivery (no mail server in a frontend-only app)
}

function checkOtp(email, purpose, code) {
  const k = email + '|' + purpose, o = OTP[k];
  if (!o) return 'No code was sent. Tap “Resend code”.';
  if (Date.now() > o.exp) return 'This code has expired. Tap “Resend code”.';
  if (o.tries >= OTP_TRIES) return 'Too many wrong attempts. Tap “Resend code”.';
  if (!/^\d{6}$/.test(code)) return 'Enter the 6-digit code.';
  if (hash(code) !== o.h) { o.tries++; return `Incorrect code. ${OTP_TRIES - o.tries} attempt${OTP_TRIES - o.tries === 1 ? '' : 's'} left.`; }
  delete OTP[k]; return null;
}
