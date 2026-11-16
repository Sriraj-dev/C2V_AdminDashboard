# C2V Vendor Dashboard (First Release) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A multi-tenant vendor dashboard plus a delivery-partner link page, built on the bot's admin API, usable on phones.

**Architecture:** Next.js 16 App Router. Server Components read via `src/lib/api` (server-only) using the bearer token
from the `c2v_session` httpOnly cookie. Server Actions are the only mutation path and return `ActionResult`. Business UI
lives in `src/features/<domain>`, routes in `src/app` stay thin. The bot server owns every business rule.

**Tech Stack:** Next.js 16.x, React 19, TypeScript strict, Tailwind v4, shadcn/ui, zod 4, react-hook-form, sonner,
lucide-react, Vitest + Testing Library (jsdom), pnpm 10.

**Spec:** `docs/superpowers/specs/2026-11-16-vendor-dashboard-design.md` (with `docs/admin-api.md` as the API contract).

## Global Constraints

- Follow `CLAUDE.md` and `.claude/skills/c2v-project-structure/SKILL.md` for every file placed. `src/app` = routes only; features never import each other; `components/*` and `lib` never import features.
- Data only through `src/lib/api`; only `features/*/server/*` and `src/lib/api/*` call it. No DB, no Supabase, no direct `fetch` elsewhere.
- Never send a tenant id to the API. Every zod input schema is `.strict()` (unknown keys rejected).
- Cookie `c2v_session`: httpOnly, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`, `path: '/'`, `expires: new Date(expiresAt)`.
- Env (server-only, validated lazily in `src/lib/env.ts`): `C2V_API_URL` (e.g. `http://localhost:8080`), `PUBLIC_APP_URL` (e.g. `http://localhost:3000`, used to build `/p/<token>` links).
- Money integer paise end to end; show with `formatPaise`; parse vendor input with `rupeesToPaise` (never float math).
- Dates: show in `Asia/Kolkata`; "today" = `todayInIST()`. Delivery dates are calendar `YYYY-MM-DD` strings, never converted through a timezone.
- Server Action shape: check session → zod-validate → `adminWrite` → `revalidatePath('/', 'layout')` on success → return `ActionResult<T>`. Never throw to the UI.
- Cancel and refund always go through a confirm dialog; their copy includes "The customer is not notified."
- UI: shadcn/ui primitives, dense, no decorative animation. Phone first; wide tables become cards below `md`.
- Every step ends green: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`.
- Never log or render a partner token anywhere except the vendor's partner list and the link itself.
- The local bot (`:8080`) writes to the production DB: live checks are read-only unless the user agrees per step.
- Each task ends with a stop: present the result, wait for approval, then commit (2–3 line message + the session's trailers).

## Review Focus

1. **Session ends mid-use** (expired, password changed on another device, vendor deactivated): any 401, in a page or an action, must clear the cookie and land on `/login?expired=1`, never a crash or redirect loop. → Task 2 tests `adminRead`/`adminWrite`; Task 3 tests `/session-expired`.
2. **Order changed elsewhere** (partner marked it delivered, another tab cancelled it): the action returns 409 `invalid_transition`; the UI shows the API message and refreshes so the buttons match the new status. → Task 6 action and component tests.
3. **IST day boundary**: between 00:00 and 05:30 IST, UTC is still yesterday; "today" and the Deliveries default date must use IST. → Task 2 `todayInIST` test; Task 7 `pickDefaultDate` test.
4. **Rupee input** like `12.5`, `₹1,200`, `0.10`, `1.234`, empty: must become exact paise or a field error, never a float rounding error. → Task 2 `rupeesToPaise` tests; Task 11/12 form tests.
5. **Bot API down or slow**: requests time out at 10 s and map to `network_error` with a friendly message; pages show `error.tsx` with Retry, not a hang. → Task 2 client test; Task 4 error boundary.

---

## File map

```
src/
  proxy.ts                                   # optimistic auth redirect (Task 3)
  app/
    layout.tsx  globals.css                  # root (Task 1), Toaster (Task 4)
    (auth)/login/page.tsx                    # Task 3
    (auth)/session-expired/route.ts          # Task 3
    (dashboard)/layout.tsx  loading.tsx  error.tsx   # Task 4
    (dashboard)/page.tsx                     # Deliveries (Task 7)
    (dashboard)/orders/page.tsx  orders/[orderId]/page.tsx   # Tasks 5, 6
    (dashboard)/refunds/page.tsx             # Task 8
    (dashboard)/partners/page.tsx            # Task 9
    (dashboard)/products/page.tsx  pincodes/page.tsx         # Task 11
    (dashboard)/settings/page.tsx            # Task 12
    (dashboard)/customers/page.tsx  customers/[customerId]/page.tsx  # Task 13
    (dashboard)/chats/layout.tsx  chats/page.tsx  chats/[customerId]/page.tsx  # Task 14
    (print)/deliveries/print/page.tsx        # Task 7
    (partner)/p/[token]/page.tsx  not-found.tsx              # Task 10
  features/
    auth/ navigation/ orders/ delivery-partners/ partner-portal/
    products/ pincodes/ settings/ customers/ chats/
  components/
    ui/                                      # shadcn generated
    layout/  app-sidebar.tsx  bottom-nav.tsx  more-sheet.tsx  site-header.tsx  page-header.tsx
    shared/  empty-state.tsx  error-state.tsx  confirm-dialog.tsx  auto-refresh.tsx  url-pagination.tsx  copy-button.tsx
  lib/
    env.ts  format.ts  money.ts  dates.ts  action-result.ts  auth.ts
    api/  client.ts  types.ts  admin.ts  partner.ts
  test/  next-mocks.ts  setup.ts
```

Each feature folder follows the skill: `components/`, `server/queries.ts`, `server/actions.ts`, `schemas.ts`,
`types.ts` (only if not inferred), `constants.ts`, `utils.ts`, `index.ts`. Tests sit next to the file they test.

---

### Task 1: Project scaffold and tooling

**Needs from user:** nothing.

**Files:**
- Create: Next.js app files (`package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx` temporary, `src/app/globals.css`), `components.json`, `src/lib/utils.ts` (shadcn `cn`), `src/lib/env.ts`, `src/lib/env.test.ts`, `vitest.config.ts`, `src/test/setup.ts`, `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `serverEnv(): { C2V_API_URL: string; PUBLIC_APP_URL: string }` (parses `process.env` on first call, caches; throws listing missing keys). `import "server-only"`.

- [ ] **Step 1: Generate the app in the scratchpad and move it in.** `create-next-app` refuses non-empty dirs, so run `pnpm create next-app@16 web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --turbopack --no-git` in the scratchpad, then copy everything except `.git` and `README.md` into the repo root. Keep existing `CLAUDE.md`, `docs/`, `.claude/`.
- [ ] **Step 2: Strict TS and scripts.** `tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`. `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"typecheck": "tsc --noEmit"`, `"lint": "eslint ."`. Add deps: `zod`, `react-hook-form`, `@hookform/resolvers`, `server-only`, `lucide-react`; dev: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vite-tsconfig-paths`.
- [ ] **Step 3: shadcn init.** `pnpm dlx shadcn@latest init` (style default, base colour neutral, CSS variables). Add `button` only now; later tasks add what they use.
- [ ] **Step 4: Vitest config.** `vitest.config.ts`: plugins react + tsconfig paths, `environment: 'node'`, `setupFiles: ['src/test/setup.ts']` (imports `@testing-library/jest-dom/vitest`), alias `server-only` to an empty module so server files are testable. Client component tests opt in with `// @vitest-environment jsdom`.
- [ ] **Step 5: Write the failing env test** `src/lib/env.test.ts`:

