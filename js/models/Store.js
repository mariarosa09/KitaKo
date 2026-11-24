/* KitaKo — MODEL · Storage. Accounts and data live in Supabase (see supabase/schema.sql).
   The app works on the in-memory state S; save(key) sends the changed parts to Supabase in the background. */
'use strict';

/* storage
   Supabase tables:  profiles (accounts), businesses, business_secrets (business password), business_data
   business_data:    one row per data type and business — settings, products, … —
                     sales and stock moves get one row per month (txns:2026-11, stockMoves:2026-11)
   This device only: the open cart (kk_cart_<business>_<user>), sidebar setting, "remember me" */
/* Models never touch the screen. They announce changes here and views subscribe (observer pattern). */
const ModelEvents = {
  handlers: {},
  on(evt, fn) { (this.handlers[evt] = this.handlers[evt] || []).push(fn); },
  emit(evt, ...args) { (this.handlers[evt] || []).forEach(fn => fn(...args)); }
};

const GP = 'kk_';

const KEYS = ['settings','categories','products','txns','held','discounts','register','notifs','stockMoves','cart','meta'];

const LOCAL_KEYS = ['cart'];                      // each device keeps its own open order

const PART = {txns: 'date', stockMoves: 'at'};    // saved as one row per month, by this date field

const S = {users: [], businesses: []};

let BIZ = null, AUTH = null;                      // current business id, signed-in Supabase user

/* "Remember me": the Supabase session is kept in localStorage, otherwise only for this browser tab */
const authStorage = {
  getItem(k) { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; } },
  setItem(k, v) { try { const keep = localStorage.getItem(GP + 'remember') !== '0'; (keep ? localStorage : sessionStorage).setItem(k, v); (keep ? sessionStorage : localStorage).removeItem(k); } catch {} },
  removeItem(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch {} }
};

const rememberMe = on => { try { localStorage.setItem(GP + 'remember', on ? '1' : '0'); } catch {} };

const sb = window.supabase && SUPABASE_URL && SUPABASE_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth: {storage: authStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true}})
  : null;

const session = {
  _unlock: null,
  get() { return AUTH?.id || null; },
  unlocked() { try { return sessionStorage.getItem(GP + 'unlock') || session._unlock; } catch { return session._unlock; } },
  unlock(id) { session._unlock = id; try { sessionStorage.setItem(GP + 'unlock', id); } catch {} },
  lock() { session._unlock = null; try { sessionStorage.removeItem(GP + 'unlock'); } catch {} }
};

/* ---------- accounts ---------- */
const toUser = (p, au) => {
  const u = {id: p.id, fullname: p.fullname || '', username: p.username || '', email: p.email || '', role: p.role, bizId: p.biz_id, created: p.created_at};
  if (au) { const prov = au.app_metadata?.providers || [au.app_metadata?.provider];
    u.pass = prov.includes('email') || !!au.user_metadata?.has_password; u.google = prov.includes('google'); }
  return u;
};

const toBiz = b => ({id: b.id, username: b.username, name: b.name, ownerId: b.owner_id, created: b.created_at});

/* ---------- local-only keys ---------- */
const localKey = k => GP + k + '_' + BIZ + '_' + (AUTH?.id || '');
const localGet = k => { try { const v = localStorage.getItem(localKey(k)); return v == null ? null : JSON.parse(v); } catch { return null; } };
const localSet = (k, v) => { try { localStorage.setItem(localKey(k), JSON.stringify(v)); } catch {} };

/* ---------- monthly rows for sales and stock moves ---------- */
const monthOf = v => { const d = new Date(v); return isNaN(d) ? '0000-00' : d.toISOString().slice(0, 7); };
const baseKey = rk => rk.split(':')[0];
const emptyFor = rk => (PART[baseKey(rk)] || Array.isArray(S[rk])) ? [] : {};

