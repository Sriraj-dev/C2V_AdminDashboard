# C2V Admin API — Contract

The HTTP API the vendor dashboard (separate Next.js repo) uses. It lives in the bot server, next to the
webhooks, and reuses the same business logic (`updateStatus`, `refundOrder`, `sendAndLog`).
This document is the contract: the dashboard codes against it, and the server must match it.

Decided with the user on 2026-11-15:
- The dashboard never talks to Postgres, Cashfree or Meta. Only the bot server does.
- The browser never calls this API. The Next.js **server** calls it, so there is no CORS. Next.js stores the
  session token in its own httpOnly cookie and sends it as a header.
- No summary or deliveries endpoints: the dashboard derives those from order lists.
- Rate limiting is deferred (backlog).
- The dashboard sends the bearer token **from its server side only** (Next.js route handlers or server
  components). Never expose the token, or the `/partner/<token>` value, to browser JavaScript outside the
  dashboard's own httpOnly cookie.

---

## 1. Conventions

- Base path: `/admin` (vendor, needs a session) and `/partner` (delivery partner private link, no session).
- JSON in and out. Field names are camelCase.
- **Money** is integer paise (`totalPaise: 57000` = ₹570). **Timestamps** are ISO 8601 UTC strings.
  **Delivery dates** are `YYYY-MM-DD` (Indian calendar day). **Phones** are `91XXXXXXXXXX`.
- **Auth:** `Authorization: Bearer <sessionToken>` on every `/admin/*` call except login.
- **Tenant** comes only from the session. No endpoint accepts a tenant id. Another tenant's ids return 404.
- **Paging** (where marked): `?page=1&pageSize=25`. `page` is an integer >= 1 (default 1), `pageSize` an integer 1-100
  (default 25). Out-of-range values are rejected with 400 `validation_error`, not clamped. Response: `{ items, page, pageSize, total }`.
- **IDs** in paths are UUIDs. A malformed id returns 404 `not_found`, the same as an unknown one. Any path under
  `/admin` that doesn't exist returns 401 without a session, else 404 `not_found`.
- **Request bodies** must be JSON. Bodies for products, pincodes, partners, settings and chat reply reject unknown
  fields (400 `validation_error`), and PATCH bodies need at least one field.
- **Errors:** status code plus `{ "error": { "code": "...", "message": "...", "details"?: ... } }`.

| HTTP | `code` | When |
|---|---|---|
| 400 | `validation_error` | Bad body or query, or body isn't JSON (`details` = list of `{ path, message }`, absent for non-JSON) |
| 401 | `unauthorized` | Missing, unknown or expired session (also: vendor or tenant deactivated) |
| 401 | `invalid_credentials` | Login or current-password check failed (never says which part was wrong) |
| 404 | `not_found` | No such record **for this tenant**, malformed id, unknown path, or invalid partner link |
| 409 | `invalid_transition` | Status change not allowed from the current status (or changed concurrently). Also returned to a partner link for an action the order's status doesn't allow |
| 409 | `partner_unavailable` | Assigning to an inactive or unknown partner |
| 409 | `refund_not_possible` | No paid payment to refund |
| 409 | `conflict` | Unique value already used (product SKU, pincode) |
| 409 | `too_many_active_products` | Activating a 9th product (the WhatsApp order form has 8 slots) |
| 409 | `outside_reply_window` | Chat reply more than 24 h after the customer's last message |
| 422 | `not_supported` | e.g. refunding a subscription order |
| 502 | `provider_error` | Cashfree or WhatsApp call failed (nothing was changed in the DB) |
| 500 | `internal` | Unexpected; logged server-side |

---

## 2. Shared shapes

