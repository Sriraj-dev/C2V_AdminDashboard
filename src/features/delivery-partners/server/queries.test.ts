import { beforeEach, describe, expect, it, vi } from "vitest";

let result: unknown = {};
const paths: string[] = [];

async function load() {
  vi.resetModules();
  vi.doMock("@/lib/api/admin", () => ({
    adminRead: async (p: string) => {
      paths.push(p);
      return result;
    },
  }));
  vi.doMock("@/lib/partner-link", () => ({
    partnerLink: (t: string) => `https://app.test/p/${t}`,
  }));
  return import("./queries");
}

beforeEach(() => {
  paths.length = 0;
});

describe("getPartners", () => {
  it("adds link only when accessToken is set, and drops the raw token", async () => {
    result = {
      items: [
        { id: "1", name: "A", accessToken: "tok", openOrderCount: 2 },
        { id: "2", name: "B", accessToken: null, openOrderCount: 0 },
      ],
    };
    const { getPartners } = await load();
    const rows = await getPartners();
    expect(paths).toEqual(["/admin/partners"]);
    expect(rows[0]).toMatchObject({ id: "1", link: "https://app.test/p/tok" });
    expect(rows[0]).not.toHaveProperty("accessToken");
    expect(rows[1]).not.toHaveProperty("accessToken");
    expect(rows[1]).toMatchObject({ id: "2", link: null });
  });
});
