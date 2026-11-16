# Phase 2 — Vendor Web Dashboard: Brief for the Planning Session

> Audience: a new Claude session that will **plan** (then build) the C2V vendor dashboard.
> Read this and `docs/c2v-user-guide.md` (what the bot does, roles, order lifecycle). Start with the
> brainstorming skill and settle the **open decisions** (§8) with the user before writing the plan.
>
> **Two repos.** This dashboard repo is `/Users/srirajdev/development/C2V_Product/C2V_AdminDashboard`.
> The bot server is a separate repo at **`/Users/srirajdev/development/C2V_Product/C2V`**
> (branch `feat/admin-api`, built on `feat/phase1-bot`). Every `src/...` path in this brief means a file **in the bot repo**.
> You should not need to read bot code: **`docs/admin-api.md` (in this repo) is the full API contract**.
>
> **Decided since this brief was written (2026-11-15/16), these override the sections below:**
> - **Stack:** Next.js (App Router) + TypeScript + shadcn/ui in this repo (see `CLAUDE.md` and the
>   `c2v-project-structure` skill). Replaces the "SPA (React + Vite)" suggestion in §7; settles §8.1's stack.
> - **Data access (§7, §8.4): the admin API on the bot server, already built.** The bot server exposes
>   `/admin/*` (vendor) and `/partner/:token/*` (delivery partner link), specified in `docs/admin-api.md`.
>   The Next.js server calls it through one client in `lib/api`. No `lib/db`, no direct Postgres or Supabase access.
>   All business rules (transitions, delivered template, Cashfree refunds, 8-product limit, 24 h reply window) live in the API.
> - **Auth:** the API's login returns a bearer token (30-day session). Next.js keeps it in an httpOnly, Secure,
>   SameSite cookie and attaches `Authorization: Bearer` from the server side only; the browser never sees the token
>   or calls the bot server directly. Vendor logins are created by the operator with `pnpm vendors create` in the bot repo
>   (NutriFarm's login exists). One login per tenant for now (the table allows more later).
> - **Delivery partners:** the dashboard page `/p/[token]` calls the bot's `/partner/:token/*` endpoints server-side.
> - **Deferred:** rate limiting (login and partner link), audit trail, staff logins, super-admin view, subscriptions UI.
> - **Already in the API, so in scope for the UI:** chat reply within 24 h (§8.5), with full WhatsApp `payload` per message
>   for a WhatsApp-like view.
>
> **How the user works:** one step at a time. Present each step, wait for review and approval, and
> commit only after approval, with commit messages of 2–3 lines at most. Before starting a step, say what you need
> from the user. When the user questions a design, discuss before changing anything. Secrets
> go only in git-ignored env files, never in chat, docs or commits.

## 1. Context

- C2V is a **multi-tenant WhatsApp commerce bot**. Phase 1 (done) is a Hono/TypeScript server on Cloud Run
  with Supabase Postgres. Customers order on WhatsApp and pay through Cashfree payment links. The server
  stores customers, orders, payments, products, pincodes, delivery partners and chat messages, every row
  scoped by `tenant_id`.
- First tenant: **NutriFarm Eggs** (`nutrifarm`). More tenants will follow on the same server and database.
- Today vendor operations run through a CLI (`pnpm orders <tenant> <code> assign|out-for-delivery|delivered|cancel|refund`).
  The dashboard replaces that and lets vendors manage their catalogue themselves.

## 2. Goal

A web dashboard where each client's vendor logs in and runs day-to-day operations for **their own
business only**: see and fulfil orders, assign delivery partners, handle cancellations and refunds,
manage products, delivery areas, partners and settings, and read or reply to customer chats.

**It is one dashboard for all tenants**, not one per client. Every query and action is scoped to the
logged-in vendor's `tenant_id`. A C2V-operator (super-admin) view across tenants is optional (see §8).

## 3. Users

- **Vendor** — one login per tenant (Phase 1 spec: "single vendor login created manually"). Sees only their tenant.
- **C2V operator** (optional) — creates tenants and vendor logins, can switch between tenants.
- **Vendor** can change their own password from the dashboard (current password + new password; only the hash is stored).
- **Delivery partners: no username/password. Each gets a private link** (user decision 2026-11-15, see §4.9).

## 4. Functional requirements

### 4.1 Orders (primary screen)
- List with filters: delivery date (default: upcoming), status, pincode, assigned partner, order code or
  customer search. Default view shows only real orders (`confirmed` and later). Toggle to include
  `payment_pending`, `expired`, `payment_failed`.
- Order detail: code, status timeline (created, paid_at, delivered_at), items (name, qty, unit price, line
  total from `order_items` snapshot), totals, delivery date, address snapshot, pincode, map link from
  `location` (`https://maps.google.com/?q=<lat>,<lng>`), customer, payment status, assigned partner.
- Actions (only those valid for the current status are shown):
  - `confirmed → assigned` (pick an active partner) · `assigned → assigned` (reassign) · `assigned → out_for_delivery`
  - `out_for_delivery → delivered` (sends the customer the `order_delivered` WhatsApp template)
  - `confirmed | assigned | out_for_delivery → cancelled` (status only, **no money movement**)
  - **Refund** (full amount via Cashfree; also cancels if not yet delivered; idempotent)
  - Bulk assign for many orders at once is a likely need.
- **These must call the existing server functions**, not re-implement them: `updateStatus(deps, tenant,
  orderId, to, { partnerId })` and `refundOrder(deps, tenant, orderId)` in `src/orders/order-status.ts`.
  They enforce the transition rules, race safety, template sending and Cashfree idempotency. Errors:
  `InvalidTransitionError`, `NotSupportedError`, `OrderNotFoundError`. `updateStatus` returns
  `{ order, notified }`: show a warning when `notified` is false (delivered, but the customer message failed).
- Cancel ≠ refund (user decision). After cancelling a paid order, prompt "Refund now?"

### 4.2 Today's deliveries
- Orders for a delivery date grouped by partner and pincode. Printable / shareable list per partner (name,
  phone, address, landmark, map link, items, order code), e.g. a "Share on WhatsApp" text or a print view.

### 4.3 Needs refund (user decision 2026-11-14)
- Payments with status `paid` whose order is `cancelled` or `expired` (expired = the customer paid after the
  link closed). Show order code, customer, amount, paid time and a **Refund** button calling `refundOrder`.
  No email alerts.

### 4.4 Payments
- List of payments (status `created | paid | failed | expired | refunded`, amount, order code, time).
  Read-only apart from Refund.

### 4.5 Customers
- List and search (profile name, phone `wa_id`, or BSUID-only with the phone from the address), saved address,
  location, order history and totals.

### 4.6 Chats
- Per-customer thread from `messages` (in/out, text summary, time). Messages are **kept 3 days only**
  (nightly pg_cron purge), so show that in the UI.
- Reply box: free-form replies are only allowed **within 24 h of the customer's last inbound message**
  (WhatsApp rule). Outside the window, disable the box and explain why. Replies must go through the server's
  WhatsApp sender and be logged with `sendAndLog` so they appear in the thread.
- Spec backlog #1 "human takeover" (pause the bot for a customer) is closely related. Ask the user whether
  it's in scope.

### 4.7 Catalogue and settings
- **Products:** name, price (₹, stored as paise), active, sort order. The order form shows at most **8
  active products** (fixed Flow slots): enforce or warn. `sku` is unique per tenant. Don't hard-delete a
  product referenced by orders; deactivate instead.
- **Pincodes:** 6-digit pincode, delivery weekday (0–6; check `src/domain/delivery-date.ts` for the exact
  convention), active, note.
- **Delivery partners:** name, phone (12-digit `91…`), active.
- **Tenant settings** (`tenants` row): support phone (Help button), delivery fee (paise), minimum order
  (paise), welcome image URL.
- Changes take effect on the customer's next order form. No Meta re-publishing is needed.

### 4.9 Delivery partner link (user decision 2026-11-15)
- Vendor adds a partner with **name + phone** only. The server generates a random access token (≥ 32 random
  bytes, base64url) and the dashboard shows the link `https://<dashboard>/p/<token>` with **Copy link** and
  **Share on WhatsApp** (prefilled `wa.me/<partnerPhone>?text=...`).
- Storage: new nullable column on `delivery_partners`, e.g. `access_token` (unique) + `access_token_created_at`.
  The token is stored as-is so the vendor can copy the link again at any time (DB access is already locked by
  RLS; a hashed token would mean the link can't be re-copied).
- **Reset link** = replace the token with a new random one (one UPDATE). The old link stops working at once.
  **Deactivate partner** (`active = false`) also blocks the link. Both are one click in the dashboard.
- Partner page (`/p/:token`, no login, mobile-first, separate from the vendor dashboard): resolve token →
  active partner → tenant. Show **only orders assigned to that partner** in status `assigned` /
  `out_for_delivery` (today and upcoming, plus today's delivered for reference): order code, customer name,
  tap-to-call phone, address, landmark, map button (`location`), items. No prices, payments or other customers.
- Actions: **Out for delivery** and **Delivered**, calling the same `updateStatus` (so "Delivered" sends the
  customer template). Server-side checks: the order belongs to the token's partner and tenant, and is still
  assigned to that partner. Partners can't cancel, refund, reassign or change their link or password.
- Rate-limit `/p/*`, never log tokens, and use `Referrer-Policy: no-referrer` on the partner page.

### 4.8 Hidden while subscriptions are on hold
- Subscriptions screens (tables `subscriptions`, `subscription_items`, `payments.kind = subscription_charge`)
  exist in the schema. Design so they can be added later, but don't build them now.

## 5. Data model (Postgres, all money in integer paise)

| Table | Key columns |
|---|---|
| `tenants` | `id` (text, e.g. `nutrifarm`), support_phone, welcome_image_url, delivery_fee_paise, min_order_paise |
| `customers` | id, tenant_id, wa_key (unique per tenant), wa_id (phone, nullable), bsuid (nullable), profile_name, email, default_address (jsonb `{name,line1,landmark?,pincode,phone?}`), default_location (jsonb `{lat,lng}`) |
| `products` | id, tenant_id, sku, name, price_paise, active, sort_order |
| `pincodes` | id, tenant_id, pincode char(6), delivery_weekday smallint, active, note |
| `delivery_partners` | id, tenant_id, name, phone, active |
| `orders` | id, tenant_id, order_code (unique per tenant), customer_id, source (`one_time`/`subscription`), status, delivery_date, address (snapshot), location, pincode, subtotal/delivery_fee/total_paise, assigned_partner_id, paid_at, delivered_at, created_at, updated_at |
| `order_items` | order_id, product_id, name + unit_price_paise (snapshots), quantity, line_total_paise, position |
| `payments` | id, tenant_id, order_id, kind (`link`/`subscription_charge`), provider_ref (= order id for links), amount_paise, status, link_url, raw (jsonb), created_at |
| `messages` | id, tenant_id, customer_id, direction (`in`/`out`), wa_message_id, type, text, payload (jsonb), created_at |

Order status enum: `payment_pending, confirmed, assigned, out_for_delivery, delivered, cancelled, payment_failed, expired`.
Schema source of truth: `src/db/schema.ts`; migrations in `src/db/migrations` (drizzle-kit).

## 6. Constraints and non-functional requirements

- **Tenant isolation is the top security requirement.** Every read and write is filtered by the session's
  tenant. Write tests that prove one tenant can't read or change another's data.
- **RLS is enabled with no policies on all tables**, so Supabase's public Data API (anon key) sees nothing.
  The server connects as `postgres` (bypasses RLS). If the dashboard ever queries Supabase directly from the
  browser, it needs real RLS policies plus Supabase Auth. That's a big decision (§8). Don't silently
  open tables.
- **Supabase free tier**: 500 MB DB, **5 GB egress/month**. Paginate, fetch incrementally, never load
  whole tables. Polling is fine (live push via SSE is backlog #9).
- Indian locale: ₹ formatting from paise, dates in Asia/Kolkata, phone numbers in 91XXXXXXXXXX form.
- Mobile-friendly: vendors will often use a phone.
- Secrets stay server-side (Cashfree keys, WhatsApp tokens). The browser never talks to Cashfree or Meta directly.
- The existing server stack is Node 22, TypeScript strict, Hono, drizzle-orm, vitest + pglite, pnpm.
  Follow the repo's conventions (small focused modules, tests next to features, no secrets in git).
- Cancel/refund/delivered rules and copy already exist. Reuse them; don't duplicate business logic in the frontend.

## 7. Suggested shape (to confirm with the user)

- **Backend:** add an authenticated `/admin/*` JSON API to the existing C2V Hono server (same deploy, same DB
  access, direct reuse of `updateStatus`, `refundOrder`, repos and `sendAndLog`). Tenant comes from the
  session, never from the request body.
- **Frontend:** a separate SPA (e.g. React + Vite) served as static files (Cloud Run, Firebase Hosting or
  Cloud Storage), or server-rendered pages from Hono if the user prefers one deployable.
- **Auth (user preference, 2026-11-15): no Google / Supabase Auth.** The C2V operator generates a username +
  random password per client and hands it over. Store it in a new `vendor_users` table (tenant_id, username,
  **password hash** (argon2id or bcrypt, never plaintext), active, created_at), created by an operator CLI
  (e.g. `ENV=prod pnpm vendors:create <tenantId> <username>` prints the generated password once; a reset
  command too). Not hard-coded in code/env, so passwords can be reset or revoked without a redeploy.
  Login → httpOnly, Secure, SameSite cookie session (signed or stored server-side) holding the
  `tenant_id`. Add login rate limiting and CSRF protection for state-changing requests.
- **Tenant isolation design:** the browser never sends a tenant id. One auth middleware on `/admin/*` resolves
  the session → `tenant_id` and passes it to every handler. Every repo function takes `tenantId` and filters on
  it (the existing code already follows this: e.g. `findOrderById(db, tenantId, id)`, `updateStatus(deps,
  tenant, orderId, …)` match on `id AND tenant_id`). Looking up another tenant's order id therefore returns
  "not found". Tests per endpoint: tenant A's session can't read, list or modify tenant B's rows.

## 8. Open decisions (ask the user during brainstorming)

1. Frontend stack and hosting (SPA vs server-rendered; where hosted; domain).
2. Auth: **decided**: operator-generated username + password per client (see §7). Still open: one login per client or several staff logins?
3. C2V super-admin view (switch tenants, create tenants/vendors) — now or later?
4. API inside the existing server (recommended) vs a separate service.
5. Chats reply and human takeover (backlog #1) — in scope?
6. Customer notifications on cancel/refund (none today) — add?
7. Out-for-delivery WhatsApp message (backlog #17, approved template `out_for_delivery_template`) — enable with the dashboard?
8. Paid-after-close customer message + refund flow (backlog #16).
9. Delivery partner access: **decided**: private link per partner (§4.9).
10. Do changes need an audit trail (who changed status, when)? Today only `updated_at` exists.

## 9. Acceptance (first release)

- A vendor logs in and sees only their tenant's data.
- Can filter orders, run every valid status transition and refund from the UI, with the same rules the CLI enforces.
- Today's deliveries per partner can be shared.
- Needs refund list works end to end against Cashfree sandbox.
- Products, pincodes, partners and settings are editable, and changes show up in the next WhatsApp order form.
- Chats readable; reply works inside the 24 h window, blocked outside it.
- Tests for tenant isolation, auth, and each admin endpoint. `pnpm test`, `pnpm typecheck`, `pnpm build` clean.
