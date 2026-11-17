# C2V Admin Dashboard

Web dashboard where each C2V client's **vendor** runs their business: orders, deliveries, delivery
partners, refunds, catalogue, delivery areas, settings and customer chats. One dashboard serves **all
tenants**. Each vendor sees only their own tenant. First tenant: **NutriFarm Eggs** (`nutrifarm`).

**Status:** first release built; hosting pending. The backend API it uses is in the bot repo (branch `feat/admin-api`).
Next: decide hosting and deploy (see `README.md`).

## Read first

- `docs/admin-api.md`: **the API contract**: every endpoint, request, response, error code, with examples.
  Build against this; you should not need the bot's code.
- `docs/dashboard-brief.md`: what to build, rules, security, open decisions, acceptance. Its header lists what has been
  decided since it was written; that header wins over the sections below it.
- `docs/c2v-user-guide.md`: what the WhatsApp bot does, the roles and the order lifecycle.
- The bot server is a **separate repo**: `/Users/srirajdev/development/C2V_Product/C2V` (branch
  `feat/admin-api`). The brief's `src/...` paths point there. Read its code only to answer something the contract
  doesn't; never change it from this repo. If the API needs a change, tell the user, it's made in the bot repo.

## Stack and structure

Next.js (App Router, latest stable), TypeScript strict, Tailwind, shadcn/ui, zod, react-hook-form, pnpm.

Before adding or moving any file, follow the `c2v-project-structure` skill
(`.claude/skills/c2v-project-structure/SKILL.md`). Use `shadcn` for components, and
`nextjs-app-router-patterns` and `vercel-react-best-practices` for rendering and performance,
`responsive-design` for mobile-first layouts, and `web-design-guidelines` to review UI and accessibility.
Core rules:

- `src/app` holds routes only. Business UI and logic live in `src/features/<domain>`.
- Features never import from each other. Shared code goes in `src/components/shared` or `src/lib`.
- Use Server Components by default. Push `"use client"` down to the smallest leaf that needs it.
- Table filters, pagination and sort live in URL search params.

## Architecture rules

- **The bot server owns the business rules** (status transitions, race safety, the `order_delivered` WhatsApp template,
  idempotent Cashfree refunds, the 8-active-product limit, the 24-hour reply window). The dashboard never re-implements them.
- **Data access (decided): the bot's admin API.** All reads and writes go through one client in `src/lib/api`, called only
  from server code (`features/*/server/*`). There is no `lib/db` and no Postgres/Supabase access from this repo.
  - Base URL from env (e.g. `C2V_API_URL`): `http://localhost:8080` locally, the Cloud Run URL in production.
  - Login calls `POST /admin/auth/login`; store the returned token in an httpOnly, Secure, SameSite=Lax cookie and send it as
    `Authorization: Bearer <token>` from the server. On a 401, clear the cookie and redirect to `/login`.
  - Map the API's `{ error: { code, message } }` to the action result `{ ok: false, error }`; show `message` to the vendor.
  - The partner page `/p/[token]` calls `/partner/:token/*` server-side; never expose the token to third parties
    (`Referrer-Policy: no-referrer` on that page too).
- Server Actions are the dashboard's mutation layer. Each one checks the session, validates with zod, calls `lib/api` and
  returns `{ ok, data } | { ok: false, error }`.
- **Database (for context only, this repo never connects to it):** shared Supabase Postgres (Mumbai, free tier). It is the
  production database, and is also used for testing while there are no customers.
  - RLS is on with **no policies**, so the anon key sees nothing. Never use the Supabase client or anon key
    in the browser, and never add RLS policies or Supabase Auth without the user's decision.
  - The schema is owned by the bot repo (drizzle migrations there). New tables such as `vendor_users`, or
    columns such as `delivery_partners.access_token`, are added there, not here.
- This repo needs no DB URL, Cashfree or WhatsApp secrets. The browser never talks to the bot server, Cashfree, Meta or
  the database directly.

## Auth (decided)