function partsOf(k) {
  const out = {};
  Object.keys(cloud.synced).filter(rk => rk.startsWith(k + ':')).forEach(rk => { out[rk] = []; });   // emptied months are saved as []
  (S[k] || []).forEach(x => { const rk = k + ':' + monthOf(x[PART[k]]); (out[rk] = out[rk] || []).push(x); });
  return out;
}

// sales: oldest month first (newest sale last); stock moves: newest first
function joinParts(k, parts) {
  const dir = k === 'txns' ? 1 : -1;
  return Object.keys(parts).filter(rk => rk.startsWith(k + ':')).sort((a, b) => dir * a.localeCompare(b)).flatMap(rk => parts[rk] || []);
}

const rowsFor = k => LOCAL_KEYS.includes(k) ? {} : PART[k] ? partsOf(k) : {[k]: S[k]};
const currentRow = rk => PART[baseKey(rk)] ? (partsOf(baseKey(rk))[rk] || []) : S[rk];

function applyRow(rk, val) {
  const k = baseKey(rk);
  if (PART[k]) { const parts = partsOf(k); parts[rk] = val; S[k] = joinParts(k, parts); } else S[k] = val;
}

/* ---------- merging when two devices changed the same row ----------
   base = what this device last read, local = this device now, remote = what the other device saved.
   Lists of records merge per record (adds, edits and deletes from both sides are kept; stock counts add up);
   settings-like objects merge per field. */
const J = v => JSON.stringify(v);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const SORT = {txns: (a, b) => String(a.date).localeCompare(String(b.date)), stockMoves: (a, b) => String(b.at).localeCompare(String(a.at)),
  notifs: (a, b) => String(b.at).localeCompare(String(a.at)), held: (a, b) => String(b.at).localeCompare(String(a.at))};

function mergeObj(b, l, r) {
  if (!isObj(l) || !isObj(r)) return J(l) !== J(b) ? l : r;
  b = isObj(b) ? b : {};
  const out = {...r};
  for (const f of new Set([...Object.keys(l), ...Object.keys(b)])) {
    if (!(f in l)) { if (f in b) delete out[f]; continue; }
    if (J(l[f]) === J(b[f])) continue;
    out[f] = f === 'stock' && [l[f], b[f], r[f]].every(n => typeof n === 'number') ? r2(r[f] + l[f] - b[f]) : l[f];
  }
  return out;
}

function merge3(base, local, remote, rk) {
  if (local == null) return remote;
  if (remote == null) return local;
  const k = baseKey(rk), withId = a => Array.isArray(a) && a.every(x => x && x.id != null);
  if (withId(local) && withId(remote)) {
    const B = new Map((withId(base) ? base : []).map(x => [x.id, x])), L = new Map(local.map(x => [x.id, x])), R = new Set(remote.map(x => x.id));
    const out = [];
    remote.forEach(r => {
      if (B.has(r.id) && !L.has(r.id)) return;                                   // deleted on this device
      const l = L.get(r.id);
      out.push(!l ? r : B.has(r.id) ? mergeObj(B.get(r.id), l, r) : l);
    });
    local.forEach(l => { if (!R.has(l.id) && !B.has(l.id)) out.push(l); });     // added on this device
    return SORT[k] ? out.sort(SORT[k]) : out;
  }
  if (isObj(local) && isObj(remote)) {
    const out = mergeObj(base, local, remote);
    if (k === 'meta') out.receiptCounter = Math.max(local.receiptCounter || 0, remote.receiptCounter || 0);
    return out;
  }
  return J(local) !== J(base) ? local : remote;
}

