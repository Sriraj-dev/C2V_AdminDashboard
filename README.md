# C2V Vendor Dashboard

Web dashboard where each C2V client's vendor runs their business: deliveries, orders, refunds, customers,
chats, delivery partners, products, pincodes and settings. Delivery partners get a private page at `/p/<token>`.

One dashboard serves all tenants; each vendor sees only their own (the tenant comes from the login session).
All data goes through the bot server's admin API. This app never talks to the database, Cashfree or WhatsApp.

- API contract: `docs/admin-api.md`
- Product brief and decisions: `docs/dashboard-brief.md`
- What the WhatsApp bot does: `docs/c2v-user-guide.md`
- Project rules: `CLAUDE.md`

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui, zod, react-hook-form,
Vitest + Testing Library. Package manager: pnpm. Node 22 or newer.

## Setup

```bash
pnpm install
cp .env.example .env.local   # then edit the values
```

Environment keys (server only, validated in `src/lib/env.ts`):

| Key | Meaning |
| --- | --- |
| `C2V_API_URL` | Base URL of the bot server's admin API, e.g. `http://localhost:8080` locally, the Cloud Run URL in production. |
| `PUBLIC_APP_URL` | Public URL of this dashboard, used to build delivery partner links (`<PUBLIC_APP_URL>/p/<token>`). |

Optional, for local browser checks only: `DEV_VENDOR_USERNAME`, `DEV_VENDOR_PASSWORD`.

No database URL, Cashfree or WhatsApp secrets are needed here. Never commit `.env.local`.

## Run against the local bot

1. In the bot repo (`C2V`, branch `feat/admin-api`), start its server on port 8080. Vendor logins are
   created there with `pnpm vendors create` (one username and password per tenant).
2. Here, with `C2V_API_URL=http://localhost:8080` in `.env.local`:

```bash
pnpm dev          # http://localhost:3000
```

3. Log in with the vendor username and password. To try it on a phone, open the "Network" URL that
   `pnpm dev` prints (same Wi-Fi), and set `PUBLIC_APP_URL` to that URL if you want partner links to open there.
   If buttons do nothing on the phone, Next.js is blocking dev assets for that origin: add the computer's LAN IP to
   `allowedDevOrigins` in `next.config.ts`, or use `pnpm build && pnpm start` (no such check).

## Scripts

| Script | Does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and server (`pnpm start -p 3100` for another port) |
| `pnpm test` | Unit and component tests (Vitest) |
| `pnpm typecheck` | Route types plus `tsc --noEmit` |
| `pnpm lint` | ESLint |

All four of `test`, `typecheck`, `lint` and `build` must pass before a change is done.

## Layout

- `src/app`: routes only (`(auth)`, `(dashboard)`, `(partner)/p/[token]`, `(print)`).
- `src/features/<domain>`: UI, server queries and Server Actions per domain. Features never import each other.
- `src/lib/api`: the single client for the bot's admin API, called only from server code.
- `src/components/ui` (shadcn), `src/components/shared`, `src/components/layout`, `src/hooks`.

## Security notes

- Vendor session: the API token is kept in an httpOnly, Secure, SameSite=Lax cookie; a 401 clears it and sends the
  vendor to `/login`.
- Partner pages `/p/*` send `Referrer-Policy: no-referrer`, `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
  Partner tokens are never logged.

## Known limitations / backlog

- The Orders list serialises order data twice into the RSC payload. Fine at current volume; fix if it grows.
- Rate limiting for vendor login and partner links is deferred.
- Bot API: `GET /admin/orders?q=<order code>` also matches phone numbers containing the code's digits (to be fixed
  in the bot repo).
- Hosting is not set up yet (likely Vercel, region near Mumbai, `C2V_API_URL` pointing at Cloud Run and
  `PUBLIC_APP_URL` at the final domain).
