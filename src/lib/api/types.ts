/** Shapes of the bot server's admin API. Source of truth: docs/admin-api.md §2–§9. */

export type OrderStatus =
  | "payment_pending"
  | "confirmed"
  | "assigned"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "payment_failed"
  | "expired";
export type PaymentStatus = "created" | "paid" | "failed" | "expired" | "refunded";

export type Address = { name: string; line1: string; landmark?: string; pincode: string; phone?: string };
export type GeoLocation = { lat: number; lng: number };

export interface OrderView {
  id: string;
  orderCode: string;
  status: OrderStatus;
  source: "one_time" | "subscription";
  deliveryDate: string;
  pincode: string;
  address: Address;
  location: GeoLocation | null;
  mapUrl: string | null;
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  customer: { id: string; profileName: string | null; phone: string | null };
  partner: { id: string; name: string; phone: string } | null;
  paymentStatus: PaymentStatus | null;
  items: { productId: string; name: string; unitPricePaise: number; quantity: number; lineTotalPaise: number }[];
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
}

export interface CustomerView {
  id: string;
  profileName: string | null;
  phone: string | null;
  email: string | null;
  defaultAddress: Address | null;
  defaultLocation: GeoLocation | null;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  pricePaise: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Pincode {
  id: string;
  pincode: string;
  deliveryWeekday: number;
  note: string | null;
  active: boolean;
  createdAt: string;
}

export interface Settings {
  supportPhone: string | null;
  welcomeImageUrl: string | null;
  deliveryFeePaise: number;
  minOrderPaise: number;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  accessToken: string | null;
  accessTokenCreatedAt: string | null;
  openOrderCount: number;
  createdAt: string;
}

export interface PartnerOrderView {
  id: string;
  orderCode: string;
  status: OrderStatus;
  deliveryDate: string;
  address: Address;
  mapUrl: string | null;
  customerName: string;
  customerPhone: string | null;
  items: { name: string; quantity: number }[];
}

export interface ChatMessage {
  id: string;
  direction: "in" | "out";
  type: string;
  text: string | null;
  payload: unknown;
  createdAt: string;
}

export type ChatCustomer = { id: string; profileName: string | null; phone: string | null };
export type ChatListItem = {
  customer: ChatCustomer;
  lastMessage: { direction: "in" | "out"; text: string | null; createdAt: string };
  lastInboundAt: string | null;
  canReply: boolean;
};

export type AuthUser = { username: string; tenantId: string; tenantName: string };
export type LoginResponse = { token: string; expiresAt: string; user: AuthUser };

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number };

export type RefundNeededItem = OrderView & { refundReason: "cancelled_after_payment" | "paid_after_expiry" };

export type BulkResult =
  | { orderId: string; ok: true; order: OrderView }
  | { orderId: string; ok: false; error: { code: string; message: string } };
