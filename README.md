# KitaKo

A cashier (point-of-sale) system for small business owners — sari-sari stores, cafés, food stalls, bakeries, retail and service shops. Frontend-only prototype: HTML, CSS and vanilla JavaScript, with data saved in the browser's `localStorage`.

## Run it

Open `index.html` in a browser (Chrome, Edge, Firefox). No server or build step is needed.

An internet connection is needed for the libraries loaded from a CDN: Chart.js (charts), jsPDF + AutoTable (PDF receipts and reports), SheetJS (Excel export) and Google Fonts. Everything else works offline.

To get a single shareable file, run `python3 tools/build.py`. It writes `dist/KitaKo.html` with the CSS, scripts and images inlined.

### First run

There are no built-in accounts. Choose **Create account**, sign up as a business owner and set up your business (tick *Start with a sample menu* if you want sample data). Cashiers then sign up and join using the business username.

## Project structure (MVC)

```
kitako/
├── index.html                 Page markup (login, sign-up steps, app shell) and script loading order
├── assets/
│   ├── css/style.css          All styles (navy #0B3866 + mint #95F9C3, light mode)
│   └── img/                   logo.png, favicon.png, google.png
├── js/
│   ├── utils.js               Shared helpers: $ / $$, escaping, money, dates, hashing
│   ├── models/                MODEL — data and business rules, no screen code
│   │   ├── Store.js           localStorage access, per-business data, session, ModelEvents
│   │   ├── SampleData.js      Default settings, sample menu, 90 days of sample sales
│   │   ├── AccountModel.js    Users, roles, access rules, one-time email codes (OTP)
│   │   ├── ProductModel.js    Products, categories, stock status, stock movement log
│   │   ├── SalesModel.js      Pricing (12% VAT, Senior/PWD), discounts, transactions, cart
│   │   ├── NotificationModel.js  Notifications (honours the on/off switches in Settings)
│   │   ├── ReportModel.js     Sales analytics: trends, best sellers, profit estimates
│   │   └── RegisterModel.js   Cash drawer arithmetic for shifts
│   ├── views/                 VIEW — what the user sees
│   │   ├── components.js      Icons, toasts, dialogs, charts, receipt layout, simulated inbox
│   │   ├── exports.js         CSV, Excel and PDF output (receipts, reports, shift reports)
│   │   └── pages/*View.js     HTML templates for each screen and dialog
│   ├── controllers/           CONTROLLER — handles user actions
│   │   ├── AppController.js   Routing, sidebar, roles/business mode, account menu
│   │   ├── AuthController.js  Log in, Google (simulated), 3-step sign-up, OTP, password reset
│   │   └── …Controller.js     One per screen: Dashboard, Pos, Product, Inventory, Transaction,
│   │                          Receipt, Report, Discount, Register, Notification, Settings
│   └── app.js                 Boot: load data, show login or app
└── tools/build.py             Bundles everything into dist/KitaKo.html
```

### How the layers talk

- **Controllers** respond to clicks and form submits. They validate input, call **model** functions to change data, then render a **view** template into the page and attach event handlers.
- **Models** hold the state (`S`) and the rules: VAT and discount maths, stock deduction, OTP checking, access control. They never touch the screen. When a model needs the screen to react, it emits an event through `ModelEvents` (for example `notifications:changed`, `otp:sent`) and a view subscribes to it (observer pattern).
- **Views** return HTML strings. A controller passes in the values a template needs (for example `PosView.totals({c, d, lines, st, t})`); templates may also read model data for display.

Example — completing a cash sale:

1. `PosController.openPayment()` shows `PosView.checkoutModal(...)` and `PosView.cashPane(...)`.
2. On **Confirm payment**, `PosController.completeSale()` calls the models: `buildTxn()` (SalesModel) to create the transaction, `changeStock()` (ProductModel) for every item, and `notify()` (NotificationModel).
3. It saves through `save()` (Store), then shows the receipt using `ReceiptView` and `receiptHTML()` (views/components).

### Script loading

The files are plain browser scripts (not ES modules), so the app also opens straight from a folder with `file://`. They share one global scope and load in this order: `utils → models → views → controllers → app.js`. The full list is at the bottom of `index.html`.

## Data storage

| Key | Contents |
|---|---|
| `kk_users`, `kk_businesses` | All accounts and businesses on this browser |
| `kk_session` | Logged-in user (localStorage if "Remember me", otherwise sessionStorage) |
| `kk_b_<businessId>_<key>` | One business's settings, categories, products, transactions, held orders, discounts, register, notifications, stock movements, cart |

Passwords are hashed in the browser for the prototype. This is **not** real security: a production version needs a server, a proper database and real authentication.

## Simulated features

These work end-to-end in the prototype but don't contact any real service:

- **Google sign-in** — an account picker that looks like Google's; nothing is sent to Google.
- **Email OTP** — codes appear in the on-screen "Simulated email inbox" instead of being emailed.
- **GCash / Maya / card payments** — the cashier types the reference or approval number; no payment gateway.
