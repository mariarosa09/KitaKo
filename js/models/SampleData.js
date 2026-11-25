/* KitaKo — MODEL · Default settings, and the optional starter menu with 90 days of example sales. */
'use strict';

const DEFAULT_SETTINGS = {
  name: 'My business', address: '', phone: '', email: '', tin: '',
  currency: '₱', currencyCode: 'PHP', vatRate: 12, vatInclusive: true, serviceCharge: 0, deliveryFee: 49,
  statRate: 20, statVatExempt: true, receiptFooter: 'Thank you! Please come again.', showVatBreakdown: true, showCashier: true,
  defaultDiscountId: '', lowStockDefault: 10,
  notify: {low: true, out: true, sale: true, inventory: true, product: true, cash: true, summary: true, info: true}
};

const CATS = ['Burgers','Chicken','Fries and Sides','Rice Meals','Pasta','Beverages','Desserts','Combos and Meal Sets','Others'];

// [name, catIndex, price, cost, stock, min, unit]
const PRODUCTS = [
  ['Classic Burger',0,59,27,80,15,'pcs'],['Cheeseburger',0,69,32,75,15,'pcs'],['Double Quarter Pounder',0,159,76,40,10,'pcs'],['Bacon Mushroom Burger',0,129,61,35,10,'pcs'],['Spicy Chicken Burger',0,99,45,45,10,'pcs'],
  ['1-pc Fried Chicken',1,89,41,90,20,'pcs'],['2-pc Fried Chicken',1,169,79,60,15,'pcs'],['Spicy Wings (6 pcs)',1,149,67,30,10,'orders'],['Chicken Nuggets (6 pcs)',1,79,33,55,12,'orders'],
  ['Regular Fries',2,45,14,120,25,'servings'],['Large Fries',2,75,24,80,20,'servings'],['Mashed Potato',2,39,12,50,12,'cups'],['Coleslaw',2,35,11,40,10,'cups'],['Onion Rings',2,59,19,0,10,'servings'],
  ['Chicken Rice Meal',3,109,49,70,15,'meals'],['Burger Steak with Rice',3,89,40,65,15,'meals'],['Pork Sisig Rice',3,119,55,40,10,'meals'],['Beef Tapa Rice',3,129,63,6,10,'meals'],['Extra Rice',3,20,6,150,30,'cups'],
  ['Spaghetti',4,65,27,60,15,'plates'],['Carbonara',4,89,38,35,10,'plates'],['Chicken Alfredo',4,119,52,20,8,'plates'],
  ['Iced Tea (Regular)',5,35,8,150,30,'cups'],['Iced Tea (Large)',5,49,11,100,25,'cups'],['Cola (Regular)',5,39,12,140,30,'cups'],['Brewed Coffee',5,45,10,60,15,'cups'],['Bottled Water',5,25,9,90,20,'bottles'],['Mango Shake',5,79,27,30,10,'cups'],
  ['Chocolate Sundae',6,45,15,50,12,'cups'],['Apple Pie',6,49,17,40,10,'pcs'],['Halo-Halo',6,89,33,4,10,'cups'],['Soft Serve Cone',6,20,6,100,20,'pcs'],
  ['Burger Fries & Drink Combo',7,149,60,50,10,'sets'],['Chicken Spaghetti Combo',7,159,69,45,10,'sets'],['Family Bucket (6 pcs)',7,549,258,15,5,'buckets'],['Kiddie Meal',7,129,55,30,8,'sets'],
  ['Gravy Cup',8,15,4,200,40,'cups'],['Extra Cheese',8,15,5,150,30,'slices']
];

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const pickW = (rnd, pairs) => { const tot = sum(pairs, p => p[1]); let x = rnd() * tot; for (const p of pairs) { if ((x -= p[1]) < 0) return p[0]; } return pairs[0][0]; };

const INFO_KEYS = ['name','address','phone','email','tin'];

