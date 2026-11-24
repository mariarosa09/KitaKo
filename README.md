# KitaKo

A cashier (point-of-sale) system for small business owners — sari-sari stores, cafés, food stalls, bakeries, retail and service shops. HTML, CSS and vanilla JavaScript, with accounts and data stored in [Supabase](https://supabase.com) (Postgres + Auth).

## Set up Supabase (once)

1. **Create the database.** In your Supabase project open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It creates the tables, security rules and functions. It is safe to run again.
2. **Connect the app.** Open **Project Settings → API** (or the **Connect** button) and copy the **Project URL** and the **Publishable key** (`sb_publishable_…`, or the legacy `anon` key) into [`js/config.js`](js/config.js). Never use the secret / `service_role` key.
3. **Set the site address.** **Authentication → URL Configuration**: set **Site URL** to where you open KitaKo (for example `http://localhost:5500`) and add the same address under **Redirect URLs**.
4. **Make emails send codes.** KitaKo asks for a code from the email, not a link. In **Authentication → Emails → Templates**, put `{{ .Token }}` in these templates, for example `<p>Your KitaKo code is <b>{{ .Token }}</b></p>`:
   - **Confirm signup**
   - **Reset password**
   - **Change email address**
5. **Email limits.** Supabase's built-in email sender only sends a few emails per hour and is meant for testing. For real use, add your own SMTP server under **Authentication → Emails → SMTP Settings**. To test without email, you can turn off **Confirm email** under **Authentication → Sign In / Providers → Email** (sign-ups then skip the code step).
6. **Email changes.** Under **Authentication → Sign In / Providers → Email**, turn off **Secure email change** so a new email needs only the code sent to the new address.
7. **Google sign-in (optional).** In Google Cloud Console create an OAuth client (**Web application**) and add `https://<your-project>.supabase.co/auth/v1/callback` as an **Authorized redirect URI**. Then in Supabase **Authentication → Sign In / Providers → Google**, turn it on and paste the client ID and secret.

## Run it

Serve the folder and open it from a web address. Supabase sign-in, and Google in particular, need `http://` or `https://`, not a file opened from disk:

```
python -m http.server 5500
```

Then open `http://localhost:5500`. You need an internet connection: data is saved to Supabase as you work, and the libraries load from a CDN (Supabase JS, Chart.js, jsPDF + AutoTable, SheetJS, Google Fonts).

To get a single shareable file, run `python3 tools/build.py`. It writes `dist/KitaKo.html` with the CSS, scripts and images inlined. The file still connects to Supabase, so host it at an address listed in step 3.

### First run

There are no built-in accounts. Choose **Create account**, sign up as a **Business owner** and set up your business (tick *Start with a sample menu* if you want sample data). Cashiers then sign up as **Cashier** and join using the business username shown in **Settings → Business account & staff**.

## Project structure (MVC)

```
kitako/
├── index.html                 Page markup (login, sign-up steps, app shell) and script loading order
├── assets/
│   ├── css/style.css          All styles (navy #0B3866 + mint #95F9C3, light mode)
│   └── img/                   logo.png, favicon.png, google.png
├── js/
│   ├── config.js              Supabase project URL and publishable key
│   ├── utils.js               Shared helpers: $ / $$, escaping, money, dates
│   ├── models/                MODEL — data and business rules, no screen code
│   │   ├── Store.js           Supabase client, loading and saving business data (with merge), session, ModelEvents
│   │   ├── SampleData.js      Default settings, sample menu, 90 days of sample sales
│   │   ├── AccountModel.js    Users, roles, access rules, readable error messages
│   │   ├── ProductModel.js    Products, categories, stock status, stock movement log
│   │   ├── SalesModel.js      Pricing (12% VAT, Senior/PWD), discounts, transactions, cart
│   │   ├── NotificationModel.js  Notifications (honours the on/off switches in Settings)
│   │   ├── ReportModel.js     Sales analytics: trends, best sellers, profit estimates
│   │   └── RegisterModel.js   Cash drawer arithmetic for shifts
│   ├── views/                 VIEW — what the user sees
│   │   ├── components.js      Icons, toasts, dialogs, charts, receipt layout
│   │   ├── exports.js         CSV, Excel and PDF output (receipts, reports, shift reports)
│   │   └── pages/*View.js     HTML templates for each screen and dialog
│   ├── controllers/           CONTROLLER — handles user actions
│   │   ├── AppController.js   Routing, sidebar, roles/business mode, account menu
│   │   ├── AuthController.js  Supabase Auth: log in, Google, 3-step sign-up with emailed code, password reset
│   │   └── …Controller.js     One per screen: Dashboard, Pos, Product, Inventory, Transaction,
│   │                          Receipt, Report, Discount, Register, Notification, Settings
│   └── app.js                 Boot: restore the session, show login or app
├── supabase/schema.sql        Database tables, security rules and functions (run once in Supabase)
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

### Script loading

The files are plain browser scripts (not ES modules). They share one global scope and load in this order: `config → utils → models → views → controllers → app.js`. The full list is at the bottom of `index.html`.

## Data storage

Everything is stored in your Supabase project:

| Where | Contents |
|---|---|
| Supabase Auth (`auth.users`) | Logins: email + password (hashed by Supabase), Google accounts, sessions |
| `profiles` | Name, username, email, role (owner / cashier) and business of each login |
| `businesses` | Business name, business username and owner |
| `business_secrets` | Business password (bcrypt hash). No one can read this table; the app only asks "is this password right?" |
| `business_data` | One business's data, one row per type: settings, categories, products, held orders, discounts, cash register, notifications, receipt counter. Sales and stock movements get one row per month (`txns:2026-11`) so a new sale only uploads the current month |

Row Level Security limits every login to its own business. Owners and cashiers can't change their own role or business directly; that only happens through the database functions in `schema.sql`.

**Several devices at once.** Each row has a version number. If two devices change the same row, the second save is refused, the app merges the two versions (both sales are kept, stock changes add up, edits to different items or fields are both kept) and saves again. Other open devices pick up changes within about 20 seconds, or at once when the realtime connection is available. Two devices editing the same field of the same item at the same moment: the last save wins.

**This device only:** the open cart (each cashier has their own), the sidebar collapse setting and "Remember me". Without "Remember me" the session ends when the tab closes.

**Limits.** There is no offline mode: if the connection drops, KitaKo warns you and keeps retrying while the page stays open. Two cashiers who finish a sale in the same second can get the same receipt number. Logging in with a username looks up that username's email, so someone who knows a username can find out its email address.

## Simulated features

- **GCash / Maya / card payments** — the cashier types the reference or approval number; no payment gateway.
