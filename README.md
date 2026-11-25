<p align="center">
  <img src="assets/img/logo-white.png" alt="KitaKo logo" width="120">
</p>

<h1 align="center">KitaKo</h1>

<p align="center">
  A cashier (point-of-sale) system for sari-sari stores, cafés, food stalls, bakeries and small shops.<br>
  <b>Live app: <a href="https://kitako-lake.vercel.app">kitako-lake.vercel.app</a></b>
</p>

---

KitaKo runs in the browser on a laptop, tablet or phone. The owner sets up the business, menu and staff; cashiers ring up sales at the counter. Everything is saved online in [Supabase](https://supabase.com), so several devices can sell for the same business at the same time.

## Features

- **Point of sale** — tap products to build an order, dine-in / takeout / delivery, hold and resume orders, Senior Citizen and PWD discounts, promos, 12% VAT (inclusive or added).
- **Payments** — cash with change computed, plus GCash, Maya and card with the reference number recorded.
- **Receipts** — printable and downloadable (PDF) receipts, searchable by receipt number.
- **Cash register shifts** — selling starts only after a shift is opened with the opening cash; cash added, withdrawn and spent is recorded; closing the shift reconciles the drawer and shows any shortage or overage. You close your own shift before logging out.
- **Products and inventory** — categories, stock levels with low- and out-of-stock alerts, stock adjustments with a movement history.
- **Reports** — dashboard and sales reports by day, week, month, year or custom range: best and least sellers, sales by category, payment method, order type and hour, estimated profit. Export to CSV, Excel or PDF.
- **Owners and cashiers** — owners manage everything; cashiers see the POS, cash register and their profile, and open the rest ("business mode") with the business password.
- **Accounts** — sign up with email (verified with a code) or Google, password reset by email code.

## Use it

Open **https://kitako-lake.vercel.app**.

1. Choose **Create account** and sign up as a **Business owner**.
2. Enter the code sent to your email, then set up your business. Tick **Add a starter menu** to get example products and 90 days of example sales to explore.
3. Cashiers sign up as **Cashier** and join with the business username shown in **Settings → Business account & staff**.

There are no built-in accounts.

## Tech stack

- HTML, CSS and plain JavaScript in an MVC structure — no framework and no build step.
- [Supabase](https://supabase.com) — Postgres database, Auth (email + Google) and Row Level Security.
- From a CDN: Supabase JS, Chart.js (charts), jsPDF + AutoTable (PDF), SheetJS (Excel), Google Fonts (Plus Jakarta Sans, IBM Plex Mono).
- Hosted on [Vercel](https://vercel.com) as a static site.

## Run it locally

You need Python 3 and an internet connection.

```
python tools/serve.py
```

Then open **http://localhost:5500**. In VS Code you can press **F5** instead. This server turns off browser caching, so your edits show up on a normal reload.

Opening `index.html` straight from disk does not work: sign-in needs an `http://` or `https://` address.

To get a single shareable file, run `python tools/build.py`. It writes `dist/KitaKo.html` with the CSS, scripts and images inlined. It still connects to Supabase, so host it at an address listed in Supabase (step 3 below).

## Set up your own Supabase project

The app in this repository is already connected to a Supabase project through [`js/config.js`](js/config.js). To use your own:

1. **Create the database.** In your Supabase project open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It creates the tables, security rules and functions, and is safe to run again.
2. **Connect the app.** Open **Project Settings → API** (or the **Connect** button) and copy the **Project URL** and the **Publishable key** (`sb_publishable_…`, or the legacy `anon` key) into [`js/config.js`](js/config.js). Never put the secret / `service_role` key in the app.
3. **Set the site addresses.** In **Authentication → URL Configuration** set **Site URL** to your live address (for example `https://kitako-lake.vercel.app`) and add each address you open KitaKo from under **Redirect URLs**, for example `https://kitako-lake.vercel.app/**` and `http://localhost:5500/**`.
4. **Make emails send codes.** KitaKo asks for a code from the email, not a link. In **Authentication → Emails → Templates**, put `{{ .Token }}` in **Confirm signup**, **Reset password** and **Change email address**, for example `<p>Your KitaKo code is <b>{{ .Token }}</b></p>`.
5. **Email changes.** Under **Authentication → Sign In / Providers → Email**, turn off **Secure email change** so a new email needs only the code sent to the new address.
6. **Email sending.** Supabase's built-in sender only sends a few emails per hour and is meant for testing. For real use, add your own SMTP server (for example Resend or Brevo) under **Authentication → Emails → SMTP Settings**.
7. **Google sign-in (optional).** In Google Cloud Console create an OAuth client (**Web application**) with `https://<your-project>.supabase.co/auth/v1/callback` as an **Authorized redirect URI**. Then in Supabase **Authentication → Sign In / Providers → Google**, turn it on and paste the client ID and secret.

## Deploy on Vercel

1. On [vercel.com](https://vercel.com), choose **Add New… → Project** and import this GitHub repository.
2. Set **Framework Preset** to **Other** and leave the build command and output directory empty. No environment variables are needed.
3. Click **Deploy**, then add the Vercel address to Supabase (step 3 above).

Every push to `main` deploys again automatically.

## Project structure (MVC)

```
kitako/
├── index.html                 Page markup (login, sign-up steps, app shell) and script loading order
├── assets/
│   ├── css/style.css          All styles (navy #0B3866 + mint #95F9C3)
│   └── img/                   logo.png, logo-white.png, favicon.png, google.png
├── js/
│   ├── config.js              Supabase project URL and publishable key
│   ├── utils.js               Shared helpers: $ / $$, escaping, money, dates
│   ├── models/                MODEL — data and business rules, no screen code
│   │   ├── Store.js           Supabase client, loading and saving business data (with merge), session, ModelEvents
│   │   ├── SampleData.js      Default settings, optional starter menu with 90 days of example sales
│   │   ├── AccountModel.js    Users, roles, access rules, readable error messages
│   │   ├── ProductModel.js    Products, categories, stock status, stock movement log
│   │   ├── SalesModel.js      Pricing (VAT, Senior/PWD), discounts, transactions, cart
│   │   ├── NotificationModel.js  Notifications (honours the on/off switches in Settings)
│   │   ├── ReportModel.js     Sales analytics: trends, best sellers, profit estimates
│   │   └── RegisterModel.js   Cash drawer arithmetic for shifts
│   ├── views/                 VIEW — what the user sees
│   │   ├── components.js      Icons, toasts, dialogs, charts, receipt layout, date picker, dropdown list
│   │   ├── exports.js         CSV, Excel and PDF output (receipts, reports, shift reports)
│   │   └── pages/*View.js     HTML templates for each screen and dialog
│   ├── controllers/           CONTROLLER — handles user actions
│   │   ├── AppController.js   Routing, sidebar, roles/business mode, logout
│   │   ├── AuthController.js  Supabase Auth: log in, Google, 3-step sign-up with emailed code, password reset
│   │   └── …Controller.js     One per screen: Dashboard, Pos, Product, Inventory, Transaction,
│   │                          Receipt, Report, Discount, Register, Notification, Settings
│   └── app.js                 Boot: restore the session, show login or app
├── supabase/schema.sql        Database tables, security rules and functions (run once in Supabase)
├── tools/serve.py             Local server for development (no caching)
└── tools/build.py             Bundles everything into dist/KitaKo.html
```

### How the layers talk

- **Controllers** respond to clicks and form submits. They validate input, call **model** functions to change data, then render a **view** template into the page and attach event handlers.
- **Models** hold the state (`S`) and the rules: VAT and discount maths, stock deduction, access control, syncing with Supabase. They never touch the screen. When a model needs the screen to react, it emits an event through `ModelEvents` (for example `notifications:changed`, `data:remote`, `sync:error`) and a view subscribes to it (observer pattern).
- **Views** return HTML strings. A controller passes in the values a template needs (for example `PosView.totals({c, d, lines, st, t})`); templates may also read model data for display.

Example — completing a cash sale:

1. `PosController.openPayment()` shows `PosView.checkoutModal(...)` and `PosView.cashPane(...)`.
2. On **Confirm payment**, `PosController.completeSale()` calls the models: `buildTxn()` (SalesModel) to create the transaction, `changeStock()` (ProductModel) for every item, and `notify()` (NotificationModel).
3. It saves through `save()` (Store), which uploads the changed data to Supabase in the background, then shows the receipt using `ReceiptView` and `receiptHTML()` (views/components).

The files are plain browser scripts (not ES modules). They share one global scope and load in this order: `config → utils → models → views → controllers → app.js`. The full list is at the bottom of `index.html`.

## Data storage

Everything is stored in Supabase:

| Where | Contents |
|---|---|
| Supabase Auth (`auth.users`) | Logins: email + password (hashed by Supabase), Google accounts, sessions |
| `profiles` | Name, username, email, role (owner / cashier) and business of each login |
| `businesses` | Business name, business username and owner |
| `business_secrets` | Business password (bcrypt hash). No one can read this table; the app only asks "is this password right?" |
| `business_data` | One business's data, one row per type: settings, categories, products, held orders, discounts, cash register, notifications, receipt counter. Sales and stock movements get one row per month (`txns:2026-11`) so a new sale only uploads the current month |

Row Level Security limits every login to its own business. Owners and cashiers can't change their own role or business directly; that only happens through the database functions in `schema.sql`.

**Several devices at once.** Each row has a version number. If two devices change the same row, the second save is refused, the app merges the two versions (both sales are kept, stock changes add up, edits to different items or fields are both kept) and saves again. Other open devices pick up changes within about 20 seconds, or at once when the realtime connection is available. If two devices edit the same field of the same item at the same moment, the last save wins.

**This device only:** the open cart (each cashier has their own), the sidebar collapse setting and "Remember me". Without "Remember me" the session ends when the tab closes.

## Payments

GCash, Maya and card payments are recorded, not processed: the customer pays on their own app or card terminal, and the cashier types the reference or approval number into KitaKo. KitaKo does not connect to a payment gateway.

## Known limits

- There is no offline mode. If the connection drops, KitaKo warns you and keeps retrying while the page stays open.
- Two cashiers who finish a sale in the same second can get the same receipt number.
- Logging in with a username looks up that username's email, so someone who knows a username can find out its email address.
- Receipts are not BIR-accredited official receipts.
