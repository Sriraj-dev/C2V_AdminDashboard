---
name: c2v-project-structure
description: Folder structure, layering and coding conventions for the C2V Admin Dashboard (Next.js App Router + TypeScript + shadcn/ui). Use before creating any new file, route, feature, component, server action or data query in this project, when deciding where code belongs, and when reviewing or refactoring code for structure and maintainability.
---

# C2V Admin Dashboard — Project Structure & Conventions

Admin dashboard for C2V, a multi-tenant WhatsApp commerce product (first tenant: NutriFarm Eggs).
The vendor manages orders, deliveries, refunds, delivery partners, customers, catalogue, delivery areas,
settings and chats. Subscriptions are on hold: build no subscriptions UI until the user says so.
Project facts and decisions live in `CLAUDE.md` and `docs/dashboard-brief.md`; they win over this skill.

Stack: Next.js (App Router, latest stable), TypeScript strict, Tailwind, shadcn/ui, zod.
Companion skills: `shadcn` (UI components), `vercel-react-best-practices` (performance),
`nextjs-app-router-patterns` (routing/rendering). This skill decides **where code goes**.

## 1. Folder layout

```
src/
  app/                          # ROUTES ONLY — thin files that compose features
    (auth)/login/page.tsx
    (partner)/p/[token]/page.tsx  # delivery partner private link (no login, token-scoped)
    (dashboard)/
      layout.tsx                # sidebar + header shell
      page.tsx                  # overview / today's deliveries
      orders/page.tsx
      orders/[orderId]/page.tsx
      refunds/  customers/  products/
      pincodes/  delivery-partners/  chats/  settings/
    api/                        # route handlers only when a real HTTP endpoint is needed
  features/                     # ALL business UI + logic, one folder per domain
    orders/
      components/               # order-table.tsx, order-status-badge.tsx, assign-partner-dialog.tsx
      server/
        queries.ts              # read functions (server-only)
        actions.ts              # "use server" mutations
      schemas.ts                # zod schemas (form + action input validation)
      types.ts                  # domain types
      constants.ts              # status labels, transitions, filters
      utils.ts                  # pure helpers for this feature only
      index.ts                  # public API of the feature (what other layers may import)
    refunds/ customers/ products/ pincodes/ settings/
    delivery-partners/ chats/ auth/ dashboard/
  components/
    ui/                         # shadcn-generated primitives — do not hand-edit beyond styling
    layout/                     # app-sidebar, site-header, page-header, breadcrumbs
    shared/                     # generic, domain-free: data-table, empty-state, confirm-dialog
  lib/
    api/                        # the single data-access client: the bot's admin API (see §4)
    auth.ts                     # session helpers
    env.ts                      # zod-validated env (server) — never read process.env elsewhere
    format.ts                   # money (paise → ₹), dates (Asia/Kolkata), phone
    utils.ts                    # cn() and tiny generic helpers
  hooks/                        # generic client hooks (use-debounce, use-media-query)
  config/
    nav.ts                      # sidebar items
    site.ts
  types/                        # truly global types only
```

Start small: create a feature's sub-files only when they are needed, but always in these places.

## 2. Dependency rules (most important)

```
app  →  features  →  components/shared, components/ui, lib, hooks, config
```

- `app/` files only import from `features/*` (via its `index.ts`), `components/layout`, `lib`.
  A `page.tsx` fetches via a feature query and renders feature components — no business logic,
  no inline data mapping, no large JSX.
- **Features never import from other features.** If two features need the same thing, move it to
  `components/shared` or `lib`. If a page needs two features, the page composes both.
- `components/*`, `lib`, `hooks` never import from `features` or `app`.
- Import other features only through their `index.ts`; never deep-import `features/x/components/...`
  from outside `features/x`.
- Use the `@/` path alias; no `../../..` chains across folders.

## 3. Server vs client components

- Default to **Server Components**. Add `"use client"` only for interactivity (forms, dialogs,
  table state, charts), and push it to the smallest leaf component.
- Data is fetched on the server in `features/*/server/queries.ts` and passed down as props.
  No data fetching in `useEffect`.
- Mutations are **Server Actions** in `features/*/server/actions.ts`. Every action:
  1. checks the session (and tenant),
  2. validates input with the feature's zod schema,
  3. calls the data layer,
  4. `revalidatePath`/`revalidateTag` for affected views,
  5. returns a typed result `{ ok: true, data } | { ok: false, error }` — do not throw to the UI.
- Mark server-only modules with `import "server-only"`.
- Table filters, pagination and sort live in **URL search params**, not client state, so views are
  shareable and server-rendered.

## 4. Data access

- All reads/writes go through one client, `lib/api`, which calls the bot server's `/admin/*` and `/partner/:token/*`
  endpoints (contract: `docs/admin-api.md`). There is no `lib/db`; this repo never connects to Postgres.
- Business rules are never re-implemented here: status transitions, the delivered WhatsApp template,
  Cashfree refunds and the product limit are enforced by the API; the UI may mirror them only to hide buttons.
- The schema is owned by the bot repo's drizzle migrations; this repo never creates or alters tables.
- Only `features/*/server/*` call that client. Components never call it, and never `fetch` the
  backend directly.
- The tenant comes from the API session (bearer token in an httpOnly cookie). Never send a tenant id to the API.
- Money is **integer paise** end to end; convert to rupees only for display via `lib/format.ts`.
- Dates are stored UTC and displayed in **Asia/Kolkata**.
- Fetch incrementally (the API's `page`/`pageSize` and filters) — the database is on a free tier with limited
  egress. Never load whole lists.

## 5. Domain vocabulary (keep names identical to the backend)

- Order statuses: `payment_pending`, `confirmed`, `assigned`, `out_for_delivery`, `delivered`,
  `cancelled`, `payment_failed`, `expired`. Only `confirmed` onward are "real" orders.
- Order codes look like `NF-7K3QX9` (tenant prefix + 6 random characters, not sequential).
- Status transitions and their labels/colours live in `features/orders/constants.ts` — one source
  of truth, never re-declared in components.

## 6. UI conventions

- Build with shadcn/ui primitives from `components/ui`; add new ones with the shadcn CLI.
- Clean, dense, consistent admin UI: no landing-page effects, no decorative animation, no 3D.
- Every list page = `PageHeader` + filters (URL params) + `DataTable` + empty/loading/error states.
- Use `loading.tsx` and `error.tsx` per route segment; Suspense around slow sections.
- Forms: react-hook-form + zod resolver using the feature's `schemas.ts`; the same schema
  validates the Server Action.
- Destructive actions (cancel, refund) always go through a confirm dialog.

## 7. Code style

- TypeScript strict; no `any`. Infer types from zod (`z.infer`) instead of duplicating them.
- Files kebab-case (`order-table.tsx`); components PascalCase; one exported component per file.
- Keep files focused — split when a file grows past ~200 lines or does two jobs.
- No dead code, no commented-out blocks, no speculative abstractions. Add an abstraction when the
  second real use appears.
- Co-locate tests next to the code they test (`order-status.test.ts`).

## 8. Checklist before finishing a change

- [ ] New code is in the right layer (§1) and respects import rules (§2).
- [ ] `"use client"` only where needed; data fetched on the server.
- [ ] Inputs validated with zod; actions check session + tenant.
- [ ] Tenant-isolation tests: another tenant's ids return "not found" for reads and writes.
- [ ] Money in paise, dates in IST for display.
- [ ] Loading, empty and error states handled.
- [ ] Type check and lint pass.
