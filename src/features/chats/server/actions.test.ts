import { beforeEach, describe, expect, it, vi } from "vitest";

const adminWrite = vi.fn();
vi.mock("@/lib/api/admin", () => ({
  adminWrite: (...a: unknown[]) => adminWrite(...a),
}));

import { sendReply } from "./actions";

const ID = "11111111-1111-4111-8111-111111111111";
const message = { id: "m", direction: "out", type: "text", text: "hi", payload: {}, createdAt: "2026-11-16T05:10:12.000Z" };

beforeEach(() => adminWrite.mockReset());

describe("sendReply", () => {
  it("trims the text and posts to the customer's reply path", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { message } });
    const r = await sendReply(ID, { text: "  hi  " });
    expect(adminWrite).toHaveBeenCalledWith(`/admin/chats/${ID}/reply`, { method: "POST", body: { text: "hi" } });
    expect(r).toEqual({ ok: true, data: { message } });
  });
  it("rejects empty and over-long text without calling the API", async () => {
    for (const text of ["", "   ", "a".repeat(4097)]) {
      const r = await sendReply(ID, { text });
      expect(r).toMatchObject({ ok: false, error: { code: "validation_error" } });
    }
    expect(adminWrite).not.toHaveBeenCalled();
  });
  it("accepts exactly 4096 chars", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { message } });
    expect((await sendReply(ID, { text: "a".repeat(4096) })).ok).toBe(true);
  });
  it("rejects a customer id that is not a uuid", async () => {
    const r = await sendReply("../x", { text: "hi" });
    expect(r.ok).toBe(false);
    expect(adminWrite).not.toHaveBeenCalled();
  });
  it("maps outside_reply_window and provider_error to the API message", async () => {
    for (const [status, code] of [[409, "outside_reply_window"], [502, "provider_error"]] as const) {
      adminWrite.mockResolvedValueOnce({ ok: false, error: { status, code, message: `msg ${code}` } });
      expect(await sendReply(ID, { text: "hi" })).toEqual({ ok: false, error: { code, message: `msg ${code}` } });
    }
  });
});
