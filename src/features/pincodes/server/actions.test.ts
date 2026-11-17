import { beforeEach, describe, expect, it, vi } from "vitest";

const adminWrite = vi.fn();
vi.mock("@/lib/api/admin", () => ({
  adminWrite: (...a: unknown[]) => adminWrite(...a),
}));

import { createPincode, setPincodeActive, updatePincode } from "./actions";

const ID = "11111111-1111-4111-8111-111111111111";
const pincode = { id: ID, pincode: "560034", deliveryWeekday: 3, note: null, active: true };

beforeEach(() => adminWrite.mockReset());

describe("pincode actions", () => {
  it("createPincode strips spaces and turns an empty note into null", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { pincode } });
    const r = await createPincode({ pincode: "560 034", deliveryWeekday: 3, note: "  ", active: true });
    expect(adminWrite).toHaveBeenCalledWith("/admin/pincodes", {
      method: "POST",
      body: { pincode: "560034", deliveryWeekday: 3, note: null, active: true },
    });
    expect(r).toMatchObject({ ok: true, data: { pincode: { id: ID } } });
  });

  it("rejects bad pincode, weekday and long note without calling the API", async () => {
    const ok = { pincode: "560034", deliveryWeekday: 3, note: "", active: true };
    for (const bad of [
      { pincode: "060034" },
      { pincode: "56003" },
      { deliveryWeekday: 7 },
      { note: "x".repeat(121) },
    ]) {
      expect((await createPincode({ ...ok, ...bad })).ok).toBe(false);
    }
    expect(adminWrite).not.toHaveBeenCalled();
  });

  it("returns the API message on conflict", async () => {
    adminWrite.mockResolvedValue({ ok: false, error: { status: 409, code: "conflict", message: "Already exists" } });
    const r = await createPincode({ pincode: "560034", deliveryWeekday: 1, note: "", active: true });
    expect(r).toEqual({ ok: false, error: { code: "conflict", message: "Already exists" } });
  });

  it("updatePincode sends only changed fields and never the pincode", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { pincode } });
    await updatePincode(ID, { note: "" });
    expect(adminWrite).toHaveBeenCalledWith(`/admin/pincodes/${ID}`, {
      method: "PATCH",
      body: { note: null },
    });
    const r = await updatePincode(ID, { pincode: "560001", note: "x" } as never);
    expect(r.ok).toBe(false);
    expect(adminWrite).toHaveBeenCalledTimes(1);
  });

  it("updatePincode rejects an empty patch", async () => {
    expect((await updatePincode(ID, {})).ok).toBe(false);
  });

  it("setPincodeActive sends only active", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { pincode } });
    await setPincodeActive(ID, false);
    expect(adminWrite).toHaveBeenCalledWith(`/admin/pincodes/${ID}`, { method: "PATCH", body: { active: false } });
  });
});
