import { beforeEach, describe, expect, it, vi } from "vitest";

const adminWrite = vi.fn();
vi.mock("@/lib/api/admin", () => ({
  adminWrite: (...a: unknown[]) => adminWrite(...a),
}));
vi.mock("./row", () => ({
  toPartnerRow: ({ accessToken, ...p }: { accessToken: string | null }) => ({
    ...p,
    link: accessToken ? `https://app.test/p/${accessToken}` : null,
  }),
}));

import {
  createPartner,
  resetPartnerLink,
  setPartnerActive,
  updatePartner,
} from "./actions";

const ID = "11111111-1111-4111-8111-111111111111";
const partner = {
  id: ID,
  name: "Suresh",
  phone: "919800000003",
  accessToken: "tok",
};

beforeEach(() => {
  adminWrite.mockReset();
});

describe("partner actions", () => {
  it("createPartner POSTs the cleaned body and returns the partner with a link", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { partner } });
    const r = await createPartner({ name: "Suresh", phone: "+91 98000-00003" });
    expect(adminWrite).toHaveBeenCalledWith("/admin/partners", {
      body: { name: "Suresh", phone: "+919800000003" },
    });
    expect(r).toMatchObject({
      ok: true,
      data: { partner: { link: "https://app.test/p/tok" } },
    });
    expect(r).toMatchObject({ ok: true });
    expect(JSON.stringify(r)).not.toContain("accessToken");
  });

  it("createPartner rejects a bad phone without calling the API", async () => {
    const r = await createPartner({ name: "S", phone: "5800000003" });
    expect(r).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        fieldErrors: { phone: expect.any(String) },
      },
    });
    expect(adminWrite).not.toHaveBeenCalled();
  });

  it("updatePartner PATCHes only the changed fields", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { partner } });
    await updatePartner(ID, { name: "New" });
    expect(adminWrite).toHaveBeenCalledWith(`/admin/partners/${ID}`, {
      method: "PATCH",
      body: { name: "New" },
    });
  });

  it("updatePartner rejects empty patch and bad id", async () => {
    expect(await updatePartner(ID, {})).toMatchObject({ ok: false });
    expect(await updatePartner("../x", { name: "N" })).toMatchObject({
      ok: false,
    });
    expect(adminWrite).not.toHaveBeenCalled();
  });

  it("setPartnerActive PATCHes active", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { partner } });
    await setPartnerActive(ID, false);
    expect(adminWrite).toHaveBeenCalledWith(`/admin/partners/${ID}`, {
      method: "PATCH",
      body: { active: false },
    });
  });

  it("resetPartnerLink POSTs reset-link", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { partner } });
    await resetPartnerLink(ID);
    expect(adminWrite).toHaveBeenCalledWith(
      `/admin/partners/${ID}/reset-link`,
      {},
    );
  });

  it("maps validation_error details to fieldErrors.phone and does not revalidate", async () => {
    adminWrite.mockResolvedValue({
      ok: false,
      error: {
        status: 400,
        code: "validation_error",
        message: "Invalid request",
        details: [{ path: "phone", message: "Bad phone" }],
      },
    });
    const r = await createPartner({ name: "S", phone: "9800000003" });
    expect(r).toEqual({
      ok: false,
      error: {
        code: "validation_error",
        message: "Invalid request",
        fieldErrors: { phone: "Bad phone" },
      },
    });
  });
});