```ts
type OrderStatus = 'payment_pending' | 'confirmed' | 'assigned' | 'out_for_delivery'
                 | 'delivered' | 'cancelled' | 'payment_failed' | 'expired';
type PaymentStatus = 'created' | 'paid' | 'failed' | 'expired' | 'refunded';

type Address = { name: string; line1: string; landmark?: string; pincode: string; phone?: string };
type GeoLocation = { lat: number; lng: number };

interface OrderView {
  id: string;                 // uuid, use for actions
  orderCode: string;          // "NF-7K3QX9", show to humans
  status: OrderStatus;
  source: 'one_time' | 'subscription';
  deliveryDate: string;       // YYYY-MM-DD
  pincode: string;
  address: Address;           // snapshot taken at order time; phone (10 digits) only if the customer typed one
  location: GeoLocation | null;
  mapUrl: string | null;      // https://maps.google.com/?q=<lat>,<lng>
  subtotalPaise: number; deliveryFeePaise: number; totalPaise: number;
  customer: { id: string; profileName: string | null; phone: string | null };
  partner: { id: string; name: string; phone: string } | null;
  paymentStatus: PaymentStatus | null;   // the order's payment-link payment; null if none
  items: { productId: string; name: string; unitPricePaise: number; quantity: number; lineTotalPaise: number }[];
  createdAt: string; updatedAt: string; paidAt: string | null; deliveredAt: string | null;
}

interface CustomerView {
  id: string;
  profileName: string | null;
  phone: string | null;               // see rule below
  email: string | null;
  defaultAddress: Address | null;
  defaultLocation: GeoLocation | null;
  createdAt: string;
}

interface Product {
  id: string; sku: string;           // sku is stored upper-case
  name: string; pricePaise: number;
  active: boolean; sortOrder: number; createdAt: string;
}

interface Pincode {
  id: string;
  pincode: string;                   // 6 digits
  deliveryWeekday: number;           // 0 = Sunday ... 6 = Saturday
  note: string | null;
  active: boolean;
  createdAt: string;
}

interface Settings {
  supportPhone: string | null;       // 91XXXXXXXXXX
  welcomeImageUrl: string | null;    // https URL
  deliveryFeePaise: number;
  minOrderPaise: number;
}

interface Partner {
  id: string; name: string;
  phone: string;                     // 91XXXXXXXXXX
  active: boolean;
  accessToken: string | null;        // 43-char URL-safe token; null until a link is generated
  accessTokenCreatedAt: string | null;
  openOrderCount: number;            // orders currently assigned or out_for_delivery
  createdAt: string;
}

interface PartnerOrderView {         // what a delivery partner sees: no prices, no payment info
  id: string; orderCode: string;
  status: OrderStatus;               // 'assigned' | 'out_for_delivery' on the list; may differ in action responses
  deliveryDate: string;
  address: Address;
  mapUrl: string | null;
  customerName: string;              // the name on the delivery address
  customerPhone: string | null;
  items: { name: string; quantity: number }[];
}

interface ChatMessage {
  id: string;
  direction: 'in' | 'out';
  type: string;        // WhatsApp type: 'text' | 'interactive' | 'image' | 'template' | 'button' | 'location' | ...
  text: string | null; // short summary for previews, e.g. body text, '[template order_delivered] NF-7K3QX9', '[location 12.9,77.6]'
  payload: unknown;    // the full message, for a WhatsApp-like view (see section 9)
  createdAt: string;
}

interface ApiErrorBody { error: { code: string; message: string; details?: { path: string; message: string }[] } }
```
`customer.phone` is the WhatsApp number. For customers who chat without a visible number, it is the
mobile number they typed in the order form, with `91` added, or `null` if there is none.
`CustomerView.phone` and the chat `customer.phone` follow the same rule, using the saved address's phone.

---

## 3. Auth

| Method & path | Body | Response |
|---|---|---|
| `POST /admin/auth/login` | `{ username (1-200 chars), password (1-1000 chars) }` | `200 { token, expiresAt, user }` · 401 `invalid_credentials` (wrong password, unknown or inactive user) |
| `POST /admin/auth/logout` | none | `204` no body (ends this session) |
| `GET /admin/me` | none | `200 { user }` |
| `POST /admin/auth/change-password` | `{ currentPassword (1-1000), newPassword (10-128 chars) }` | `200 { token, expiresAt, user }`. Signs out every session of this user, then returns a fresh one for the current device. 401 `invalid_credentials` if the current password is wrong |