```ts
it('parses valid env', () => { /* stub C2V_API_URL='http://localhost:8080', PUBLIC_APP_URL='http://localhost:3000' */
  expect(serverEnv()).toEqual({ C2V_API_URL: 'http://localhost:8080', PUBLIC_APP_URL: 'http://localhost:3000' });
});
it('throws naming the missing keys', () => { /* stub empty */
  expect(() => serverEnv()).toThrow(/C2V_API_URL/);
});
it('strips a trailing slash from C2V_API_URL', () => { /* 'http://x:8080/' */ expect(serverEnv().C2V_API_URL).toBe('http://x:8080'); });
```
Use `vi.stubEnv` and a test-only `resetServerEnvForTests()` export.
- [ ] **Step 6: Run** `pnpm test src/lib/env.test.ts` → FAIL (module missing).
- [ ] **Step 7: Implement `src/lib/env.ts`** with `z.object({ C2V_API_URL: z.url(), PUBLIC_APP_URL: z.url() })`, lazy so `pnpm build` works without env.
- [ ] **Step 8: Env files.** `.env.example` with both keys and placeholder values. `.gitignore` covers `.env*` except `!.env.example`. Create `.env.local` with the local values (no secrets yet).
- [ ] **Step 9: Verify** `pnpm test && pnpm typecheck && pnpm lint && pnpm build` → all pass.
- [ ] **Step 10: Stop for review; on approval commit** `chore: scaffold next.js app with shadcn, vitest and env validation`.

---

### Task 2: Core lib — formatting, money, dates, API client, session cookie

**Needs from user:** nothing.

**Files:**
- Create: `src/lib/format.ts`, `src/lib/money.ts`, `src/lib/dates.ts`, `src/lib/action-result.ts`, `src/lib/auth.ts`, `src/lib/api/{client,types,admin,partner}.ts`, `src/test/next-mocks.ts`, tests next to each.

**Interfaces:**
- Produces (`money.ts`): `formatPaise(paise: number): string`; `rupeesToPaise(input: string): number | null`; `paiseToRupeesInput(paise: number): string`.
- Produces (`dates.ts`): `todayInIST(now?: Date): string`; `formatDateTime(iso: string): string`; `formatDeliveryDate(ymd: string): string`; `WEEKDAYS: readonly string[]` (Sunday…Saturday); `weekdayName(n: number): string`; `addDays(ymd: string, n: number): string`.
- Produces (`format.ts`): `toFullPhone(p: string): string` (10 digits → `91…`, 12 digits unchanged); `formatPhone(p: string): string`; `telHref(p: string): string`.
- Produces (`api/types.ts`): every shape from contract §2–§9 verbatim: `OrderStatus`, `PaymentStatus`, `Address`, `GeoLocation`, `OrderView`, `CustomerView`, `Product`, `Pincode`, `Settings`, `Partner`, `PartnerOrderView`, `ChatMessage`, `ChatCustomer`, `ChatListItem`, `AuthUser`, `LoginResponse`, `Paged<T> = { items: T[]; page: number; pageSize: number; total: number }`, `RefundNeededItem = OrderView & { refundReason: 'cancelled_after_payment' | 'paid_after_expiry' }`, `BulkResult`.
- Produces (`api/client.ts`): `type ApiError = { status: number; code: string; message: string; details?: { path: string; message: string }[] }`; `type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }`; `apiRequest<T>(path: string, opts?: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; token?: string; query?: Record<string, string | number | undefined> }): Promise<ApiResult<T>>`; `class ApiRequestError extends Error { error: ApiError }`.
- Produces (`auth.ts`, server-only): `SESSION_COOKIE = 'c2v_session'`; `getSessionToken(): Promise<string | null>`; `setSession(token: string, expiresAt: string): Promise<void>`; `clearSession(): Promise<void>`.
- Produces (`api/admin.ts`, server-only): `adminRead<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T>` — no token or 401 → `redirect('/session-expired')`; 404 → `notFound()`; other errors → throw `ApiRequestError`. `adminWrite<T>(path: string, init?: { method?: 'POST' | 'PATCH'; body?: unknown }): Promise<ApiResult<T>>` — no token or 401 → `await clearSession()` then `redirect('/login?expired=1')`; else returns the result.
- Produces (`api/partner.ts`, server-only): `partnerRead<T>(token: string, path: string): Promise<T>` (404 → `notFound()`); `partnerWrite<T>(token: string, path: string): Promise<ApiResult<T>>` (POST). Token is `encodeURIComponent`-ed into `/partner/<token><path>`.
- Produces (`action-result.ts`): `type ActionError = { code: string; message: string; fieldErrors?: Record<string, string> }`; `type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError }`; `fromApiError(e: ApiError): ActionError` (details → `fieldErrors` keyed by `path`, first message wins); `validationFailed(e: z.ZodError): ActionError` (code `validation_error`, message `Check the highlighted fields.`).
- Produces (`test/next-mocks.ts`): `mockNextHeaders()` returning an in-memory cookie jar (`get/set/delete` spies) and mocks for `redirect`/`notFound` that throw `Error('NEXT_REDIRECT:<url>')` / `Error('NEXT_NOT_FOUND')`.

- [ ] **Step 1: Write failing tests** `money.test.ts`, `dates.test.ts`, `format.test.ts`:

```ts
expect(formatPaise(57000)).toBe('₹570');
expect(formatPaise(1250)).toBe('₹12.50');
expect(formatPaise(12345600)).toBe('₹1,23,456');
expect(rupeesToPaise('570')).toBe(57000);
expect(rupeesToPaise('12.5')).toBe(1250);
expect(rupeesToPaise(' ₹1,200 ')).toBe(120000);
expect(rupeesToPaise('0.10')).toBe(10);
expect(rupeesToPaise('1.234')).toBeNull();
expect(rupeesToPaise('')).toBeNull();
expect(rupeesToPaise('-5')).toBeNull();
expect(rupeesToPaise('abc')).toBeNull();
expect(paiseToRupeesInput(1250)).toBe('12.50');
expect(paiseToRupeesInput(57000)).toBe('570');

expect(todayInIST(new Date('2026-11-15T19:00:00Z'))).toBe('2026-11-16'); // 00:30 IST
expect(todayInIST(new Date('2026-11-15T18:29:00Z'))).toBe('2026-11-15'); // 23:59 IST
expect(formatDeliveryDate('2026-11-18')).toBe('Wed, 18 Nov');
expect(formatDateTime('2026-11-14T06:15:03.000Z')).toBe('14 Nov, 11:45 am');
expect(weekdayName(0)).toBe('Sunday');
expect(addDays('2026-11-30', 1)).toBe('2026-12-01');

expect(toFullPhone('9800000001')).toBe('919800000001');
expect(formatPhone('919800000001')).toBe('+91 98000 00001');
expect(telHref('9800000001')).toBe('tel:+919800000001');
```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the three modules. `rupeesToPaise`: strip `₹`, commas, spaces; match `/^\d+(\.\d{1,2})?$/`; build paise from the integer and fraction strings (pad fraction to 2). Dates use `Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ... })`; delivery-date helpers treat `YYYY-MM-DD` as a UTC calendar date. **Step 4: Run** → PASS.
- [ ] **Step 5: Write failing client tests** `api/client.test.ts` (stub `fetch`, `serverEnv`):

