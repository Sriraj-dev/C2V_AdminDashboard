import { vi } from "vitest";

export type MockCookieJar = {
  get: ReturnType<typeof vi.fn<(name: string) => { name: string; value: string } | undefined>>;
  set: ReturnType<typeof vi.fn<(name: string, value: string, options?: unknown) => void>>;
  delete: ReturnType<typeof vi.fn<(name: string) => void>>;
};

/**
 * Mocks `next/headers` (in-memory cookie jar) and `next/navigation` (redirect and notFound throw).
 * Call it in a test, then dynamically import the module under test (after `vi.resetModules()`).
 */
export function mockNextHeaders(initial: Record<string, string> = {}): MockCookieJar {
  const store = new Map<string, string>(Object.entries(initial));
  const jar: MockCookieJar = {
    get: vi.fn((name: string) => {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    }),
    set: vi.fn((name: string, value: string) => {
      store.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      store.delete(name);
    }),
  };
  vi.doMock("next/headers", () => ({ cookies: async () => jar }));
  vi.doMock("next/navigation", () => ({
    redirect: (url: string): never => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    },
    notFound: (): never => {
      throw new Error("NEXT_NOT_FOUND");
    },
  }));
  return jar;
}
