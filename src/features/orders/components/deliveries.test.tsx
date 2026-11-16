// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OrderView } from "@/lib/api/types";
import { DeliveryDatePicker } from "./delivery-date-picker";
import { PartnerDeliveryGroup } from "./partner-delivery-group";

afterEach(cleanup);
const partner = { id: "p1", name: "Ravi", phone: "919800000002" };
const order = {
  id: "o1",
  orderCode: "NF-7K3QX9",
  status: "assigned",
  deliveryDate: "2026-11-18",
  pincode: "560034",
  address: { name: "Asha Rao", line1: "12 Road", pincode: "560034" },
  mapUrl: null,
  customer: { id: "c", profileName: "Asha", phone: "919800000001" },
  partner,
  items: [{ productId: "x", name: "Eggs", unitPricePaise: 1, quantity: 2, lineTotalPaise: 2 }],
} as unknown as OrderView;

describe("DeliveryDatePicker", () => {
  it("marks overdue and today, and the selected chip", () => {
    render(
      <DeliveryDatePicker
        dates={[
          { date: "2026-11-14", count: 1 },
          { date: "2026-11-16", count: 3 },
          { date: "2026-11-18", count: 2 },
        ]}
        selected="2026-11-16"
        today="2026-11-16"
      />,
    );
    const links = screen.getAllByRole("link");
    expect(within(links[0]!).getByText("Overdue")).toBeTruthy();
    expect(within(links[1]!).getByText("Today")).toBeTruthy();
    expect(links[1]!.getAttribute("aria-current")).toBe("date");
    expect(links[2]!.textContent).not.toMatch(/Overdue|Today/);
    expect(links[2]!.getAttribute("href")).toBe("/?date=2026-11-18");
  });
});

describe("PartnerDeliveryGroup", () => {
  it("renders the WhatsApp share, partner link and print links", () => {
    render(
      <PartnerDeliveryGroup
        group={{ partner, pincodes: [{ pincode: "560034", orders: [order] }] }}
        date="2026-11-18"
        tenantName="T"
        link="https://app.example.com/p/tok"
      />,
    );
    const wa = screen.getByRole("link", { name: /share on whatsapp/i });
    expect(wa.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/919800000002\?text=/);
    expect(decodeURIComponent(wa.getAttribute("href")!)).toContain("Your orders: https://app.example.com/p/tok");
    expect(wa.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByRole("button", { name: /copy partner link/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /print/i }).getAttribute("href")).toBe(
      "/deliveries/print?date=2026-11-18&partnerId=p1",
    );
    expect(screen.getByText("1 order · 0 out for delivery")).toBeTruthy();
  });
  it("hides Copy partner link without a link", () => {
    render(
      <PartnerDeliveryGroup
        group={{ partner, pincodes: [{ pincode: "560034", orders: [order] }] }}
        date="2026-11-18"
        tenantName="T"
      />,
    );
    expect(screen.queryByRole("button", { name: /copy partner link/i })).toBeNull();
  });
});