```ts
it('sends bearer, JSON body and no-store', ...) // expect fetch called with 'http://localhost:8080/admin/orders?status=confirmed&page=2', headers Authorization 'Bearer t', cache 'no-store'
it('drops undefined query values', ...)
it('returns ok data on 2xx and undefined data on 204', ...)
it('maps error body', ...) // 409 { error: { code: 'invalid_transition', message: 'm' } } → { ok:false, error:{ status:409, code:'invalid_transition', message:'m' } }
it('maps non-JSON error to internal', ...) // 500 text/html → code 'internal', message 'Something went wrong. Try again.'
it('maps network failure and timeout to network_error', ...) // fetch rejects (incl. TimeoutError) → { status:0, code:'network_error', message:"Couldn't reach the server. Try again." }
```
- [ ] **Step 6: Run** → FAIL. **Step 7: Implement `client.ts`** with `AbortSignal.timeout(10_000)`. **Step 8: Run** → PASS.
- [ ] **Step 9: Write failing tests** `auth.test.ts` and `api/admin.test.ts`, `api/partner.test.ts` using `mockNextHeaders()`:

```ts
// auth
await setSession('tok', '2026-12-15T09:30:00.000Z');
expect(jar.set).toHaveBeenCalledWith('c2v_session', 'tok', { httpOnly: true, sameSite: 'lax', secure: false, path: '/', expires: new Date('2026-12-15T09:30:00.000Z') });
// adminRead
it('redirects to /session-expired with no cookie, without calling fetch')
it('redirects to /session-expired on 401')
it('calls notFound on 404')
it('throws ApiRequestError on 500')
// adminWrite
it('on 401 clears the cookie then redirects to /login?expired=1')
it('returns the error result on 409 without redirecting')
// partnerRead/partnerWrite
it('builds /partner/<encoded token>/orders and sends no Authorization header')
it('partnerRead calls notFound on 404')
```
- [ ] **Step 10: Run** → FAIL. **Step 11: Implement** `auth.ts`, `admin.ts`, `partner.ts`, `action-result.ts`, `types.ts`. **Step 12: Run** → PASS.
- [ ] **Step 13: Verify** full suite + typecheck + lint + build.
- [ ] **Step 14: Stop for review; on approval commit** `feat(lib): api client, session cookie, money/date/phone helpers`.

---

### Task 3: Auth — login, logout, session expiry, route guard

**Needs from user:** for the live check only, the NutriFarm username and password in `.env.local` as `DEV_VENDOR_USERNAME` / `DEV_VENDOR_PASSWORD` (git-ignored, used only to drive the browser check; the app never reads them). The bot running on `:8080`.