/* ---------- sync with Supabase ---------- */
const cloud = {
  synced: {},          // row key → {v: version, j: JSON this device last saw on the server}
  dirty: new Set(), timer: null, chain: Promise.resolve(), pending: 0, channel: null, poller: null, lastErr: 0,

  schedule(ms = 250) { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), ms); },
  queue(fn) { this.pending++; const p = this.chain.then(fn).finally(() => { this.pending--; }); this.chain = p.catch(() => {}); return p; },
  flush() { clearTimeout(this.timer); return this.queue(() => this._flush()); },
  pull() { return this.queue(() => this._pull()); },
  busy() { return this.pending > 0 || this.dirty.size > 0; },

  async _flush() {
    const biz = BIZ, ks = [...this.dirty]; this.dirty.clear();
    if (!biz || !sb) return;
    for (const k of ks) {
      try {
        for (const [rk, val] of Object.entries(rowsFor(k))) { if (J(val) !== this.synced[rk]?.j) await this._put(biz, rk); }
      } catch (e) {
        if (BIZ !== biz) return;
        this.dirty.add(k); this.schedule(8000);
        if (Date.now() - this.lastErr > 60e3) { this.lastErr = Date.now(); ModelEvents.emit('sync:error', e); }
      }
    }
  },

  async _put(biz, rk) {
    for (let i = 0; i < 5 && BIZ === biz; i++) {
      const val = currentRow(rk), j = J(val), base = this.synced[rk];
      if (j === base?.j) return;
      const {data: v, error} = await sb.rpc('put_data', {p_biz: biz, p_key: rk, p_value: val, p_version: base?.v || 0});
      if (error) throw error;
      if (v != null) { this.synced[rk] = {v, j}; this.announce(rk, v); return; }
      // another device saved this row first: merge its version with ours, then try again
      const {data: row, error: e2} = await sb.from('business_data').select('value,version').eq('biz_id', biz).eq('key', rk).maybeSingle();
      if (e2) throw e2;
      if (BIZ !== biz) return;
      if (!row) { delete this.synced[rk]; continue; }
      const merged = merge3(base ? JSON.parse(base.j) : emptyFor(rk), currentRow(rk), row.value, rk);
      this.synced[rk] = {v: row.version, j: J(row.value)};
      applyRow(rk, merged); ModelEvents.emit('data:remote', [baseKey(rk)]);
    }
  },

  // read rows another device changed since this device last saw them
  async _pull() {
    const biz = BIZ; if (!biz || !sb) return;
    const {data: list, error} = await sb.from('business_data').select('key,version').eq('biz_id', biz);
    if (error || BIZ !== biz) return;
    const stale = list.filter(r => (this.synced[r.key]?.v || 0) < r.version).map(r => r.key);
    if (!stale.length) return;
    const {data: rows, error: e2} = await sb.from('business_data').select('key,value,version').eq('biz_id', biz).in('key', stale);
    if (e2 || BIZ !== biz) return;
    const changed = new Set();
    rows.forEach(r => {
      const base = this.synced[r.key], local = currentRow(r.key);
      const merged = merge3(base ? JSON.parse(base.j) : emptyFor(r.key), local, r.value, r.key);
      this.synced[r.key] = {v: r.version, j: J(r.value)};
      applyRow(r.key, merged); changed.add(baseKey(r.key));
      if (J(merged) !== J(r.value)) this.dirty.add(baseKey(r.key));
    });
    if (S.settings) normalize();
    if (this.dirty.size) this.schedule();
    ModelEvents.emit('data:remote', [...changed]);
  },

  // tell other open devices of this business to pull (best effort; the poll below catches anything missed)
  announce(key, v) { try { this.channel?.send({type: 'broadcast', event: 'put', payload: {key, v}}); } catch {} },

  start() {
    this.stop(); const biz = BIZ;
    try {
      this.channel = sb.channel('kk-biz-' + biz).on('broadcast', {event: 'put'}, ({payload}) => {
        if (BIZ === biz && (this.synced[payload?.key]?.v || 0) < payload?.v) this.pull();
      }).subscribe();
    } catch { this.channel = null; }
    this.poller = setInterval(() => { if (!document.hidden) this.pull(); }, 20e3);
  },

  stop() { clearInterval(this.poller); this.poller = null; if (this.channel) { try { sb.removeChannel(this.channel); } catch {} this.channel = null; } }
};