- **Vendors:** no Google login and no Supabase Auth.
  - The C2V operator creates a username and random password per tenant with `pnpm vendors create` in the bot repo
    (stored scrypt-hashed in the bot's `vendor_users`). NutriFarm's login exists.
  - Login, logout, `GET /admin/me` and change-password are API endpoints (contract §3). Sessions last 30 days.
  - One login per tenant for now. Login rate limiting is deferred (backlog); add CSRF protection on the Next.js side
    (Server Actions' built-in origin check plus SameSite cookies).
- **Delivery partners:** no password. Each partner gets a private link `/p/<token>`.
  - The token is random (43 chars), returned by the partners API as `accessToken`, so the vendor can copy the link
    again. Partners created before the link feature need one **Reset link** to get a token.
  - The vendor can **Reset link** (new token) or **Deactivate** the partner.
  - The page shows only that partner's assigned and out-for-delivery orders, with *Out for delivery* and
    *Delivered* actions. It shows no prices or payments.
  - Never log tokens and send `Referrer-Policy: no-referrer`. Rate limiting is deferred (backlog).

## Tenant isolation (top security requirement)

- The tenant comes **only from the session**. Never take a tenant id from the URL, body or client.
- Every query and mutation filters by `tenant_id`. Another tenant's id behaves as "not found".
- Write tests proving tenant A can't read, list or change tenant B's data (and a partner link can't
  reach other partners' orders).

## Domain facts

- Order statuses: `payment_pending, confirmed, assigned, out_for_delivery, delivered, cancelled,
  payment_failed, expired`.
  - Only `confirmed` onward are real orders.
  - Transitions: `confirmed → assigned` (reassign allowed) `→ out_for_delivery → delivered`.
  - Cancel is allowed from confirmed, assigned or out_for_delivery.
- **Cancel ≠ refund.** Cancel only changes the status. After cancelling a paid order, offer "Refund now?".
  - Refund returns the full amount through Cashfree, cancels the order if it isn't delivered yet, and is safe
    to retry.
  - "Needs refund" means paid orders that were cancelled, plus payments that arrived after the link expired.
- Marking an order delivered sends the customer a WhatsApp template. If `notified` comes back false, show a
  warning.
- Order codes are a tenant prefix plus 6 random characters, e.g. `NF-7K3QX9` (not sequential).
- Money is integer **paise** end to end. Dates are stored in UTC and shown in **Asia/Kolkata**. Phone numbers
  are `91XXXXXXXXXX`.
- Each pincode has one delivery weekday (0 = Sun … 6 = Sat). An order goes to the next such weekday after
  today.
- The WhatsApp order form shows at most **8 active products**. Catalogue and price changes apply to the next
  form a customer opens.
- Chat messages are kept for 3 days (nightly purge). A reply is only possible inside WhatsApp's 24-hour window
  (`canReply`). Each message has `type`, a short `text` and the full WhatsApp `payload` for a WhatsApp-like view;
  fall back to `text` for shapes you don't draw.
- **Subscriptions are on hold.** The bot replies "coming soon", so no subscriptions UI goes in the first
  release. The `out_for_delivery_template` is approved but unused (backlog #17).

## Non-functional

- Free tier with 5 GB egress a month: paginate, filter on the server and never load whole tables. Polling is
  fine.
- **Mobile-friendly.** Vendors and partners mostly use phones.
- Clean, dense admin UI built from shadcn/ui, with no animated or decorative effects. Cancel and refund always
  go through a confirm dialog.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` must pass before a step is called done.

## How the user works

- **One step at a time.** Present each step, wait for review and approval, then start the next.
- Before starting a step, say what you need from the user (IDs, keys, decisions).
- When the user questions a design, discuss it first and don't change code yet.
- **Commit only after approval.** Commit messages are 2–3 lines at most.
- Secrets go only in git-ignored env files, never in chat, docs or commits.
- In the bot repo: follow its own `docs/session-handoff.md`, and never touch or stage `CLIENT_CHECKLIST.md`
  or `LEARNING.md`. The user's bot dev server may be running on port 8080, so don't kill it.
