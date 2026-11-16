import { describe, expect, it } from "vitest";
import type { OrderView } from "@/lib/api/types";
import { buildShareText, deliveryDates, groupDeliveries, pickDefaultDate } from "./deliveries";

const RAVI = { id: "9b3d6f21-5c0e-4a7b-b1d8-2e4f6a8c0d13", name: "Ravi", phone: "919800000002" };
const ANU = { id: "a1", name: "Anu", phone: "919800000003" };

function order(over: Partial<OrderView> = {}): OrderView {
  return {
    id: "5f0c2d3e-8a41-4b6e-9c52-1d7e3a9b4f10",
    orderCode: "NF-7K3QX9",
    status: "assigned",
    source: "one_time",
    deliveryDate: "2026-11-18",
    pincode: "560034",
    address: {
      name: "Asha Rao",
      line1: "12, 4th Cross, Koramangala",
      landmark: "Near the park",
      pincode: "560034",
      phone: "9800000001",
    },
    location: { lat: 12.9352, lng: 77.6245 },
    mapUrl: "https://maps.google.com/?q=12.9352,77.6245",
    subtotalPaise: 25800,
    deliveryFeePaise: 0,
    totalPaise: 25800,
    customer: { id: "c1", profileName: "Asha", phone: "919800000001" },
    partner: RAVI,
    paymentStatus: "paid",
    items: [
      { productId: "p1", name: "White Eggs 12 pack", unitPricePaise: 16800, quantity: 1, lineTotalPaise: 16800 },
      { productId: "p2", name: "White Eggs 6 pack", unitPricePaise: 9000, quantity: 1, lineTotalPaise: 9000 },
    ],
    createdAt: "2026-11-14T06:12:44.000Z",
    updatedAt: "2026-11-15T04:02:10.000Z",
    paidAt: "2026-11-14T06:15:03.000Z",
    deliveredAt: null,
    ...over,
  };
}

describe("pickDefaultDate", () => {
  it("uses the earliest future date when today is absent", () => {
    expect(pickDefaultDate(["2026-11-18"], "2026-11-16")).toBe("2026-11-18");
    expect(pickDefaultDate(["2026-11-20", "2026-11-18"], "2026-11-16")).toBe("2026-11-18");
  });
  it("uses today when present", () => {
    expect(pickDefaultDate(["2026-11-14", "2026-11-16"], "2026-11-16")).toBe("2026-11-16");
  });
  it("falls back to the latest overdue date", () => {
    expect(pickDefaultDate(["2026-11-14"], "2026-11-16")).toBe("2026-11-14");
    expect(pickDefaultDate(["2026-11-12", "2026-11-14"], "2026-11-16")).toBe("2026-11-14");
  });
  it("uses today when there are no dates", () => {
    expect(pickDefaultDate([], "2026-11-16")).toBe("2026-11-16");
  });
});

describe("deliveryDates", () => {
  it("is unique and ascending", () => {
    const o = (d: string) => order({ deliveryDate: d });
    expect(deliveryDates([o("2026-11-20"), o("2026-11-18"), o("2026-11-20")])).toEqual(["2026-11-18", "2026-11-20"]);
  });
});

describe("groupDeliveries", () => {
  it("separates unassigned, sorts partners by name and pincodes ascending, excludes other dates", () => {
    const orders = [
      order({ id: "1", orderCode: "NF-B", partner: RAVI, pincode: "560068" }),
      order({ id: "2", orderCode: "NF-A", partner: RAVI, pincode: "560034" }),
      order({ id: "3", orderCode: "NF-C", partner: RAVI, pincode: "560034" }),
      order({ id: "4", orderCode: "NF-D", partner: ANU, pincode: "560001" }),
      order({ id: "5", orderCode: "NF-E", partner: null, status: "confirmed" }),
      order({ id: "6", orderCode: "NF-F", partner: RAVI, deliveryDate: "2026-11-19" }),
    ];
    const g = groupDeliveries(orders, "2026-11-18");
    expect(g.unassigned.map((o) => o.id)).toEqual(["5"]);
    expect(g.partners.map((p) => p.partner.name)).toEqual(["Anu", "Ravi"]);
    const ravi = g.partners[1]!;
    expect(ravi.pincodes.map((p) => p.pincode)).toEqual(["560034", "560068"]);
    expect(ravi.pincodes[0]!.orders.map((o) => o.orderCode)).toEqual(["NF-A", "NF-C"]);
  });
});

describe("buildShareText", () => {
  it("matches the exact format for the contract example order", () => {
    const text = buildShareText({
      tenantName: "NutriFarm Eggs",
      partnerName: "Ravi",
      date: "2026-11-18",
      orders: [order()],
      partnerLink: "https://app.example.com/p/tok",
    });
    expect(text).toBe(
      [
        "NutriFarm Eggs — deliveries for Wed, 18 Nov",
        "Ravi: 1 order",
        "",
        "1. NF-7K3QX9",
        "Asha Rao · +91 98000 00001",
        "12, 4th Cross, Koramangala, 560034",
        "Landmark: Near the park",
        "Map: https://maps.google.com/?q=12.9352,77.6245",
        "White Eggs 12 pack × 1, White Eggs 6 pack × 1",
        "",
        "Your orders: https://app.example.com/p/tok",
      ].join("\n"),
    );
  });
  it("omits landmark, map, phone and link when absent; pluralises", () => {
    const bare = order({
      mapUrl: null,
      customer: { id: "c", profileName: null, phone: null },
      address: { name: "Asha Rao", line1: "12 Road", pincode: "560034" },
    });
    const text = buildShareText({
      tenantName: "T",
      partnerName: "Ravi",
      date: "2026-11-18",
      orders: [bare, { ...bare, orderCode: "NF-2" }],
    });
    expect(text).toBe(
      [
        "T — deliveries for Wed, 18 Nov",
        "Ravi: 2 orders",
        "",
        "1. NF-7K3QX9",
        "Asha Rao",
        "12 Road, 560034",
        "White Eggs 12 pack × 1, White Eggs 6 pack × 1",
        "",
        "2. NF-2",
        "Asha Rao",
        "12 Road, 560034",
        "White Eggs 12 pack × 1, White Eggs 6 pack × 1",
      ].join("\n"),
    );
  });
  it("falls back to the address phone", () => {
    const o = order({ customer: { id: "c", profileName: null, phone: null } });
    const text = buildShareText({ tenantName: "T", partnerName: "R", date: "2026-11-18", orders: [o] });
    expect(text).toContain("Asha Rao · +91 98000 00001");
  });
});
