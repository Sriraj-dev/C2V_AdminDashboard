import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/lib/api/types";
import { toMessageView } from "./message-view";

function msg(direction: "in" | "out", type: string, payload: unknown, text: string | null = null): ChatMessage {
  return { id: "m1", direction, type, text, payload, createdAt: "2026-11-16T05:10:12.000Z" };
}

describe("toMessageView", () => {
  it("draws the contract's interactive button example", () => {
    const m = msg(
      "out",
      "interactive",
      {
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: "Welcome to NutriFarm! What would you like to do?" },
          action: {
            buttons: [
              { type: "reply", reply: { id: "order", title: "Order Eggs" } },
              { type: "reply", reply: { id: "my_orders", title: "My Orders" } },
            ],
          },
        },
      },
      "Welcome",
    );
    expect(toMessageView(m)).toEqual({
      kind: "interactive",
      body: "Welcome to NutriFarm! What would you like to do?",
      options: ["Order Eggs", "My Orders"],
    });
  });
  it("keeps header and footer on an interactive list and collects every row title", () => {
    const m = msg("out", "interactive", {
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "Menu" },
        body: { text: "Pick one" },
        footer: { text: "Thanks" },
        action: {
          button: "Choose",
          sections: [{ rows: [{ title: "A" }, { title: "B" }] }, { rows: [{ title: "C" }] }],
        },
      },
    });
    expect(toMessageView(m)).toEqual({
      kind: "interactive",
      header: "Menu",
      body: "Pick one",
      footer: "Thanks",
      options: ["Choose", "A", "B", "C"],
    });
  });
  it("uses flow_cta for a flow", () => {
    const m = msg("out", "interactive", {
      type: "interactive",
      interactive: { type: "flow", body: { text: "Order now" }, action: { parameters: { flow_cta: "Open form" } } },
    });
    expect(toMessageView(m)).toEqual({ kind: "interactive", body: "Order now", options: ["Open form"] });
  });
  it("draws text", () => {
    expect(toMessageView(msg("in", "text", { type: "text", text: { body: "hi" } }))).toEqual({
      kind: "text",
      body: "hi",
    });
  });
  it("draws button and list replies as a reply", () => {
    expect(
      toMessageView(
        msg("in", "interactive", {
          type: "interactive",
          interactive: { type: "button_reply", button_reply: { id: "x", title: "Order Eggs" } },
        }),
      ),
    ).toEqual({ kind: "reply", title: "Order Eggs" });
    expect(
      toMessageView(
        msg("in", "interactive", {
          type: "interactive",
          interactive: { type: "list_reply", list_reply: { id: "x", title: "Row 1" } },
        }),
      ),
    ).toEqual({ kind: "reply", title: "Row 1" });
  });
  it("draws nfm_reply as the order form", () => {
    expect(
      toMessageView(
        msg("in", "interactive", {
          type: "interactive",
          interactive: { type: "nfm_reply", nfm_reply: { response_json: "{}" } },
        }),
      ),
    ).toEqual({ kind: "form", label: "Order form submitted" });
  });
  it("draws a template quick reply button", () => {
    expect(toMessageView(msg("in", "button", { type: "button", button: { text: "Stop", payload: "s" } }))).toEqual({
      kind: "reply",
      title: "Stop",
    });
  });
  it("draws images with link and caption", () => {
    expect(
      toMessageView(msg("out", "image", { type: "image", image: { link: "https://x.test/a.jpg", caption: "Hi" } })),
    ).toEqual({ kind: "image", url: "https://x.test/a.jpg", caption: "Hi" });
    expect(toMessageView(msg("out", "image", { type: "image", image: {} }))).toEqual({ kind: "image" });
  });
  it("draws a template with its body params", () => {
    const m = msg("out", "template", {
      type: "template",
      template: {
        name: "order_delivered",
        language: { code: "en" },
        components: [
          { type: "header", parameters: [{ type: "text", text: "ignored" }] },
          { type: "body", parameters: [{ type: "text", text: "Asha" }, { type: "text", text: "NF-7K3QX9" }] },
        ],
      },
    });
    expect(toMessageView(m)).toEqual({ kind: "template", name: "order_delivered", params: ["Asha", "NF-7K3QX9"] });
  });
  it("draws a location as a maps link", () => {
    const m = msg("in", "location", { type: "location", location: { latitude: 12.9352, longitude: 77.6245 } });
    expect(toMessageView(m)).toEqual({ kind: "location", mapUrl: "https://maps.google.com/?q=12.9352,77.6245" });
  });
  it("falls back to text for an empty payload", () => {
    expect(toMessageView(msg("out", "text", {}, "Sorry"))).toEqual({ kind: "fallback", body: "Sorry" });
  });
  it("falls back to [type] when there is no text either", () => {
    expect(toMessageView(msg("in", "sticker", {}, null))).toEqual({ kind: "fallback", body: "[sticker]" });
  });
  it("never throws on odd payloads", () => {
    for (const p of [null, undefined, 5, "x", [], { type: "interactive" }, { type: "interactive", interactive: 3 }]) {
      expect(() => toMessageView(msg("in", "interactive", p, "t"))).not.toThrow();
      expect(toMessageView(msg("in", "interactive", p, "t")).kind).toBe("fallback");
    }
  });
});
