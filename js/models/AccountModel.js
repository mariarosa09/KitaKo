/* KitaKo — MODEL · Accounts, roles and access rules. Sign-in itself is Supabase Auth (see AuthController). */
'use strict';

const user = () => S.users.find(u => u.id === session.get());

const business = () => S.businesses.find(b => b.id === BIZ) || S.businesses.find(b => b.id === user()?.bizId);

const isOwner = () => user()?.role === 'owner';

const unlocked = () => isOwner() || (!!user() && session.unlocked() === user().id);

const CASHIER_PAGES = ['pos', 'register', 'config'];

// cashier without business mode: POS, cash drawer, own profile
const canAccess = page => CASHIER_PAGES.includes(page) || unlocked();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, USER_RE = /^[a-zA-Z0-9_.]{3,20}$/, BIZ_RE = /^[a-z0-9][a-z0-9-]{2,29}$/;

/* Supabase errors → messages people can act on */
function authMsg(e) {
  const m = String(e?.message || e || 'Something went wrong.');
  if (e?.code === '23505') return 'That name is already taken.';
  if (/Invalid login credentials/i.test(m)) return 'Incorrect username/email or password.';
  if (/rate limit|too many|security purposes|only request this after/i.test(m)) return 'Too many attempts or emails. Wait a minute, then try again.';
  if (/expired|invalid.*(otp|token)|otp.*invalid/i.test(m)) return 'That code is wrong or has expired. Check the latest email, or tap “Resend code”.';
  if (/already registered|already been registered|already exists/i.test(m)) return 'An account with that email already exists. Log in instead.';
  if (/Password should be|weak password/i.test(m)) return m;
  if (/provider is not enabled|Unsupported provider/i.test(m)) return 'Google sign-in is not turned on in Supabase yet (Authentication → Sign In / Providers → Google).';
  if (/Failed to fetch|NetworkError|Load failed|fetch/i.test(m)) return 'Cannot reach the server. Check your internet connection and try again.';
  if (/Database error saving new user/i.test(m)) return 'The account could not be created. Make sure supabase/schema.sql was run on your project.';
  return m;
}