/* Fills the current business (BIZ) with defaults. withSamples adds the starter menu, promos and 90 days of example sales. */
function seedBusiness(withSamples, info = {}) {
  const now = new Date();
  S.settings = {...DEFAULT_SETTINGS, ...Object.fromEntries(Object.entries(info).filter(([k, v]) => INFO_KEYS.includes(k) && v != null))};
  S.held = []; S.notifs = []; S.stockMoves = []; S.cart = null;
  if (!withSamples) {
    S.categories = [{id: 'c9', name: 'Others'}];   // new businesses start with one category; the owner adds their own
    S.products = []; S.txns = [];
    S.discounts = [{id: 'd1', name: 'Senior Citizen', type: 'senior', value: 20, minSpend: 0, from: '', to: '', enabled: true}, {id: 'd2', name: 'PWD', type: 'pwd', value: 20, minSpend: 0, from: '', to: '', enabled: true}];
    S.register = {current: null, history: []}; S.meta = {receiptCounter: 1000, seeded: now.toISOString()};
    notify('info', 'Welcome to KitaKo', 'Your business is ready. Add your menu in Products, then start selling in Point of Sale.', true);
    save(); return;
  }
  S.categories = CATS.map((n, i) => ({id: 'c' + (i + 1), name: n}));
  S.products = PRODUCTS.map((p, i) => ({
    id: 'p' + (i + 1), sku: CATS[p[1]].slice(0, 3).toUpperCase().replace(/\s/g, '') + '-' + pad(i + 1, 3), name: p[0], cat: 'c' + (p[1] + 1),
    price: p[2], cost: p[3], stock: p[4], min: p[5], unit: p[6], desc: '', available: p[0] !== 'Chicken Alfredo', updated: now.toISOString()
  }));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1), monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  S.discounts = [
    {id: 'd1', name: 'Senior Citizen', type: 'senior', value: 20, minSpend: 0, from: '', to: '', enabled: true},
    {id: 'd2', name: 'PWD', type: 'pwd', value: 20, minSpend: 0, from: '', to: '', enabled: true},
    {id: 'd3', name: 'Payday Promo 10%', type: 'promo', value: 10, minSpend: 300, from: dayKey(monthStart), to: dayKey(monthEnd), enabled: true},
    {id: 'd4', name: '₱50 Off Voucher', type: 'fixed', value: 50, minSpend: 0, from: '', to: '', enabled: true},
    {id: 'd5', name: 'Staff Meal 15%', type: 'percent', value: 15, minSpend: 0, from: '', to: '', enabled: false}
  ];
  S.held = []; S.notifs = []; S.stockMoves = []; S.cart = null;
  // example sales history: last 90 days
  const rnd = mulberry32(20261124), txns = [];
  const sellable = S.products.filter(p => p.available && p.stock > 0);
  
  for (let d = 89; d >= 0; d--) {
    const day = sod(addDays(now, -d)), wk = day.getDay() === 0 || day.getDay() === 6;
    const n = Math.floor(10 + rnd() * 12 + (wk ? 6 : 0));
    for (let k = 0; k < n; k++) {
      const hr = pickW(rnd, [[9,2],[10,4],[11,9],[12,14],[13,10],[14,5],[15,5],[16,5],[17,8],[18,13],[19,11],[20,6],[21,3]]);
      const at = new Date(day); at.setHours(hr, Math.floor(rnd() * 60), Math.floor(rnd() * 60));
      if (at > now) continue;
      const items = [], cnt = 1 + Math.floor(rnd() * 4);
      for (let j = 0; j < cnt; j++) {
        const p = sellable[Math.floor(rnd() * sellable.length)];
        const ex = items.find(x => x.pid === p.id);
        const q = 1 + Math.floor(rnd() * (p.price > 300 ? 1 : 3));
        if (ex) ex.qty += q; else items.push({pid: p.id, name: p.name, sku: p.sku, cat: p.cat, catName: catName(p.cat), price: p.price, cost: p.cost, qty: q});
      }
      const orderType = pickW(rnd, [['dine-in',50],['takeout',35],['delivery',15]]);
      const discount = rnd() < 0.08 ? S.discounts[0] : rnd() < 0.04 ? S.discounts[3] : null;
      const c = calc(items, discount, orderType);
      const method = pickW(rnd, [['Cash',56],['GCash',20],['Maya',8],['Debit Card',6],['Credit Card',10]]);
      let received = c.total;
      if (method === 'Cash') { const steps = [20, 50, 100, 500, 1000]; const st = steps.find(s => s >= c.total / 3) || 1000; received = Math.ceil(c.total / st) * st; }
      txns.push({at, items, c, discount, method, received, orderType});
    }
  }
  txns.sort((a, b) => a.at - b.at);
  let rc = 1000;
  S.txns = txns.map(x => buildTxn({...x, customer: '', notes: '', cashier: 'Juan Dela Cruz', rc: ++rc}));
  S.meta = {receiptCounter: rc, seeded: now.toISOString()};
  const y = addDays(now, -1); const o = new Date(y); o.setHours(8, 0, 0); const cAt = new Date(y); cAt.setHours(22, 5, 0);
  const ycash = r2(sum(S.txns.filter(t => t.method === 'Cash' && dayKey(t.date) === dayKey(y)), t => t.total));
  S.register = {current: null, history: [{
    id: 'shift-sample', openedAt: o.toISOString(), closedAt: cAt.toISOString(), opening: 3000, by: 'Juan Dela Cruz',
    moves: [{id: 'm1', type: 'expense', amount: 350, reason: 'LPG refill', at: new Date(y.setHours(14, 10)).toISOString()}, {id: 'm2', type: 'withdraw', amount: 5000, reason: 'Mid-day bank deposit', at: new Date(y.setHours(16, 30)).toISOString()}],
    cashSales: ycash, expected: r2(3000 + ycash - 350 - 5000), actual: r2(3000 + ycash - 350 - 5000 - 20), variance: -20
  }]};
  notify('info', 'Starter menu added', 'Products, discounts and 90 days of example sales were added so you can explore the reports. Edit or delete any of them in Products, Discounts and Transaction History.', true);
  S.products.filter(p => p.stock <= p.min).forEach(p => notify(p.stock <= 0 ? 'out' : 'low', p.stock <= 0 ? 'Out of stock' : 'Low stock', `${p.name}: ${p.stock} ${p.unit} left (minimum ${p.min}).`, true));
  save();
}

