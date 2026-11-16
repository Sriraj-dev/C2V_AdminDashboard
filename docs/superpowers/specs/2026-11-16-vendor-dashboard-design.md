# C2V Vendor Dashboard — First Release Design

Date: 2026-11-16. Settled with the user during brainstorming. Read with `CLAUDE.md`, `docs/admin-api.md`
(the API contract) and `docs/dashboard-brief.md` (its header wins over its older sections).

## 1. Intent

Each C2V client's vendor (first: NutriFarm Eggs) runs day-to-day operations from a browser, mostly a phone,
instead of asking the operator to run `pnpm orders ...`. Delivery partners get a private link to see and
complete their own deliveries. One dashboard serves all tenants; the tenant always comes from the session.

Success: the vendor can fulfil a delivery day end to end (assign, share the list, mark out for delivery and
delivered, or let partners do it from their link), handle cancellations and refunds, edit catalogue, areas,
partners and settings, and answer customers on chat, all on a phone, without the operator.

## 2. Goals, non-goals, anti-goals

**Goals (first release):** login/logout/change password; deliveries by day; orders (active + paged history)
with every valid action and bulk assign; needs-refund list; chats with WhatsApp-like thread and reply; partners
with private links; partner page `/p/[token]`; products; pincodes; settings; customers.