```ts
type AuthUser = { username: string; tenantId: string; tenantName: string };
type LoginResponse = { token: string; expiresAt: string; user: AuthUser };   // token is 43 chars, URL-safe
```
Sessions last **30 days** from login (no sliding renewal). The token is shown only in this response: the server
stores a hash. Usernames are unique across all tenants (login doesn't name the tenant) and are case-insensitive.
Inactive vendors can't log in, and deactivating one ends their sessions. Send the token as
`Authorization: Bearer <token>`.

Vendor logins are created by the C2V operator, not via the API:
```
ENV=prod pnpm vendors create <tenantId> <username>     # prints a generated password once
ENV=prod pnpm vendors reset-password <username>        # new password, all sessions ended
ENV=prod pnpm vendors deactivate <username>            # can't log in, all sessions ended
ENV=prod pnpm vendors activate <username>
```

---

## 4. Orders

| Method & path | Notes | Response |
|---|---|---|
| `GET /admin/orders/active` | All `confirmed`, `assigned`, `out_for_delivery` orders. **Not paged** (a small working set). Sorted by delivery date, then oldest first | `200 { items: OrderView[] }` |
| `GET /admin/orders` | Paged history, all statuses. Filters (all optional): `status` (comma list of `OrderStatus`, e.g. `confirmed,assigned`; unknown value is 400), `deliveryFrom`, `deliveryTo` (YYYY-MM-DD, inclusive), `pincode` (exactly 6 digits), `partnerId` (uuid), `q` (max 100 chars; partial match on order code, or on the customer's WhatsApp number or order-form phone when it has digits). Sorted newest first | `200 { items: OrderView[], page, pageSize, total }` |
| `GET /admin/orders/:id` | | `200 { order: OrderView }` · 404 |
| `GET /admin/refunds/needed` | Orders with a `paid` link payment whose status is `cancelled` (reason `cancelled_after_payment`) or `expired` (`paid_after_expiry`: paid after the link closed). Once refunded they drop off. Not paged, newest first | `200 { items: (OrderView & { refundReason: 'cancelled_after_payment' \| 'paid_after_expiry' })[] }` |

### Actions

All return the updated order. Only transitions valid for the current status succeed. Otherwise the API returns
409 `invalid_transition`.

| Method & path | Body | Allowed from | Response |
|---|---|---|---|
| `POST /admin/orders/:id/assign` | `{ partnerId (uuid) }` | `confirmed`, `assigned` (reassign) | `200 { order }` · 409 `partner_unavailable` (unknown or inactive partner) |
| `POST /admin/orders/:id/out-for-delivery` | none | `assigned` | `200 { order }` |
| `POST /admin/orders/:id/delivered` | none | `out_for_delivery` | `200 { order, notified }`. `notified: false` = delivered, but the customer's WhatsApp message failed: show a warning |
| `POST /admin/orders/:id/cancel` | none | `confirmed`, `assigned`, `out_for_delivery` | `200 { order }`. **No money moves.** If `order.paymentStatus === 'paid'`, offer "Refund now?" |
| `POST /admin/orders/:id/refund` | none | any one-time order whose payment is `paid` (or already `refunded`) | `200 { result: 'refunded' \| 'already_refunded', order }`. Full amount via Cashfree; also cancels the order if it is still open (`confirmed`, `assigned`, `out_for_delivery`); delivered, expired and cancelled orders keep their status. Safe to retry. 409 `refund_not_possible` (no payment, or payment not `paid`), 422 `not_supported` (subscription order), 502 `provider_error` if Cashfree fails (nothing changed) |
| `POST /admin/orders/bulk-assign` | `{ orderIds: string[] (1-100 uuids), partnerId (uuid) }` | as assign | `200 { results: BulkResult[] }` where `BulkResult = { orderId, ok: true, order: OrderView } \| { orderId, ok: false, error: { code, message } }`. Each order is handled separately; one failure doesn't stop the rest. Duplicate ids are processed once. The HTTP status is 200 even if every order failed: check `ok` |

---

## 5. Customers

| Method & path | Notes | Response |
|---|---|---|
| `GET /admin/customers` | Paged. `q` (max 100 chars) matches profile name or saved-address name (partial, case-insensitive), or WhatsApp number / saved-address phone when it contains digits. Sorted newest first | `200 { items: CustomerView[], page, pageSize, total }` |
| `GET /admin/customers/:id` | Includes the 20 most recent orders (newest first, all statuses) | `200 { customer: CustomerView, orders: OrderView[] }` · 404 |

`CustomerView` is defined in section 2.

---

## 6. Catalogue and settings

**Products.** There is no delete, because old orders refer to products: set `active: false` instead.
At most **8 active** products. A 9th returns 409 `too_many_active_products`.

| Method & path | Body | Response |
|---|---|---|
| `GET /admin/products` | | `200 { items: Product[] }` (sorted by sortOrder, then creation) |
| `POST /admin/products` | `{ sku, name, pricePaise, sortOrder?, active? }` | `201 { product }` · 409 `conflict` (SKU exists) · 409 `too_many_active_products` |
| `PATCH /admin/products/:id` | any of `{ sku, name, pricePaise, sortOrder, active }` | `200 { product }` · 404 · 409 `conflict` · 409 `too_many_active_products` |

Limits: `sku` 1-40 characters from `A-Z a-z 0-9 _ -` (stored upper-case, unique per tenant), `name` 1-60 characters
(trimmed), `pricePaise` integer 1-10,000,000, `sortOrder` integer within +-1,000,000 (default on create: last, i.e.
highest + 1), `active` default `true`.

**Pincodes** (delivery areas). `deliveryWeekday`: 0 = Sunday ... 6 = Saturday.

| Method & path | Body | Response |
|---|---|---|
| `GET /admin/pincodes` | | `200 { items: Pincode[] }` (sorted by pincode) |
| `POST /admin/pincodes` | `{ pincode, deliveryWeekday, note?, active? }` | `201 { pincode: Pincode }` · 409 `conflict` (already exists for this tenant) |
| `PATCH /admin/pincodes/:id` | any of `{ deliveryWeekday, note, active }` (the pincode itself can't change; add a new one) | `200 { pincode: Pincode }` · 404 |

`pincode` is 6 digits, first digit 1-9 (spaces are stripped), `deliveryWeekday` an integer 0-6, `note` up to 120
characters or `null` (empty text becomes `null`), `active` default `true`.

**Settings**

| Method & path | Body | Response |
|---|---|---|
| `GET /admin/settings` | | `200 { settings: Settings }` |
| `PATCH /admin/settings` | any of `{ supportPhone, welcomeImageUrl, deliveryFeePaise, minOrderPaise }` | `200 { settings: Settings }` |

`supportPhone`: an Indian mobile (10 digits, or with `91`/`+91`), saved as `91XXXXXXXXXX`, or `null` to clear.
`welcomeImageUrl`: an `https` URL up to 2000 characters, or `null` to clear. `deliveryFeePaise` and `minOrderPaise`:
integers 0-10,000,000.

Changes to products, pincodes and settings apply to the next order form a customer opens.

---

## 7. Delivery partners

| Method & path | Body | Response |
|---|---|---|
| `GET /admin/partners` | | `200 { items: Partner[] }` (oldest first) |
| `POST /admin/partners` | `{ name (1-60 chars), phone }` | `201 { partner: Partner }` (a link token is generated) |
| `PATCH /admin/partners/:id` | any of `{ name, phone, active }` | `200 { partner: Partner }` · 404 |
| `POST /admin/partners/:id/reset-link` | none | `200 { partner: Partner }` (new token; the old link stops working immediately) · 404 |

`phone` is an Indian mobile: 10 digits starting 6-9, optionally with `91` or `+91` (spaces and dashes are ignored),
and is saved as `91XXXXXXXXXX`. Phones are not unique.

The dashboard builds the link as `<dashboard-origin>/p/<accessToken>`. Partners created before this API have no
token (`accessToken: null`) until "reset link" is used. Deactivating a partner disables their link (it then
returns 404). Their open orders stay assigned (`openOrderCount` shows how many), so the vendor should reassign
them. Re-activating restores the same link. `PATCH` never changes the token; only reset-link does.

---

## 8. Partner link (no login)

The token in the URL is the only credential. A token of the wrong shape (not 43 URL-safe characters), an unknown
token, an inactive partner and any unknown path under `/partner` all return 404 `not_found`.

| Method & path | Response |
|---|---|
| `GET /partner/:token/orders` | `200 { partner: { name }, items: PartnerOrderView[] }`: this partner's `assigned` and `out_for_delivery` orders, sorted by delivery date, then oldest first |
| `POST /partner/:token/orders/:orderId/out-for-delivery` | `200 { order: PartnerOrderView }` (only from `assigned`) |
| `POST /partner/:token/orders/:orderId/delivered` | `200 { order: PartnerOrderView, notified: boolean }` (only from `out_for_delivery`; `notified: false` = delivered but the customer message failed) |

`PartnerOrderView` is defined in section 2. It has **no prices or payment info**. An order that is not this
partner's, or is no longer `assigned`/`out_for_delivery` (delivered, cancelled, reassigned), returns 404. An order
that is still open but in the wrong status for the action (e.g. `delivered` while only `assigned`, or
`out-for-delivery` twice) returns 409 `invalid_transition`. Partners can't cancel, refund, reassign or assign.
The server sends `Referrer-Policy: no-referrer` and `Cache-Control: no-store` on these responses (errors
included), and never logs the token.

---

## 9. Chats

Messages are kept for 3 days, so these lists are small and not paged.

| Method & path | Response |
|---|---|
| `GET /admin/chats` | `200 { items: ChatListItem[] }`, sorted by the latest message first |
| `GET /admin/chats/:customerId/messages` | `200 { customer, canReply, items: ChatMessage[] }`, oldest first · 404 |
| `POST /admin/chats/:customerId/reply` | body `{ text }` (trimmed, 1-4096 chars, no other fields) → `201 { message: ChatMessage }` · 404 · 409 `outside_reply_window` when the customer's last inbound message is 24 h old or more, or there is none (WhatsApp rule) · 502 `provider_error` if the send fails |

```ts
type ChatCustomer = { id: string; profileName: string | null; phone: string | null };
type ChatListItem = {
  customer: ChatCustomer;
  lastMessage: { direction: 'in' | 'out'; text: string | null; createdAt: string };
  lastInboundAt: string | null;
  canReply: boolean;
};
```

`canReply` = the customer messaged within the last 24 hours.

`ChatMessage` is defined in section 2.

`payload` is stored as-is, so its shape follows WhatsApp Cloud API:

- `direction: 'out'`: the message object we sent to `POST /{phone-number-id}/messages`, without `to`. For example
  `{ type: 'text', text: { body } }`, `{ type: 'interactive', interactive: { type: 'button' | 'list' | 'flow', header?, body: { text }, footer?, action } }`,
  `{ type: 'image', image: { link, caption? } }`, `{ type: 'template', template: { name, language, components } }`.
- `direction: 'in'`: the raw message object from the webhook (`entry[].changes[].value.messages[]`). For example
  `{ type: 'text', text: { body } }`, `{ type: 'interactive', interactive: { type: 'button_reply', button_reply: { id, title } } }`,
  `{ type: 'interactive', interactive: { type: 'nfm_reply', nfm_reply: { response_json } } }` (order form), `{ type: 'location', location: { latitude, longitude } }`.
- A failed send (WhatsApp rejected it) is still logged as `out`; it can be `{}` for old rows. Always fall back to `text` when the
  payload has a shape the dashboard doesn't draw. The conversation list (`GET /admin/chats`) does not include payloads.

---

## 10. Examples

All values are made up. Responses are shortened only where noted.

**Auth: login**
```
POST /admin/auth/login
{ "username": "acme", "password": "<the password the operator gave you>" }

200
{ "token": "<43-char token>", "expiresAt": "2026-12-15T09:30:00.000Z",
  "user": { "username": "acme", "tenantId": "nutrifarm", "tenantName": "NutriFarm Eggs" } }
```

**An OrderView** (`GET /admin/orders/:id` returns `{ "order": ... }`)
```json
{
  "id": "5f0c2d3e-8a41-4b6e-9c52-1d7e3a9b4f10",
  "orderCode": "NF-7K3QX9",
  "status": "assigned",
  "source": "one_time",
  "deliveryDate": "2026-11-18",
  "pincode": "560034",
  "address": { "name": "Asha Rao", "line1": "12, 4th Cross, Koramangala", "landmark": "Near the park", "pincode": "560034", "phone": "9800000001" },
  "location": { "lat": 12.9352, "lng": 77.6245 },
  "mapUrl": "https://maps.google.com/?q=12.9352,77.6245",
  "subtotalPaise": 25800, "deliveryFeePaise": 0, "totalPaise": 25800,
  "customer": { "id": "c1a7e0b2-3f55-4d0a-8e6b-7a2f9d1c5e44", "profileName": "Asha", "phone": "919800000001" },
  "partner": { "id": "9b3d6f21-5c0e-4a7b-b1d8-2e4f6a8c0d13", "name": "Ravi", "phone": "919800000002" },
  "paymentStatus": "paid",
  "items": [
    { "productId": "0e8b4c7a-1d2f-4e63-a9b5-3c7d1f5e8a20", "name": "White Eggs 12 pack", "unitPricePaise": 16800, "quantity": 1, "lineTotalPaise": 16800 },
    { "productId": "7a2c9e41-6b3d-4f08-8d15-9e0b2c4a6f37", "name": "White Eggs 6 pack", "unitPricePaise": 9000, "quantity": 1, "lineTotalPaise": 9000 }
  ],
  "createdAt": "2026-11-14T06:12:44.000Z", "updatedAt": "2026-11-15T04:02:10.000Z",
  "paidAt": "2026-11-14T06:15:03.000Z", "deliveredAt": null
}
```

**Customer detail** (`GET /admin/customers/:id`, `orders` shortened to `[ ...OrderView ]`)
```json
{
  "customer": {
    "id": "c1a7e0b2-3f55-4d0a-8e6b-7a2f9d1c5e44",
    "profileName": "Asha", "phone": "919800000001", "email": null,
    "defaultAddress": { "name": "Asha Rao", "line1": "12, 4th Cross, Koramangala", "pincode": "560034" },
    "defaultLocation": { "lat": 12.9352, "lng": 77.6245 },
    "createdAt": "2026-10-02T11:20:00.000Z"
  },
  "orders": [ ]
}
```

**Product: create**
```
POST /admin/products
{ "sku": "egg-brown-12", "name": "Brown Eggs 12 pack", "pricePaise": 18000 }

201
{ "product": { "id": "3d9f1b52-7c4e-4a86-b0d2-5e8a7c1f9b64", "sku": "EGG-BROWN-12", "name": "Brown Eggs 12 pack",
               "pricePaise": 18000, "active": true, "sortOrder": 4, "createdAt": "2026-11-16T05:00:00.000Z" } }
```

**Partner: create, then use the link**
```
POST /admin/partners
{ "name": "Suresh", "phone": "9800000003" }

201
{ "partner": { "id": "e4b8a0c6-2d1f-4973-85ab-6c0d9f3e7a52", "name": "Suresh", "phone": "919800000003", "active": true,
               "accessToken": "<43-char token>", "accessTokenCreatedAt": "2026-11-16T05:05:00.000Z",
               "openOrderCount": 0, "createdAt": "2026-11-16T05:05:00.000Z" } }
```
Link shown to the vendor: `https://dashboard.example.com/p/<43-char token>`.

**Partner link orders** (`GET /partner/<43-char token>/orders`)
```json
{
  "partner": { "name": "Suresh" },
  "items": [
    {
      "id": "5f0c2d3e-8a41-4b6e-9c52-1d7e3a9b4f10", "orderCode": "NF-7K3QX9", "status": "assigned",
      "deliveryDate": "2026-11-18",
      "address": { "name": "Asha Rao", "line1": "12, 4th Cross, Koramangala", "landmark": "Near the park", "pincode": "560034" },
      "mapUrl": "https://maps.google.com/?q=12.9352,77.6245",
      "customerName": "Asha Rao", "customerPhone": "919800000001",
      "items": [ { "name": "White Eggs 12 pack", "quantity": 1 }, { "name": "White Eggs 6 pack", "quantity": 1 } ]
    }
  ]
}
```

**Chat message with an interactive payload** (an item of `GET /admin/chats/:customerId/messages`)
```json
{
  "id": "b7c1d3e5-9f20-4a68-8b4c-0d2e6a8f1c93",
  "direction": "out", "type": "interactive",
  "text": "Welcome to NutriFarm! What would you like to do?",
  "payload": {
    "type": "interactive",
    "interactive": {
      "type": "button",
      "body": { "text": "Welcome to NutriFarm! What would you like to do?" },
      "action": { "buttons": [
        { "type": "reply", "reply": { "id": "order", "title": "Order Eggs" } },
        { "type": "reply", "reply": { "id": "my_orders", "title": "My Orders" } }
      ] }
    }
  },
  "createdAt": "2026-11-16T05:10:12.000Z"
}
```

**Error response** (assigning to an inactive partner; bad input uses `validation_error` with `details`)
```
POST /admin/orders/5f0c2d3e-8a41-4b6e-9c52-1d7e3a9b4f10/assign   { "partnerId": "<an inactive partner's id>" }

409
{ "error": { "code": "partner_unavailable", "message": "Delivery partner Suresh is not active" } }

POST /admin/products   { "sku": "x", "name": "", "pricePaise": 0 }

400
{ "error": { "code": "validation_error", "message": "Invalid request",
             "details": [ { "path": "name", "message": "Too small: expected string to have >=1 characters" },
                          { "path": "pricePaise", "message": "Too small: expected number to be >=1" } ] } }
```

---

## 11. Not in this version

Rate limiting (login, `/admin/*`, `/partner/*`), audit trail (who changed what), staff logins (the table supports several per tenant, but the
CLI and dashboard assume one), unassigning open orders when a partner is deactivated, customer messages on cancel or refund, the out-for-delivery customer message,
subscriptions UI, live push (polling is fine).