**Files:**
- Create: `src/features/auth/{schemas.ts,server/actions.ts,server/queries.ts,components/login-form.tsx,index.ts}` + tests, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/session-expired/route.ts` + test, `src/proxy.ts` + test
- shadcn add: `input`, `label`, `card`, `form`, `sonner`, `alert`

**Interfaces:**
- Consumes: `apiRequest`, `setSession`, `clearSession`, `getSessionToken`, `adminRead`, `fromApiError`, `validationFailed`.
- Produces: `loginSchema = z.object({ username: z.string().trim().min(1).max(200), password: z.string().min(1).max(1000) }).strict()`; `loginAction(input: LoginInput): Promise<ActionResult<never>>` (success → `setSession` then `redirect('/')`); `logoutAction(): Promise<void>` (POST `/admin/auth/logout` with token, ignore its failure, `clearSession()`, `redirect('/login')`); `getCurrentUser = cache(async (): Promise<AuthUser> => …)` via `adminRead<{ user: AuthUser }>('/admin/me')`.

- [ ] **Step 1: Write failing action tests** `server/actions.test.ts`:

```ts
it('logs in: posts credentials, sets cookie from token/expiresAt, redirects to /') // expect redirect error 'NEXT_REDIRECT:/'
it('wrong password returns the API message, sets no cookie') // 401 invalid_credentials → { ok:false, error:{ code:'invalid_credentials', message: <api message> } }
it('rejects empty username without calling the API')
it('rejects unknown keys (tenantId) without calling the API')
it('logout clears the cookie even when the API call fails')
```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** schemas + actions + `getCurrentUser`. **Step 4: Run** → PASS.
- [ ] **Step 5: Write failing tests** for `session-expired/route.ts` (GET deletes `c2v_session`, 307 to `/login?expired=1`) and `proxy.ts`:

```ts
it('redirects /orders to /login when no cookie')
it('lets /orders through with a cookie')
it('never guards /login, /session-expired, /p/<token>, /_next, favicon')
it('redirects /login to / when a cookie exists')
```
`proxy.ts` exports `proxy(request: NextRequest)` and `config.matcher` excluding `_next/static`, `_next/image`, `favicon.ico`.
- [ ] **Step 6: Run** → FAIL. **Step 7: Implement.** **Step 8: Run** → PASS.
- [ ] **Step 9: Login UI.** `LoginForm` (client, react-hook-form + `loginSchema`, shows API error in an `Alert`, disables button while pending). Login page: centred card, tenant-neutral title "C2V Vendor Login", `?expired=1` notice "Your session ended. Log in again."
- [ ] **Step 10: Verify** suite + typecheck + lint + build. **Live check** (browser-automation): wrong password shows the message; right password lands on `/`; deleting the cookie and opening `/orders` lands on `/login`.
- [ ] **Step 11: Stop for review; on approval commit** `feat(auth): vendor login, logout, session-expired handling and route guard`.

---

### Task 4: App shell — sidebar, bottom bar, header, shared states

**Needs from user:** nothing.

**Files:**
- Create: `src/app/(dashboard)/{layout,loading,error}.tsx`, placeholder `page.tsx` for every dashboard route in the file map (heading only, replaced by later tasks), `src/components/layout/*`, `src/components/shared/*`, `src/features/navigation/{constants.ts,utils.ts,server/queries.ts,components/nav-badges.tsx,index.ts}` + tests
- Modify: `src/app/layout.tsx` (Toaster, `lang="en-IN"`, viewport meta), remove temporary `src/app/page.tsx`
- shadcn add: `sheet`, `badge`, `separator`, `skeleton`, `alert-dialog`, `dropdown-menu`

**Interfaces:**
- Consumes: `getCurrentUser`, `logoutAction`, `adminRead`.
- Produces (`navigation/constants.ts`): `NAV_ITEMS: { href: string; label: string; icon: LucideIcon; primary: boolean; badge?: 'refunds' | 'chats' }[]` in this order: Deliveries `/` (primary), Orders `/orders` (primary), Refunds `/refunds` (primary, badge refunds), Chats `/chats` (primary, badge chats), Partners `/partners`, Products `/products`, Pincodes `/pincodes`, Customers `/customers`, Settings `/settings`.
- Produces (`navigation/utils.ts`): `isActive(pathname: string, href: string): boolean` (`/` only exact; others prefix); `chatsAwaitingReply(items: ChatListItem[]): number` (count with `canReply && lastMessage.direction === 'in'`).
- Produces (`navigation/server/queries.ts`): `getNavCounts(): Promise<{ refunds: number; chats: number }>` (both endpoints in parallel; on non-401 failure return 0s so the shell never breaks).
- Produces (shared): `ConfirmDialog({ trigger, title, description, confirmLabel, destructive?, onConfirm: () => Promise<void> })` (keeps open + disables while pending); `AutoRefresh({ intervalMs }: { intervalMs: number })` (calls `router.refresh()` on an interval only while `document.visibilityState === 'visible'`, and once on becoming visible); `UrlPagination({ page, pageSize, total })` (links preserve other search params); `EmptyState({ title, description? })`; `ErrorState({ message, onRetry })`; `CopyButton({ value, label })` (clipboard + toast "Copied"); `PageHeader({ title, description?, actions? })`.

- [ ] **Step 1: Write failing tests** `navigation/utils.test.ts` (`isActive('/', '/')` true, `isActive('/orders/x', '/')` false, `isActive('/orders/x', '/orders')` true; `chatsAwaitingReply` counts only inbound+canReply) and `components/shared/auto-refresh.test.tsx` (jsdom, fake timers: refresh called at interval when visible; not called when hidden; called once on `visibilitychange` to visible).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** utils, constants, shared components, `getNavCounts`. **Step 4: Run** → PASS.
- [ ] **Step 5: Shell.** `(dashboard)/layout.tsx` (Server Component) loads `getCurrentUser()` and `getNavCounts()`, renders `AppSidebar` (`hidden md:flex`), `SiteHeader` (tenant name, logout form posting `logoutAction`), `<main>` with bottom padding on phones, `BottomNav` (`md:hidden`, the 4 primary items + More) and `MoreSheet` (the rest + Log out). Badges are plain counts (no animation). Active item from `usePathname()` in the smallest client leaf.
- [ ] **Step 6: States.** `(dashboard)/error.tsx` (client) renders `ErrorState` with the error message for `ApiRequestError`-like messages and "Something went wrong." otherwise, Retry = `reset()`. `loading.tsx` = skeleton rows.
- [ ] **Step 7: Verify** suite + typecheck + lint + build. **Live check** at 390×844 and 1280×800: navigation works, badges render, logout returns to `/login`.
- [ ] **Step 8: Stop for review; on approval commit** `feat(shell): responsive sidebar, bottom bar, header and shared states`.

---

### Task 5: Orders — constants, queries, list page (read-only)

**Needs from user:** nothing.

**Files:**
- Create: `src/features/orders/{constants.ts,utils.ts,schemas.ts,server/queries.ts,components/{status-badge,order-list,order-card,order-table,orders-filters,orders-tabs}.tsx,index.ts}` + tests
- Modify: `src/app/(dashboard)/orders/page.tsx`
- shadcn add: `table`, `tabs`, `select`, `checkbox`, `switch`

**Interfaces:**
- Consumes: `adminRead`, `OrderView`, `Paged`, `Partner`, `formatPaise`, `formatDeliveryDate`, `todayInIST`.
- Produces (`constants.ts`): `STATUS_LABEL: Record<OrderStatus, string>` (Payment pending, Confirmed, Assigned, Out for delivery, Delivered, Cancelled, Payment failed, Expired); `STATUS_TONE: Record<OrderStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'>`; `REAL_STATUSES` (`confirmed`…`cancelled`); `UNPAID_STATUSES` (`payment_pending`, `payment_failed`, `expired`); `type OrderAction = 'assign' | 'reassign' | 'out_for_delivery' | 'delivered' | 'cancel' | 'refund'`.
- Produces (`utils.ts`): `availableActions(o: Pick<OrderView, 'status' | 'paymentStatus' | 'source'>): OrderAction[]`; `filterActiveOrders(orders: OrderView[], f: ActiveFilters): OrderView[]` (date exact, pincode exact, partnerId exact or `'unassigned'`, `q` case-insensitive substring of order code, customer name/profile name, or digits of phone).
- Produces (`schemas.ts`): `activeFiltersSchema` (`date?` YYYY-MM-DD, `pincode?` 6 digits, `partnerId?` uuid | `'unassigned'`, `q?` ≤100) and `historyParamsSchema` (`status?` comma list of `OrderStatus`, `deliveryFrom?`, `deliveryTo?`, `pincode?`, `partnerId?`, `q?`, `includeUnpaid?` `'1'`, `page?` int ≥1 default 1). Both parse raw `searchParams` and **drop** invalid values (a bad URL never 400s the API).
- Produces (`server/queries.ts`): `getActiveOrders(): Promise<OrderView[]>`; `getOrderHistory(p: HistoryParams): Promise<Paged<OrderView>>` (pageSize 25; status defaults to `REAL_STATUSES` joined, plus `UNPAID_STATUSES` when `includeUnpaid`); `getOrder(id: string): Promise<OrderView>`; `getPartnersForAssign(): Promise<Pick<Partner, 'id' | 'name' | 'phone' | 'active' | 'accessToken'>[]>`.
- Produces (components): `StatusBadge({ status })`; `OrderList({ orders, selectable?, partners? })` (table at `md+`, cards below; each row links to `/orders/[id]`); exported from `index.ts` for the customers page to compose.

- [ ] **Step 1: Write failing tests** `utils.test.ts`, `schemas.test.ts`, `server/queries.test.ts`:

```ts
expect(availableActions({ status: 'confirmed', paymentStatus: 'paid', source: 'one_time' })).toEqual(['assign', 'cancel', 'refund']);
expect(availableActions({ status: 'assigned', paymentStatus: 'paid', source: 'one_time' })).toEqual(['reassign', 'out_for_delivery', 'cancel', 'refund']);
expect(availableActions({ status: 'out_for_delivery', paymentStatus: 'paid', source: 'one_time' })).toEqual(['delivered', 'cancel', 'refund']);
expect(availableActions({ status: 'delivered', paymentStatus: 'paid', source: 'one_time' })).toEqual(['refund']);
expect(availableActions({ status: 'cancelled', paymentStatus: 'refunded', source: 'one_time' })).toEqual([]);
expect(availableActions({ status: 'expired', paymentStatus: 'paid', source: 'one_time' })).toEqual(['refund']);
expect(availableActions({ status: 'delivered', paymentStatus: 'paid', source: 'subscription' })).toEqual([]);
// filterActiveOrders: by date, by 'unassigned', q matches 'nf-7k3' and '98000'
// historyParamsSchema: { status: 'confirmed,bogus' } → status ['confirmed']; { page: '0' } → page 1; { pincode: '12' } → pincode undefined
// getOrderHistory: default query has status 'confirmed,assigned,out_for_delivery,delivered,cancelled', page 1, pageSize 25; includeUnpaid adds the three unpaid statuses
```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Orders page.** `?view=active` (default) renders `OrdersFilters` (date, pincode, partner incl. "Unassigned", search; client leaf that writes URL params with `router.replace`) + `OrderList` of `filterActiveOrders(getActiveOrders())`; `RefreshButton` in the header (no auto-refresh; user ruling 2026-11-16). `?view=history` renders history filters (status multi-select, date range, include unpaid switch) + `OrderList` + `UrlPagination`. Empty states for both.
- [ ] **Step 6: Verify** suite + typecheck + lint + build. **Live check** (read-only): both tabs load, filters change the URL and results, pagination works, phone layout shows cards.
- [ ] **Step 7: Stop for review; on approval commit** `feat(orders): active and history order lists with URL filters`.

---

### Task 6: Order detail and actions (assign, out for delivery, delivered, cancel, refund, bulk assign)

**Needs from user:** OK to run actions live against the local bot (writes production rows), and a test order to use, or skip the live check.

**Files:**
- Create: `src/features/orders/server/actions.ts` + test, `src/features/orders/components/{order-detail,order-timeline,order-actions,assign-dialog,cancel-order-flow,refund-button,bulk-assign-bar}.tsx` + `cancel-order-flow.test.tsx`, `src/app/(dashboard)/orders/[orderId]/{page,not-found}.tsx`
- Modify: `orders/schemas.ts` (action schemas), `order-list.tsx` (selection + `BulkAssignBar` when `selectable`)
- shadcn add: `dialog`, `radio-group`

**Interfaces:**
- Consumes: `adminWrite`, `fromApiError`, `validationFailed`, `getOrder`, `getPartnersForAssign`, `availableActions`, `ConfirmDialog`.
- Produces (`actions.ts`, each `"use server"`, ids validated with `z.uuid()`):
  - `assignOrder(input: { orderId: string; partnerId: string }): Promise<ActionResult<{ order: OrderView }>>` → POST `/admin/orders/:id/assign`
  - `markOutForDelivery(orderId: string): Promise<ActionResult<{ order: OrderView }>>`
  - `markDelivered(orderId: string): Promise<ActionResult<{ order: OrderView; notified: boolean }>>`
  - `cancelOrder(orderId: string): Promise<ActionResult<{ order: OrderView }>>`
  - `refundOrder(orderId: string): Promise<ActionResult<{ result: 'refunded' | 'already_refunded'; order: OrderView }>>`
  - `bulkAssign(input: { orderIds: string[]; partnerId: string }): Promise<ActionResult<{ assigned: number; failed: { orderId: string; message: string }[] }>>` (1–100 ids)
- Copy (fixed): cancel dialog "Cancel order {code}?" / "This only changes the status. No money is returned and the customer is not notified."; refund prompt after cancelling a paid order "Refund ₹{total} now?" / "The full amount goes back through Cashfree. The customer is not notified."; refund dialog "Refund ₹{total} for {code}?" same description; delivered warning toast "Marked delivered, but the WhatsApp message to the customer failed. Let them know yourself."; refund toast `already_refunded` → "This order was already refunded."

- [ ] **Step 1: Write failing action tests** (mock `adminWrite` module path, `revalidatePath`):

```ts
it('assignOrder posts partnerId to /admin/orders/<id>/assign and revalidates')
it('rejects a non-uuid orderId without calling the API') // → code 'validation_error'
it('maps 409 partner_unavailable to its API message')
it('maps 409 invalid_transition (order changed elsewhere) to its API message') // Review Focus 2
it('markDelivered returns notified=false through')
it('refundOrder passes already_refunded through')
it('bulkAssign summarises results: 2 ok, 1 failed with message')
it('bulkAssign rejects 0 and 101 ids')
it('no action sends a tenant id in path or body') // inspect every adminWrite call
```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `actions.ts`.** **Step 4: Run** → PASS.
- [ ] **Step 5: Write failing component test** `cancel-order-flow.test.tsx` (jsdom, mock actions): confirming cancel on a paid order opens the "Refund … now?" dialog; on an unpaid one it doesn't; an `{ ok:false }` result shows the message and calls `router.refresh()`.
- [ ] **Step 6: Run** → FAIL. **Step 7: Implement** `OrderActions` (renders only `availableActions`), `AssignDialog` (active partners only; inactive listed disabled), `CancelOrderFlow`, `RefundButton`, `BulkAssignBar` (sticky bar on selection: partner select + Assign; toast "{n} assigned", failed ones listed). After any result: toast, `router.refresh()`. **Step 8: Run** → PASS.
- [ ] **Step 9: Detail page** `/orders/[orderId]`: `OrderDetail` (code, `StatusBadge`, `OrderTimeline`, items with line totals, subtotal/fee/total, delivery date, address + landmark + Map link, customer link to `/customers/[id]` + tap-to-call, payment status, partner) + `OrderActions`. `not-found.tsx`: "Order not found." Mobile: actions in a sticky bottom area above the bottom bar.
- [ ] **Step 10: Verify** suite + typecheck + lint + build. **Live check** per the user's answer.
- [ ] **Step 11: Stop for review; on approval commit** `feat(orders): order detail with status actions, refund and bulk assign`.

---

### Task 7: Deliveries (home) — by day, by partner, share and print

**Needs from user:** nothing (read-only live check).

**Files:**
- Create: `src/lib/whatsapp.ts` + test, `src/lib/partner-link.ts` + test, `src/features/orders/{deliveries.ts,deliveries.test.ts}`, `src/features/orders/components/{deliveries-board,delivery-date-picker,partner-delivery-group,unassigned-group,share-actions,print-sheet}.tsx`, `src/app/(print)/{layout.tsx,deliveries/print/page.tsx}`
- Modify: `src/app/(dashboard)/page.tsx`, `orders/index.ts`

**Interfaces:**
- Consumes: `getActiveOrders`, `getPartnersForAssign`, `getCurrentUser` (tenant name), `assignOrder`, `bulkAssign`, `CopyButton`, `RefreshButton`, `serverEnv().PUBLIC_APP_URL`.
- Produces (`deliveries.ts`, pure):
  - `deliveryDates(orders: OrderView[]): string[]` (unique, ascending)
  - `pickDefaultDate(dates: string[], today: string): string` (today if present; else earliest date > today; else latest date < today (overdue); else today)
  - `groupDeliveries(orders: OrderView[], date: string): { unassigned: OrderView[]; partners: { partner: NonNullable<OrderView['partner']>; pincodes: { pincode: string; orders: OrderView[] }[] }[] }` (partners by name, pincodes ascending, orders by order code)
  - `buildShareText(a: { tenantName: string; partnerName: string; date: string; orders: OrderView[]; partnerLink?: string }): string`
- Produces (`src/lib/whatsapp.ts`): `waShareUrl(phone: string, text: string): string` → `https://wa.me/<phone>?text=<encoded>`.
- Produces (`src/lib/partner-link.ts`, server-only): `partnerLink(token: string): string` → `${serverEnv().PUBLIC_APP_URL}/p/${token}`.
- Share text format (exact):

```
{tenantName} — deliveries for {Wed, 18 Nov}
{partnerName}: {n} order(s)

1. {NF-7K3QX9}
{address.name} · {+91 98000 00001 | omitted if no phone}
{address.line1}, {pincode}
Landmark: {landmark}            ← only if present
Map: {mapUrl}                   ← only if present
{White Eggs 12 pack × 1, White Eggs 6 pack × 1}

Your orders: {partnerLink}      ← only if given
```
(blank line between orders).

- [ ] **Step 1: Write failing tests** `deliveries.test.ts`:

```ts
expect(pickDefaultDate(['2026-11-18'], '2026-11-16')).toBe('2026-11-18');
expect(pickDefaultDate(['2026-11-14', '2026-11-16'], '2026-11-16')).toBe('2026-11-16');
expect(pickDefaultDate(['2026-11-14'], '2026-11-16')).toBe('2026-11-14');
expect(pickDefaultDate([], '2026-11-16')).toBe('2026-11-16');
// groupDeliveries: unassigned separated; two partners sorted by name; pincodes ascending; other dates excluded
// buildShareText: matches the exact sample above for the contract's example order; omits Landmark/Map/phone lines when absent; pluralises "1 order"/"2 orders"
expect(waShareUrl('919800000002', 'a b')).toBe('https://wa.me/919800000002?text=a%20b');   // src/lib/whatsapp.test.ts
expect(partnerLink('t'.repeat(43))).toBe(`http://localhost:3000/p/${'t'.repeat(43)}`); // src/lib/partner-link.test.ts
```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Page `/`.** `?date=` in URL (default `pickDefaultDate(..., todayInIST())`). `DeliveryDatePicker` shows chips for each date with counts, overdue dates marked "Overdue". `UnassignedGroup`: checkbox list + partner select + Assign (uses `bulkAssign`). `PartnerDeliveryGroup` per partner: header (name, tap-to-call, count, Out-for-delivery/Delivered counts), pincode sub-groups with compact order rows linking to detail; `ShareActions`: Copy list, Share on WhatsApp, Copy partner link (only if the partner's `accessToken` is set; link built server-side with `partnerLink`), Print (opens `/deliveries/print?date=&partnerId=` in a new tab). `RefreshButton` in the header (no auto-refresh). Empty state "No open deliveries."
- [ ] **Step 6: Print page** in `(print)` group (no shell, own minimal layout that still requires a session via `getCurrentUser`): one partner's orders for the date as a table with address, landmark, phone, items, a checkbox column; `window.print()` button; print CSS hides the button.
- [ ] **Step 7: Verify** suite + typecheck + lint + build. **Live check** (read-only): default date, grouping, share link opens WhatsApp with the text, print page.
- [ ] **Step 8: Stop for review; on approval commit** `feat(deliveries): deliveries board by day and partner with share and print`.

---

### Task 8: Needs refund

**Needs from user:** nothing (refund button live use only with consent, as in Task 6).

**Files:**
- Create: `src/features/orders/components/refunds-list.tsx`, `src/features/orders/constants.ts` addition `REFUND_REASON_LABEL`, query `getRefundsNeeded(): Promise<RefundNeededItem[]>` + test
- Modify: `src/app/(dashboard)/refunds/page.tsx`

**Interfaces:**
- Consumes: `adminRead`, `RefundButton` (Task 6), `refundOrder`.
- Produces: `REFUND_REASON_LABEL = { cancelled_after_payment: 'Cancelled after payment', paid_after_expiry: 'Paid after link expired' }`.

- [ ] **Step 1: Write failing test**: `getRefundsNeeded()` reads `/admin/refunds/needed` and returns `items`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** query, page (list: code → detail link, customer, amount, paid time, reason badge, `RefundButton`), empty state "Nothing to refund." **Step 4: Run** → PASS.
- [ ] **Step 5: Verify** suite + typecheck + lint + build; live read-only check.
- [ ] **Step 6: Stop for review; on approval commit** `feat(refunds): needs-refund list with refund action`.

---

### Task 9: Delivery partners and their links

**Needs from user:** OK to create a test partner live (production row; can be deactivated after), or skip.

**Files:**
- Create: `src/features/delivery-partners/{schemas.ts,utils.ts,server/queries.ts,server/actions.ts,components/{partner-list,partner-form-dialog,partner-link-actions,partner-status-toggle}.tsx,index.ts}` + tests
- Modify: `src/app/(dashboard)/partners/page.tsx`

**Interfaces:**
- Consumes: `adminRead`, `adminWrite`, `partnerLink`, `waShareUrl` (both `src/lib`, Task 7), `CopyButton`, `ConfirmDialog`.
- Produces: `partnerFormSchema = z.object({ name: z.string().trim().min(1).max(60), phone: z.string().trim().regex(/^(\+?91)?[6-9]\d{9}$/, 'Enter a 10-digit mobile number') }).strict()` (spaces/dashes stripped before regex); `partnerShareText(name: string, link: string): string` → `Hi {name}, here is your delivery link. Open it to see your orders and mark them delivered:\n{link}`; actions `createPartner(input)`, `updatePartner(id, input: Partial<PartnerForm>)`, `setPartnerActive(id, active: boolean)`, `resetPartnerLink(id)`, each `ActionResult<{ partner: Partner }>`. Queries `getPartners(): Promise<(Partner & { link: string | null })[]>`.

- [ ] **Step 1: Write failing tests**: schema accepts `9800000003`, `+91 98000-00003`, rejects `5800000003`, `98000`; `getPartners` adds `link` only when `accessToken` is set; actions hit POST `/admin/partners`, PATCH `/admin/partners/:id` with only the changed fields, POST `/admin/partners/:id/reset-link`; `validation_error` details become `fieldErrors.phone`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** schemas, utils, queries, actions. **Step 4: Run** → PASS.
- [ ] **Step 5: UI.** Partner list (name, phone tap-to-call, Active/Inactive badge, open orders count, link created date). `PartnerLinkActions`: Copy link, Share on WhatsApp (`waShareUrl(phone, partnerShareText(...))`), Reset link (confirm "The old link stops working right away."), or Generate link when `accessToken` is null (same reset endpoint, no confirm). `PartnerStatusToggle`: deactivating with `openOrderCount > 0` confirms "{name} still has {n} open orders. They stay assigned; reassign them from Deliveries." Add/Edit dialog with RHF + schema, API field errors shown inline.
- [ ] **Step 6: Verify** suite + typecheck + lint + build; live check per the user's answer.
- [ ] **Step 7: Stop for review; on approval commit** `feat(partners): manage delivery partners and their private links`.

---

### Task 10: Partner page `/p/[token]`

**Needs from user:** a partner link to test with (from Task 9), OK to mark a test order out for delivery/delivered live, or skip actions.

**Files:**
- Create: `src/features/partner-portal/{utils.ts,server/queries.ts,server/actions.ts,components/{partner-orders,partner-order-card,partner-order-actions}.tsx,index.ts}` + tests, `src/app/(partner)/{layout.tsx,p/[token]/page.tsx,p/[token]/not-found.tsx}`
- Modify: `next.config.ts` (headers for `/p/:path*`)

**Interfaces:**
- Consumes: `partnerRead`, `partnerWrite`, `fromApiError`, `formatDeliveryDate`, `telHref`, `ConfirmDialog`, `RefreshButton`.
- Produces: `TOKEN_RE = /^[A-Za-z0-9_-]{43}$/` (`utils.ts`; bad shape → `notFound()` without calling the API); `getPartnerOrders(token: string): Promise<{ partner: { name: string }; items: PartnerOrderView[] }>`; actions `partnerOutForDelivery(token: string, orderId: string): Promise<ActionResult<{ order: PartnerOrderView }>>`, `partnerDelivered(token: string, orderId: string): Promise<ActionResult<{ order: PartnerOrderView; notified: boolean }>>` (both validate token shape and uuid, never log the token, `revalidatePath('/p/[token]', 'page')`).
- Headers for `/p/:path*`: `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, `X-Robots-Tag: noindex`. Page metadata `robots: { index: false }`.
- Copy: not-found "This link isn't active. Ask the shop for a new one."; empty "No deliveries assigned to you right now."; 404 from an action → "This order is no longer assigned to you." then refresh.

- [ ] **Step 1: Write failing tests**: bad-shape token → `notFound` and no fetch; actions call `/partner/<token>/orders/<id>/out-for-delivery` and `/delivered` with no Authorization header; 409 → API message; 404 → the fixed copy above; non-uuid orderId rejected; a test asserting `next.config.ts` `headers()` returns the three headers for `/p/:path*`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: UI.** `(partner)/layout.tsx`: minimal, no dashboard shell. Page: "Hi {name}", orders grouped by delivery date (overdue first, flagged), card per order: code, status, customer name, Call button (`tel:`), address + landmark, Map button, items "name × qty". Buttons: "Out for delivery" (assigned), "Delivered" (out_for_delivery; confirm "Mark {code} delivered? The customer gets a WhatsApp message."). Large tap targets (min 44 px). `notified:false` → warning toast as in Task 6. A `RefreshButton` (no auto-refresh).
- [ ] **Step 6: Verify** suite + typecheck + lint + build. **Live check** at 390×844: page loads, response headers present (inspect), deactivated/reset link shows the not-found copy.
- [ ] **Step 7: Stop for review; on approval commit** `feat(partner): private delivery partner page with out-for-delivery and delivered`.

---

### Task 11: Catalogue — products and pincodes

**Needs from user:** OK to edit products/pincodes live (affects the real WhatsApp order form), or skip writes.

**Files:**
- Create: `src/features/products/{schemas.ts,server/queries.ts,server/actions.ts,components/{product-list,product-form-dialog}.tsx,index.ts}` + tests; `src/features/pincodes/{schemas.ts,server/queries.ts,server/actions.ts,components/{pincode-list,pincode-form-dialog}.tsx,index.ts}` + tests
- Modify: `src/app/(dashboard)/products/page.tsx`, `src/app/(dashboard)/pincodes/page.tsx`

**Interfaces:**
- Consumes: `adminRead`, `adminWrite`, `rupeesToPaise`, `paiseToRupeesInput`, `formatPaise`, `WEEKDAYS`.
- Produces (products): form schema `{ sku: /^[A-Za-z0-9_-]{1,40}$/, name: trim 1–60, price: string → paise via rupeesToPaise, 1–10,000,000 paise, error "Enter a price like 90 or 12.50", sortOrder: int ±1,000,000, active: boolean }` (`.strict()`); `MAX_ACTIVE_PRODUCTS = 8`; actions `createProduct(input)`, `updateProduct(id, input)` returning `ActionResult<{ product: Product }>`; PATCH sends only changed fields; `getProducts()`.
- Produces (pincodes): form schema `{ pincode: /^[1-9]\d{5}$/ after stripping spaces, deliveryWeekday: int 0–6, note: trim ≤120, '' → null, active: boolean }`; edit schema omits `pincode`; actions `createPincode`, `updatePincode` → `ActionResult<{ pincode: Pincode }>`; `getPincodes()`.

- [ ] **Step 1: Write failing tests**: product price `'12.5'` → body `pricePaise: 1250`; `'1.234'` → `fieldErrors.price` and no API call; 409 `too_many_active_products` and `conflict` → API message; update sends only changed fields; pincode `'560 034'` → `'560034'`; empty note → `null`; edit never sends `pincode`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: UI.** Products: header shows "{n} of 8 active", list (sort order, SKU, name, price, active switch inline, Edit), add/edit dialog; note under header "Changes show in the next order form a customer opens." Pincodes: list (pincode, weekday name, note, active switch, Edit), add dialog (weekday select Sunday…Saturday), edit dialog with pincode read-only.
- [ ] **Step 6: Verify** suite + typecheck + lint + build; live check per the user's answer.
- [ ] **Step 7: Stop for review; on approval commit** `feat(catalogue): products and pincodes management`.

---

### Task 12: Settings and change password

**Needs from user:** OK to change settings live (affects the bot), and whether to try a password change live (it signs out other sessions).

**Files:**
- Create: `src/features/settings/{schemas.ts,server/queries.ts,server/actions.ts,components/{settings-form,change-password-form}.tsx,index.ts}` + tests
- Modify: `src/app/(dashboard)/settings/page.tsx`

**Interfaces:**
- Consumes: `adminRead`, `adminWrite`, `setSession`, `rupeesToPaise`, `paiseToRupeesInput`.
- Produces: settings form schema `{ supportPhone: '' → null | Indian mobile, welcomeImageUrl: '' → null | https URL ≤2000, deliveryFee: rupees string → 0–10,000,000 paise, minOrder: same }`; `updateSettings(input): Promise<ActionResult<{ settings: Settings }>>` (sends only changed fields); `changePasswordSchema = { currentPassword: 1–1000, newPassword: 10–128, confirmPassword }` with refine "Passwords don't match"; `changePassword(input): Promise<ActionResult<null>>` (POST `/admin/auth/change-password` with `{ currentPassword, newPassword }` only; on success `setSession(token, expiresAt)`); `getSettings()`.

- [ ] **Step 1: Write failing tests**: empty support phone → `supportPhone: null`; `http://` URL rejected; fee `'0'` → `0`; change password stores the new token cookie; `invalid_credentials` → message, cookie untouched; mismatch → `fieldErrors.confirmPassword`, no API call; `confirmPassword` never sent.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: UI.** Settings form (RHF, ₹ inputs, success toast "Saved. Applies to the next order form."). Change-password section with a note "This signs you out on other devices." and success toast.
- [ ] **Step 6: Verify** suite + typecheck + lint + build; live check per the user's answer.
- [ ] **Step 7: Stop for review; on approval commit** `feat(settings): store settings and change password`.

---

### Task 13: Customers

**Needs from user:** nothing (read-only).

**Files:**
- Create: `src/features/customers/{schemas.ts,server/queries.ts,components/{customer-list,customer-search,customer-profile}.tsx,index.ts}` + tests
- Modify: `src/app/(dashboard)/customers/page.tsx`, `src/app/(dashboard)/customers/[customerId]/{page,not-found}.tsx`

**Interfaces:**
- Consumes: `adminRead`, `UrlPagination`, `OrderList` (composed by the page, imported from `@/features/orders`).
- Produces: `customerParamsSchema = { q?: ≤100, page?: int ≥1 }` (invalid dropped); `getCustomers(p): Promise<Paged<CustomerView>>` (pageSize 25); `getCustomer(id): Promise<{ customer: CustomerView; orders: OrderView[] }>`.

- [ ] **Step 1: Write failing tests**: query passes `q`, `page`, `pageSize=25`; over-long `q` dropped; 404 → `notFound`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: UI.** List with search (debounced URL update), name (profile name, else address name, else "Unknown"), phone tap-to-call, pincode, joined date; detail: profile, saved address, location map link, "Open chat" link to `/chats/[id]`, recent orders via `OrderList`.
- [ ] **Step 6: Verify** suite + typecheck + lint + build; live check.
- [ ] **Step 7: Stop for review; on approval commit** `feat(customers): customer search and detail with order history`.

---

### Task 14: Chats — list, WhatsApp-like thread, reply

**Needs from user:** OK to send a real WhatsApp reply live to a test customer (a number you control) inside the 24 h window, or skip sending.

**Files:**
- Create: `src/features/chats/{message-view.ts,message-view.test.ts,schemas.ts,server/queries.ts,server/actions.ts,components/{chat-list,chat-thread,message-bubble,reply-box}.tsx,index.ts}` + tests
- Modify: `src/app/(dashboard)/chats/{layout,page}.tsx`, `src/app/(dashboard)/chats/[customerId]/{page,not-found}.tsx`
- shadcn add: `textarea`, `scroll-area`

**Interfaces:**
- Consumes: `adminRead`, `adminWrite`, `AutoRefresh`, `RefreshButton`, `formatDateTime`. The per-row "awaiting reply" flag is `canReply && lastMessage.direction === 'in'` (same rule as navigation's counter; features can't share it, so it's one line here).
- Produces (`message-view.ts`, pure): `toMessageView(m: ChatMessage): MessageView` where
  `MessageView = { kind: 'text'; body: string } | { kind: 'interactive'; header?: string; body: string; footer?: string; options: string[] } | { kind: 'reply'; title: string } | { kind: 'form'; label: 'Order form submitted' } | { kind: 'image'; url?: string; caption?: string } | { kind: 'template'; name: string; params: string[] } | { kind: 'location'; mapUrl: string } | { kind: 'fallback'; body: string }`.
  Rules: out `interactive` button → options from `action.buttons[].reply.title`; list → `action.button` + every `sections[].rows[].title`; flow → `action.parameters.flow_cta`. In `interactive.button_reply|list_reply` → `reply` with title; `nfm_reply` → `form`; `button` (template quick reply) → `reply` with `button.text`; `image` → `image.link` / `caption`; `template` → name + body component text params; `location` → `https://maps.google.com/?q=<lat>,<lng>`. Anything else, missing fields, or `{}` payload → `fallback` with `text ?? '[' + type + ']'`. Never throws.
- Produces: `replySchema = z.object({ text: z.string().trim().min(1).max(4096) }).strict()`; `sendReply(customerId: string, input: { text: string }): Promise<ActionResult<{ message: ChatMessage }>>`; `getChats(): Promise<ChatListItem[]>`; `getChatThread(customerId): Promise<{ customer: ChatCustomer; canReply: boolean; items: ChatMessage[] }>`.
- Copy: reply disabled "You can reply only within 24 hours of the customer's last message (WhatsApp rule). Ask them to message you first."; retention note "Messages are kept for 3 days."; `outside_reply_window` → API message, then refresh.

- [ ] **Step 1: Write failing tests** `message-view.test.ts` using the contract's §10 interactive example (→ `options: ['Order Eggs', 'My Orders']`), one case per rule above, plus `{}` payload with text → fallback text, and `{}` with null text and type `sticker` → `'[sticker]'`; action tests: trims text, rejects empty and 4097 chars, maps `outside_reply_window` and `provider_error`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: UI.** `chats/layout.tsx`: on `md+` list column + outlet side by side; on phones `/chats` shows the list and `/chats/[id]` shows the thread with a back link. List rows: name, phone, last message preview, relative time, "Awaiting reply" badge, "Reply window closed" muted label. Thread: bubbles left (in) / right (out), WhatsApp-ish neutral colours from theme tokens, options as non-clickable chips, time under each, day separators in IST; scroll to bottom on load and on new messages. `ReplyBox` (textarea, Enter sends on desktop, Shift+Enter newline; disabled with copy when `!canReply`). No auto-refresh by default: a `RefreshButton`, plus an "Auto-refresh" switch (off by default) that mounts `AutoRefresh` (10 s on the thread, 30 s on the list) only while on.
- [ ] **Step 6: Verify** suite + typecheck + lint + build; live check per the user's answer.
- [ ] **Step 7: Stop for review; on approval commit** `feat(chats): conversations, whatsapp-like thread and reply within 24h`.

---

### Task 15: Release pass — accessibility, mobile, docs

**Needs from user:** time for a final walkthrough on their own phone (via the local network URL).

**Files:**
- Modify: any UI files flagged; Create: `README.md` (setup, env keys, scripts, how to run against the local bot), update `CLAUDE.md` Status line.

- [ ] **Step 1: Guidelines review.** Run the `web-design-guidelines` skill over `src/app` and `src/components`/`src/features/**/components`; fix findings (labels, focus states, contrast, tap targets ≥44 px on phone, `aria-live` for toasts, no layout shift).
- [ ] **Step 2: Mobile pass.** browser-automation at 360×740, 390×844, 768×1024, 1280×800 for every page: no horizontal scroll, bottom bar never covers actions, dialogs fit, print page prints one partner.
- [ ] **Step 3: Isolation and security sweep.** Grep: no `tenantId` sent anywhere (`rg -n "tenantId" src` → only types/display), no `fetch(` outside `src/lib/api`, no `"use client"` file imports `@/lib/api` or `@/lib/auth`, no token in `console.*`; confirm the `/p/*` headers in a production build (`pnpm build && pnpm start`).
- [ ] **Step 4: Docs.** README and the `CLAUDE.md` Status line ("first release built; hosting pending").
- [ ] **Step 5: Verify** `pnpm test && pnpm typecheck && pnpm lint && pnpm build`.
- [ ] **Step 6: Stop for review; on approval commit** `chore: accessibility and mobile pass, readme`.

Hosting and deploy (Vercel likely, region near Mumbai, env `C2V_API_URL` → Cloud Run URL, `PUBLIC_APP_URL` → final domain) is a separate step once the user decides.