**Non-goals (decided):** hosting/deploy (not decided; Vercel likely, bot stays on Google Cloud), super-admin view,
staff logins, subscriptions UI, rate limiting, audit trail, human takeover, customer messages on cancel/refund,
out-for-delivery message, payments ledger (no API endpoint), live push (manual refresh instead; pages don't auto-refresh unless necessary, to save DB calls).

**Anti-goals:** any tenant id taken from the URL/body/client; the bearer token or any secret reaching browser JS;
business rules re-implemented in the dashboard (the UI only mirrors them to hide buttons); whole lists loaded when
the API pages them; decorative animation.

## 3. Constraints

- Next.js 16 (App Router; `proxy.ts` replaces `middleware.ts`; `cookies()`, `params`, `searchParams` are async),
  TypeScript strict, Tailwind, shadcn/ui, zod, react-hook-form, pnpm, Vitest.
- All data via `src/lib/api` → bot `/admin/*` and `/partner/:token/*`, server-side only. Contract is fixed; if it needs
  a change, tell the user (made in the bot repo).
- The shared Supabase DB is production. Live checks against the local bot write real rows: only with the user's OK.
- Money integer paise; dates shown in Asia/Kolkata; phones `91XXXXXXXXXX`.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` pass at the end of every step.

## 4. Approaches considered

Data access was the only real fork. (a) bot admin API, called from the Next.js server — **chosen** by the user: one
place for business rules and tenant isolation, which already exist and are tested in the bot. (b) direct Postgres reads
from Next.js with mutations through the bot — rejected: two data paths, duplicated schema types, tenant filtering in two
codebases. Everything else follows from the fixed stack and the fixed contract, so there was one sensible way.

## 5. Design

### 5.1 Session and API access
- Login posts to `/admin/auth/login`; the token goes in cookie `c2v_session` (httpOnly, SameSite=Lax, Secure when
  `NODE_ENV=production`, path `/`, `expires` = the API's `expiresAt`). The cookie is never read by client code.
- `src/proxy.ts` does an optimistic check: no cookie on a dashboard route → redirect `/login`. Real validation is the API.
- Any 401 from the API: in a Server Component, redirect to `/session-expired` (a route handler that deletes the cookie
  and redirects to `/login?expired=1`, since Server Components can't modify cookies); in a Server Action, delete the
  cookie and `redirect('/login?expired=1')`.
- 404 from a read → `notFound()`. Other errors from a read → thrown, shown by the segment's `error.tsx`. Mutations
  never throw to the UI: they return `{ ok: false, error: { code, message, fieldErrors? } }` and the UI shows `message`
  (field errors from `validation_error.details` go next to the field).
- Requests use `cache: 'no-store'` and a 10 s timeout; network failure maps to code `network_error`, message
  "Couldn't reach the server. Try again."
- CSRF: Server Actions' built-in origin check plus SameSite=Lax. No state change on GET except `/session-expired`
  (clears a cookie only).

### 5.2 Navigation and layout
- Wide screens (`md` and up): left sidebar with every page, tenant name and logout in the header.
- Phones: bottom bar with **Deliveries, Orders, Refunds, Chats, More**. "More" opens a sheet with Partners, Products,
  Pincodes, Customers, Settings, Log out. Every feature works on phones; wide tables turn into stacked cards.
- Refunds item shows a count badge (from `/admin/refunds/needed`), Chats shows the number of conversations with
  `canReply` and last message inbound.

### 5.3 Pages
| Route | Content |
|---|---|
| `/login` | Username + password. `?expired=1` shows "Your session ended. Log in again." |
| `/` Deliveries | From `/admin/orders/active`. Date selector of dates that have open orders (default: today in IST if it has orders, else the earliest upcoming date); overdue dates (before today, still open) flagged. Groups: **Unassigned** (multi-select + partner → bulk assign) then one group per partner, sub-grouped by pincode. Per partner: Copy list, Share on WhatsApp (`wa.me/<partnerPhone>?text=`), Copy partner link, Print. Refresh button; no auto-refresh. |
| `/orders` | Tabs via `?view=active|history`. Active: the active list filtered server-side by `date`, `pincode`, `partnerId`, `q`, with bulk assign. History: `/admin/orders` paged, filters `status`, `deliveryFrom`, `deliveryTo`, `pincode`, `partnerId`, `q`, `page` in URL; "include unpaid" toggle adds `payment_pending,payment_failed,expired` (default shows `confirmed` onward). |
| `/orders/[orderId]` | Code, status, timeline (created, paid, delivered), items, totals, delivery date, address, map link, customer (link to customer page, tap-to-call), payment status, partner. Actions shown only when valid: Assign/Reassign (active partners), Out for delivery, Delivered (warn if `notified:false`), Cancel (confirm; paid → then "Refund now?" dialog), Refund (confirm; shown when `paymentStatus === 'paid'`). Dialog copy says the customer is not notified on cancel/refund. 409 → show message and refresh. |
| `/refunds` | `/admin/refunds/needed`: code, customer, amount, paid time, reason label ("Cancelled after payment" / "Paid after link expired"), Refund with confirm. |
| `/chats`, `/chats/[customerId]` | List (latest first, reply-window badge). Thread drawn like WhatsApp: text, interactive button/list/flow (body + buttons as chips), button_reply/list_reply, nfm_reply ("Order form submitted"), image (link + caption), template (name + params), location (map link); anything else falls back to `text`, then "[type]". Reply box disabled with reason when `canReply` is false. "Messages are kept for 3 days" note. Refresh button; an "Auto-refresh" switch (off by default) polls the thread every 10 s while on and visible. On phones the list and thread are separate screens; on wide screens side by side. |
| `/partners` | List with status, open orders, link actions: Copy link, Share on WhatsApp, Reset link (confirm: old link stops), Generate link when `accessToken` is null. Add/edit (name, phone), Deactivate/Activate (warn if `openOrderCount > 0`: their orders stay assigned, reassign them). |
| `/products` | List sorted by sortOrder; add/edit (sku, name, price in ₹, sortOrder, active). Shows "N of 8 active"; API's `too_many_active_products` message shown. No delete. |
| `/pincodes` | List; add (pincode, weekday, note, active); edit weekday/note/active (pincode itself read-only). |
| `/customers`, `/customers/[customerId]` | Paged search; detail with saved address, location link, and the 20 recent orders. |
| `/settings` | Support phone, delivery fee (₹), minimum order (₹), welcome image URL; Change password section (on success the new token replaces the cookie). |
| `/p/[token]` | Partner page, own minimal layout, mobile-first. Greeting with partner name; orders grouped by delivery date: code, customer name, tap-to-call, address, landmark, Map button, items (no prices). Actions Out for delivery / Delivered (confirm before Delivered). Invalid/inactive link → plain "This link isn't active. Ask the shop for a new one." `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, `noindex`. Refresh button; no auto-refresh. |

### 5.4 Code layout (the builder's calls, per the structure skill)
- Features: `auth`, `orders` (orders list, detail, actions, deliveries and refunds — all views of the same order data and
  the same actions, so they live together instead of duplicating actions across features), `chats`, `delivery-partners`,
  `partner-portal` (the `/p/[token]` page), `products`, `pincodes`, `customers`, `settings`, `navigation` (shell badges).
  The customer detail page composes `customers` + the orders feature's `OrderList` at the page level.
- `src/lib/api/` = generic client + contract types; feature `server/queries.ts` and `server/actions.ts` call it.

### 5.5 Testing
- Vitest (node env for server code, jsdom + Testing Library for client components).
- Unit: format helpers, rupee parsing, date-in-IST helpers, `availableActions`, delivery grouping, share-text builder,
  chat payload → view model, API client (mocked `fetch`), every Server Action (mocked API + `next/headers`).
- Tenant isolation on this side: no request ever carries a tenant id (zod schemas are strict, the client has no tenant
  parameter); another tenant's id → API 404 → `notFound()`; partner actions use only the URL token. The bot repo proves
  the server-side isolation.
- Live check at the end of each step against the local bot on `:8080`, read-only unless the user agrees.

## 6. Left to the builder
Exact column sets, card layouts, empty-state copy, icon choices (lucide), shadcn component picks, and print styling,
within "clean, dense, no decoration".
