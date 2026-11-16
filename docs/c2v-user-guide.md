# C2V WhatsApp Ordering — User Guide

This guide explains what C2V does and how each kind of user works with it. It describes behaviour,
not internals. (Setup and deployment are in `docs/runbook.md` of the bot repo, `/Users/srirajdev/development/C2V_Product/C2V`.)

C2V is one service that runs WhatsApp ordering for several businesses ("clients"). Each client has
its own WhatsApp number, products, delivery areas, Cashfree account and orders. The first client is
**NutriFarm Eggs**.

---

## 1. Who uses it

| Role | Uses | Responsible for |
|---|---|---|
| **Customer** | WhatsApp, chatting with the client's business number | Placing orders, paying, sharing a delivery location |
| **Vendor** (the client, e.g. NutriFarm) | Order commands today; the web dashboard in Phase 2 | Products, prices, delivery areas, assigning deliveries, marking delivered, cancellations and refunds |
| **Delivery partner** | Nothing in C2V yet (no login) | Delivering the orders assigned to them |
| **C2V operator** (you) | Server, Meta, Cashfree, database | Onboarding clients, running the service, keeping it healthy |

---

## 2. Customer experience (WhatsApp)

1. **Say anything** (e.g. "Hi") → the bot replies with a welcome and a menu:
   - **Order Eggs**: pick packs and get them delivered
   - **My Orders**: recent orders and their status
   - **Help**: a button to call the business
   - *Subscribe*: replies that weekly subscriptions are under development and coming soon.
2. **Order Eggs** opens an order form inside WhatsApp:
   - Screen 1: choose quantities for each pack (prices shown).
   - Screen 2: name, address, landmark, pincode. Customers who chat without a visible phone number also
     enter a 10-digit mobile number. The address is remembered for next time.
3. After submitting, the customer gets an **order summary** (items, total, expected delivery date) with a
   **Pay ₹X** button. The payment link works for **30 minutes** (UPI, cards, netbanking via Cashfree).
   - Problems are explained right away: no items picked, invalid pincode, area not served yet, below the
     minimum order (NutriFarm: ₹90).
4. **After paying**: "Payment received… your order *NF-XXXXXX* is confirmed and will arrive on <date>."
   If the customer has never shared a location, the bot asks for one (optional) to help the delivery partner.
5. **If the link expires unpaid**: the customer is told the link expired and to order again from the menu.
6. **My Orders** shows the last 5 orders with status (*Payment pending, Confirmed, Assigned, Out for
   delivery, Delivered, Cancelled*). A pending order includes a note: if already paid, it can take a few
   minutes; otherwise tap Help.
7. **When delivered**, the customer receives a WhatsApp message: "Your order NF-XXXXXX has been delivered…".

**Delivery date rule:** each pincode has one delivery weekday. The delivery date is the next such weekday
after today (ordering on the delivery day itself means next week). Indian time.

---

## 3. Vendor operations

### 3.1 Order lifecycle

```
payment_pending ──paid──▶ confirmed ──▶ assigned ──▶ out_for_delivery ──▶ delivered
       │                      │             │                │
   link expires            cancel        cancel           cancel
       ▼                      ▼             ▼                ▼
    expired               cancelled     cancelled        cancelled
```

- Only **confirmed and later** orders are real orders to fulfil. Payment-pending and expired orders are
  customers who didn't pay.
- An order can only move one step at a time. For example, you can't mark an unpaid order delivered.
- **Assign** needs an active delivery partner. You can reassign while the order is *assigned*.
- **Delivered** sends the customer the delivered message.
- **Cancel** only changes the status. **It does not return money.**
- **Refund** returns the full amount to the customer through Cashfree. If the order wasn't delivered yet,
  refunding also cancels it. A refund can be safely retried; it never refunds twice.
- **Needs refund:** paid orders that were cancelled, or payments that arrived after the link had expired.
  These need a refund decision (shown as a list in the Phase 2 dashboard).

### 3.2 Order commands (until the dashboard exists)

Run by the C2V operator on the vendor's behalf:

```
ENV=prod pnpm orders <client> <orderCode> assign <partnerPhone>
ENV=prod pnpm orders <client> <orderCode> out-for-delivery
ENV=prod pnpm orders <client> <orderCode> delivered
ENV=prod pnpm orders <client> <orderCode> cancel
ENV=prod pnpm orders <client> <orderCode> refund
```
Example: `ENV=prod pnpm orders nutrifarm NF-7K3QX9 assign 9398651343`.

### 3.3 Catalogue and settings

Until the dashboard exists, these are changed by the C2V operator in the database:
- **Products:** name, price, active/hidden, display order (up to 8 shown in the order form).
- **Delivery areas:** pincode, delivery weekday, active.
- **Delivery partners:** name, phone, active.
- **Settings:** support phone (Help button), delivery fee, minimum order, welcome image.

Price and product changes apply to the next order form a customer opens; the WhatsApp form itself does
not need re-publishing.

---

## 4. Service endpoints

The service has three public addresses, all shared by every client. Nobody opens them in a browser;
Meta and Cashfree call them automatically.

| Endpoint | Called by | Purpose |
|---|---|---|
| `GET /health` | Monitoring / Cloud Run | Returns `{"ok":true}` when the service is up |
| `GET /webhooks/whatsapp` | Meta (once, during setup) | Webhook verification handshake using the verify token |
| `POST /webhooks/whatsapp` | Meta | Delivers customer messages, button taps, order-form submissions and locations. The service works out which client from the WhatsApp number that received the message |
| `POST /webhooks/cashfree` | Cashfree | Payment updates (paid, expired). The service works out which client from the payment, and checks Cashfree's signature with that client's key |

Unsigned or invalid requests are rejected. Duplicate deliveries from Meta or Cashfree are handled safely.

---

## 5. What's stored and for how long

- Customers (WhatsApp name, number or WhatsApp user ID, saved address, optional location), orders, order
  items, payments, delivery partners, products, delivery areas.
- **Chat messages are kept for 3 days**, then deleted automatically every night.
- Each client's data is kept separate and is only visible to that client.

---

## 6. Not available yet

Subscriptions (weekly AutoPay), the vendor web dashboard and login, cash on delivery, the out-for-delivery
message to customers, a message to customers when a refund is issued, and automatic refunds for late
payments.
