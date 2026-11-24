/* KitaKo — Shared helpers: DOM shortcuts, escaping, numbers, money and dates. */
'use strict';

const $ = (s, r = document) => r.querySelector(s);

const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const r2 = n => Math.round((+n + Number.EPSILON) * 100) / 100;

const sum = (arr, f) => arr.reduce((a, x) => a + (+f(x) || 0), 0);

const num = v => { const n = parseFloat(v); return isFinite(n) ? n : NaN; };

const fmtNum = n => (+n || 0).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

const money = n => ((+n || 0) < 0 ? '−' : '') + (S.settings?.currency || '₱') + fmtNum(Math.abs(+n || 0));

const pdfMoney = n => ((+n || 0) < 0 ? '-' : '') + (S.settings?.currencyCode || 'PHP') + ' ' + fmtNum(Math.abs(+n || 0));

// jsPDF core fonts have no ₱ glyph
const pad = (n, l = 2) => String(n).padStart(l, '0');

const dayKey = d => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

const sod = d => { d = new Date(d); d.setHours(0, 0, 0, 0); return d; };

const eod = d => { d = new Date(d); d.setHours(23, 59, 59, 999); return d; };

const addDays = (d, n) => { d = new Date(d); d.setDate(d.getDate() + n); return d; };

const fmtDate = d => new Date(d).toLocaleDateString('en-PH', {year: 'numeric', month: 'short', day: 'numeric'});

const fmtTime = d => new Date(d).toLocaleTimeString('en-PH', {hour: 'numeric', minute: '2-digit'});

const fmtDT = d => fmtDate(d) + ' ' + fmtTime(d);

const ago = d => { const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return fmtDT(d); };

