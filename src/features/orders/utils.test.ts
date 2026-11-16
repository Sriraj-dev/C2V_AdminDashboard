import { describe, expect, it } from "vitest";
import type { OrderView } from "@/lib/api/types";
import { availableActions, filterActiveOrders } from "./utils";

const base = { paymentStatus: "paid", source: "one_time" } as const;

describe("availableActions", () => {
  it("confirmed", () => expect(availableActions({ ...base, status: "confirmed" })).toEqual(["assign", "cancel", "refund"]));
  it("assigned", () =>
    expect(availableActions({ ...base, status: "assigned" })).toEqual(["reassign", "out_for_delivery", "cancel", "refund"]));
  it("out for delivery", () =>
    expect(availableActions({ ...base, status: "out_for_delivery" })).toEqual(["delivered", "cancel", "refund"]));
  it("delivered", () => expect(availableActions({ ...base, status: "delivered" })).toEqual(["refund"]));
  it("cancelled and refunded", () =>
    expect(availableActions({ status: "cancelled", paymentStatus: "refunded", source: "one_time" })).toEqual([]));
  it("expired but paid", () => expect(availableActions({ ...base, status: "expired" })).toEqual(["refund"]));
  it("subscription never refunds", () =>
    expect(availableActions({ status: "delivered", paymentStatus: "paid", source: "subscription" })).toEqual([]));
});

function order(p: Partial<OrderView> & { name?: string }): OrderView {
  return {
    id: "1",
    orderCode: "NF-AAAAAA",
    status: "confirmed",
    source: "one_time",
    deliveryDate: "2026-11-20",
    pincode: "560001",
    address: { name: p.name ?? "Asha", line1: "x", pincode: "560001" },
    customer: { id: "c", profileName: "Prof", phone: "919800012345" },
    partner: null,
    ...p,
  } as OrderView;
}

describe("filterActiveOrders", () => {
  const a = order({ id: "a", orderCode: "NF-7K3QX9", deliveryDate: "2026-11-20" });
  const b = order({
    id: "b",
    orderCode: "NF-ZZZZZZ",
    deliveryDate: "2026-11-21",
    pincode: "560002",
    name: "Ravi",
    partner: { id: "p1", name: "P", phone: "1" },
    customer: { id: "c2", profileName: null, phone: "919111111111" },
  });
  const all = [a, b];
  it("no filter", () => expect(filterActiveOrders(all, {})).toEqual(all));
  it("date", () => expect(filterActiveOrders(all, { date: "2026-11-21" })).toEqual([b]));
  it("pincode", () => expect(filterActiveOrders(all, { pincode: "560002" })).toEqual([b]));
  it("unassigned", () => expect(filterActiveOrders(all, { partnerId: "unassigned" })).toEqual([a]));
  it("partner", () => expect(filterActiveOrders(all, { partnerId: "p1" })).toEqual([b]));
  it("q code", () => expect(filterActiveOrders(all, { q: "nf-7k3" })).toEqual([a]));
  it("q phone digits", () => expect(filterActiveOrders(all, { q: "98000" })).toEqual([a]));
  it("q with code-like text does not match a phone containing a digit run", () => {
    const c = order({ id: "c", orderCode: "NF-CCCCCC", name: "Zed", customer: { id: "c3", profileName: null, phone: "917300000000" } });
    expect(filterActiveOrders([c], { q: "nf-7k3" })).toEqual([]);
  });
  it("q with +91 and spaces matches phone", () => expect(filterActiveOrders(all, { q: "+91 98000" })).toEqual([a]));
  it("q name", () => expect(filterActiveOrders(all, { q: "ravi" })).toEqual([b]));
  it("q profile name", () => expect(filterActiveOrders(all, { q: "prof" })).toEqual([a]));
});
