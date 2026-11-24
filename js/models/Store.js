/* KitaKo — MODEL · Storage. All data lives in localStorage: global keys (users, businesses) plus one set of keys per business. */
'use strict';

/* storage
   Global (all businesses):  kk_users, kk_businesses, kk_session
   Per business:             kk_b_<businessId>_<key>   — each business has its own menu, sales, stock and settings */
/* Models never touch the screen. They announce changes here and views subscribe (observer pattern). */
const ModelEvents = {
  handlers: {},
  on(evt, fn) { (this.handlers[evt] = this.handlers[evt] || []).push(fn); },
  emit(evt, ...args) { (this.handlers[evt] || []).forEach(fn => fn(...args)); }
};

const GP = 'kk_';

const GLOBAL_KEYS = ['users','businesses'];

const KEYS = ['settings','categories','products','txns','held','discounts','register','notifs','stockMoves','cart','meta'];

const S = {users: [], businesses: []};

let BIZ = null, storageOK = true;

const keyFor = k => GLOBAL_KEYS.includes(k) ? GP + k : GP + 'b_' + BIZ + '_' + k;

const store = {
  get(k, d) { try { const v = localStorage.getItem(keyFor(k)); return v == null ? d : JSON.parse(v); } catch { storageOK = false; return d; } },
  set(k, v) { try { localStorage.setItem(keyFor(k), JSON.stringify(v)); } catch { if (storageOK) ModelEvents.emit('storage:error'); storageOK = false; } }
};

const save = (...ks) => (ks.length ? ks : KEYS).forEach(k => { if (GLOBAL_KEYS.includes(k) || BIZ) store.set(k, S[k]); });

function loadGlobal() { GLOBAL_KEYS.forEach(k => { S[k] = store.get(k, null); if (!Array.isArray(S[k])) S[k] = []; }); }

function loadBiz(id) {
  BIZ = id; KEYS.forEach(k => { S[k] = store.get(k, null); });
  if (!S.settings || !S.products) { const b = S.businesses.find(x => x.id === id); seedBusiness(false, {name: b?.name || DEFAULT_SETTINGS.name}); } else normalize();
}

const session = {
  _mem: null, _unlock: null,
  get() { try { return localStorage.getItem(GP + 'session') || sessionStorage.getItem(GP + 'session') || session._mem; } catch { return session._mem; } },
  set(id, remember) { session._mem = id; try { (remember ? localStorage : sessionStorage).setItem(GP + 'session', id); } catch {} },
  clear() { session._mem = null; session.lock(); try { localStorage.removeItem(GP + 'session'); sessionStorage.removeItem(GP + 'session'); } catch {} },
  unlocked() { try { return sessionStorage.getItem(GP + 'unlock') || session._unlock; } catch { return session._unlock; } },
  unlock(id) { session._unlock = id; try { sessionStorage.setItem(GP + 'unlock', id); } catch {} },
  lock() { session._unlock = null; try { sessionStorage.removeItem(GP + 'unlock'); } catch {} }
};

function normalize() {
  S.settings = {...DEFAULT_SETTINGS, ...(S.settings || {})};
  S.settings.notify = {...DEFAULT_SETTINGS.notify, ...(S.settings.notify || {})};
  ['categories','products','txns','held','discounts','notifs','stockMoves'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
  S.register = S.register && Array.isArray(S.register.history) ? S.register : {current: null, history: []};
  S.meta = S.meta || {receiptCounter: 1000};
  if (!S.categories.length) S.categories = CATS.map((n, i) => ({id: 'c' + (i + 1), name: n}));
}