document.addEventListener('visibilitychange', () => { if (!document.hidden && BIZ) cloud.pull(); });

window.addEventListener('beforeunload', e => { if (BIZ && cloud.busy()) { cloud.flush(); e.preventDefault(); e.returnValue = ''; } });

const save = (...ks) => {
  (ks.length ? ks : KEYS).forEach(k => {
    if (k === 'businesses') return saveBizName();
    if (LOCAL_KEYS.includes(k)) { if (BIZ) localSet(k, S[k]); return; }
    if (BIZ && KEYS.includes(k)) cloud.dirty.add(k);
  });
  if (cloud.dirty.size) cloud.schedule();
};

async function saveBizName() {
  const b = S.businesses.find(x => x.id === BIZ); if (!b || !sb) return;
  const {error} = await sb.from('businesses').update({name: b.name}).eq('id', b.id);
  if (error) ModelEvents.emit('sync:error', error);
}

/* the signed-in account, its business and coworkers */
async function loadMe() {
  const {data: {user: au}, error} = await sb.auth.getUser();
  if (error || !au) { AUTH = null; return null; }
  AUTH = au;
  const {data: p, error: e1} = await sb.from('profiles').select('*').eq('id', au.id).maybeSingle();
  if (e1) throw e1;
  S.users = []; S.businesses = [];
  if (!p) return null;
  S.users.push(toUser(p, au));
  if (p.biz_id) {
    const [b, staff] = await Promise.all([sb.from('businesses').select('*').eq('id', p.biz_id).maybeSingle(), sb.from('profiles').select('*').eq('biz_id', p.biz_id)]);
    if (b.error) throw b.error;
    if (b.data) S.businesses.push(toBiz(b.data));
    (staff.data || []).forEach(x => { if (x.id !== p.id) S.users.push(toUser(x)); });
  }
  return S.users[0];
}

async function loadBiz(id) {
  cloud.stop(); BIZ = id; cloud.synced = {}; cloud.dirty.clear();
  const {data, error} = await sb.from('business_data').select('key,value,version').eq('biz_id', id);
  if (error) { BIZ = null; throw error; }
  const rows = {};
  data.forEach(r => { rows[r.key] = r.value; cloud.synced[r.key] = {v: r.version, j: J(r.value)}; });
  KEYS.forEach(k => { S[k] = LOCAL_KEYS.includes(k) ? localGet(k) : PART[k] ? joinParts(k, rows) : (rows[k] ?? null); });
  if (!S.settings || !S.products) { const b = S.businesses.find(x => x.id === id); seedBusiness(false, {name: b?.name || DEFAULT_SETTINGS.name}); } else normalize();
  cloud.start();
}

/* a new business: fill it with defaults (and optional sample data) and wait until it is saved */
async function createBizData(id, withSamples, info) {
  cloud.stop(); BIZ = id; cloud.synced = {}; cloud.dirty.clear();
  seedBusiness(withSamples, info);
  await cloud.flush();
  if (cloud.dirty.size) throw new Error('Could not save the new business data. Check your internet connection.');
  cloud.start();
}

async function signOutCloud() {
  if (BIZ && cloud.busy()) { try { await cloud.flush(); } catch {} }
  cloud.stop(); session.lock(); BIZ = null; AUTH = null; S.users = []; S.businesses = [];
  if (sb) { try { await sb.auth.signOut(); } catch {} }
}

function normalize() {
  S.settings = {...DEFAULT_SETTINGS, ...(S.settings || {})};
  S.settings.notify = {...DEFAULT_SETTINGS.notify, ...(S.settings.notify || {})};
  ['categories','products','txns','held','discounts','notifs','stockMoves'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
  S.register = S.register && Array.isArray(S.register.history) ? S.register : {current: null, history: []};
  S.meta = S.meta || {receiptCounter: 1000};
  if (!S.categories.length) S.categories = CATS.map((n, i) => ({id: 'c' + (i + 1), name: n}));
}
